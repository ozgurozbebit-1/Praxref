import type { Color, Shape, SelectiveAttentionTrial, Stimulus } from "../types";

export const COLOR_NAMES: Record<Color, string> = {
  blue: "Mavi",
  gold: "Altın",
  purple: "Mor",
  coral: "Mercan",
};
export const SHAPE_NAMES: Record<Shape, string> = {
  star: "Yıldız",
  circle: "Daire",
  triangle: "Üçgen",
  square: "Kare",
};
// Keep the existing colour-background/white-glyph relationship, including exact hues.
export const PIECE_COLORS: Record<Color, string> = {
  blue: "#3479c9",
  gold: "#d99b25",
  purple: "#8861c4",
  coral: "#d66b65",
};
export const GLYPHS: Record<Shape, string> = {
  star: "★",
  circle: "●",
  triangle: "▲",
  square: "■",
};
export function translateRule(rule: string) {
  return rule.replace(
    /\b(blue|gold|purple|coral|star|circle|triangle|square)\b/g,
    (word) => ({ ...COLOR_NAMES, ...SHAPE_NAMES })[word as Color | Shape],
  );
}
export function formatRemaining(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
export function visibleResult(
  stimuli: Stimulus[],
  result?: SelectiveAttentionTrial,
) {
  return result && stimuli.some((item) => item.id === result.targetStimulus.id)
    ? result
    : undefined;
}
/** Layout only: never reorder, replace or regenerate the supplied stimuli. */
export function workbenchLayout(
  width: number,
  height: number,
  count: number,
  requestedSize: number,
) {
  const compact = height <= 500 && width >= 540;
  const columns = compact
    ? Math.min(count || 1, count > 9 ? 8 : count > 5 ? 5 : 3)
    : count > 9
      ? 4
      : 3;
  const rows = Math.ceil(Math.max(1, count) / columns);
  const gap = compact ? 8 : 10;
  // Matches the fixed HUD/rule/footer and console padding in workshop.module.css.
  const availableWidth = Math.max(1, Math.min(width - 64, 880));
  const availableHeight = Math.max(1, height - (compact ? 184 : 260));
  const cell = Math.min(
    112,
    (availableWidth - gap * (columns - 1)) / columns,
    (availableHeight - gap * (rows - 1)) / rows,
  );
  const visualSize = Math.min(requestedSize, Math.max(1, cell - 4));
  return {
    columns,
    rows,
    gap,
    cell,
    visualSize,
    width: cell * columns + gap * (columns - 1),
    height: cell * rows + gap * (rows - 1),
  };
}
