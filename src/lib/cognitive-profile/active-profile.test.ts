import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileReport } from "@/app/profile/profile-report";
import styles from "@/app/profile/profile-report.module.css";
import { CognitiveProfile } from "@/components/cognitive-profile";
import { buildCognitiveProfile } from "./profile-engine";
import {
  ACTIVE_PROFILE_DOMAINS,
  PROFILE_PAGE_COUNT,
  type PremiumGamePerformanceRecord,
} from "./profile-types";

const data = vi.hoisted(() => ({
  records: [] as PremiumGamePerformanceRecord[],
  bridge: vi.fn(() => [] as Array<{ score: number }>),
}));
vi.mock("./performance-store", () => ({
  getPremiumPerformance: () => data.records,
  getKogniFlexBridge: data.bridge,
}));
vi.mock("@/lib/session-store/unified-session-store", () => ({
  getRecentUnifiedSessions: () => [],
}));
// Render the report after hydration without introducing browser/test packages.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) =>
      actual.useState(initial === false ? true : initial),
  };
});

function record(
  game: PremiumGamePerformanceRecord["game"],
  score: number | null,
): PremiumGamePerformanceRecord {
  return {
    id: game,
    game,
    score,
    audience: "kids",
    completedAt: "2026-10-06T10:00:00Z",
    metrics: {},
  };
}
beforeEach(() => {
  data.records = [];
  data.bridge.mockReset().mockReturnValue([]);
});

describe("active PraxRef profile scope", () => {
  it("averages only available active scores without an absent KogniFlex penalty", () => {
    data.records = [
      record("focus-hunt", 80),
      record("selective-attention", 60),
    ];
    const report = buildCognitiveProfile();
    expect(report.availableDomainCount).toBe(2);
    expect(report.overallScore).toBe(70);
    expect(report.domains.map((domain) => domain.key)).toEqual(
      ACTIVE_PROFILE_DOMAINS,
    );
    expect(report.domains).toHaveLength(5);
    expect(
      report.domains.some((domain) => domain.sourceGames.includes("KogniFlex")),
    ).toBe(false);
  });
  it("keeps real zero scores in the denominator while excluding missing scores", () => {
    data.records = [record("focus-hunt", 0), record("selective-attention", 80)];
    expect(buildCognitiveProfile().overallScore).toBe(40);
    expect(buildCognitiveProfile().availableDomainCount).toBe(2);
    data.records[0].score = null;
    expect(buildCognitiveProfile().overallScore).toBe(80);
    expect(buildCognitiveProfile().availableDomainCount).toBe(1);
    data.records = [record("focus-hunt", 0)];
    expect(buildCognitiveProfile().overallScore).toBe(0);
    data.records = [];
    expect(buildCognitiveProfile().overallScore).toBeNull();
    expect(buildCognitiveProfile().availableDomainCount).toBe(0);
  });
  it("averages all five active domains when their measurements are available", () => {
    data.records = [
      {
        ...record("focus-hunt", 80),
        metrics: { meanReactionTimeMs: 250, accuracyPercent: 100 },
      },
      record("selective-attention", 60),
      record("inhibition", 40),
      { ...record("praxref-city", 20), metrics: { decisionScore: 20 } },
    ];
    const report = buildCognitiveProfile();
    expect(report.domains.map((domain) => domain.score)).toEqual([
      80, 60, 40, 100, 20,
    ]);
    expect(report.availableDomainCount).toBe(5);
    expect(report.overallScore).toBe(60);
  });
  it("does not read or include historical KogniFlex scores, even zero", () => {
    data.records = [record("focus-hunt", 80)];
    for (const score of [0, 100]) {
      data.bridge.mockReturnValue([{ score }]);
      expect(buildCognitiveProfile().overallScore).toBe(80);
    }
    expect(data.bridge).not.toHaveBeenCalled();
  });
  it("excludes non-finite scores from the overall average", () => {
    data.records = [
      record("focus-hunt", 80),
      record("selective-attention", NaN),
    ];
    expect(buildCognitiveProfile().overallScore).toBe(80);
    expect(buildCognitiveProfile().availableDomainCount).toBe(1);
  });
  it("renders only five active domain cards and eight print/PDF pages", () => {
    data.records = [record("focus-hunt", 0)];
    const dashboard = renderToStaticMarkup(createElement(CognitiveProfile));
    const report = renderToStaticMarkup(createElement(ProfileReport));
    for (const html of [dashboard, report]) {
      expect(html).not.toContain("Bilişsel Esneklik");
      expect(html).not.toContain("KogniFlex");
    }
    expect(dashboard.match(/class="[^"]*\bdomain-card\b[^"]*"/g)).toHaveLength(
      5,
    );
    expect(PROFILE_PAGE_COUNT).toBe(8);
    expect(report.split(`class="${styles.printPage}`).length - 1).toBe(
      PROFILE_PAGE_COUNT,
    );
    expect(report).not.toContain("NaN");
  });
});
