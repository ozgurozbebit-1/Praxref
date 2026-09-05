import { Game } from "@/components/game";
import { Shell } from "@/components/shell";
import { MissionShell } from "@/features/adventure/components/mission-shell";
import { RunnerGame } from "@/features/focus-hunt/visual-lab/RunnerGame";
import { InhibitionGame } from "@/features/inhibition/components/inhibition-game";
import { SelectiveAttentionGame } from "@/features/selective-attention/components/selective-attention-game";
import { WorkingMemoryGame } from "@/features/working-memory/components/working-memory-game";
import type { Audience } from "@/lib/audience";
import { games } from "@/lib/demo";

export default async function AudienceGame({
  params,
}: PageProps<"/play/[audience]/[game]">) {
  const { audience, game } = await params;
  const safeAudience: Audience = audience === "teen" ? "teen" : "kids";
  // Use the approved Atlas layout without the old space mission wrapper.
  if (game === "focus-hunt")
    return (
      <Shell play>
        <RunnerGame audience={safeAudience} />
      </Shell>
    );
  const current = games.find(([slug]) => slug === game) ?? games[0];
  const content =
    game === "selective-attention" ? (
      <SelectiveAttentionGame audience={safeAudience} />
    ) : game === "inhibition" ? (
      <InhibitionGame audience={safeAudience} />
    ) : game === "working-memory" ? (
      <WorkingMemoryGame audience={safeAudience} />
    ) : (
      <Game
        title={`${current[1]} · ${safeAudience === "kids" ? "Kids" : "Teen"}`}
        game={current[0]}
        audience={safeAudience}
        instruction={current[3]}
      />
    );
  return (
    <Shell play>
      {["selective-attention", "inhibition", "working-memory"].includes(
        game,
      ) ? (
        <MissionShell
          audience={safeAudience}
          mission={
            game as "selective-attention" | "inhibition" | "working-memory"
          }
        >
          {content}
        </MissionShell>
      ) : (
        content
      )}
    </Shell>
  );
}
