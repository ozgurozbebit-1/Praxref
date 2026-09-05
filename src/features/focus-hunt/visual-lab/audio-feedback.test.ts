import { describe, expect, it, vi } from "vitest";
import {
  createCueObserver,
  createGameAudio,
  type AudioSnapshot,
} from "./audio-feedback";

const initial: AudioSnapshot = {
  pickup: 0,
  airborne: false,
  distance: 0,
  finished: false,
  paused: false,
};
function fakeContext() {
  const parameter = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const oscillator = () => ({
    frequency: parameter(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  });
  const context = {
    state: "running",
    currentTime: 0,
    destination: {},
    createGain: vi.fn(() => ({
      gain: parameter(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createOscillator: vi.fn(oscillator),
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  };
  return { context, factory: () => context as unknown as AudioContext };
}
describe("Atlas presentation audio", () => {
  it.each([
    ["pickup", 0.4, 880, 1320, 0.2, { ...initial, pickup: 1 }],
    ["error", 0.35, 190, 95, 0.22, { ...initial, incorrectTrialId: "wrong" }],
    ["takeoff", 0.28, 140, 420, 0.24, { ...initial, airborne: true }],
    ["landing", 0.28, 120, 55, 0.16, initial],
    ["enter", 0.22, 220, 165, 0.4, { ...initial, distance: 436 }],
    ["exit", 0.24, 330, 440, 0.35, { ...initial, distance: 520 }],
    ["finish", 0.45, 523, 784, 0.9, { ...initial, finished: true }],
  ] as const)(
    "balances %s without changing frequency or duration",
    (cue, gain, from, to, duration, snapshot) => {
      const { context, factory } = fakeContext();
      const audio = createGameAudio(factory);
      audio.unlock();
      const master = context.createGain.mock.results[0].value;
      expect(master.gain.value).toBe(0.27);
      if (cue === "landing") audio.observe({ ...initial, airborne: true });
      if (cue === "exit") audio.observe({ ...initial, distance: 436 });
      audio.silence();
      context.createOscillator.mockClear();
      context.createGain.mockClear();
      audio.observe(snapshot);
      expect(context.createOscillator).toHaveBeenCalledTimes(1);
      const voice = context.createOscillator.mock.results[0].value;
      const envelope = context.createGain.mock.results[0].value;
      expect(voice.frequency.setValueAtTime).toHaveBeenCalledWith(from, 0);
      expect(voice.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        to,
        duration,
      );
      expect(voice.stop).toHaveBeenCalledWith(duration + 0.02);
      expect(envelope.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        gain,
        0.025,
      );
      audio.setMuted(true);
      expect(master.gain.value).toBe(0);
      audio.setMuted(false);
      expect(master.gain.value).toBe(0.27);
      audio.dispose();
    },
  );
  it("caps concurrent voices at four with conservative digital peak headroom", () => {
    const { context, factory } = fakeContext();
    const audio = createGameAudio(factory);
    audio.unlock();
    for (let pickup = 1; pickup <= 6; pickup++)
      audio.observe({ ...initial, pickup });
    expect(context.createOscillator).toHaveBeenCalledTimes(4);
    const master = context.createGain.mock.results[0].value.gain.value;
    const peaks = context.createGain.mock.results
      .slice(1)
      .map(
        (result) =>
          result.value.gain.linearRampToValueAtTime.mock.calls[0][0] as number,
      );
    expect(peaks.reduce((sum, peak) => sum + peak, 0) * master).toBeLessThan(1);
    expect(4 * 0.45 * master).toBeCloseTo(0.486);
    audio.dispose();
  });
  it("plays an error once per incorrect trial, independently of gold pickup", () => {
    const play = vi.fn();
    const observe = createCueObserver(play);
    observe({ ...initial, pickup: 1 });
    observe({ ...initial, pickup: 1, incorrectTrialId: "wrong-1" });
    observe({ ...initial, pickup: 1, incorrectTrialId: "wrong-1" });
    observe({ ...initial, pickup: 1 }); // omission: no incorrect collectible identity
    observe({ ...initial, pickup: 1, incorrectTrialId: "wrong-2" });
    expect(play.mock.calls.flat()).toEqual(["pickup", "error", "error"]);
  });
  it("mutes errors and pickups without replay, and shares the quiet audio path", () => {
    const { context, factory } = fakeContext();
    const audio = createGameAudio(factory);
    audio.unlock();
    audio.setMuted(true);
    audio.observe({ ...initial, pickup: 1, incorrectTrialId: "wrong-1" });
    expect(context.createOscillator).not.toHaveBeenCalled();
    audio.setMuted(false);
    audio.observe({ ...initial, pickup: 1, incorrectTrialId: "wrong-1" });
    expect(context.createOscillator).not.toHaveBeenCalled();
    audio.observe({ ...initial, pickup: 1, incorrectTrialId: "wrong-2" });
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    const voice = context.createOscillator.mock.results[0].value;
    expect(voice.frequency.setValueAtTime).toHaveBeenCalledWith(190, 0);
    expect(voice.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      95,
      0.22,
    );
    audio.dispose();
  });
  it("deduplicates pickup, transitions, tunnel and finish snapshots", () => {
    const play = vi.fn();
    const observe = createCueObserver(play);
    const snapshots = [
      initial,
      { ...initial, pickup: 1, airborne: true },
      { ...initial, pickup: 1, distance: 440 },
      { ...initial, pickup: 1, distance: 530 },
      { ...initial, pickup: 1, distance: 972, finished: true },
    ];
    for (const snapshot of snapshots) {
      observe(snapshot);
      observe(snapshot);
    }
    expect(play.mock.calls.flat()).toEqual([
      "pickup",
      "takeoff",
      "landing",
      "enter",
      "exit",
      "finish",
    ]);
  });
  it("creates no context before a gesture and no nodes while muted; does not replay muted pickups", () => {
    const { context, factory } = fakeContext();
    const create = vi.fn(factory);
    const audio = createGameAudio(create);
    audio.observe(initial);
    expect(create).not.toHaveBeenCalled();
    audio.unlock();
    audio.setMuted(true);
    audio.observe({ ...initial, pickup: 1 });
    expect(context.createOscillator).not.toHaveBeenCalled();
    audio.setMuted(false);
    audio.observe({ ...initial, pickup: 1 });
    expect(context.createOscillator).not.toHaveBeenCalled();
    audio.observe({ ...initial, pickup: 2 });
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    audio.dispose();
    expect(context.close).toHaveBeenCalledTimes(1);
  });
  it("safely remains silent without AudioContext", () => {
    const audio = createGameAudio(() => null);
    expect(() => {
      audio.unlock();
      audio.observe({
        ...initial,
        pickup: 1,
        incorrectTrialId: "wrong-1",
        finished: true,
      });
      audio.dispose();
    }).not.toThrow();
  });
  it("handles browser context construction and resume failures", async () => {
    expect(() =>
      createGameAudio(() => {
        throw new Error("blocked");
      }).unlock(),
    ).not.toThrow();
    const { context, factory } = fakeContext();
    context.state = "suspended";
    context.resume.mockRejectedValue(new Error("gesture required"));
    const audio = createGameAudio(factory);
    audio.unlock();
    await Promise.resolve();
    audio.observe({ ...initial, pickup: 1 });
    expect(context.createOscillator).not.toHaveBeenCalled();
    audio.dispose();
  });
  it("suppresses paused events and unchanged reward identities", () => {
    const play = vi.fn();
    const observe = createCueObserver(play);
    observe(initial);
    observe({ ...initial, distance: 40 }); // distractor or omission: reward identity unchanged
    observe({ ...initial, paused: true, distance: 440 });
    observe({ ...initial, distance: 440 });
    expect(play).not.toHaveBeenCalled();
  });
});
