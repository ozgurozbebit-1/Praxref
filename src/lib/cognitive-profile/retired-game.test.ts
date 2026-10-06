import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { games } from "@/lib/demo";
import { PRAXREF_SEQUENCE, nextSequenceStep } from "@/lib/praxref-sequence";
import { buildCognitiveProfile } from "./profile-engine";
import { getPremiumPerformance } from "./performance-store";
import {
  getRecentUnifiedSessions,
  getLatestDomainScores,
} from "@/lib/session-store/unified-session-store";
import { normalizeFocusHunt } from "@/lib/protocol/metric-normalization";
const data = new Map<string, string>();
beforeEach(() => {
  data.clear();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());
describe("retired working-memory data", () => {
  it("is absent from menu/sequence and inhibition continues directly to City", () => {
    expect(games.map((g) => g[0])).not.toContain("working-memory");
    expect(PRAXREF_SEQUENCE.map((g) => g.slug)).not.toContain("working-memory");
    expect(nextSequenceStep("kids", "inhibition")?.href).toBe(
      "/play/kids/praxref-city",
    );
    expect(nextSequenceStep("teen", "praxref-city")).toBeNull();
  });
  it("ignores legacy unified memory without deleting the stored record", () => {
    const session = normalizeFocusHunt({
      sessionId: "old",
      audience: "kids",
      totalTrials: 12,
      lateResponses: 0,
      sustainedAttentionScore: 99,
      accuracyPercent: 100,
      omissionErrors: 0,
      commissionErrors: 0,
      currentDifficulty: 2,
      completedDurationSec: 90,
      insufficientData: false,
    });
    const raw = JSON.stringify([
      null,
      { ...session, gameType: "working-memory", domain: "workingMemory" },
    ]);
    data.set("praxref.unified-sessions", raw);
    expect(getRecentUnifiedSessions()).toEqual([]);
    expect(getLatestDomainScores().map((d) => d.domain)).not.toContain(
      "workingMemory",
    );
    expect(data.get("praxref.unified-sessions")).toBe(raw);
  });
  it("does not include memory in any domain, speed, recommendation input or normalized total", () => {
    const records = ["focus-hunt", "selective-attention", "inhibition"].map(
      (game, index) => ({
        id: game,
        game,
        audience: "kids",
        completedAt: "2026-10-05T10:00:00Z",
        score: 60 + index * 10,
        metrics: { meanReactionTimeMs: 500, accuracyPercent: 80 },
      }),
    );
    data.set("praxref.profile.premium-performance", JSON.stringify(records));
    const before = buildCognitiveProfile();
    const raw = JSON.stringify([
      ...records,
      {
        ...records[0],
        id: "retired",
        game: "working-memory",
        score: 0,
        metrics: { meanReactionTimeMs: 999999, accuracyPercent: 0 },
      },
    ]);
    data.set("praxref.profile.premium-performance", raw);
    const after = buildCognitiveProfile();
    expect(after.domains).toEqual(before.domains);
    expect(after.overallScore).toBe(before.overallScore);
    expect(after.domains).toHaveLength(5);
    const scores = after.domains.flatMap((d) =>
      d.score === null ? [] : [d.score],
    );
    expect(after.overallScore).toBe(
      Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    );
    expect(getPremiumPerformance()).toHaveLength(3);
    expect(data.get("praxref.profile.premium-performance")).toBe(raw);
  });
  it("old-only or broken saves produce a safe empty profile", () => {
    data.set(
      "praxref.profile.premium-performance",
      JSON.stringify([null, { game: "working-memory" }]),
    );
    expect(buildCognitiveProfile().overallScore).toBeNull();
    data.set("praxref.profile.premium-performance", "broken{");
    data.set("praxref.unified-sessions", "broken{");
    expect(() => buildCognitiveProfile()).not.toThrow();
  });
});
