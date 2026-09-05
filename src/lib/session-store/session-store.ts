import type { FocusHuntSessionSummary, FocusHuntTrial } from "@/features/focus-hunt";
export interface SessionStore { saveTrial(trial: FocusHuntTrial): void; saveSessionSummary(summary: FocusHuntSessionSummary): void; getRecentSessions(): FocusHuntSessionSummary[]; }
