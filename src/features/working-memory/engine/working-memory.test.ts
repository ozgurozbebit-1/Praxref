import { describe, expect, it } from "vitest";
import { calculateWorkingMemoryScore, classifyTrial, createSummary, expectedSequence, nextWorkingMemoryDifficulty, positionalMatchCount, workingMemoryParams, type WorkingMemoryTrial, type WorkingMemoryTrialType } from "@/features/working-memory";

const base = (type: WorkingMemoryTrialType = "forward", expected = ["●", "▲", "■"]): Omit<WorkingMemoryTrial, "responseSequence" | "responseStartedAt" | "responseEndedAt" | "responseTimeMs" | "correct" | "exactMatch" | "partialCorrectCount" | "positionalAccuracy" | "errorType"> => ({ trialId: "trial", sessionId: "session", audience: "kids", difficultyLevel: 2, trialType: type, sequenceLength: expected.length, stimulusSequence: type === "reverse" ? [...expected].reverse() : expected, expectedSequence: expected, presentationStartedAt: 0, presentationEndedAt: 900 });
const make = (type: WorkingMemoryTrialType, expected: string[], response: string[], end = 1800) => classifyTrial(base(type, expected), response, 1000, end, 3000);

describe("Akılda Tut engine", () => {
  it("classifies a forward exact match", () => expect(make("forward", ["●", "▲"], ["●", "▲"]).correct).toBe(true));
  it("classifies a reverse exact match", () => expect(make("reverse", ["▲", "●"], ["▲", "●"]).exactMatch).toBe(true));
  it("classifies a spatial exact match", () => expect(make("spatial", ["0", "4"], ["0", "4"]).correct).toBe(true));
  it("derives the reverse expected sequence", () => expect(expectedSequence("reverse", ["●", "▲", "■"])).toEqual(["■", "▲", "●"]));
  it("marks a reordered full answer as wrong-order", () => expect(make("forward", ["●", "▲", "■"], ["●", "■", "▲"]).errorType).toBe("wrong-order"));
  it("marks no answer as omission", () => expect(make("forward", ["●", "▲"], []).errorType).toBe("omission"));
  it("marks a short answer as incomplete", () => expect(make("forward", ["●", "▲", "■"], ["●"]).errorType).toBe("incomplete-response"));
  it("marks a late recall as late-response", () => expect(make("forward", ["●", "▲"], ["●", "▲"], 4501).errorType).toBe("late-response"));
  it("counts exact positional matches", () => expect(positionalMatchCount(["A", "B", "C", "D"], ["A", "B", "D", "C"])).toBe(2));
  it("calculates positional accuracy", () => expect(make("forward", ["A", "B", "C", "D"], ["A", "B", "D", "C"]).positionalAccuracy).toBe(50));
  it("tracks the maximum successful sequence span", () => {
    const summary = createSummary("session", "kids", [make("forward", ["A", "B"], ["A", "B"]), make("forward", ["A", "B", "C", "D"], ["A", "B", "C", "D"])], 2);
    expect(summary.maxSuccessfulSequenceLength).toBe(4);
  });
  it("returns no score for insufficient data", () => expect(calculateWorkingMemoryScore([make("forward", ["A", "B"], ["A", "B"])] )).toBeNull());
  it("raises adaptive difficulty for a strong ten-trial block", () => {
    expect(nextWorkingMemoryDifficulty(4, Array.from({ length: 10 }, () => make("forward", ["A", "B"], ["A", "B"])))) .toBe(5);
  });
  it("holds adaptive difficulty for middle performance", () => {
    const block = Array.from({ length: 7 }, () => make("forward", ["A", "B"], ["A", "B"])).concat(Array.from({ length: 3 }, () => make("forward", ["A", "B"], [])));
    expect(nextWorkingMemoryDifficulty(4, block)).toBe(4);
  });
  it("lowers adaptive difficulty for weak performance", () => {
    expect(nextWorkingMemoryDifficulty(4, Array.from({ length: 10 }, () => make("forward", ["A", "B"], [])))) .toBe(3);
  });
  it("clamps adaptive difficulty at level one", () => {
    expect(nextWorkingMemoryDifficulty(1, Array.from({ length: 10 }, () => make("forward", ["A", "B"], [])))) .toBe(1);
  });
  it("uses a longer Kids presentation and response window", () => { expect(workingMemoryParams("kids", 1).presentationMs).toBeGreaterThan(workingMemoryParams("teen", 1).presentationMs); expect(workingMemoryParams("kids", 1).responseWindowMs).toBeGreaterThan(workingMemoryParams("teen", 1).responseWindowMs); });
});
