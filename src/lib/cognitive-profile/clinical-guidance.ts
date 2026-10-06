import type { CognitiveProfileReport, DomainProfile } from "./profile-types";

export type GuidanceScaleKey =
  | "attentionDifficulty"
  | "timingDifficulty"
  | "impulsivityDifficulty"
  | "activationDifficulty";

export type GuidanceScale = {
  key: GuidanceScaleKey;
  label: string;
  value: number | null;
  note: string;
};

export type ClinicalGuidanceItem = {
  title: string;
  status: "degerlendir" | "izle" | "veri-yetersiz";
  rationale: string;
  nextStep: string;
};

export type ClinicalGuidanceSummary = {
  scales: GuidanceScale[];
  items: ClinicalGuidanceItem[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const mean = (values: Array<number | null | undefined>) => {
  const ready = values.filter(
    (value): value is number => typeof value === "number",
  );
  if (!ready.length) return null;
  return ready.reduce((sum, value) => sum + value, 0) / ready.length;
};

function domain(report: CognitiveProfileReport, key: DomainProfile["key"]) {
  return report.domains.find((item) => item.key === key);
}

function metric(domainValue: DomainProfile | undefined, label: string) {
  return (
    domainValue?.metrics.find((item) => item.label === label)?.value ?? null
  );
}

function deficit(score: number | null | undefined) {
  return typeof score === "number" ? clamp(100 - score) : null;
}

export function buildClinicalGuidance(
  report: CognitiveProfileReport,
): ClinicalGuidanceSummary {
  const attention = domain(report, "attention");
  const selective = domain(report, "selectiveAttention");
  const inhibition = domain(report, "inhibition");
  const speed = domain(report, "processingSpeed");
  const decision = domain(report, "decisionMaking");

  const attentionDifficulty = mean([
    deficit(attention?.score),
    deficit(selective?.score),
  ]);
  const timingDifficulty = deficit(speed?.score);
  const impulsivityDifficulty = deficit(inhibition?.score);

  const speedControl = metric(decision, "Hız kontrolü");
  const commission = metric(inhibition, "Yanlış tepki");
  const activationDifficulty = mean([
    typeof speedControl === "number" ? clamp(100 - speedControl) : null,
    typeof commission === "number" ? clamp(commission) : null,
  ]);

  const scales: GuidanceScale[] = [
    {
      key: "attentionDifficulty",
      label: "Dikkat güçlüğü örüntüsü",
      value: attentionDifficulty === null ? null : clamp(attentionDifficulty),
      note: "Dikkat ve seçici dikkat oyun puanlarının ters çevrilmiş bileşimidir; semptom ölçeği değildir.",
    },
    {
      key: "timingDifficulty",
      label: "Zamanlama / işlemleme güçlüğü",
      value: timingDifficulty,
      note: "Tepki süresi ve doğruluk bileşiminden türetilen oyun-içi göstergedir.",
    },
    {
      key: "impulsivityDifficulty",
      label: "Dürtüsel tepki eğilimi",
      value: impulsivityDifficulty,
      note: "İnhibisyon oyun performansının ters çevrilmiş özetidir; klinik dürtüsellik ölçeği değildir.",
    },
    {
      key: "activationDifficulty",
      label: "Hiperaktivite ile ilişkili aktivasyon / hız kontrolü",
      value: activationDifficulty === null ? null : clamp(activationDifficulty),
      note: "Yalnızca oyun içi hız kontrolü ve yanlış tepki örüntüsünü yansıtır; fiziksel hiperaktiviteyi ölçmez.",
    },
  ];

  const att = attentionDifficulty ?? 0;
  const tim = timingDifficulty ?? 0;
  const imp = impulsivityDifficulty ?? 0;
  const act = activationDifficulty ?? 0;
  const broad =
    mean([
      attentionDifficulty,
      timingDifficulty,
      impulsivityDifficulty,
      deficit(decision?.score),
    ]) ?? 0;

  const items: ClinicalGuidanceItem[] = [
    {
      title: "DEHB semptom alanları açısından klinik görüşme",
      status: att >= 35 || imp >= 35 || act >= 35 ? "degerlendir" : "izle",
      rationale:
        "Dikkat, inhibisyon ve hız kontrolündeki oyun-içi güçlükler DEHB ile görülebilen alanlarla örtüşebilir; ancak bu örüntü tek başına DEHB'yi göstermez.",
      nextStep:
        "Gelişim öyküsü, okul/işlevsellik, en az iki ortamdan bilgi ve uygun yaşta standardize DEHB belirti ölçekleriyle değerlendirme yapılabilir.",
    },
    {
      title: "Anksiyete / stres etkilerinin dışlanması",
      status: tim >= 35 || att >= 35 ? "degerlendir" : "izle",
      rationale:
        "Kaygı ve stres tepki hızını, hata eğilimini ve dikkat sürekliliğini etkileyebilir; oyun verisi bunları DEHB'den ayıramaz.",
      nextStep:
        "Kaygı belirtileri, performans baskısı, kaçınma ve somatik yakınmalar klinik görüşmede ayrıca sorgulanabilir.",
    },
    {
      title: "Uyku, yorgunluk ve günlük ritim",
      status: tim >= 30 || att >= 30 ? "degerlendir" : "izle",
      rationale:
        "Uyku azlığı ve yorgunluk işlemleme hızını, çalışma belleğini ve dikkat performansını düşürebilir.",
      nextStep:
        "Uyku süresi/kalitesi, gün içi uykululuk, testin yapıldığı saat ve kafein/ilaç etkileri gözden geçirilebilir.",
    },
    {
      title: "Duygudurum, motivasyon ve çevresel etkenler",
      status: broad >= 35 ? "degerlendir" : "izle",
      rationale:
        "Birden fazla alanda düşük oyun performansı; motivasyon, duygudurum, ağrı, cihaz/ekran kullanımı veya çevresel dikkat dağıtıcılarla da ilişkili olabilir.",
      nextStep:
        "Sonuçlar anamnez, gözlem, işlevsellik ve gerekirse tekrar ölçümle birlikte yorumlanmalıdır.",
    },
  ];

  return { scales, items };
}
