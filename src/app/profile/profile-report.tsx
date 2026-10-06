"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildCognitiveProfile } from "@/lib/cognitive-profile/profile-engine";
import { buildClinicalGuidance } from "@/lib/cognitive-profile/clinical-guidance";
import {
  ACTIVE_PROFILE_DOMAINS,
  PROFILE_PAGE_COUNT,
} from "@/lib/cognitive-profile/profile-types";
import type {
  CognitiveProfileReport,
  DomainProfile,
} from "@/lib/cognitive-profile/profile-types";
import {
  genderLabel,
  readParticipantProfile,
  type ParticipantProfile,
} from "@/lib/participant-profile";
import styles from "./profile-report.module.css";

const domainOrder = ACTIVE_PROFILE_DOMAINS;
const TOTAL_PAGES = PROFILE_PAGE_COUNT;

function ScoreRing({ score }: { score: number | null }) {
  const value = score ?? 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  return (
    <div
      className={styles.scoreRing}
      aria-label={score === null ? "Veri yok" : `${score} / 100`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} className={styles.ringTrack} />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className={styles.ringValue}
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <strong>{score ?? "—"}</strong>
      <span>/100</span>
    </div>
  );
}

function Radar({ report }: { report: CognitiveProfileReport }) {
  const domains = domainOrder.map((key) =>
    report.domains.find((domain) => domain.key === key)!,
  );
  const size = 420,
    center = size / 2,
    maxR = 150;
  const angleFor = (i: number) =>
    -Math.PI / 2 + (i * Math.PI * 2) / domains.length;
  const point = (i: number, f: number) => {
    const a = angleFor(i);
    return [
      center + Math.cos(a) * maxR * f,
      center + Math.sin(a) * maxR * f,
    ] as const;
  };
  const grid = [0.25, 0.5, 0.75, 1].map((f) =>
    domains.map((_, i) => point(i, f).join(",")).join(" "),
  );
  const polygon = domains
    .map((d, i) => point(i, (d.score ?? 0) / 100).join(","))
    .join(" ");
  return (
    <svg
      className={styles.radar}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Altı alanlı bilişsel profil radar grafiği"
    >
      {grid.map((pts, i) => (
        <polygon key={i} points={pts} className={styles.radarGrid} />
      ))}
      {domains.map((_, i) => {
        const [x, y] = point(i, 1);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            className={styles.radarAxis}
          />
        );
      })}
      <polygon points={polygon} className={styles.radarValue} />
      {domains.map((d, i) => {
        const [x, y] = point(i, 1.17);
        return (
          <text
            key={d.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={styles.radarLabel}
          >
            {d.shortLabel}
          </text>
        );
      })}
    </svg>
  );
}

function TrendChart({ values }: { values: number[] }) {
  if (!values.length)
    return (
      <div className={styles.emptyChart}>
        Trend için en az bir oturum gerekli.
      </div>
    );
  const width = 560,
    height = 180,
    padding = 24;
  const points = values.map((value, index) => {
    const x =
      values.length === 1
        ? width / 2
        : padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - (value / 100) * (height - padding * 2);
    return [x, y] as const;
  });
  return (
    <svg
      className={styles.trend}
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Oturum trend grafiği"
    >
      {[25, 50, 75, 100].map((value) => {
        const y = height - padding - (value / 100) * (height - padding * 2);
        return (
          <line
            key={value}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            className={styles.trendGrid}
          />
        );
      })}
      <polyline
        points={points.map((p) => p.join(",")).join(" ")}
        className={styles.trendLine}
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" className={styles.trendPoint} />
      ))}
    </svg>
  );
}

