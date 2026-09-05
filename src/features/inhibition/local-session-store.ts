"use client";

import type { InhibitionSummary, InhibitionTrial } from "./types";

const sessionsKey = "praxref.inhibition.sessions";
const trialsKey = "praxref.inhibition.trials";
const maxSessions = 12;
let memorySessions: InhibitionSummary[] = [];
let memoryTrials: InhibitionTrial[] = [];

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local demo storage is optional: quota/privacy failures must not stop play.
  }
}

function read<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value as T[] : fallback;
  } catch {
    return fallback;
  }
}

export const inhibitionSessionStore = {
  saveTrial(trial: InhibitionTrial) {
    memoryTrials = [trial, ...memoryTrials].slice(0, 200);
    if (typeof window !== "undefined") write(trialsKey, memoryTrials);
  },
  saveSessionSummary(summary: InhibitionSummary) {
    memorySessions = [summary, ...memorySessions].slice(0, maxSessions);
    if (typeof window !== "undefined") write(sessionsKey, memorySessions);
  },
  getRecentSessions() {
    return read<InhibitionSummary>(sessionsKey, memorySessions);
  },
};
