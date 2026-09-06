import Link from "next/link";
import { CognitiveProfile } from "@/components/cognitive-profile";
import { RecentFocusHuntSession } from "@/features/focus-hunt/components/recent-session-card";
import { RecentSelectiveAttentionSession } from "@/features/selective-attention/components/recent-session-card";
import { RecentInhibitionSession } from "@/features/inhibition/components/recent-session-card";
import { RecentWorkingMemorySession } from "@/features/working-memory/components/recent-session-card";
import { Shell } from "@/components/shell";
import {
  Card,
  MetricCard,
  PageHeader,
  Score,
  SectionHeader,
  Trend,
  TrendIndicator,
} from "@/components/ui";
import { children, trend } from "@/lib/demo";

export default function Clinician() {
  const c = children[0];
  return (
    <Shell>
      <PageHeader
        eyebrow="Klinisyen alanı"
        title="ÖZBEBİT"
        description="Yeni başlangıç · istatistikler sıfırlandı"
        action={
          <Link className="button button--primary" href="/clinician/children">
            Tüm çocuklar
          </Link>
        }
      />
      <CognitiveProfile />

      <section className="metric-grid">
        <MetricCard label="Aktif çocuk" value="0" detail="Henüz kayıt yok" />
        <MetricCard label="Tamamlanan oturum" value="0" detail="Henüz oturum yok" tone="coral" />
        <MetricCard label="Ortalama uyum" value="%0" detail="Henüz veri yok" tone="success" />
        <MetricCard label="Dikkat trendi" value="0" detail="Başlangıç noktası" tone="lilac" />
      </section>

      <section className="recent-session-grid">
        <RecentFocusHuntSession />
        <RecentSelectiveAttentionSession />
        <RecentInhibitionSession />
        <RecentWorkingMemorySession />
      </section>

      <section className="dashboard-grid">
        <Card className="chart-card">
          <SectionHeader
            title="Dikkat trendi"
            description="Yeni başlangıç"
            action={<TrendIndicator label="Veri yok" direction="flat" />}
          />
          <Trend values={trend} />
        </Card>
        <Card className="activity-card">
          <h2>Son aktivite</h2>
          <p className="muted">Henüz tamamlanmış aktivite yok.</p>
        </Card>
      </section>

      <SectionHeader
        title="Bilişsel beceri görünümü"
        description="Yeni oturumlarla otomatik oluşacak"
      />
      <section className="scores">
        {["Sürdürülen dikkat", "Seçici dikkat", "İnhibisyon", "Çalışma belleği"].map(
          (name, index) => (
            <Score key={name} name={name} value={c.s[index]} />
          ),
        )}
      </section>
    </Shell>
  );
}
