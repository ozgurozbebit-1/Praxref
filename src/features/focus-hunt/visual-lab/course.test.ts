import { describe, expect, it } from "vitest";
import {
  COURSE,
  RAMPS,
  createRunnerState,
  deckHeight,
  keyboardLane,
  pickupCrossed,
  pointerLane,
  predictedHeight,
  stepRunner,
  trackPoint,
  visualRandom,
} from "./course";

describe("visual-lab course and controls", () => {
  it("crosses the finish at 54 seconds, then remains stopped", () => {
    const state = createRunnerState();
    for (let i = 0; i < 54 * 120 - 1; i++) stepRunner(state, 0, COURSE.step);
    expect(state.finished).toBe(false);
    stepRunner(state, 0, COURSE.step);
    expect(state.finished).toBe(true);
    expect(state.distance).toBe(972);
    expect(state.elapsed).toBe(54);
    const copy = { ...state };
    for (let i = 0; i < 100; i++) stepRunner(state, 3, COURSE.step);
    expect(state).toEqual(copy);
  });
  it("actually launches over all three gaps and lands on their far decks", () => {
    const state = createRunnerState();
    const flights = [false, false, false],
      lands = [false, false, false];
    for (let i = 0; i < 54 * 120; i++) {
      stepRunner(state, 0, COURSE.step);
      expect(state.height).toBeGreaterThanOrEqual(COURSE.deck - 0.001);
      RAMPS.forEach((ramp, j) => {
        if (state.distance > ramp.crest && state.distance < ramp.land) {
          expect(state.airborne).toBe(true);
          expect(deckHeight(state.distance)).toBe(-20);
          flights[j] = true;
        }
        if (
          state.distance > ramp.land + 20 &&
          state.distance < ramp.land + 21
        ) {
          expect(state.airborne).toBe(false);
          expect(state.height).toBe(COURSE.deck);
          lands[j] = true;
        }
      });
    }
    expect(flights).toEqual([true, true, true]);
    expect(lands).toEqual([true, true, true]);
    expect(state.jumps).toBe(3);
  });
  it("steers smoothly, clamps to track width, and holds position when released", () => {
    const state = createRunnerState();
    stepRunner(state, 3.15, COURSE.step);
    expect(state.lateral).toBeGreaterThan(0);
    expect(state.lateral).toBeLessThan(0.1);
    for (let i = 0; i < 500; i++) stepRunner(state, 100, COURSE.step);
    expect(state.lateral).toBeLessThanOrEqual(3.15);
    expect(state.lateral).toBeCloseTo(3.15, 2);
    for (let i = 0; i < 500; i++) stepRunner(state, -100, COURSE.step);
    expect(state.lateral).toBeCloseTo(-3.15, 2);
  });
  it("maps mouse and touch coordinates consistently at desktop/mobile widths", () => {
    for (const width of [360, 390, 1280]) {
      expect(pointerLane(10, 10, width)).toBe(-3.15);
      expect(pointerLane(10 + width / 2, 10, width)).toBe(0);
      expect(pointerLane(10 + width, 10, width)).toBe(3.15);
    }
    expect(pointerLane(30, 0, 0)).toBe(0);
    expect(keyboardLane(0, true, false, 0.1)).toBeCloseTo(-0.7);
    expect(keyboardLane(0, false, true, 0.1)).toBeCloseTo(0.7);
    expect(keyboardLane(2, false, false, 0.1)).toBe(2);
  });
  it("follows a continuous curved route at approximately constant arc speed", () => {
    for (let s = 1; s < COURSE.length; s++) {
      const a = trackPoint(s - 1),
        b = trackPoint(s);
      expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeCloseTo(1, 4);
      expect(Math.abs(b.yaw - a.yaw)).toBeLessThan(0.02);
    }
    expect(Math.abs(trackPoint(150).yaw - trackPoint(300).yaw)).toBeGreaterThan(
      0.2,
    );
  });
  it("predicts airborne pickup height using the actual physics", () => {
    const state = createRunnerState();
    while (state.distance < 235) stepRunner(state, 0, COURSE.step);
    const prediction = predictedHeight(state, 1);
    const actual = { ...state };
    for (let i = 0; i < 120; i++) stepRunner(actual, 0, COURSE.step);
    expect(prediction).toBeCloseTo(actual.height, 5);
    expect(actual.airborne).toBe(true);
  });
  it("requires lateral and vertical alignment for a swept interception", () => {
    const state = { ...createRunnerState(), distance: 10, height: 5 };
    expect(
      pickupCrossed(9, state, { distance: 10, lateral: 0, height: 5 }),
    ).toBe(true);
    expect(
      pickupCrossed(9, state, { distance: 10, lateral: 2.6, height: 5 }),
    ).toBe(false);
    expect(
      pickupCrossed(9, state, { distance: 10, lateral: 0, height: 9 }),
    ).toBe(false);
  });
  it("uses an independent deterministic visual random stream", () => {
    const a = visualRandom(22),
      b = visualRandom(22);
    expect(Array.from({ length: 20 }, a)).toEqual(
      Array.from({ length: 20 }, b),
    );
  });
});
