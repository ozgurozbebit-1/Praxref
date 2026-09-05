import {
  buildFocusHuntSummary,
  classifyTrial,
  createStimulus,
  focusHuntConfig,
  FOCUS_HUNT_BLOCK_SIZE,
  getDifficultyParams,
  getNextDifficulty,
  shouldAcceptResponse,
  type FocusHuntAudience,
  type FocusHuntStimulus,
  type FocusHuntTrial,
} from "../index";
import { COURSE } from "./course";

type TrialBase = Parameters<typeof classifyTrial>[0];
export type LabTrial = {
  id: string;
  stimulus: FocusHuntStimulus;
  base: TrialBase | null;
  windowMs: number;
  resolved: boolean;
};

/** Lab adapter owns lifecycle, not scoring. No production/localStorage writes. */
export class LabSession {
  readonly trials: FocusHuntTrial[] = [];
  active: LabTrial | null = null;
  rewardStars = 0;
  difficulty: number;
  private serial = 0;
  private closed = false;
  constructor(
    readonly audience: FocusHuntAudience,
    readonly id: string,
  ) {
    this.difficulty = focusHuntConfig[audience].initialDifficulty;
  }
  offer(stimulus?: FocusHuntStimulus): LabTrial | null {
    if (this.closed || (this.active && !this.active.resolved)) return null;
    const params = getDifficultyParams(this.audience, this.difficulty);
    this.active = {
      id: `${this.id}-${++this.serial}`,
      stimulus: stimulus ?? createStimulus(params.targetRate),
      base: null,
      windowMs: params.responseWindowMs,
      resolved: false,
    };
    return this.active;
  }
  // Called by the first actual draw of the already-loaded model, not its spawn.
  presented(id: string, now: number) {
    const active = this.active;
    if (
      !active ||
      active.id !== id ||
      active.base ||
      active.resolved ||
      this.closed
    )
      return;
    active.base = {
      trialId: id,
      sessionId: this.id,
      audience: this.audience,
      difficultyLevel: this.difficulty,
      stimulusType: active.stimulus.type,
      isTarget: active.stimulus.isTarget,
      appearedAt: now,
    };
  }
  respond(id: string, now: number | null) {
    const active = this.active;
    if (
      !active ||
      active.id !== id ||
      !active.base ||
      !shouldAcceptResponse(active.resolved) ||
      this.closed
    )
      return null;
    active.resolved = true;
    const result = classifyTrial(active.base, now, active.windowMs);
    this.trials.push(result);
    if (result.isTarget && result.correct && result.responded)
      this.rewardStars++;
    if (this.trials.length % FOCUS_HUNT_BLOCK_SIZE === 0)
      this.difficulty = getNextDifficulty(
        this.difficulty,
        this.trials.slice(-FOCUS_HUNT_BLOCK_SIZE),
      );
    return result;
  }
  expire(now: number) {
    if (
      this.active?.base &&
      !this.active.resolved &&
      now - this.active.base.appearedAt >= this.active.windowMs
    )
      return this.respond(this.active.id, null);
    return null;
  }
  finish() {
    if (!this.closed && this.active?.base && !this.active.resolved)
      this.respond(this.active.id, null);
    this.closed = true;
    return buildFocusHuntSummary(
      this.id,
      this.audience,
      this.trials,
      COURSE.seconds,
      this.difficulty,
    );
  }
}
