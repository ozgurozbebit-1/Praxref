import { afterEach, describe, expect, it, vi } from "vitest";
import { advanceLab, createLabRuntime } from "./runtime";
import { COURSE, RAMPS, courseLength } from "./course";

afterEach(() => vi.restoreAllMocks());
describe("visual-lab full run", () => {
  const completed = new Map<
    string,
    ReturnType<typeof createLabRuntime>["runner"]
  >();
  it.each(
    (["kids", "teen"] as const).flatMap((audience) =>
      [30, 60, 120].map((fps) => ({ audience, fps })),
    ),
  )(
    "$audience finishes at 90 seconds at $fps FPS with every reachable jump",
    ({ audience, fps }) => {
      vi.spyOn(Math, "random").mockReturnValue(0.1);
      const runtime = createLabRuntime(audience);
      runtime.running = true;
      for (let frame = 1; frame <= COURSE.seconds * fps + 1; frame++) {
        advanceLab(runtime, 1 / fps, (frame * 1000) / fps);
        if (runtime.pickup) {
          runtime.session.presented(runtime.pickup.id, (frame * 1000) / fps);
          runtime.input.lateral = runtime.pickup.lateral;
        }
      }
      expect(runtime.runner.finished).toBe(true);
      expect(runtime.runner.distance).toBe(courseLength(audience));
      expect(runtime.runner.jumps).toBe(
        RAMPS.filter((ramp) => ramp.crest < courseLength(audience)).length,
      );
      // Lateral steering follows frame-timed pickups; compare only the fixed-step
      // forward/vertical physics, whose outcome must not depend on render FPS.
      const previous = completed.get(audience);
      if (previous) {
        for (const key of [
          "elapsed",
          "distance",
          "height",
          "verticalVelocity",
          "airborne",
          "jumps",
          "finished",
        ] as const)
          expect(runtime.runner[key]).toBe(previous[key]);
      }
      completed.set(audience, { ...runtime.runner });
      expect(runtime.summary?.completedDurationSec).toBe(COURSE.seconds);
      expect(runtime.session.rewardStars).toBeGreaterThan(5);
      expect(runtime.fx.id).toBe(runtime.session.rewardStars);
      expect(runtime.running).toBe(false);
    },
  );
  it("does not move before start or while paused", () => {
    const runtime = createLabRuntime("kids");
    advanceLab(runtime, 1, 1000);
    expect(runtime.runner.elapsed).toBe(0);
    runtime.running = true;
    runtime.paused = true;
    advanceLab(runtime, 1, 2000);
    expect(runtime.runner.elapsed).toBe(0);
    expect(runtime.session.trials).toHaveLength(0);
  });
  it("gives no reward or logo FX for distractor collisions", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const runtime = createLabRuntime("kids");
    runtime.running = true;
    for (let frame = 1; frame < 360; frame++) {
      advanceLab(runtime, 1 / 60, (frame * 1000) / 60);
      if (runtime.pickup) {
        runtime.session.presented(runtime.pickup.id, (frame * 1000) / 60);
        runtime.input.lateral = runtime.pickup.lateral;
      }
    }
    expect(
      runtime.session.trials.some((trial) => trial.errorType === "commission"),
    ).toBe(true);
    expect(runtime.session.rewardStars).toBe(0);
    expect(runtime.fx.id).toBe(0);
  });
  it("does not record invisible/culled stimuli as measured trials", () => {
    const runtime = createLabRuntime("kids");
    runtime.running = true;
    for (let frame = 1; frame < 360; frame++)
      advanceLab(runtime, 1 / 60, (frame * 1000) / 60);
    expect(runtime.session.trials).toHaveLength(0);
    expect(runtime.session.rewardStars).toBe(0);
  });
});
