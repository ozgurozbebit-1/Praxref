import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { RunnerGame } from "@/features/focus-hunt/visual-lab/RunnerGame";

export default async function VisualLab({
  params,
}: {
  params: Promise<{ audience: string; game: string }>;
}) {
  const { audience, game } = await params;
  if (game !== "focus-hunt" || (audience !== "kids" && audience !== "teen"))
    notFound();
  return (
    <Shell play>
      <RunnerGame audience={audience} development />
    </Shell>
  );
}
