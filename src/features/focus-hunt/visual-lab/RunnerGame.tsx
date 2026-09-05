"use client";

import { Canvas } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import type { FocusHuntAudience, FocusHuntSessionSummary } from "../types";
import { COURSE, pointerLane } from "./course";
import { createLabRuntime } from "./runtime";
import { RunnerScene } from "./RunnerScene";
import styles from "./runner.module.css";
import { createGameAudio } from "./audio-feedback";

// Presentation landmarks only; these do not create gameplay checkpoints.
const REGIONS = [
  { at: 0, name: "Başlangıç Adası", hint: "Adalar rotası" },
  { at: 108, name: "Mercan Geçidi", hint: "Kıyı boyunca" },
  { at: 218, name: "Rüzgâr Rampası", hint: "Adalar arasında" },
  { at: 436, name: "Atlas Tüneli", hint: "Rotayı takip et" },
  { at: 650, name: "Yıldız Burnu", hint: "Açık denize doğru" },
  { at: 864, name: "Son Ada", hint: "Atlas bitiş kapısı" },
] as const;

function useMedia(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    [query],
  );
  const snapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className={styles.error} role="alert">
        3D sahne yüklenemedi. Bağlantıyı ve WebGL desteğini kontrol edip sayfayı
        yenile. Oturum başlatılmadı.
      </div>
    ) : (
      this.props.children
    );
  }
}

export function RunnerGame({
  audience,
  development = false,
}: {
  audience: FocusHuntAudience;
  development?: boolean;
}) {
  const [run, setRun] = useState(0);
  return (
    <RunnerSession
      key={run}
      audience={audience}
      development={development}
      restart={() => setRun((value) => value + 1)}
    />
  );
}

