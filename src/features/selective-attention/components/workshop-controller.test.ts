import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { classifySelectiveTrial } from "../engine/selective-attention";
import {
  getSelectiveParams,
  SELECTIVE_ATTENTION_BLOCK_SIZE,
} from "../config/selective-attention";
import { getNextDifficulty } from "../adaptive/selective-attention";
import type { SelectiveAttentionTrial, Stimulus } from "../types";

// Exercise the actual closure body with synthetic clocks/storage. Do not copy its logic.
const source = readFileSync(
  new URL("./selective-attention-game.tsx", import.meta.url),
  "utf8",
);
const tree = ts.createSourceFile(
  "game.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let recordSource = "";
function find(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(tree) === "record")
    recordSource = node.initializer!.getText(tree);
  ts.forEachChild(node, find);
}
find(tree);
const recordJs = ts.transpile(`const handler = ${recordSource};`, {
  target: ts.ScriptTarget.ES2022,
});
const target: Stimulus = {
  id: "target",
  color: "blue",
  shape: "star",
  isTarget: true,
};
const wrong: Stimulus = {
  id: "wrong",
  color: "coral",
  shape: "circle",
  isTarget: false,
};
const base = {
  trialId: "synthetic-1",
  sessionId: "synthetic",
  audience: "kids" as const,
  difficultyLevel: 2,
  trialType: "feature" as const,
  targetRule: "star olan hedefi bul",
  targetStimulus: target,
  distractorCount: 4,
  distractorSimilarity: 0.2,
  appearedAt: 1000,
};
function harness(now: number, previous: SelectiveAttentionTrial[] = []) {
  const env = {
    base: { current: base },
    seen: { current: false },
    trialsRef: { current: previous },
    levelRef: { current: 2 },
    timer: { current: null },
    audience: "kids",
    performance: { now: () => now },
    classifySelectiveTrial,
    getSelectiveParams,
    getNextDifficulty,
    SELECTIVE_ATTENTION_BLOCK_SIZE,
    selectiveAttentionStore: { saveTrial: vi.fn() },
    setTrials: vi.fn(),
    setFeedback: vi.fn(),
    setDifficulty: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    setTimeout: vi.fn(),
  };
  const record = new Function(
    ...Object.keys(env),
    `${recordJs}; return handler;`,
  )(...Object.values(env)) as (stimulus: Stimulus | null) => void;
  return { record, env };
}
describe("Prizma uses the existing response controller", () => {
  it.each([
    [target, 1400, null],
    [wrong, 1400, "wrong-target"],
    [null, 1400, "omission"],
    [target, 10000, "late-response"],
  ] as const)(
    "keeps classification, timestamps and 420 ms next-trial flow: %j",
    (selected, now, errorType) => {
      const { record, env } = harness(now);
      record(selected);
      const saved = env.selectiveAttentionStore.saveTrial.mock.calls[0][0];
      expect(saved).toEqual(
        classifySelectiveTrial(
          base,
          selected,
          selected ? now : null,
          getSelectiveParams("kids", 2).responseWindowMs,
        ),
      );
      expect(saved.errorType).toBe(errorType);
      expect(env.setTimeout).toHaveBeenCalledWith(expect.any(Function), 420);
      expect(env.show).not.toHaveBeenCalled();
      env.setTimeout.mock.calls[0][0]();
      expect(env.show).toHaveBeenCalledExactlyOnceWith(2);
    },
  );
  it("seen guard rejects repeated clicks and a following timeout for the same trial", () => {
    const { record, env } = harness(1400);
    record(target);
    record(target);
    record(wrong);
    record(null);
    expect(env.selectiveAttentionStore.saveTrial).toHaveBeenCalledOnce();
    expect(env.setTimeout).toHaveBeenCalledOnce();
  });
  it("preserves ten-trial adaptive evaluation, including the existing algorithm", () => {
    const previous = Array.from({ length: 9 }, (_, i) =>
      classifySelectiveTrial(
        { ...base, trialId: `previous-${i}` },
        target,
        1400 + i * 25,
        3000,
      ),
    );
    const { record, env } = harness(1650, previous);
    record(target);
    expect(env.setDifficulty).toHaveBeenCalledWith(
      getNextDifficulty(2, env.trialsRef.current),
    );
    expect(env.trialsRef.current).toHaveLength(10);
  });
});
