import type { Color, Shape, Stimulus } from "../types";
export type DemoTrial = { id: number; target: Stimulus; stimuli: Stimulus[] };
export type DemoState = {
  trial: DemoTrial;
  score: number;
  response: { id: string; correct: boolean } | null;
};
/** Local visual-demo tasks only. No RT, adaptive evaluation, persistence or clinical score. */
export function makeDemoTrial(id: number, random = Math.random): DemoTrial {
  const colors: Color[] = ["blue", "gold", "purple", "coral"],
    shapes: Shape[] = ["star", "circle", "triangle", "square"];
  const pairs = colors.flatMap((color) =>
    shapes.map((shape) => ({ color, shape })),
  );
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  const targetIndex = Math.floor(random() * pairs.length);
  const stimuli = pairs.map((pair, i) => ({
    ...pair,
    id: `demo-${id}-${i}`,
    isTarget: i === targetIndex,
  }));
  return { id, target: stimuli[targetIndex], stimuli };
}
export function respondDemo(state: DemoState, id: string): DemoState {
  if (state.response) return state;
  const selected = state.trial.stimuli.find((s) => s.id === id);
  if (!selected) return state;
  return {
    ...state,
    score: state.score + (selected.isTarget ? 1 : 0),
    response: { id, correct: selected.isTarget },
  };
}
