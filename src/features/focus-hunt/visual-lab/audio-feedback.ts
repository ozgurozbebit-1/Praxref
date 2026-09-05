export type AudioCue =
  "pickup" | "takeoff" | "landing" | "enter" | "exit" | "finish";
export type AudioSnapshot = {
  pickup: number;
  airborne: boolean;
  distance: number;
  finished: boolean;
  paused: boolean;
};

/** Observes presentation snapshots only. Muted events are consumed, never replayed. */
export function createCueObserver(play: (cue: AudioCue) => void) {
  let pickup = 0,
    airborne = false,
    distance = 0,
    finished = false;
  return (next: AudioSnapshot) => {
    const emit = (cue: AudioCue) => {
      if (!next.paused) play(cue);
    };
    if (next.pickup > pickup) emit("pickup");
    if (next.airborne && !airborne) emit("takeoff");
    if (!next.airborne && airborne) emit("landing");
    if (distance < 436 && next.distance >= 436) emit("enter");
    if (distance < 520 && next.distance >= 520) emit("exit");
    if (next.finished && !finished) emit("finish");
    pickup = next.pickup;
    airborne = next.airborne;
    distance = next.distance;
    finished = next.finished;
  };
}

const tones: Record<AudioCue, readonly [number, number, number, number]> = {
  pickup: [880, 1320, 0.2, 0.25],
  takeoff: [140, 420, 0.24, 0.16],
  landing: [120, 55, 0.16, 0.16],
  enter: [220, 165, 0.4, 0.1],
  exit: [330, 440, 0.35, 0.12],
  finish: [523, 784, 0.9, 0.3],
};

export function createGameAudio(
  contextFactory = (): AudioContext | null =>
    typeof window !== "undefined" && window.AudioContext
      ? new window.AudioContext()
      : null,
) {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = false;
  const voices = new Set<OscillatorNode>();
  const silence = () => {
    for (const voice of voices) {
      try {
        voice.stop();
      } catch {
        /* already stopped */
      }
    }
    voices.clear();
  };
  const play = (cue: AudioCue) => {
    if (
      muted ||
      !context ||
      !master ||
      context.state !== "running" ||
      voices.size >= 4
    )
      return;
    try {
      const [from, to, duration, volume] = tones[cue];
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(volume, now + 0.025);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(envelope);
      envelope.connect(master);
      voices.add(oscillator);
      oscillator.onended = () => {
        voices.delete(oscillator);
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    } catch {
      /* Audio must never interrupt gameplay. */
    }
  };
  const observe = createCueObserver(play);
  return {
    observe,
    // Invoke synchronously from a user gesture, not from effects or the render loop.
    unlock() {
      if (muted) return;
      try {
        if (!context) {
          context = contextFactory();
          if (!context) return;
          master = context.createGain();
          master.gain.value = 0.18; // Four simultaneous voices remain conservatively quiet.
          master.connect(context.destination);
        }
        if (context.state === "suspended")
          void context.resume().catch(() => {});
      } catch {
        /* Unsupported or blocked audio: silent fallback. */
      }
    },
    setMuted(value: boolean) {
      muted = value;
      if (master) master.gain.value = value ? 0 : 0.18;
      if (value) silence();
    },
    silence,
    dispose() {
      silence();
      master?.disconnect();
      if (context) void context.close().catch(() => {});
      context = null;
      master = null;
    },
  };
}
