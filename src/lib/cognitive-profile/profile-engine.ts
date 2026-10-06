"use client";

import { getRecentUnifiedSessions } from "@/lib/session-store/unified-session-store";
import type { UnifiedSession } from "@/lib/protocol/session-protocol";
import { getPremiumPerformance } from "./performance-store";
import { ACTIVE_PROFILE_DOMAINS } from "./profile-types";
import type {
  CognitiveProfileReport,
  DomainProfile,
  PremiumGamePerformanceRecord,
  ProfileDomainKey,
} from "./profile-types";

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const round = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? null
    : Math.round(value);
const mean = (values: number[]) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

const labels: Record<ProfileDomainKey, [string, string]> = {
  attention: ["Dikkat", "Dikkat"],
  selectiveAttention: ["Seçici Dikkat", "Seçici"],
  inhibition: ["İnhibisyon", "İnhibisyon"],
  cognitiveFlexibility: ["Bilişsel Esneklik", "Esneklik"],
  processingSpeed: ["İşlemleme Hızı", "Hız"],
  decisionMaking: ["Karar Verme", "Karar"],
};

function reactionScore(ms: number | undefined) {
  if (ms === undefined || !Number.isFinite(ms)) return null;
  // Game-performance transform only; not an age norm.
  return clamp(100 - ((ms - 250) / 950) * 100);
}

function trendFrom(values: Array<number | null | undefined>) {
  return values
    .filter((value): value is number => value !== null && value !== undefined)
    .slice(0, 6)
    .reverse()
    .map((value) => Math.round(value));
}

function unifiedFor(
  sessions: UnifiedSession[],
  gameType: UnifiedSession["gameType"],
) {
  return sessions.filter((session) => session.gameType === gameType);
}

function premiumFor(
  records: PremiumGamePerformanceRecord[],
  game: PremiumGamePerformanceRecord["game"],
) {
  return records.filter((record) => record.game === game);
}

function chooseLatest(
  unified: UnifiedSession[],
  premium: PremiumGamePerformanceRecord[],
) {
  const u = unified[0];
  const p = premium[0];
  if (!u) return p ? { kind: "premium" as const, value: p } : null;
  if (!p) return { kind: "unified" as const, value: u };
  return Date.parse(p.completedAt) >= Date.parse(u.completedAt)
    ? { kind: "premium" as const, value: p }
    : { kind: "unified" as const, value: u };
}

function baseDomain(
  key: ProfileDomainKey,
  score: number | null,
  sourceGames: string[],
  metrics: DomainProfile["metrics"],
  trend: number[],
  summary: string,
): DomainProfile {
  return {
    key,
    label: labels[key][0],
    shortLabel: labels[key][1],
    score: score === null ? null : Math.round(clamp(score)),
    status:
      score === null ? "insufficient" : trend.length < 2 ? "limited" : "ready",
    sourceGames,
    metrics,
    trend,
    summary,
  };
}

function fromLatestSession(
  key: "attention" | "selectiveAttention" | "inhibition",
  latest: ReturnType<typeof chooseLatest>,
  allUnified: UnifiedSession[],
  allPremium: PremiumGamePerformanceRecord[],
  sourceLabel: string,
) {
  if (!latest)
    return baseDomain(
      key,
      null,
      [sourceLabel],
      [],
      [],
      "Bu alan için tamamlanmış oturum verisi henüz yok.",
    );

  const isUnified = latest.kind === "unified";
  const metrics = latest.value.metrics;
  const score = latest.value.score;
  const accuracy = metrics.accuracyPercent;
  const omission = metrics.omissionRate;
  const commission = metrics.commissionRate;
  const meanRt = metrics.meanReactionTimeMs;
  const medianRt = metrics.medianReactionTimeMs;
  const cv = metrics.reactionTimeCV;
  const trend = trendFrom([
    ...allPremium.map((item) => item.score),
    ...allUnified.map((item) => item.score),
  ]);

  return baseDomain(
    key,
    score,
    [sourceLabel],
    [
      { label: "Doğruluk", value: round(accuracy), unit: "%" },
      {
        label: "Ortalama tepki",
        value: round(meanRt),
        unit: "ms",
        higherIsBetter: false,
      },
      {
        label: "Medyan tepki",
        value: round(medianRt),
        unit: "ms",
        higherIsBetter: false,
      },
      {
        label: "Kaçırma",
        value: round(omission),
        unit: "%",
        higherIsBetter: false,
      },
      {
        label: "Yanlış tepki",
        value: round(commission),
        unit: "%",
        higherIsBetter: false,
      },
      {
        label: "Tepki değişkenliği",
        value: round(cv),
        unit: "%",
        higherIsBetter: false,
      },
    ],
    trend,
    isUnified
      ? "Bu alan, son standart oyun oturumunun özet performansından hesaplandı."
      : "Bu alan, premium oyun oturumunun gerçek zamanlı performans özetinden hesaplandı.",
  );
}

