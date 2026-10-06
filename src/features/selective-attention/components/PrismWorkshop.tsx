"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import Link from "next/link";
import type {
  SelectiveAttentionAudience,
  SelectiveAttentionTrial,
  SelectiveAttentionSummary,
  Stimulus,
} from "../types";
import { createWorkshopAudio } from "./selective-attention-audio";
import {
  COLOR_NAMES,
  SHAPE_NAMES,
  GLYPHS,
  PIECE_COLORS,
  translateRule,
  formatRemaining,
  visibleResult,
  workbenchLayout,
} from "./workshop-presentation";
import styles from "./workshop.module.css";

const subscribeViewport = (notify: () => void) => {
  window.addEventListener("resize", notify);
  return () => window.removeEventListener("resize", notify);
};
const readViewport = () => `${window.innerWidth},${window.innerHeight}`;
const serverViewport = () => "390,844";

export function WorkshopPiece({
  stimulus,
  size,
  onSelect,
  result,
}: {
  stimulus: Stimulus;
  size: number;
  onSelect: (stimulus: Stimulus) => void;
  result?: SelectiveAttentionTrial;
}) {
  const selected = result?.selectedStimulus?.id === stimulus.id;
  const outcome = selected
    ? result?.correct
      ? "correct"
      : result?.errorType === "wrong-target"
        ? "wrong"
        : "late"
    : undefined;
  return (
    <button
      type="button"
      className={styles.socket}
      onClick={() => onSelect(stimulus)}
      aria-label={`${COLOR_NAMES[stimulus.color]} ${SHAPE_NAMES[stimulus.shape]}`}
      data-feedback={outcome}
      style={
        {
          "--piece-size": `${size}px`,
          "--piece-color": PIECE_COLORS[stimulus.color],
        } as CSSProperties
      }
    >
      <span className={styles.piece} aria-hidden="true">
        {GLYPHS[stimulus.shape]}
      </span>
    </button>
  );
}

