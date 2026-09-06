// Only the visual-lab route imports this course. Distances are metres, time seconds.
export const COURSE = {
  seconds: 90,
  speed: 10.8,
  length: 972,
  halfWidth: 4.2,
  deck: 5,
  gravity: 22,
  step: 1 / 120,
} as const;
export const COURSE_SECTIONS = [
  { name: "Başlangıç adası", kind: "start" },
  { name: "Mercan virajı", kind: "curve" },
  { name: "İlk sıçrama", kind: "ramp" },
  { name: "Kemerler geçidi", kind: "arches" },
  { name: "Mavi tünel", kind: "tunnel" },
  { name: "Ada atlayışı", kind: "ramp" },
  { name: "Yüksek viyadük", kind: "curve" },
  { name: "Son sıçrama", kind: "ramp" },
  { name: "Atlas bitiş kapısı", kind: "finish" },
] as const;
export const RAMPS = [
  // Launch velocities are tuned for the 90 s / 10.8 m·s⁻¹ course pace so
  // the ship clears each water gap and lands on the far deck without dipping.
  { start: 218, crest: 244, land: 264, rise: 3, launch: 18.8 },
  { start: 542, crest: 568, land: 590, rise: 4, launch: 20.5 },
  { start: 758, crest: 782, land: 804, rise: 3.6, launch: 20.7 },
] as const;

const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));
const heading = (s: number) =>
  0.62 * Math.sin(s / 83) + 0.22 * Math.sin(s / 39);
// Arc-length lookup keeps forward speed constant through every curve.
const path = Array.from({ length: COURSE.length + 100 }, () => ({
  x: 0,
  z: 0,
}));
for (let i = 1; i < path.length; i++) {
  path[i].x = path[i - 1].x + Math.sin(heading(i - 0.5));
  path[i].z = path[i - 1].z - Math.cos(heading(i - 0.5));
}
export function deckHeight(s: number): number {
  for (const ramp of RAMPS) {
    if (s >= ramp.start && s <= ramp.crest)
      return (
        COURSE.deck + (ramp.rise * (s - ramp.start)) / (ramp.crest - ramp.start)
      );
    if (s > ramp.crest && s < ramp.land) return -20;
  }
  return COURSE.deck;
}
export function trackPoint(s: number, lateral = 0) {
  const distance = clamp(s, 0, path.length - 2);
  const index = Math.floor(distance),
    fraction = distance - index,
    yaw = heading(distance);
  return {
    x:
      path[index].x +
      (path[index + 1].x - path[index].x) * fraction +
      Math.cos(yaw) * lateral,
    y: deckHeight(distance),
    z:
      path[index].z +
      (path[index + 1].z - path[index].z) * fraction +
      Math.sin(yaw) * lateral,
    yaw,
  };
}
export type RunnerState = {
  elapsed: number;
  distance: number;
  lateral: number;
  lateralVelocity: number;
  height: number;
  verticalVelocity: number;
  airborne: boolean;
  landing: number;
  jumps: number;
  finished: boolean;
};
export function createRunnerState(): RunnerState {
  return {
    elapsed: 0,
    distance: 0,
    lateral: 0,
    lateralVelocity: 0,
    height: COURSE.deck,
    verticalVelocity: 0,
    airborne: false,
    landing: 0,
    jumps: 0,
    finished: false,
  };
}
// Mutates an isolated simulation state; renderer, tests and pickup prediction share it.
export function stepRunner(state: RunnerState, input: number, delta: number) {
  if (state.finished || !Number.isFinite(delta) || delta <= 0) return;
  const dt = Math.min(delta, COURSE.step, COURSE.seconds - state.elapsed);
  const previousDistance = state.distance;
  state.elapsed = Math.min(COURSE.seconds, state.elapsed + dt);
  state.distance = Math.min(COURSE.length, state.elapsed * COURSE.speed);
  const desired = clamp(
    Number.isFinite(input) ? input : state.lateral,
    -3.15,
    3.15,
  );
  state.lateralVelocity +=
    ((desired - state.lateral) * 65 - state.lateralVelocity * 15) * dt;
  state.lateral = clamp(
    state.lateral + state.lateralVelocity * dt,
    -3.15,
    3.15,
  );
  state.landing *= Math.exp(-dt * 12);
  for (const ramp of RAMPS) {
    if (
      previousDistance <= ramp.crest &&
      state.distance > ramp.crest &&
      !state.airborne
    ) {
      state.height = COURSE.deck + ramp.rise;
      state.verticalVelocity = ramp.launch;
      state.airborne = true;
      state.jumps++;
    }
  }
  const floor = deckHeight(state.distance);
  if (state.airborne) {
    state.verticalVelocity -= COURSE.gravity * dt;
    state.height += state.verticalVelocity * dt;
    if (state.height <= floor && state.verticalVelocity < 0) {
      state.landing = Math.min(0.15, -state.verticalVelocity * 0.009);
      state.height = floor;
      state.verticalVelocity = 0;
      state.airborne = false;
    }
  } else state.height = floor;
  if (state.elapsed >= COURSE.seconds - 1e-8) {
    state.elapsed = COURSE.seconds;
    state.distance = COURSE.length;
    state.finished = true;
  }
}
export function predictedHeight(state: RunnerState, seconds: number) {
  const preview = { ...state };
  for (let t = 0; t < seconds; t += COURSE.step)
    stepRunner(preview, preview.lateral, Math.min(COURSE.step, seconds - t));
  return preview.height;
}

export function pointerLane(clientX: number, left: number, width: number) {
  return width > 0
    ? clamp((((clientX - left) / width) * 2 - 1) * 3.15, -3.15, 3.15)
    : 0;
}
export function keyboardLane(
  current: number,
  left: boolean,
  right: boolean,
  dt: number,
) {
  return clamp(current + (Number(right) - Number(left)) * 7 * dt, -3.15, 3.15);
}

export function pickupCrossed(
  previous: number,
  state: RunnerState,
  pickup: { distance: number; lateral: number; height: number },
) {
  return (
    previous <= pickup.distance + 0.65 &&
    state.distance >= pickup.distance - 0.65 &&
    Math.abs(state.lateral - pickup.lateral) <= 1 &&
    Math.abs(state.height - pickup.height) <= 1.6
  );
}

export function visualRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