function MetricBars({ domain }: { domain: DomainProfile }) {
  const rows = domain.metrics.filter(
    (m) => m.value !== null && (m.unit === "%" || m.unit === "/100"),
  );
  if (!rows.length) return null;
  return (
    <div className={styles.metricBars}>
      {rows.map((m) => (
        <div key={m.label}>
          <div className={styles.metricBarHead}>
            <span>{m.label}</span>
            <b>
              {m.value}
              {m.unit}
            </b>
          </div>
          <div className={styles.metricTrack}>
            <i
              style={{ width: `${Math.max(0, Math.min(100, m.value ?? 0))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PageFooter({ page, right }: { page: number; right?: string }) {
  return (
    <footer className={styles.pageFooter}>
      <span>
        Sayfa {page} / {TOTAL_PAGES}
      </span>
      <span>{right ?? "PRAXREF · Oyun içi bilişsel performans raporu"}</span>
      <strong>Bu bir tıbbi tanılama aracı değildir.</strong>
    </footer>
  );
}

function IntroPage({
  participant,
  generatedLabel,
}: {
  participant: ParticipantProfile | null;
  generatedLabel: string;
}) {
  const start = participant ? new Date(participant.startedAt) : null;
  return (
    <section className={`${styles.printPage} ${styles.introPage}`}>
      <div className={styles.introBrand}>
        <img src="/assets/brand/logo/praxref-profile-mark.png" alt="PRAXREF" />
        <div>
          <span>PRAXREF</span>
          <h2>Bilişsel Profil Değerlendirme Raporu</h2>
          <p>
            Oyun içi performans verilerinin 6 bilişsel alanda yapılandırılmış
            özeti
          </p>
        </div>
      </div>
      <div className={styles.identityCard}>
        <div>
          <span>Ad Soyad</span>
          <strong>
            {participant
              ? `${participant.firstName} ${participant.lastName}`
              : "—"}
          </strong>
        </div>
        <div>
          <span>Cinsiyet</span>
          <strong>{participant ? genderLabel(participant.gender) : "—"}</strong>
        </div>
        <div>
          <span>Yaş</span>
          <strong>{participant ? `${participant.age}` : "—"}</strong>
        </div>
        <div>
          <span>Test tarihi</span>
          <strong>{start ? start.toLocaleDateString("tr-TR") : "—"}</strong>
        </div>
        <div>
          <span>Başlangıç saati</span>
          <strong>
            {start
              ? start.toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </strong>
        </div>
        <div>
          <span>Rapor tarihi / saati</span>
          <strong>{generatedLabel || "Rapor hazırlanıyor…"}</strong>
        </div>
      </div>
      <div className={styles.introColumns}>
        <article>
          <span>RAPORUN AMACI</span>
          <h3>Bilişsel performans örüntüsünü görünür kılmak</h3>
          <p>
            PraxRef; oyun görevlerindeki doğruluk, tepki süresi, hedef yakalama,
            hata örüntüsü, hız kontrolü ve benzeri performans verilerini Dikkat,
            Seçici Dikkat, İnhibisyon, İşlemleme Hızı ve Karar Verme
            başlıklarında bir araya getirir.
          </p>
        </article>
        <article>
          <span>RAPOR YAPISI</span>
          <h3>{TOTAL_PAGES} rapor sayfası</h3>
          <p>
            Bu giriş sayfasını; genel profil özeti, {domainOrder.length}{" "}
            bilişsel alan için ayrı ayrıntı sayfası ve rehberlik sayfası izler.
            Uygun olduğunda tepki hızı (ms), doğruluk oranı, kaçırma, yanlış
            tepki, değişkenlik ve oyun kaynaklı diğer metrikler gösterilir.
          </p>
        </article>
      </div>
      <div className={styles.warningBox}>
        <strong>Önemli kullanım uyarısı</strong>
        <p>
          Bu rapordaki 0–100 skorlar ve süre dönüşümleri PraxRef oyun-içi
          performans göstergeleridir. Klinik tanı, yaş normu, IQ puanı veya
          standardize nöropsikolojik test sonucu değildir. Yorgunluk,
          motivasyon, cihaz, ekran, giriş yöntemi ve çevresel dikkat dağıtıcılar
          performansı etkileyebilir. Yetersiz veri bulunan alanlar “—” ile
          gösterilir.
        </p>
      </div>
      <div className={styles.privacyNote}>
        <strong>Veri notu:</strong> Bu yerel sürümde katılımcı bilgileri ve
        oturum kayıtları tarayıcının yerel depolamasında tutulur.
      </div>
      <PageFooter
        page={1}
        right="PRAXREF · Bilişsel Profil Değerlendirme Raporu"
      />
    </section>
  );
}

function GeneralPage({ report }: { report: CognitiveProfileReport }) {
  return (
    <section className={`${styles.printPage} ${styles.coverPage}`}>
      <div className={styles.resultHeader}>
        <div>
          <span>PRAXREF · GENEL SONUÇ</span>
          <h2>Bilişsel Profil Özeti</h2>
        </div>
        <div className={styles.overallScore}>
          <strong>{report.overallScore ?? "—"}</strong>
          <span>Genel profil</span>
        </div>
      </div>
      <div className={styles.coverGrid}>
        <article className={styles.radarCard}>
          <Radar report={report} />
        </article>
        <article className={styles.domainList}>
          {report.domains.map((domain) => (
            <div key={domain.key}>
              <span>{domain.label}</span>
              <b>{domain.score ?? "—"}</b>
              <small>
                {domain.status === "ready"
                  ? "Profil hazır"
                  : domain.status === "limited"
                    ? "Sınırlı veri"
                    : "Veri bekleniyor"}
              </small>
            </div>
          ))}
        </article>
      </div>
      <div className={styles.coverSummary}>
        <div>
          <b>
            {report.availableDomainCount}/{report.domains.length}
          </b>
          <span>veri bulunan alan</span>
        </div>
        <div>
          <b>{report.overallScore ?? "—"}</b>
          <span>mevcut alanların ortalaması</span>
        </div>
        <div>
          <b>{TOTAL_PAGES}</b>
          <span>rapor sayfası</span>
        </div>
      </div>
      <div className={styles.disclaimer}>
        <strong>Genel profilin yorumu</strong>
        <p>
          Genel skor yalnızca yeterli veri bulunan alanların oyun-içi
          bileşimidir. Tek başına tanısal anlam taşımaz; alan sayfalarındaki ham
          ve türetilmiş metriklerle birlikte okunmalıdır.
        </p>
      </div>
      <PageFooter page={2} />
    </section>
  );
}

function DomainPage({
  domain,
  pageNumber,
}: {
  domain: DomainProfile;
  pageNumber: number;
}) {
  return (
    <section className={`${styles.printPage} ${styles.domainPage}`}>
      <header className={styles.pageHeader}>
        <div className={styles.pageTitleBlock}>
          <span>PRAXREF · BİLİŞSEL PROFİL</span>
          <h2>{domain.label}</h2>
        </div>
        <ScoreRing score={domain.score} />
      </header>
      <div className={styles.domainIntro}>
        <p>{domain.summary}</p>
        <span>{domain.sourceGames.join(" · ")}</span>
      </div>
      <div className={styles.domainGrid}>
        <article className={styles.chartCard}>
          <h3>Oturum eğilimi</h3>
          <TrendChart values={domain.trend} />
        </article>
        <article className={styles.chartCard}>
          <h3>Alt göstergeler</h3>
          <MetricBars domain={domain} />
          {!domain.metrics.some(
            (m) => m.value !== null && (m.unit === "%" || m.unit === "/100"),
          ) && (
            <p className={styles.muted}>
              Bu alan için yüzdelik alt gösterge henüz oluşmadı.
            </p>
          )}
        </article>
      </div>
      <div className={styles.metricTable}>
        <div className={styles.metricTableHead}>
          <span>Ölçüm</span>
          <span>Son değer</span>
          <span>Açıklama</span>
        </div>
        {domain.metrics.length ? (
          domain.metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <b>
                {metric.value === null
                  ? "—"
                  : `${metric.value}${metric.unit ?? ""}`}
              </b>
              <small>
                {metric.note ??
                  (metric.value === null
                    ? "Yetersiz veri"
                    : metric.higherIsBetter === false
                      ? "Daha düşük değer oyun performansında daha avantajlı olabilir."
                      : "Oyun içi performans göstergesi.")}
              </small>
            </div>
          ))
        ) : (
          <div>
            <span>Veri durumu</span>
            <b>—</b>
            <small>
              Bu alanın veri kaynağı henüz PraxRef profiline bağlanmadı.
            </small>
          </div>
        )}
      </div>
      <PageFooter
        page={pageNumber}
        right="Oyun içi performans göstergeleridir; klinik tanı veya normatif değerlendirme değildir."
      />
    </section>
  );
}

function FinalGuidancePage({ report }: { report: CognitiveProfileReport }) {
  const guidance = buildClinicalGuidance(report);
  return (
    <section className={`${styles.printPage} ${styles.guidancePage}`}>
      <div className={styles.resultHeader}>
        <div>
          <span>PRAXREF · KLİNİK YÖNLENDİRME ÖZETİ</span>
          <h2>Sonuçların klinik bağlamda okunması</h2>
        </div>
      </div>
      <div className={styles.guidanceWarning}>
        <strong>Bu sayfa tanı koymaz.</strong>
        <p>
          Buradaki alt ölçekler PraxRef oyun verilerinden türetilmiş işlevsel
          göstergelerdir. Tanı olasılığı, hastalık riski veya tıbbi karar yerine
          geçmez. Özellikle “hiperaktivite” başlığı fiziksel aktiviteyi ölçmez;
          yalnızca oyun içi hız kontrolü ve yanlış tepki örüntüsünü özetler.
        </p>
      </div>
      <div className={styles.guidanceScales}>
        {guidance.scales.map((scale) => (
          <article key={scale.key}>
            <div>
              <span>{scale.label}</span>
              <b>
                {scale.value ?? "—"}
                <small>{scale.value === null ? "" : " /100"}</small>
              </b>
            </div>
            <div className={styles.guidanceTrack}>
              <i style={{ width: `${scale.value ?? 0}%` }} />
            </div>
            <p>{scale.note}</p>
          </article>
        ))}
      </div>
      <div className={styles.guidanceList}>
        <h3>Klinisyenin ayrıca değerlendirebileceği başlıklar</h3>
        <p className={styles.guidanceLead}>
          Aşağıdaki liste “tanı ihtimali sıralaması” değildir. Oyun
          performansını etkileyebilen ve klinik görüşmede ayrıştırılması yararlı
          olabilecek alanları gösterir.
        </p>
        {guidance.items.map((item, index) => (
          <article key={item.title}>
            <div className={styles.guidanceIndex}>{index + 1}</div>
            <div>
              <div className={styles.guidanceItemHead}>
                <strong>{item.title}</strong>
                <span data-status={item.status}>
                  {item.status === "degerlendir"
                    ? "Değerlendir"
                    : item.status === "izle"
                      ? "İzle"
                      : "Veri yetersiz"}
                </span>
              </div>
              <p>{item.rationale}</p>
              <small>
                <b>Sonraki adım:</b> {item.nextStep}
              </small>
            </div>
          </article>
        ))}
      </div>
      <PageFooter
        page={TOTAL_PAGES}
        right="Klinik karar; anamnez, gözlem, işlevsellik ve standardize araçlarla birlikte verilmelidir."
      />
    </section>
  );
}

export function ProfileReport() {
  const [hydrated, setHydrated] = useState(false);
  const [version, setVersion] = useState(0);
  const [generatedLabel, setGeneratedLabel] = useState("");
  const [participant, setParticipant] = useState<ParticipantProfile | null>(
    null,
  );
  const report = useMemo(
    () => (hydrated ? buildCognitiveProfile() : null),
    [hydrated, version],
  );
  useEffect(() => {
    setHydrated(true);
  }, []);
  useEffect(() => {
    const refresh = () => {
      setParticipant(readParticipantProfile());
      setVersion((v) => v + 1);
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    if (!report) return;
    setGeneratedLabel(new Date(report.generatedAt).toLocaleString("tr-TR"));
  }, [report?.generatedAt]);
  if (!hydrated || !report) {
    return (
      <main className={styles.reportShell}>
        <div
          style={{
            minHeight: "70vh",
            display: "grid",
            placeItems: "center",
            color: "#173b4a",
            fontWeight: 700,
          }}
        >
          PRAXREF raporu hazırlanıyor…
        </div>
      </main>
    );
  }

  return (
    <main className={styles.reportShell}>
      <div className={styles.toolbar}>
        <div>
          <span>PRAXREF COGNITIVE PROFILE</span>
          <h1>Bilişsel Profil Raporu</h1>
        </div>
        <div className={styles.toolbarActions}>
          <button onClick={() => setVersion((v) => v + 1)}>
            Veriyi yenile
          </button>
          <button className={styles.printButton} onClick={() => window.print()}>
            Yazdır / PDF
          </button>
          <Link href="/play">Oyunlara dön</Link>
        </div>
      </div>
      <IntroPage participant={participant} generatedLabel={generatedLabel} />
      <GeneralPage report={report} />
      {report.domains.map((domain, index) => (
        <DomainPage key={domain.key} domain={domain} pageNumber={index + 3} />
      ))}
      <FinalGuidancePage report={report} />
    </main>
  );
}
