import { Game } from "@/components/game";
import { Shell } from "@/components/shell";
import { MissionShell } from "@/features/adventure/components/mission-shell";
import { RunnerGame } from "@/features/focus-hunt/visual-lab/RunnerGame";
import { StarBlaster } from "@/features/inhibition/visual-lab/StarBlaster";
import { SelectiveAttentionGame } from "@/features/selective-attention/components/selective-attention-game";
import { TownLab } from "@/features/selective-attention/visual-lab/TownLab";
import { WorkingMemoryGame } from "@/features/working-memory/components/working-memory-game";
import { PraxrefCity } from "@/features/final-city/PraxrefCity";
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
  if (game === "praxref-city")
    return (
      <Shell play>
        <PraxrefCity audience={safeAudience} development={false} />
      </Shell>
    );
  if (game === "inhibition")
    return (
      <Shell play>
        <StarBlaster audience={safeAudience} development={false} />
      </Shell>
    );
  // Selective Attention now opens directly into the approved Sahil Kasabası experience.
  if (game === "selective-attention")
    return (
      <Shell play>
        <TownLab audience={safeAudience} />
      </Shell>
    );
  const current = games.find(([slug]) => slug === game) ?? games[0];
  const content =
    game === "selective-attention" ? (
      <SelectiveAttentionGame audience={safeAudience} />
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