function RunnerSession({
  audience,
  restart,
  development,
}: {
  audience: FocusHuntAudience;
  restart: () => void;
  development: boolean;
}) {
  const runtimeRef = useRef(createLabRuntime(audience));
  const [audio] = useState(createGameAudio);
  const [muted, setMuted] = useState(false);
  useEffect(() => () => audio.dispose(), [audio]);
  const [summary, setSummary] = useState<FocusHuntSessionSummary | null>(null);
  const [phase, setPhase] = useState<
    "loading" | "intro" | "running" | "complete"
  >("loading");
  const [hud, setHud] = useState({
    elapsed: 0,
    stars: 0,
    feedback: "Hedef: Altın yıldız",
    pickup: 0,
    paused: false,
    jumps: 0,
  });
  const [quality, setQuality] = useState<"auto" | "low" | "high">("auto");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const coarse = useMedia("(pointer: coarse)");
  const lowQuality = quality === "low" || (quality === "auto" && coarse);
  const viewport = useRef<HTMLDivElement>(null);
  const onReady = useCallback(
    () => setPhase((current) => (current === "loading" ? "intro" : current)),
    [],
  );
  const onUpdate = useCallback(() => {
    const runtime = runtimeRef.current;
    const lastTrial = runtime.session.trials.at(-1);
    audio.observe({
      pickup: runtime.fx.id,
      // Read the engine's existing classification; omissions are not errors here.
      incorrectTrialId:
        lastTrial?.errorType === "commission" ? lastTrial.trialId : undefined,
      airborne: runtime.runner.airborne,
      distance: runtime.runner.distance,
      finished: runtime.runner.finished,
      paused: runtime.paused,
    });
    if (runtime.paused) audio.silence();
    setHud({
      elapsed: runtime.runner.elapsed,
      stars: runtime.session.rewardStars,
      feedback:
        runtime.runner.elapsed > runtime.feedbackUntil
          ? "Hedef: Altın yıldız"
          : runtime.feedback,
      pickup: runtime.fx.id,
      paused: runtime.paused,
      jumps: runtime.runner.jumps,
    });
  }, [audio]);
  const onFinish = useCallback(() => {
    setSummary(runtimeRef.current.summary);
    setPhase("complete");
    onUpdate();
  }, [onUpdate]);
  const pause = useCallback(() => {
    const runtime = runtimeRef.current;
    runtime.input.left = runtime.input.right = false;
    if (!runtime.running || runtime.paused) return;
    runtime.paused = true;
    // An interrupted visible trial closes without a response; no shifted RT clock.
    if (runtime.session.active?.base)
      runtime.session.respond(runtime.session.active.id, null);
    else if (runtime.session.active) runtime.session.active.resolved = true;
    runtime.pickup = null;
    runtime.nextTrialAt = runtime.runner.elapsed + 0.5;
    onUpdate();
  }, [onUpdate]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) pause();
    };
    const release = () => {
      const runtime = runtimeRef.current;
      runtime.input.left = runtime.input.right = false;
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("keyup", release);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("keyup", release);
    };
  }, [pause]);
  const start = () => {
    audio.unlock();
    const runtime = runtimeRef.current;
    runtime.running = true;
    runtime.paused = false;
    setPhase("running");
    viewport.current?.focus();
  };
  const region = REGIONS.reduce(
    (current, candidate) =>
      hud.elapsed * COURSE.speed >= candidate.at ? candidate : current,
    REGIONS[0] as (typeof REGIONS)[number],
  );
  const regionAge = hud.elapsed - region.at / COURSE.speed;
  const regionOpacity = Math.max(
    0,
    Math.min(1, regionAge / 0.15, (1.8 - regionAge) / 0.35),
  );
  // Visual envelope only: reuse course progress, never a gameplay timer.
  const tunnelExitAge = hud.elapsed - 520 / COURSE.speed;
  const tunnelLift =
    !reduced && tunnelExitAge >= 0 && tunnelExitAge < 0.5
      ? Math.sin((tunnelExitAge / 0.5) * Math.PI) * 0.045
      : 0;
  if (phase === "complete" && summary)
    return (
      <section className={styles.results}>
        <p className={styles.eyebrow}>
          {development ? "PRAXREF · VISUAL LAB" : "PRAXREF · ATLAS ADALARI"}
        </p>
        <h1 className={styles.finishTitle}>ATLAS ADALARI TAMAMLANDI</h1>
        <p>Görev tamamlandı</p>
        <p>Atlas bitiş kapısına ulaştın. {hud.stars} altın yıldız topladın.</p>
        <div className={styles.metrics}>
          <div>
            <strong>
              {summary.accuracyPercent === null
                ? "—"
                : `${summary.accuracyPercent}%`}
            </strong>
            <span>Doğruluk</span>
          </div>
          <div>
            <strong>
              {summary.meanReactionTimeMs === null
                ? "—"
                : `${summary.meanReactionTimeMs} ms`}
            </strong>
            <span>Ortalama yanıt</span>
          </div>
          <div>
            <strong>
              {summary.sustainedAttentionScore ?? "Yetersiz veri"}
            </strong>
            <span>Odak Sürekliliği</span>
          </div>
        </div>
        <p>
          54 saniye · {hud.jumps} atlayış · {summary.totalTrials} deneme
        </p>
        <p className={styles.note}>
          Bu parkur skoru klinik değerlendirme değildir ve klinisyen geçmişine
          kaydedilmez.
        </p>
        <button onClick={restart}>Yeniden oyna</button>
        <Link
          href={
            development ? `/play/${audience}/focus-hunt` : `/play/${audience}`
          }
        >
          {development ? "Ana oyuna dön" : "Oyun merkezine dön"}
        </Link>
      </section>
    );

  return (
    <section className={styles.game}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            {development ? "PRAXREF · VISUAL LAB" : "PRAXREF · FOCUS HUNT"}
          </span>
          <h1>Atlas Adaları</h1>
        </div>
        <Link
          href={
            development ? `/play/${audience}/focus-hunt` : `/play/${audience}`
          }
        >
          {development ? "Ana oyuna dön" : "Oyun merkezine dön"}
        </Link>
      </header>
      <div className={styles.hud}>
        <span className={styles.regionLabel}>{region.name}</span>
        <span aria-label="Kalan süre">
          {Math.ceil(COURSE.seconds - hud.elapsed)} sn
        </span>
        <span aria-label="Toplanan altın yıldız">✦ {hud.stars}</span>
        <button
          aria-label={muted ? "Sesi aç" : "Sesi kapat"}
          aria-pressed={muted}
          onClick={() => {
            audio.setMuted(!muted);
            setMuted(!muted);
            if (muted) audio.unlock();
          }}
        >
          <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
        </button>
        <button
          disabled={phase !== "running"}
          onClick={pause}
          aria-label="Oyunu duraklat"
        >
          Ⅱ
        </button>
      </div>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label="Parkur ilerlemesi"
        aria-valuemin={0}
        aria-valuemax={54}
        aria-valuenow={Math.floor(hud.elapsed)}
      >
        <span style={{ width: `${(hud.elapsed / COURSE.seconds) * 100}%` }} />
      </div>
      <div
        className={styles.viewport}
        ref={viewport}
        tabIndex={0}
        aria-label="Parkur: sağ-sol oklar veya A/D ile yönlendir; dokunarak ya da mouse ile konum seç."
        onKeyDown={(event) => {
          const runtime = runtimeRef.current;
          if (event.key === "Escape") {
            pause();
            return;
          }
          if (
            !["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)
          )
            return;
          event.preventDefault();
          if (runtime.running && !runtime.paused) {
            if (["ArrowLeft", "a", "A"].includes(event.key))
              runtime.input.left = true;
            else runtime.input.right = true;
          }
        }}
        onPointerDown={(event) => {
          const runtime = runtimeRef.current;
          if (!runtime.running || runtime.paused) return;
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          const rect = event.currentTarget.getBoundingClientRect();
          runtime.input.lateral = pointerLane(
            event.clientX,
            rect.left,
            rect.width,
          );
        }}
        onPointerMove={(event) => {
          const runtime = runtimeRef.current;
          if (
            !runtime.running ||
            runtime.paused ||
            (event.pointerType === "touch" && !event.buttons)
          )
            return;
          const rect = event.currentTarget.getBoundingClientRect();
          runtime.input.lateral = pointerLane(
            event.clientX,
            rect.left,
            rect.width,
          );
        }}
        onPointerCancel={() => {
          const runtime = runtimeRef.current;
          runtime.input.left = runtime.input.right = false;
        }}
      >
        <SceneBoundary>
          <Canvas
            shadows={!lowQuality}
            dpr={lowQuality ? 1 : [1, 1.5]}
            gl={{ antialias: !lowQuality, powerPreference: "high-performance" }}
            camera={{ fov: 60, near: 0.1, far: 240, position: [0, 10, 10] }}
            fallback={
              <p className={styles.error}>
                Bu tarayıcı WebGL desteklemiyor. Oturum başlamadı.
              </p>
            }
          >
            <Suspense fallback={null}>
              <RunnerScene
                runtimeRef={runtimeRef}
                reduced={reduced}
                lowQuality={lowQuality}
                onReady={onReady}
                onUpdate={onUpdate}
                onFinish={onFinish}
              />
            </Suspense>
          </Canvas>
        </SceneBoundary>
        {phase === "running" && tunnelLift > 0 && (
          <div
            className={styles.tunnelLift}
            style={{ opacity: tunnelLift }}
            aria-hidden="true"
          />
        )}
        {phase === "running" && !hud.paused && regionAge < 1.8 && (
          <div
            className={styles.regionNotice}
            style={{ opacity: regionOpacity }}
          >
            <strong>{region.name.toLocaleUpperCase("tr-TR")}</strong>
            <span>{region.hint}</span>
          </div>
        )}
        {phase === "loading" && (
          <div className={styles.overlay}>
            <p>Atlas parkuru yükleniyor…</p>
          </div>
        )}
        {phase === "intro" && (
          <div className={styles.overlay}>
            <div className={styles.briefing}>
              <span className={styles.eyebrow}>54 SANİYELİK PARKUR</span>
              <h2>Adaların üzerinden uç.</h2>
              <p>
                Altın yıldızlara yönel. Diğer renkli şekillerden uzak dur.
                Rampalarda gemi kendiliğinden sıçrar.
              </p>
              <p className={styles.note}>
                ← → / A–D · Mouse ile sağ–sol · Dokun ve sürükle
              </p>
              <label>
                Görsel kalite{" "}
                <select
                  value={quality}
                  onChange={(event) =>
                    setQuality(event.target.value as typeof quality)
                  }
                >
                  <option value="auto">Otomatik</option>
                  <option value="low">Hafif</option>
                  <option value="high">Yüksek</option>
                </select>
              </label>
              <button onClick={start}>Parkura başla</button>
            </div>
          </div>
        )}
        {hud.paused && (
          <div className={styles.overlay}>
            <div className={styles.briefing}>
              <h2>Parkur duraklatıldı</h2>
              <button
                onClick={() => {
                  audio.unlock();
                  runtimeRef.current.paused = false;
                  viewport.current?.focus();
                  onUpdate();
                }}
              >
                Devam et
              </button>
            </div>
          </div>
        )}
        {phase === "running" && hud.pickup > 0 && (
          <span
            key={`reward-${hud.pickup}`}
            className={styles.collectFeedback}
            aria-hidden="true"
          >
            +1
          </span>
        )}
        {phase === "running" && hud.pickup > 0 && (
          <Image
            key={hud.pickup}
            className={styles.pickup}
            src="/assets/brand/logo/logo1.png"
            width={74}
            height={74}
            unoptimized
            alt=""
            aria-hidden="true"
          />
        )}
      </div>
      <footer className={styles.footer}>
        <span role="status">{hud.feedback}</span>
        <span>Otomatik ilerleme · rampada otomatik sıçrama</span>
      </footer>
    </section>
  );
}
