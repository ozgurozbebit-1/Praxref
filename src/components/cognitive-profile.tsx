"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { buildCognitiveProfile } from "@/lib/cognitive-profile/profile-engine";

export function CognitiveProfile() {
  const [version, setVersion] = useState(0);
  const report = useMemo(() => buildCognitiveProfile(), [version]);

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <section className="cognitive-profile">
      <div className="profile-heading">
        <div>
          <p className="eyebrow">PRAXREF Bilişsel Profil</p>
          <h2>{report.domains.length} alanlı profil</h2>
          <p className="muted">
            Oyun oturumları tamamlandıkça dikkat, inhibisyon, hız ve karar verme
            alanları birleşir.
          </p>
        </div>
      </div>

      <div className="domain-grid">
        {report.domains.map((domain) => (
          <Card key={domain.key} className="domain-card">
            <p>{domain.label}</p>
            <strong>{domain.score ?? "—"}</strong>
            <span>
              {domain.status === "ready"
                ? "Profil hazır"
                : domain.status === "limited"
                  ? "Sınırlı veri"
                  : "Veri bekleniyor"}
            </span>
            <small>{domain.sourceGames.join(" · ")}</small>
          </Card>
        ))}
      </div>

      <Card className="profile-summary">
        <h3>Genel profil</h3>
        <p>
          {report.overallScore === null
            ? `Şu anda ${report.availableDomainCount}/${report.domains.length} alanda veri var. Genel skor için ölçüm verisi bekleniyor.`
            : `Mevcut ${report.availableDomainCount}/${report.domains.length} alanın oyun-içi ortalama profil skoru ${report.overallScore}/100.`}
        </p>
        <p>
          Bu skorlar klinik norm değildir; oyun-içi performans göstergeleridir.
        </p>
        <Link className="button button--secondary" href="/profile">
          Ayrıntılı raporu aç / yazdır →
        </Link>
      </Card>
    </section>
  );
}
