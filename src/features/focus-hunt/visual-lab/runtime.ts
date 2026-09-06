import type { FocusHuntAudience, FocusHuntSessionSummary } from "../types";
import { getDifficultyParams } from "../config/focus-hunt";
import {
  COURSE,
  createRunnerState,
  keyboardLane,
  pickupCrossed,
  predictedHeight,
  stepRunner,
  visualRandom,
} from "./course";
import { LabSession } from "./session-adapter";

export function createLabRuntime(audience: FocusHuntAudience) {
  return {
    session: new LabSession(audience, `visual-lab-${audience}`),
    runner: createRunnerState(),
    running: false,
    paused: false,
    input: { lateral: 0, left: false, right: false },
    accumulator: 0,
    nextTrialAt: 0,
    hudAt: 0,
    random: visualRandom(83041),
    pickup: null as null | {
      id: string;
      distance: number;
      lateral: number;
      height: number;
      model: number;
    },
    fx: { id: 0, age: 2, lateral: 0, height: 0, distance: 0 },
    feedback: "Hedef: Altın yıldız",
    feedbackUntil: 0,
    summary: null as FocusHuntSessionSummary | null,
  };
}
export type LabRuntime = ReturnType<typeof createLabRuntime>;

function resolved(runtime: LabRuntime, correct: boolean) {
  const pickup = runtime.pickup;
  if (correct && pickup) {
    Object.assign(runtime.fx, {
      id: runtime.fx.id + 1,
      age: 0,
      lateral: pickup.lateral,
      height: pickup.height,
      distance: pickup.distance,
    });
    runtime.feedback = "Altın yıldız toplandı!";
  } else runtime.feedback = "Rotayı izle, altın yıldızı seç.";
  runtime.feedbackUntil = runtime.runner.elapsed + 1.1;
  runtime.pickup = null;
  runtime.nextTrialAt =
    runtime.runner.elapsed +
    (getDifficultyParams(runtime.session.audience, runtime.session.difficulty)
      .interTrialMs /
      1000) *
      (runtime.session.audience === "teen" ? 0.55 : 1);
}

/** One render-frame update. Fixed-step physics catches swept pickup crossings. */
export function advanceLab(runtime: LabRuntime, delta: number, now: number) {
  if (!runtime.running || runtime.paused || runtime.runner.finished) return;
  // Browser backgrounding pauses explicitly. A long stall never teleports the ship.
  const pace = 1;
  runtime.accumulator += Math.min(delta, 0.1) * pace;
  runtime.fx.age += Math.min(delta, 0.1);
  while (
    runtime.accumulator + 1e-10 >= COURSE.step &&
    !runtime.runner.finished
  ) {
    runtime.accumulator -= COURSE.step;
    runtime.input.lateral = keyboardLane(
      runtime.input.lateral,
      runtime.input.left,
      runtime.input.right,
      COURSE.step,
    );
    const previous = runtime.runner.distance;
    stepRunner(runtime.runner, runtime.input.lateral, COURSE.step);
    if (
      runtime.pickup &&
      pickupCrossed(previous, runtime.runner, runtime.pickup)
    ) {
      const trial = runtime.session.respond(runtime.pickup.id, now);
      if (trial)
        resolved(runtime, trial.correct && trial.responded && trial.isTarget);
    }
  }
  const expired = runtime.session.expire(now);
  if (expired) resolved(runtime, false);
  // A model culled before its first draw is not a measured omission.
  if (
    runtime.pickup &&
    !runtime.session.active?.base &&
    runtime.runner.distance > runtime.pickup.distance + 3
  ) {
    if (runtime.session.active) runtime.session.active.resolved = true;
    runtime.pickup = null;
    runtime.nextTrialAt = runtime.runner.elapsed + 0.5;
  }
  if (runtime.runner.finished) {
    runtime.summary = runtime.session.finish();
    runtime.pickup = null;
    runtime.running = false;
    return;
  }
  if (
    !runtime.pickup &&
    runtime.runner.elapsed >= runtime.nextTrialAt &&
    runtime.runner.elapsed < COURSE.seconds - 1.8
  ) {
    const trial = runtime.session.offer();
    if (trial) {
      const arrivalSeconds = (trial.windowMs / 1000) * 0.72;
      const distance = runtime.runner.distance + COURSE.speed * arrivalSeconds;
      runtime.pickup = {
        id: trial.id,
        distance,
        lateral: [-2.6, 0, 2.6][Math.floor(runtime.random() * 3)],
        height: predictedHeight(runtime.runner, arrivalSeconds),
        model: trial.stimulus.isTarget
          ? 0
          : trial.stimulus.type === "circle"
            ? 3
            : trial.stimulus.type === "diamond"
              ? 4
              : [1, 2, 5, 6][Math.floor(runtime.random() * 4)],
      };
    }
  }
}
