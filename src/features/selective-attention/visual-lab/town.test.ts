import { describe, expect, it, vi } from "vitest";
import { OrthographicCamera, Vector3 } from "three";
import { makeDemoTrial, respondDemo, type DemoState } from "./demo";
import {
  COAST_TOWN,
  ambientMotion,
  mapTrialToWorld,
  townZoom,
} from "./town-world";
import { createTownAudio } from "./town-audio";

const trial = () => makeDemoTrial(1, () => 0.42);
const state = (): DemoState => ({ trial: trial(), score: 0, response: null });
describe("coast town lab contract", () => {
  it("has 24 semantic sockets and 16 active distinct identities", () => {
    expect(COAST_TOWN.sockets).toHaveLength(24);
    expect(new Set(COAST_TOWN.sockets.map((s) => s.id)).size).toBe(24);
    const input = trial().stimuli,
      placed = mapTrialToWorld(input);
    expect(placed).toHaveLength(16);
    placed.forEach((p, i) => {
      expect(p.stimulus).toBe(input[i]);
      expect(p.active).toBe(true);
      expect(p.socket.hitSize).toBeGreaterThanOrEqual(44);
    });
  });
  it("rejects capacity overflow instead of silently dropping stimuli", () => {
    expect(() =>
      mapTrialToWorld([...trial().stimuli, ...trial().stimuli]),
    ).toThrow("capacity");
  });
  it("exactly one correct target and all sixteen colour/shape pairs", () => {
    const t = trial();
    expect(t.stimuli.filter((s) => s.isTarget)).toEqual([t.target]);
    expect(new Set(t.stimuli.map((s) => `${s.color}/${s.shape}`)).size).toBe(
      16,
    );
  });
  it("correct selection gives one local discovery; repeated click/touch cannot count twice", () => {
    const before = state(),
      after = respondDemo(before, before.trial.target.id);
    expect(after.score).toBe(1);
    expect(after.response?.correct).toBe(true);
    expect(respondDemo(after, before.trial.target.id)).toBe(after);
  });
  it("incorrect selection gives zero and does not expose target identity in feedback", () => {
    const before = state(),
      wrong = before.trial.stimuli.find((s) => !s.isTarget)!;
    const after = respondDemo(before, wrong.id);
    expect(after.score).toBe(0);
    expect(after.response).toEqual({ id: wrong.id, correct: false });
    expect(respondDemo(after, before.trial.target.id)).toBe(after);
    expect(respondDemo(before, "not-an-active-object")).toBe(before);
  });
  it("next tasks use new identities without any persistence fields", () => {
    const a = trial(),
      b = makeDemoTrial(2, () => 0.42);
    expect(b.stimuli.every((s) => !a.stimuli.some((p) => p.id === s.id))).toBe(
      true,
    );
    expect(Object.keys(b).sort()).toEqual(["id", "stimuli", "target"]);
  });
  it("reduced motion stops ambient motion at all sampled times", () => {
    for (const t of [0, 1, 10, 100]) {
      expect(ambientMotion(t, true)).toBe(0);
      expect(Math.abs(ambientMotion(t, false))).toBeLessThanOrEqual(0.025);
    }
  });
  for (const [width, height] of [
    [320, 400],
    [390, 676],
    [768, 848],
    [1280, 544],
    [568, 212],
    [844, 282],
  ]) {
    it(`all 16 hit areas fit and do not overlap in canvas ${width}×${height}`, () => {
      const camera = new OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        0.1,
        150,
      );
      camera.position.set(0, 24, height < 300 ? 24.49 : 24);
      camera.rotation.set(-Math.PI / 4, 0, 0);
      camera.zoom = townZoom(width, height);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const boxes = COAST_TOWN.sockets.slice(0, 16).map((socket) => {
        const [x, y, z] = socket.position,
          p = new Vector3(x, y + 0.04, z + 0.98).project(camera),
          cx = ((p.x + 1) * width) / 2,
          cy = ((1 - p.y) * height) / 2;
        return { left: cx - 22, right: cx + 22, top: cy - 22, bottom: cy + 22 };
      });
      for (const [i, a] of boxes.entries()) {
        expect(a.left).toBeGreaterThanOrEqual(0);
        expect(a.right).toBeLessThanOrEqual(width);
        expect(a.top).toBeGreaterThanOrEqual(0);
        expect(a.bottom).toBeLessThanOrEqual(height);
        for (const b of boxes.slice(i + 1))
          expect(
            a.left < b.right &&
              a.right > b.left &&
              a.top < b.bottom &&
              a.bottom > b.top,
          ).toBe(false);
      }
    });
  }
});

describe("lab audio", () => {
  function fixture() {
    const param = () => ({
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    });
    const createOscillator = vi.fn(() => ({
      frequency: param(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    }));
    const context = {
      state: "running",
      currentTime: 0,
      destination: {},
      createOscillator,
      createGain: () => ({
        gain: param(),
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      close: vi.fn(async () => {}),
    };
    const factory = vi.fn(() => context as unknown as AudioContext);
    return { audio: createTownAudio(factory), factory, createOscillator };
  }
  it("no autoplay before unlock, correct/incorrect tones differ, duplicate is silent", () => {
    const { audio, factory, createOscillator } = fixture();
    expect(factory).not.toHaveBeenCalled();
    audio.unlock();
    audio.play(1, true);
    audio.play(1, true);
    audio.play(2, false);
    expect(createOscillator).toHaveBeenCalledTimes(2);
    expect(
      createOscillator.mock.results[0].value.frequency.setValueAtTime,
    ).toHaveBeenCalledWith(780, 0);
    expect(
      createOscillator.mock.results[1].value.frequency.setValueAtTime,
    ).toHaveBeenCalledWith(180, 0);
  });
  it("mute suppresses both results and doesn't replay when re-enabled", () => {
    const { audio, createOscillator } = fixture();
    audio.unlock();
    audio.mute(true);
    audio.play(1, true);
    audio.play(2, false);
    audio.mute(false);
    audio.play(1, true);
    expect(createOscillator).not.toHaveBeenCalled();
    audio.play(3, true);
    expect(createOscillator).toHaveBeenCalledOnce();
  });
  it("unavailable AudioContext is safe", () => {
    const audio = createTownAudio(() => null);
    expect(() => {
      audio.unlock();
      audio.play(1, true);
      audio.mute(true);
      audio.dispose();
    }).not.toThrow();
  });
});
