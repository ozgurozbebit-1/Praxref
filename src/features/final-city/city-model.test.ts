import { describe, expect, it } from "vitest";
import {
  INITIAL_SCORE,
  LANES,
  MISSION,
  advanceInput,
  createGates,
  crossGate,
  roadX,
  roadYaw,
  scoreGate,
  settings,
  streamZ,
  type InputState,
} from "./city-model";
describe("City: existing mission/score contract", () => {
  it("starts with the existing 28 gates, spacing, lanes and symbols", () => {
    const gates = createGates();
    expect(gates).toHaveLength(28);
    expect(gates[0]).toEqual({
      id: 0,
      z: -24,
      lane: 0,
      kind: "star",
      passed: false,
    });
    expect(gates[1]).toMatchObject({ z: -32.3, lane: 1, kind: "circle" });
    expect(MISSION).toEqual(["star", "triangle", "circle", "diamond"]);
  });
  it("awards 20 then 23 and advances the mission only on correct", () => {
    const first = scoreGate(INITIAL_SCORE, true),
      second = scoreGate(first, true);
    expect(first).toEqual({
      score: 20,
      combo: 1,
      hits: 1,
      wrong: 0,
      missionIndex: 1,
    });
    expect(second).toMatchObject({ score: 43, combo: 2, missionIndex: 2 });
    expect(scoreGate(second, false)).toEqual({
      score: 33,
      combo: 0,
      hits: 2,
      wrong: 1,
      missionIndex: 2,
    });
  });
  it("preserves zero floor and the +40 maximum combo bonus", () => {
    expect(scoreGate(INITIAL_SCORE, false).score).toBe(0);
    expect(scoreGate({ ...INITIAL_SCORE, combo: 99 }, true).score).toBe(60);
  });
  it("correct lane is guarded against a second crossing", () => {
    const g = createGates()[0];
    g.z = 2;
    expect(crossGate(g, 1, LANES[0], "star")).toBe(true);
    expect(crossGate(g, 2, LANES[0], "star")).toBeNull();
  });
  it("wrong symbol is wrong, bypassed lane is not an extra penalty", () => {
    const a = createGates()[0],
      b = createGates()[0];
    a.z = b.z = 2;
    expect(crossGate(a, 1, LANES[0], "triangle")).toBe(false);
    expect(crossGate(b, 1, LANES[2], "star")).toBeNull();
    expect(b.passed).toBe(true);
  });
  it("uses the unchanged 1.45 lateral radius and 1.1 arrival threshold", () => {
    const g = createGates()[0];
    g.z = 1.1;
    expect(crossGate(g, 0, LANES[0], "star")).toBeNull();
    g.z = 2;
    expect(crossGate(g, 1, LANES[0] + 1.46, "star")).toBeNull();
  });
  it("does not miss a crossing during a long frame", () => {
    const g = createGates()[0];
    g.z = 6;
    expect(crossGate(g, 0, LANES[0], "star")).toBe(true);
  });
});
describe("City controls and presentation streaming", () => {
  it("keeps Kids 75s/22 speed and Teen 65s/27 speed; traffic +33%", () => {
    expect(settings("kids")).toEqual({ seconds: 75, speed: 22, traffic: 12 });
    expect(settings("teen")).toEqual({ seconds: 65, speed: 27, traffic: 16 });
  });
  for (const fps of [30, 60, 120])
    it(`preserves controls, forward distance and crossing at ${fps} FPS`, () => {
      const input: InputState = {
        x: 0,
        speed: 22,
        left: false,
        right: false,
        up: false,
        down: false,
      };
      let distance = 0,
        count = 0;
      const g = createGates()[0];
      for (let f = 0; f < 75 * fps; f++) {
        advanceInput(input, 1 / fps);
        distance += input.speed / fps;
        const prev = g.z;
        g.z += input.speed / fps;
        if (crossGate(g, prev, LANES[0], "star") === true) count++;
      }
      expect(distance).toBeCloseTo(1650, 7);
      expect(input.x).toBe(0);
      expect(count).toBe(1);
    });
  it("accelerates/brakes and clamps the existing steering range", () => {
    const input: InputState = {
      x: 0,
      speed: 22,
      left: false,
      right: true,
      up: true,
      down: false,
    };
    advanceInput(input, 1);
    expect(input).toMatchObject({ x: 5.35, speed: 36 });
    advanceInput(input, 1);
    expect(input.speed).toBe(38);
    input.up = false;
    input.down = true;
    input.right = false;
    input.left = true;
    advanceInput(input, 2);
    expect(input.speed).toBe(14);
    expect(input.x).toBe(-5.35);
  });
  it("recycles all chunks forever without removing objects", () => {
    for (const d of [0, 320, 1600, 20000]) {
      const positions = Array.from({ length: 40 }, (_, i) =>
        streamZ(-i * 8, d),
      );
      expect(new Set(positions).size).toBe(40);
      expect(Math.max(...positions)).toBeLessThanOrEqual(32);
      expect(Math.min(...positions)).toBeGreaterThan(-288);
    }
    expect(streamZ(-50, 320)).toBe(streamZ(-50, 0));
  });
  it("shares a smooth bend across scenery, signs and traffic", () => {
    expect(roadX(100, 0)).toBe(0);
    for (let d = 0; d < 2000; d += 25) {
      expect(Math.abs(roadYaw(d, -50))).toBeLessThan(0.06);
      expect(Math.abs(roadX(d + 0.01, -50) - roadX(d, -50))).toBeLessThan(
        0.001,
      );
    }
  });
});