export function buildCognitiveProfile(): CognitiveProfileReport {
  const unified = getRecentUnifiedSessions();
  const premium = getPremiumPerformance();

  const focusUnified = unifiedFor(unified, "focus-hunt");
  const focusPremium = premiumFor(premium, "focus-hunt");
  const selectiveUnified = unifiedFor(unified, "selective-attention");
  const selectivePremium = premiumFor(premium, "selective-attention");
  const inhibitionUnified = unifiedFor(unified, "inhibition");
  const inhibitionPremium = premiumFor(premium, "inhibition");

  const attention = fromLatestSession(
    "attention",
    chooseLatest(focusUnified, focusPremium),
    focusUnified,
    focusPremium,
    "Odak Avı",
  );
  const selective = fromLatestSession(
    "selectiveAttention",
    chooseLatest(selectiveUnified, selectivePremium),
    selectiveUnified,
    selectivePremium,
    "Gürültüde Hedef",
  );
  const inhibition = fromLatestSession(
    "inhibition",
    chooseLatest(inhibitionUnified, inhibitionPremium),
    inhibitionUnified,
    inhibitionPremium,
    "Yıldız Savunması",
  );

  const recentReactionSources = [
    ...focusPremium,
    ...selectivePremium,
    ...inhibitionPremium,
  ]
    .filter((item) => item.metrics.meanReactionTimeMs !== undefined)
    .slice(0, 9);
  const unifiedReactionSources = [
    ...focusUnified,
    ...selectiveUnified,
    ...inhibitionUnified,
  ]
    .filter((item) => item.metrics.meanReactionTimeMs !== undefined)
    .slice(0, 12);

  const speedSessionScores = [
    ...recentReactionSources.map((item) => {
      const rt = reactionScore(item.metrics.meanReactionTimeMs);
      const accuracy = item.metrics.accuracyPercent;
      return rt === null ? null : rt * 0.75 + (accuracy ?? 100) * 0.25;
    }),
    ...unifiedReactionSources.map((item) => {
      const rt = reactionScore(item.metrics.meanReactionTimeMs);
      const accuracy = item.metrics.accuracyPercent;
      return rt === null ? null : rt * 0.75 + (accuracy ?? 100) * 0.25;
    }),
  ].filter((value): value is number => value !== null);

  const speedRtValues = [
    ...recentReactionSources.map((item) => item.metrics.meanReactionTimeMs),
    ...unifiedReactionSources.map((item) => item.metrics.meanReactionTimeMs),
  ].filter((value): value is number => value !== undefined);

  const processingSpeedScore = mean(speedSessionScores);
  const processingSpeed = baseDomain(
    "processingSpeed",
    processingSpeedScore,
    ["Odak Avı", "Gürültüde Hedef", "Yıldız Savunması"],
    [
      {
        label: "Ortalama tepki",
        value: round(mean(speedRtValues)),
        unit: "ms",
        higherIsBetter: false,
      },
      {
        label: "En hızlı oturum",
        value: speedRtValues.length ? round(Math.min(...speedRtValues)) : null,
        unit: "ms",
        higherIsBetter: false,
      },
      {
        label: "En yavaş oturum",
        value: speedRtValues.length ? round(Math.max(...speedRtValues)) : null,
        unit: "ms",
        higherIsBetter: false,
      },
      {
        label: "Hız örnek sayısı",
        value: speedRtValues.length,
        unit: " oturum",
      },
    ],
    trendFrom(speedSessionScores),
    "İşlemleme hızı, tepki süresi ile doğruluk dengesinin oyun-içi bileşimidir; klinik norm değildir.",
  );

  const city = premiumFor(premium, "praxref-city");
  const latestCity = city[0];
  const decisionFallbackInputs = [
    selective.score,
    inhibition.score,
    processingSpeed.score,
  ].filter((value): value is number => value !== null);
  const decisionScore =
    latestCity?.metrics.decisionScore ??
    (decisionFallbackInputs.length >= 2 ? mean(decisionFallbackInputs) : null);

  const decisionMaking = baseDomain(
    "decisionMaking",
    decisionScore,
    latestCity
      ? ["PraxRef City", "Gürültüde Hedef", "Yıldız Savunması"]
      : ["Gürültüde Hedef", "Yıldız Savunması"],
    [
      {
        label: "Karar süresi",
        value: round(latestCity?.metrics.meanReactionTimeMs),
        unit: "ms",
        higherIsBetter: false,
      },
      {
        label: "Seçim doğruluğu",
        value: round(latestCity?.metrics.accuracyPercent),
        unit: "%",
      },
      {
        label: "Hedef yakalama",
        value: round(latestCity?.metrics.targetHitRate),
        unit: "%",
      },
      {
        label: "Hız kontrolü",
        value: round(latestCity?.metrics.speedControlScore),
        unit: "/100",
      },
      {
        label: "Ortalama hız",
        value: round(latestCity?.metrics.averageSpeedKmh),
        unit: " km/sa",
      },
      {
        label: "Maksimum hız",
        value: round(latestCity?.metrics.maxSpeedKmh),
        unit: " km/sa",
      },
    ],
    latestCity
      ? trendFrom(city.map((item) => item.metrics.decisionScore ?? item.score))
      : trendFrom(decisionFallbackInputs),
    latestCity
      ? "Karar verme skoru PraxRef City telemetrisiyle desteklenmektedir."
      : "PraxRef City verisi oluşana kadar bu alan mevcut dikkat ve inhibisyon performansından sınırlı bir bileşim gösterir.",
  );

  const domains = [
    attention,
    selective,
    inhibition,
    processingSpeed,
    decisionMaking,
  ].filter((domain) =>
    ACTIVE_PROFILE_DOMAINS.some((key) => key === domain.key),
  );
  const available = domains
    .map((domain) => domain.score)
    .filter(
      (score): score is number => score !== null && Number.isFinite(score),
    );

  return {
    generatedAt: new Date().toISOString(),
    availableDomainCount: available.length,
    overallScore: round(mean(available)),
    domains,
  };
}
