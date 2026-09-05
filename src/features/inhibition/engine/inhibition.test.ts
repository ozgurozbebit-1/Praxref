import { describe, expect, it } from "vitest";
import { classify, createTrial, nextDifficulty, params, summary, type InhibitionTrial } from "@/features/inhibition";

const base = (trialType: InhibitionTrial["trialType"], appearedAt = 1000): Omit<InhibitionTrial, "respondedAt" | "reactionTimeMs" | "responded" | "correct" | "errorType" | "responseQualityFlag"> => ({ trialId: "trial", sessionId: "session", audience: "kids", difficultyLevel: 2, trialType, stimulusId: trialType, stimulusLabel: trialType, appearedAt });
const trial = (type: InhibitionTrial["trialType"], at: number | null) => classify(base(type), at, 1200);

describe("Dur-Git trial engine", () => {
  it("marks a timely GO response correct", () => expect(trial("go", 1400).correct).toBe(true));
  it("marks a missed GO as omission", () => expect(trial("go", null).errorType).toBe("omission"));
  it("marks a late GO as late-response", () => expect(trial("go", 2301).errorType).toBe("late-response"));
  it("marks withheld NO-GO as correct", () => expect(trial("no-go", null).correct).toBe(true));
  it("marks a NO-GO tap as commission", () => expect(trial("no-go", 1400).errorType).toBe("commission"));
  it("marks implausibly fast input as premature", () => expect(trial("go", 1050).errorType).toBe("premature-response"));
  it("creates only GO or NO-GO stimuli", () => expect(["go", "no-go"]).toContain(createTrial(.5).type));
  it("raises difficulty for a strong ten-trial block", () => expect(nextDifficulty(4, Array.from({ length: 10 }, () => trial("go", 1500)))).toBe(5));
  it("lowers difficulty for a weak ten-trial block", () => expect(nextDifficulty(4, Array.from({ length: 10 }, () => trial("go", null)))).toBe(3));
  it("never lowers difficulty below level one", () => expect(nextDifficulty(1, Array.from({ length: 10 }, () => trial("go", null)))).toBe(1));
  it("never raises difficulty above level ten", () => expect(nextDifficulty(10, Array.from({ length: 10 }, () => trial("go", 1500)))).toBe(10));
  it("uses a more forgiving Kids response window", () => expect(params("kids", 2).windowMs).toBeGreaterThan(params("teen", 2).windowMs));
  it("produces an insufficient-data summary for fewer than five trials", () => expect(summary("session", "kids", [trial("go", 1500)], 2).insufficientData).toBe(true));
});
