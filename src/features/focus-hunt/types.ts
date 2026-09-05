export type FocusHuntAudience = "kids" | "teen";
export type StimulusType = "star" | "circle" | "diamond" | "spark";
export type ErrorType = "omission" | "commission" | "late-response" | null;

export type ReactionTimeQualityFlag = "too-fast" | "invalid" | null;
export type FocusHuntTrial = { trialId: string; sessionId: string; audience: FocusHuntAudience; difficultyLevel: number; stimulusType: StimulusType; isTarget: boolean; appearedAt: number; respondedAt: number | null; reactionTimeMs: number | null; reactionTimeQualityFlag: ReactionTimeQualityFlag; responded: boolean; correct: boolean; errorType: ErrorType };
export type FocusHuntSessionSummary = { sessionId: string; audience: FocusHuntAudience; totalTrials: number; targetTrials: number; distractorTrials: number; correctResponses: number; omissionErrors: number; commissionErrors: number; lateResponses: number; accuracyPercent: number | null; meanReactionTimeMs: number | null; medianReactionTimeMs: number | null; reactionTimeSD: number | null; reactionTimeCV: number | null; completedDurationSec: number; currentDifficulty: number; sustainedAttentionScore: number | null; insufficientData: boolean };
export type FocusHuntStimulus = { type: StimulusType; isTarget: boolean };
