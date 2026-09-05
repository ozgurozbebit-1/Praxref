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
  const oscillator = {
    frequency: parameter(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  };
  const context = {
    state: "running",
    currentTime: 0,
    destination: {},
    createGain: vi.fn(() => ({
      gain: parameter(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createOscillator: vi.fn(() => oscillator),
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  };
  return { context, factory: () => context as unknown as AudioContext };
}
describe("Atlas presentation audio", () => {
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
      audio.observe({ ...initial, pickup: 1, finished: true });
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