export function PrismWorkshop({
  audience,
  phase,
  count,
  rule,
  stimuli,
  size,
  difficulty,
  remaining,
  trials,
  feedback,
  summary,
  onStart,
  onSelect,
  onReplay,
}: {
  audience: SelectiveAttentionAudience;
  phase: "intro" | "countdown" | "playing" | "complete";
  count: number;
  rule: string;
  stimuli: Stimulus[];
  size: number;
  difficulty: number;
  remaining: number;
  trials: SelectiveAttentionTrial[];
  feedback: string;
  summary: SelectiveAttentionSummary | null;
  onStart: () => void;
  onSelect: (stimulus: Stimulus) => void;
  onReplay: () => void;
}) {
  const [audio] = useState(createWorkshopAudio);
  const [muted, setMuted] = useState(false);
  const viewport = useSyncExternalStore(
    subscribeViewport,
    readViewport,
    serverViewport,
  );
  const [width, height] = viewport.split(",").map(Number);
  const layout = workbenchLayout(width, height, stimuli.length, size);
  const latest = trials.at(-1);
  const result = visibleResult(stimuli, latest);
  useEffect(() => {
    audio.result(latest);
  }, [audio, latest]);
  useEffect(() => {
    if (phase === "complete") audio.finish();
  }, [audio, phase]);
  useEffect(() => () => audio.dispose(), [audio]);

  return (
    <section
      className={styles.workshop}
      data-phase={phase}
      data-audience={audience}
      aria-label="Prizma Atölyesi"
    >
      <header className={styles.hud}>
        <div className={styles.identity}>
          <span className={styles.monogram} aria-hidden="true">
            P<span>↗</span>
          </span>
          <div>
            <small>PRAXREF / GÜRÜLTÜDE HEDEF</small>
            <h1>PRİZMA ATÖLYESİ</h1>
          </div>
        </div>
        <div className={styles.controls}>
          <span className={styles.time} aria-label="Kalan süre">
            {formatRemaining(remaining)}
          </span>
          <button
            type="button"
            onClick={() => {
              audio.setMuted(!muted);
              setMuted(!muted);
              if (muted) audio.unlock();
            }}
            aria-pressed={muted}
            aria-label={muted ? "Sesi aç" : "Sesi kapat"}
          >
            {muted ? "Ses kapalı" : "Ses açık"}
          </button>
          <Link href={`/play/${audience}`} aria-label="Oyun merkezine dön">
            Çıkış ↗
          </Link>
        </div>
      </header>
      <div className={styles.rulePanel}>
        <span>
          {phase === "playing" ? "BU DEVRE İÇİN" : "PRAXREF ENERJİ SİSTEMLERİ"}
        </span>
        <strong>
          {phase === "playing"
            ? translateRule(rule)
            : phase === "complete"
              ? "Çalışma tamamlandı"
              : "Doğru parçayı seç. Bağlantıyı kur."}
        </strong>
      </div>
      <div className={styles.world}>
        <div className={styles.backWall} aria-hidden="true">
          <span>PR / 02</span>
          <i />
          <i />
          <i />
        </div>
        <div className={styles.ambient} aria-hidden="true">
          <div className={styles.fan} />
          <span>SOĞUTMA / AKTİF</span>
        </div>
        <div className={styles.service} aria-hidden="true">
          <div className={styles.arm} />
          <span>BAKIM ÜNİTESİ</span>
        </div>
        <div className={styles.console}>
          <div className={styles.consoleRim} aria-hidden="true">
            <span>PRİZMA TEZGÂHI</span>
            <span>◎ BAĞLANTI HATTI</span>
          </div>
          <div
            className={styles.energy}
            key={result?.trialId ?? "idle"}
            data-success={result?.correct || undefined}
            aria-hidden="true"
          />
          {phase === "playing" ? (
            <div
              className={styles.bench}
              role="group"
              aria-label="Parça seçim alanı"
              style={{
                gridTemplateColumns: `repeat(${layout.columns}, ${layout.cell}px)`,
                gridAutoRows: `${layout.cell}px`,
                gap: `${layout.gap}px`,
                width: `${layout.width}px`,
                height: `${layout.height}px`,
              }}
            >
              {stimuli.map((stimulus) => (
                <WorkshopPiece
                  key={stimulus.id}
                  stimulus={stimulus}
                  size={layout.visualSize}
                  onSelect={onSelect}
                  result={result}
                />
              ))}
            </div>
          ) : phase === "countdown" ? (
            <div className={styles.briefing}>
              <span className={styles.label}>HEDEF KURALINA HAZIR OL</span>
              <strong className={styles.count}>{count || "Başla!"}</strong>
              <p>Parçalar sabit. Seçim sende.</p>
            </div>
          ) : phase === "complete" && summary ? (
            <div className={styles.briefing}>
              <span className={styles.label}>DEVRE RAPORU</span>
              <h2>Görev tamamlandı.</h2>
              <p>Atölye çalışmasının özeti</p>
              <div className={styles.metrics}>
                <div>
                  <b>
                    {summary.accuracyPercent === null
                      ? "—"
                      : `%${summary.accuracyPercent}`}
                  </b>
                  <span>Doğruluk</span>
                </div>
                <div>
                  <b>{summary.wrongTargetErrors}</b>
                  <span>Yanlış seçim</span>
                </div>
                <div>
                  <b>{summary.selectiveAttentionScore ?? "Yetersiz veri"}</b>
                  <span>Seçici Dikkat</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.primary}
                onClick={onReplay}
              >
                Yeni çalışma başlat ↗
              </button>
            </div>
          ) : (
            <div className={styles.briefing}>
              <span className={styles.label}>
                {audience === "kids"
                  ? "KIDS / KEŞİF EKİBİ"
                  : "TEEN / TEKNİK EKİP"}
              </span>
              <h2>
                Kalabalığın içindeki
                <br /> <em>doğru bağlantı.</em>
              </h2>
              <p>
                Yukarıdaki renk ve şekil kuralını oku.
                <br />
                Uyan parçayı seç; devreyi tamamla.
              </p>
              <div className={styles.instructions}>
                <span>01 / İPUCUNU OKU</span>
                <span>02 / PARÇAYI SEÇ</span>
                <span>03 / BAĞLANTIYI KUR</span>
              </div>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  audio.unlock();
                  onStart();
                }}
              >
                Atölyeyi başlat ↗
              </button>
              <small>Tıkla · Dokun · Tab ve Enter ile seç</small>
            </div>
          )}
          <div className={styles.consoleFoot} aria-hidden="true">
            <span>▰ ▰ ▰</span>
            <span>PRAXREF / PRECISION WORKSHOP</span>
            <span>●</span>
          </div>
        </div>
        <div
          className={styles.responseMechanism}
          key={`mechanism-${result?.trialId ?? "idle"}`}
          data-success={result?.correct || undefined}
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
        </div>
      </div>
      <footer className={styles.status}>
        <span role="status">
          {phase === "playing"
            ? result?.errorType === "late-response"
              ? "Yanıt süresi doldu. Yeni devre hazırlanıyor."
              : result?.errorType === "omission"
                ? "Yeni devre hazırlanıyor."
                : feedback || "İpucuna uygun parçayı seç."
            : "Sabit parçalar · Tek seçim · Temiz bağlantı"}
        </span>
        <span>
          Seviye {difficulty} · {trials.length} görev
        </span>
      </footer>
    </section>
  );
}
