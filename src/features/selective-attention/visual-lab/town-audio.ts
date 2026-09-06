/** Tiny, event-only lab audio; deliberately independent from both production games. */
export function createTownAudio(
  factory = (): AudioContext | null =>
    typeof window !== "undefined" && window.AudioContext
      ? new window.AudioContext()
      : null,
) {
  let context: AudioContext | null = null,
    muted = false;
  const heard = new Set<number>(),
    voices = new Set<OscillatorNode>();
  return {
    unlock() {
      try {
        context ??= factory();
        if (context?.state === "suspended")
          void context.resume().catch(() => {});
      } catch {
        /* optional audio */
      }
    },
    mute(value: boolean) {
      muted = value;
      if (value)
        voices.forEach((v) => {
          try {
            v.stop();
          } catch {
            /* already ended */
          }
        });
    },
    play(id: number, correct: boolean) {
      if (heard.has(id)) return;
      heard.add(id);
      if (muted || !context || context.state !== "running" || voices.size >= 3)
        return;
      try {
        const voice = context.createOscillator(),
          gain = context.createGain(),
          now = context.currentTime;
        voice.type = "sine";
        voice.frequency.setValueAtTime(correct ? 780 : 180, now);
        voice.frequency.exponentialRampToValueAtTime(
          correct ? 1170 : 120,
          now + 0.2,
        );
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(correct ? 0.12 : 0.085, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        voice.connect(gain);
        gain.connect(context.destination);
        voices.add(voice);
        voice.onended = () => {
          voices.delete(voice);
          voice.disconnect();
          gain.disconnect();
        };
        voice.start(now);
        voice.stop(now + 0.24);
      } catch {
        /* gameplay never depends on audio availability */
      }
    },
    dispose() {
      voices.forEach((v) => {
        try {
          v.stop();
        } catch {
          /* ended */
        }
      });
      voices.clear();
      if (context) void context.close().catch(() => {});
      context = null;
    },
  };
}
