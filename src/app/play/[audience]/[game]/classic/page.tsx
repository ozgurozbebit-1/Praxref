import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { MissionShell } from "@/features/adventure/components/mission-shell";
import { FocusHuntGame } from "@/features/focus-hunt/components/focus-hunt-game";

export default async function ClassicFocusHunt({
  params,
}: {
  params: Promise<{ audience: string; game: string }>;
}) {
  const { audience, game } = await params;
  if (game !== "focus-hunt" || (audience !== "kids" && audience !== "teen"))
    notFound();
  return (
    <Shell play>
      <MissionShell audience={audience} mission="focus-hunt">
        <FocusHuntGame audience={audience} />
      </MissionShell>
    </Shell>
  );
}
