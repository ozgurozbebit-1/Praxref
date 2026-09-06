import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { RunnerGame } from "@/features/focus-hunt/visual-lab/RunnerGame";
import { TownLab } from "@/features/selective-attention/visual-lab/TownLab";

export default async function VisualLab({
  params,
}: {
  params: Promise<{ audience: string; game: string }>;
}) {
  const { audience, game } = await params;
  if (
    (game !== "focus-hunt" && game !== "selective-attention") ||
    (audience !== "kids" && audience !== "teen")
  )
    notFound();
  if (game === "selective-attention") return <TownLab audience={audience} />;
  return (
    <Shell play>
      <RunnerGame audience={audience} development />
    </Shell>
  );
}
