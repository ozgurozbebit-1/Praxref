"use client";

import { useEffect } from "react";

const RESET_VERSION = "2026-09-06-v1";
const VERSION_KEY = "praxref.stats-reset-version";
const KEYS = [
  "praxref.focus-hunt.sessions",
  "praxref.focus-hunt.trials",
  "praxref.selective-attention.sessions",
  "praxref.selective-attention.trials",
  "praxref.inhibition.sessions",
  "praxref.inhibition.trials",
  "praxref.working-memory.sessions",
  "praxref.working-memory.trials",
  "praxref.unified-sessions",
];

export function StatisticsReset() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem(VERSION_KEY) === RESET_VERSION) return;
      KEYS.forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.setItem(VERSION_KEY, RESET_VERSION);
    } catch {
      // Storage may be unavailable in private/restricted browser contexts.
    }
  }, []);

  return null;
}
