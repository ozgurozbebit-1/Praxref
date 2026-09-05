import { describe, expect, it } from "vitest";
import {
  buildFocusHuntSummary,
  classifyTrial,
  getDifficultyParams,
  getNextDifficulty,
} from "../index";
import { LabSession } from "./session-adapter";

describe("visual-lab delegates to the shared measurement engine", () => {
  it("does not measure or accept a response before the first actual draw", () => {
    const lab = new LabSession("kids", "draw");
    const offered = lab.offer({ isTarget: true, type: "star" })!;
    expect(lab.respond(offered.id, 2000)).toBeNull();
    expect(lab.expire(9000)).toBeNull();
    lab.presented(offered.id, 9001);
    lab.presented(offered.id, 9999);
    expect(lab.respond(offered.id, 9501)?.reactionTimeMs).toBe(500);
  });
  it("awards once for gold; rejects duplicates, commissions and omissions", () => {
    const lab = new LabSession("kids", "gold");
    for (let i = 0; i < 2; i++) {
      const active = lab.offer({ isTarget: true, type: "star" })!;
      lab.presented(active.id, i * 2000);
      expect(lab.respond(active.id, i * 2000 + 400)?.correct).toBe(true);
      expect(lab.respond(active.id, i * 2000 + 450)).toBeNull();
      expect(lab.rewardStars).toBe(i + 1);
    }
    const distractor = lab.offer({ isTarget: false, type: "spark" })!;
    lab.presented(distractor.id, 5000);
    expect(lab.respond(distractor.id, 5400)?.errorType).toBe("commission");
    const missed = lab.offer({ isTarget: true, type: "star" })!;
    lab.presented(missed.id, 7000);
    expect(lab.expire(9000)?.errorType).toBe("omission");
    expect(lab.rewardStars).toBe(2);
  });
  it.each(["kids", "teen"] as const)(
    "produces identical records and summary for synthetic %s events",
    (audience) => {
      const lab = new LabSession(audience, "replay");
      const records = [];
      for (let i = 0; i < 12; i++) {
        const active = lab.offer({
          isTarget: i % 3 !== 0,
          type: i % 3 ? "star" : "spark",
        })!;
        lab.presented(active.id, 1000 + i * 3000);
        const response = i % 4 === 0 ? null : active.base!.appearedAt + 450;
        const expected = classifyTrial(active.base!, response, active.windowMs);
        expect(lab.respond(active.id, response)).toEqual(expected);
        records.push(expected);
      }
      expect(lab.trials).toEqual(records);
      expect(lab.finish()).toEqual(
        buildFocusHuntSummary("replay", audience, records, 54, lab.difficulty),
      );
      expect(lab.offer()).toBeNull();
    },
  );
  it("uses the shared ten-trial adaptive rule and response windows", () => {
    const lab = new LabSession("kids", "adaptive");
    const initial = lab.difficulty;
    for (let i = 0; i < 10; i++) {
      const trial = lab.offer({ isTarget: true, type: "star" })!;
      expect(trial.windowMs).toBe(
        getDifficultyParams("kids", initial).responseWindowMs,
      );
      lab.presented(trial.id, i * 2500);
      lab.respond(trial.id, i * 2500 + 400);
      if (i < 9) expect(lab.difficulty).toBe(initial);
    }
    expect(lab.difficulty).toBe(getNextDifficulty(initial, lab.trials));
  });
  it("finishes once, classifies a pending visible trial and retains the schema", () => {
    const lab = new LabSession("kids", "finish");
    const active = lab.offer({ type: "star", isTarget: true })!;
    lab.presented(active.id, 1000);
    const summary = lab.finish();
    expect(summary.omissionErrors).toBe(1);
    expect(summary.completedDurationSec).toBe(54);
    expect(lab.finish()).toEqual(summary);
    expect(lab.trials).toHaveLength(1);
    expect(lab.rewardStars).toBe(0);
  });
});
