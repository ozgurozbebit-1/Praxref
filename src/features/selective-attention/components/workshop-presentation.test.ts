import { describe, expect, it, vi } from "vitest";
import { WorkshopPiece } from "./PrismWorkshop";
import { classifySelectiveTrial } from "../engine/selective-attention";
import { getSelectiveParams } from "../config/selective-attention";
import {
  formatRemaining,
  translateRule,
  workbenchLayout,
  visibleResult,
} from "./workshop-presentation";
import type { Stimulus } from "../types";

const target: Stimulus = {
  id: "target",
  color: "blue",
  shape: "star",
  isTarget: true,
};
const wrong: Stimulus = {
  id: "wrong",
  color: "gold",
  shape: "square",
  isTarget: false,
};
const base = {
  trialId: "trial",
  sessionId: "synthetic",
  audience: "kids" as const,
  difficultyLevel: 2,
  trialType: "conjunction" as const,
  targetRule: "blue star",
  targetStimulus: target,
  distractorCount: 1,
  distractorSimilarity: 0.4,
  appearedAt: 1000,
};

describe("Prizma presentation measurement boundary", () => {
  it("translates labels only, retaining the supplied rule", () => {
    expect(translateRule(base.targetRule)).toBe("Mavi Yıldız");
    expect(base.targetRule).toBe("blue star");
    expect(translateRule("star hedefini bul")).toBe("Yıldız hedefini bul");
  });
  it("formats seconds without changing session duration", () => {
    expect([180, 119, 9, 0].map(formatRemaining)).toEqual([
      "03:00",
      "01:59",
      "00:09",
      "00:00",
    ]);
  });
  it.each([target, wrong])(
    "native click forwards the exact $id object unchanged",
    (stimulus) => {
      const select = vi.fn();
      const piece = WorkshopPiece({ stimulus, size: 68, onSelect: select });
      expect(piece.type).toBe("button");
      expect(piece.props.onPointerDown).toBeUndefined();
      piece.props.onClick();
      expect(select).toHaveBeenCalledExactlyOnceWith(stimulus);
      expect(select.mock.calls[0][0]).toBe(stimulus);
      expect(piece.props["data-feedback"]).toBeUndefined();
    },
  );
  it.each([
    [target, 1400, null, true, 400],
    [wrong, 1400, "wrong-target", false, 400],
    [null, null, "omission", false, null],
    [target, 4001, "late-response", false, 3001],
  ] as const)(
    "preserves classifier output for selection %j at %s",
    (selected, at, error, correct, rt) => {
      const result = classifySelectiveTrial(base, selected, at, 3000);
      expect(result).toMatchObject({
        errorType: error,
        correct,
        reactionTimeMs: rt,
        appearedAt: 1000,
        respondedAt: at,
        selectedStimulus: selected,
      });
    },
  );
  it("wrong selection never highlights the unselected target", () => {
    const result = classifySelectiveTrial(base, wrong, 1400, 3000);
    expect(
      WorkshopPiece({ stimulus: target, size: 68, onSelect: vi.fn(), result })
        .props["data-feedback"],
    ).toBeUndefined();
    expect(
      WorkshopPiece({ stimulus: wrong, size: 68, onSelect: vi.fn(), result })
        .props["data-feedback"],
    ).toBe("wrong");
  });
  it("previous-trial feedback cannot leak into the next tray", () => {
    const result = classifySelectiveTrial(base, target, 1400, 3000);
    expect(visibleResult([target, wrong], result)).toBe(result);
    expect(visibleResult([{ ...target, id: "next" }], result)).toBeUndefined();
  });
});

describe("all pieces visible without scrolling", () => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [768, 1024],
    [1280, 720],
    [568, 320],
    [844, 390],
  ]) {
    for (const [audience, level] of [
      ["kids", 2],
      ["kids", 10],
      ["teen", 4],
      ["teen", 10],
    ] as const) {
      it(`${audience} level ${level} fits ${width}×${height}`, () => {
        const params = getSelectiveParams(audience, level);
        const count = params.distractorCount + 1;
        const layout = workbenchLayout(
          width,
          height,
          count,
          params.stimulusSize,
        );
        expect(layout.columns * layout.rows).toBeGreaterThanOrEqual(count);
        expect(layout.width).toBeLessThanOrEqual(width - 64 + 0.001);
        expect(layout.height).toBeLessThanOrEqual(
          height - (height <= 500 && width >= 540 ? 184 : 260) + 0.001,
        );
        expect(layout.cell).toBeGreaterThanOrEqual(44);
        expect(layout.visualSize).toBeLessThanOrEqual(params.stimulusSize);
      });
    }
  }
});
