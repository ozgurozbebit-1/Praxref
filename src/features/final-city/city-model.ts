/** City-only state. No cognitive-engine or other game's state is shared here. */
export type Audience = "kids" | "teen";
export type SymbolKind = "star" | "triangle" | "circle" | "diamond";
export type InputState = {
  x: number;
  speed: number;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};
export type DriveState = {
  distance: number;
  visualX: number;
  steering: number;
};
export type Gate = {
  id: number;
  z: number;
  lane: number;
  kind: SymbolKind;
  passed: boolean;
};
export const LANES = [-3.7, 0, 3.7];
export const MISSION: SymbolKind[] = ["star", "triangle", "circle", "diamond"];
export const COLORS = {
  star: "#ffd83d",
  triangle: "#35bfff",
  circle: "#48ed8b",
  diamond: "#ff5572",
};
export const LABELS = {
  star: "Yıldız",
  triangle: "Üçgen",
  circle: "Daire",
  diamond: "Elmas",
};
export const settings = (audience: Audience) =>
  audience === "teen"
    ? { seconds: 65, speed: 27, traffic: 16 }
    : { seconds: 75, speed: 22, traffic: 12 };
export function seeded(i: number) {
  const n = Math.sin(i * 9283.13) * 43758.5453;
  return n - Math.floor(n);
}
export function roadX(distance: number, z: number) {
  return 9 * (Math.sin((distance - z) / 155) - Math.sin(distance / 155));
}
export function roadYaw(distance: number, z: number) {
  return (-9 / 155) * Math.cos((distance - z) / 155);
}
export function streamZ(initial: number, distance: number, length = 320) {
  return 32 - ((((32 - initial - distance) % length) + length) % length);
}
export function advanceInput(input: InputState, dt: number) {
  input.speed = Math.max(
    14,
    Math.min(
      38,
      input.speed + (Number(input.up) - Number(input.down)) * dt * 14,
    ),
  );
  input.x = Math.max(
    -5.35,
    Math.min(
      5.35,
      input.x + (Number(input.right) - Number(input.left)) * dt * 8.6,
    ),
  );
}
export function createGates(): Gate[] {
  return Array.from({ length: 28 }, (_, i) => ({
    id: i,
    z: -24 - i * 8.3,
    lane: i % 3,
    kind: MISSION[(i + (i % 3)) % 4],
    passed: false,
  }));
}
/** Existing lane/window/one-response rules, including no penalty for bypassing a lane. */
export function crossGate(
  gate: Gate,
  previousZ: number,
  x: number,
  mission: SymbolKind,
): boolean | null {
  if (gate.passed || gate.z <= 1.1 || previousZ >= 4.8) return null;
  gate.passed = true;
  return Math.abs(x - LANES[gate.lane]) < 1.45 ? gate.kind === mission : null;
}
export type ScoreState = {
  score: number;
  combo: number;
  hits: number;
  wrong: number;
  missionIndex: number;
};
export const INITIAL_SCORE: ScoreState = {
  score: 0,
  combo: 0,
  hits: 0,
  wrong: 0,
  missionIndex: 0,
};
export function scoreGate(s: ScoreState, correct: boolean): ScoreState {
  return correct
    ? {
        score: s.score + 20 + Math.min(40, s.combo * 3),
        combo: s.combo + 1,
        hits: s.hits + 1,
        wrong: s.wrong,
        missionIndex: (s.missionIndex + 1) % 4,
      }
    : { ...s, score: Math.max(0, s.score - 10), combo: 0, wrong: s.wrong + 1 };
}
