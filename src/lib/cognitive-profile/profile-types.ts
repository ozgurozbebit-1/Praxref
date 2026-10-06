export type ProfileAudience = "kids" | "teen";

export type ProfileDomainKey =
  | "attention"
  | "selectiveAttention"
  | "inhibition"
  | "cognitiveFlexibility"
  | "processingSpeed"
  | "decisionMaking";

// KogniFlex remains a separate integration, outside the active PraxRef report.
export const ACTIVE_PROFILE_DOMAINS = [
  "attention",
  "selectiveAttention",
  "inhibition",
  "processingSpeed",
  "decisionMaking",
] as const satisfies readonly ProfileDomainKey[];

// Introduction, general summary, domain pages, and final guidance.
export const PROFILE_PAGE_COUNT = ACTIVE_PROFILE_DOMAINS.length + 3;

export type ProfileMetric = {
  label: string;
  value: number | null;
  unit?: string;
  higherIsBetter?: boolean;
  note?: string;
};

export type DomainProfile = {
  key: ProfileDomainKey;
  label: string;
  shortLabel: string;
  score: number | null;
  status: "ready" | "limited" | "insufficient";
  sourceGames: string[];
  metrics: ProfileMetric[];
  trend: number[];
  summary: string;
};

export type CognitiveProfileReport = {
  generatedAt: string;
  availableDomainCount: number;
  overallScore: number | null;
  domains: DomainProfile[];
};

export type PremiumGamePerformanceRecord = {
  id: string;
  audience: ProfileAudience;
  game:
    | "focus-hunt"
    | "selective-attention"
    | "inhibition"
    | "working-memory" // Historical storage compatibility only; excluded by the read adapter.
    | "praxref-city";
  completedAt: string;
  score: number | null;
  metrics: Partial<{
    accuracyPercent: number;
    targetHitRate: number;
    distractorResistance: number;
    omissionRate: number;
    commissionRate: number;
    meanReactionTimeMs: number;
    medianReactionTimeMs: number;
    reactionTimeCV: number;
    consistencyScore: number;
    decisionScore: number;
    attentionScore: number;
    speedControlScore: number;
    averageSpeedKmh: number;
    maxSpeedKmh: number;
  }>;
};

export type KogniFlexBridgeRecord = {
  id: string;
  audience: ProfileAudience;
  completedAt: string;
  score: number | null;
  perseverationRate?: number;
  ruleShiftAccuracy?: number;
  postShiftErrorRate?: number;
  meanReactionTimeMs?: number;
  medianReactionTimeMs?: number;
};
