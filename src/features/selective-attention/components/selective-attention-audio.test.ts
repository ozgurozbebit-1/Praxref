import { describe, expect, it, vi } from "vitest";
import { createWorkshopAudio } from "./selective-attention-audio";
import type { SelectiveAttentionTrial } from "../types";

const result = (
  trialId: string,
  correct = true,
  errorType: SelectiveAttentionTrial["errorType"] = null,
) => ({ trialId, correct, errorType }) as SelectiveAttentionTrial;
function setup() {
  const param = () => ({
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const oscillator = vi.fn(() => ({
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
    createOscillator: oscillator,
    createGain: () => ({
      gain: param(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    close: vi.fn(async () => {}),
    resume: vi.fn(async () => {}),
  };
  const factory = vi.fn(() => context as unknown as AudioContext);
  const audio = createWorkshopAudio(factory);
  return { audio, factory, context, oscillator };
}
describe("workshop event audio", () => {
  it("only creates context on a user unlock", () => {
    const { audio, factory } = setup();
    audio.result(result("before"));
    expect(factory).not.toHaveBeenCalled();
    audio.unlock();
    expect(factory).toHaveBeenCalledOnce();
  });
  it("correct and wrong-target have different short tones; omission/late are silent", () => {
    const { audio, oscillator } = setup();
    audio.unlock();
    audio.result(result("correct"));
    audio.result(result("wrong", false, "wrong-target"));
    audio.result(result("omission", false, "omission"));
    audio.result(result("late", false, "late-response"));
    expect(oscillator).toHaveBeenCalledTimes(2);
    expect(
      oscillator.mock.results[0].value.frequency.setValueAtTime,
    ).toHaveBeenCalledWith(740, 0);
    expect(
      oscillator.mock.results[1].value.frequency.setValueAtTime,
    ).toHaveBeenCalledWith(175, 0);
  });
  it("deduplicates classified trial identities and completion", () => {
    const { audio, oscillator } = setup();
    audio.unlock();
    audio.result(result("one", false, "wrong-target"));
    audio.result(result("one", false, "wrong-target"));
    audio.finish();
    audio.finish();
    expect(oscillator).toHaveBeenCalledTimes(2);
  });
  it("mute stops active voices and suppresses all later cues without replay on unmute", () => {
    const { audio, oscillator } = setup();
    audio.unlock();
    audio.result(result("first"));
    audio.setMuted(true);
    expect(oscillator.mock.results[0].value.stop).toHaveBeenCalledTimes(2);
    audio.result(result("muted"));
    audio.result(result("wrong", false, "wrong-target"));
    audio.finish();
    audio.setMuted(false);
    audio.result(result("muted"));
    audio.finish();
    expect(oscillator).toHaveBeenCalledOnce();
  });
  it("caps simultaneous voices and releases nodes on completion", () => {
    const { audio, oscillator } = setup();
    audio.unlock();
    for (let i = 0; i < 5; i++) audio.result(result(String(i)));
    expect(oscillator).toHaveBeenCalledTimes(3);
    const voice = oscillator.mock.results[0].value;
    (voice.onended as unknown as () => void)();
    expect(voice.disconnect).toHaveBeenCalledOnce();
    audio.result(result("next"));
    expect(oscillator).toHaveBeenCalledTimes(4);
  });
  it("unsupported or denied AudioContext is safe", () => {
    for (const factory of [
      () => null,
      () => {
        throw new Error("denied");
      },
    ]) {
      const audio = createWorkshopAudio(factory);
      expect(() => {
        audio.unlock();
        audio.result(result("one"));
        audio.finish();
        audio.dispose();
      }).not.toThrow();
    }
  });
  it("resumes a suspended context and closes on unmount", () => {
    const { audio, context } = setup();
    context.state = "suspended";
    audio.unlock();
    expect(context.resume).toHaveBeenCalledOnce();
    audio.dispose();
    expect(context.close).toHaveBeenCalledOnce();
  });
});
