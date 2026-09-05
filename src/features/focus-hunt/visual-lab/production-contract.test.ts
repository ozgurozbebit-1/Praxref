import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COURSE } from "./course";
import {
  FOCUS_HUNT_SESSION_SECONDS,
  focusHuntConfig,
  getDifficultyParams,
} from "../config/focus-hunt";
const read = (file: string) =>
  readFileSync(path.resolve(process.cwd(), file), "utf8");

describe("Focus Hunt Atlas promotion and classic preservation", () => {
  it("keeps Atlas at 54 seconds and classic at 120 with the shared config intact", () => {
    expect(COURSE.seconds).toBe(54);
    expect(FOCUS_HUNT_SESSION_SECONDS).toBe(120);
    expect(focusHuntConfig.kids.initialDifficulty).toBe(2);
    expect(focusHuntConfig.teen.initialDifficulty).toBe(4);
    expect(getDifficultyParams("kids", 2).responseWindowMs).toBe(1600);
    expect(getDifficultyParams("teen", 4).responseWindowMs).toBe(1050);
  });
  it("main Focus Hunt and visual-lab use the same approved runner", () => {
    const route = read("src/app/play/[audience]/[game]/page.tsx");
    const game = read("src/features/focus-hunt/components/focus-hunt-game.tsx");
    expect(route).toContain('if (game === "focus-hunt")');
    expect(route).toContain("<RunnerGame audience={safeAudience}");
    expect(route).not.toContain("FocusHuntGame");
    expect(game).not.toContain("visual-lab/runtime");
    expect(game).not.toContain("session-adapter");
    expect(
      read("src/app/play/[audience]/[game]/visual-lab/page.tsx"),
    ).toContain("<RunnerGame");
  });
  it("keeps the classic route using the old game without advertising it in Atlas", () => {
    const classic = read("src/app/play/[audience]/[game]/classic/page.tsx");
    expect(classic).toContain("<FocusHuntGame audience={audience}");
    expect(classic).toContain('game !== "focus-hunt"');
    expect(
      read("src/features/focus-hunt/visual-lab/RunnerGame.tsx"),
    ).not.toContain("/classic");
  });
  it("redirects the older unsegmented entry to the new main Kids route", () => {
    expect(read("src/app/play/focus-hunt/page.tsx")).toContain(
      'redirect("/play/kids/focus-hunt")',
    );
  });
  it("only visual-lab opts into development labels; default links return to the game centre", () => {
    expect(
      read("src/app/play/[audience]/[game]/visual-lab/page.tsx"),
    ).toContain("audience={audience} development");
    const runner = read("src/features/focus-hunt/visual-lab/RunnerGame.tsx");
    expect(runner).toContain("development = false");
    expect(runner).toContain("Oyun merkezine dön");
  });
});
