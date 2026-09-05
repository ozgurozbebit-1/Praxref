"use client";

import { useEffect, useState } from "react";
import { Card, TrendIndicator } from "@/components/ui";
import { inhibitionSessionStore, type InhibitionSummary } from "@/features/inhibition";

export function RecentInhibitionSession() {
  const [session, setSession] = useState<InhibitionSummary | null>(null);

  useEffect(() => {
    setSession(inhibitionSessionStore.getRecentSessions()[0] ?? null);
  }, []);

  if (!session) return <Card className="recent-session recent-session--empty"><div><p className="eyebrow">Dur-Git</p><h2>Henüz yerel oturum yok</h2><p className="muted">Bir Dur-Git oturumu tamamlandığında özet burada görünür.</p></div><TrendIndicator label="Yerel demo verisi" direction="flat" /></Card>;

  return <Card className="recent-session"><div><p className="eyebrow">Son Dur-Git oturumu</p><h2>{session.audience === "kids" ? "Praxref Kids" : "Praxref Teen"}</h2><p className="muted">{session.totalTrials} trial · %{session.inhibitionAccuracy ?? "—"} durma doğruluğu</p><p className="muted">{session.commissionErrors} commission · {session.prematureResponses} premature</p></div><div><strong>{session.inhibitionScore ?? "—"}</strong><span>İnhibisyon Kontrolü</span><TrendIndicator label="Yerel demo verisi" direction="flat" /></div></Card>;
}
