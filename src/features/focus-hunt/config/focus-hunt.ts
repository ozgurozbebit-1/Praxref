import type { FocusHuntAudience } from "../types";

export const FOCUS_HUNT_SESSION_SECONDS = 120;
export const FOCUS_HUNT_BLOCK_SIZE = 10;
export const focusHuntConfig = {
  kids: {
    initialDifficulty: 2,
    targetSize: 112,
    baseWindowMs: 1700,
    minimumWindowMs: 900,
    targetRate: 0.58,
    interTrialMs: 560,
  },
  teen: {
    initialDifficulty: 4,
    targetSize: 84,
    baseWindowMs: 1350,
    minimumWindowMs: 700,
    targetRate: 0.52,
    interTrialMs: 430,
  },
} as const;
export function getDifficultyParams(
  audience: FocusHuntAudience,
  difficultyLevel: number,
) {
  const base = focusHuntConfig[audience];
  const level = Math.max(1, Math.min(10, difficultyLevel));
  return {
    responseWindowMs: Math.max(
      base.minimumWindowMs,
      base.baseWindowMs - (level - 1) * 100,
    ),
    targetSize: Math.max(
      audience === "kids" ? 74 : 58,
      base.targetSize - (level - 1) * 3,
    ),
    interTrialMs: Math.max(260, base.interTrialMs - (level - 1) * 18),
    targetRate: Math.max(0.4, base.targetRate - (level - 1) * 0.012),
  };
}
