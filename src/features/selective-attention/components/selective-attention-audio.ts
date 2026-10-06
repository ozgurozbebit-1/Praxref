import type { SelectiveAttentionTrial } from "../types";

/** Workshop-only audio. It consumes classified results, never measures responses. */
export function createWorkshopAudio(
  factory = (): AudioContext | null =>
    typeof window !== "undefined" && window.AudioContext
      ? new window.AudioContext()
      : null,
) {
  let context: AudioContext | null = null;
  let muted = false;
  let completed = false;
  const heard = new Set<string>();
  const voices = new Set<OscillatorNode>();
  const stop = () => {
    voices.forEach((voice) => {
      try {
        voice.stop();
      } catch {
        /* ended */
      }
    });
    voices.clear();
  };
  const tone = (from: number, to: number, duration: number, gain: number) => {
    if (muted || !context || context.state !== "running" || voices.size >= 3)
      return;
    try {
      const voice = context.createOscillator(),
        envelope = context.createGain(),
        now = context.currentTime;
      voice.type = "sine";
      voice.frequency.setValueAtTime(from, now);
      voice.frequency.exponentialRampToValueAtTime(to, now + duration);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(gain, now + 0.018);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      voice.connect(envelope);
      envelope.connect(context.destination);
      voices.add(voice);
      voice.onended = () => {
        voices.delete(voice);
        voice.disconnect();
        envelope.disconnect();
      };
      voice.start(now);
      voice.stop(now + duration + 0.02);
    } catch {
      /* Silent fallback must not interrupt a trial. */
    }
  };
  return {
    unlock() {
      if (muted) return;
      try {
        context ??= factory();
        if (context?.state === "suspended")
          void context.resume().catch(() => {});
      } catch {
        /* unsupported or denied */
      }
    },
    setMuted(value: boolean) {
      muted = value;
      if (value) stop();
    },
    result(result?: SelectiveAttentionTrial) {
      if (!result || heard.has(result.trialId)) return;
      heard.add(result.trialId);
      if (result.correct) tone(740, 1110, 0.19, 0.095);
      else if (result.errorType === "wrong-target") tone(175, 110, 0.18, 0.065);
      // Omission and late-response stay silent, never reuse the wrong-target cue.
    },
    finish() {
      if (completed) return;
      completed = true;
      tone(440, 660, 0.65, 0.1);
    },
    dispose() {
      stop();
      if (context) void context.close().catch(() => {});
      context = null;
    },
  };
}
