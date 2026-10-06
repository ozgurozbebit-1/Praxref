"use client";
import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CityScene } from "./CityScene";
import {
  COLORS,
  LABELS,
  MISSION,
  INITIAL_SCORE,
  scoreGate,
  type Audience,
  type InputState,
  type SymbolKind,
} from "./city-model";
import styles from "./city-run.module.css";

export function PraxrefCity({
  audience,
  development = true,
}: {
  audience: Audience;
  development?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [feedback, setFeedback] = useState<{
    id: number;
    correct: boolean;
  } | null>(null);
  const feedbackId = useRef(0);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [result, setResult] = useState(INITIAL_SCORE);
  const { score, combo, hits, wrong, missionIndex } = result;
  const [remaining, setRemaining] = useState(90);
  const inputRef = useRef<InputState>({
    x: 0,
    speed: audience === "teen" ? 27 : 22,
    left: false,
    right: false,
    up: false,
    down: false,
  });
  useEffect(() => {
    const release = () => {
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.up = false;
      inputRef.current.down = false;
    };
    window.addEventListener("blur", release);
    return () => window.removeEventListener("blur", release);
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const started = performance.now();
    const duration = 90 * 1000;
    const id = window.setInterval(() => {
      const left = Math.max(0, duration - (performance.now() - started));
      setRemaining(left / 1000);
      if (left <= 0) {
        window.clearInterval(id);
        setPhase("done");
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, audience]);

  const onGate = useCallback(
    (_kind: SymbolKind, correct: boolean) => {
      if (phase !== "running") return;
      setFeedback({ id: ++feedbackId.current, correct });
      setResult((previous) => scoreGate(previous, correct));
    },
    [phase],
  );

  return (
    <section className={styles.game}>
      <header className={styles.header}>
        <div>
          <span>PRAXREF · COGNITIVE CITY</span>
          <h1>
            PraxRef City <small>{audience === "teen" ? "TEEN" : "KIDS"}</small>
          </h1>
        </div>
        <div className={styles.stats}>
          <b>{Math.ceil(remaining)} sn</b>
          <b>{score} puan</b>
          <span>🔥 {combo}</span>
          <Link href={development ? `/play/${audience}` : `/play/${audience}`}>
            Çıkış ↗
          </Link>
        </div>
      </header>

      <div
        className={styles.viewport}
        ref={viewport}
        onBlur={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
          )
            return;
          inputRef.current.left = false;
          inputRef.current.right = false;
          inputRef.current.up = false;
          inputRef.current.down = false;
        }}
        tabIndex={0}
        onKeyDown={(event) => {
          const key = event.key.toLowerCase();
          if (
            [
              "arrowleft",
              "arrowright",
              "arrowup",
              "arrowdown",
              "a",
              "d",
              "w",
              "s",
            ].includes(key)
          )
            event.preventDefault();
          if (key === "arrowleft" || key === "a") inputRef.current.left = true;
          if (key === "arrowright" || key === "d")
            inputRef.current.right = true;
          if (key === "arrowup" || key === "w") inputRef.current.up = true;
          if (key === "arrowdown" || key === "s") inputRef.current.down = true;
        }}
        onKeyUp={(event) => {
          const key = event.key.toLowerCase();
          if (key === "arrowleft" || key === "a") inputRef.current.left = false;
          if (key === "arrowright" || key === "d")
            inputRef.current.right = false;
          if (key === "arrowup" || key === "w") inputRef.current.up = false;
          if (key === "arrowdown" || key === "s") inputRef.current.down = false;
        }}
        onPointerMove={(event) => {
          if (
            phase !== "running" ||
            (event.target as HTMLElement).closest("button,a")
          )
            return;
          const rect = event.currentTarget.getBoundingClientRect();
          inputRef.current.x = THREE.MathUtils.clamp(
            (((event.clientX - rect.left) / rect.width) * 2 - 1) * 5.2,
            -5.35,
            5.35,
          );
        }}
      >
        <Canvas
          shadows
          camera={{ position: [0, 3.5, 10.8], fov: 57, near: 0.1, far: 280 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ camera }) => camera.lookAt(0, 1.15, -34)}
        >
          <Suspense fallback={null}>
            <CityScene
              reduced={reduced}
              audience={audience}
              running={phase === "running"}
              inputRef={inputRef}
              onGate={onGate}
              missionIndex={missionIndex}
            />
          </Suspense>
        </Canvas>

        {phase === "running" && (
          <div className={styles.mission}>
            <span>SIRADAKİ HEDEF</span>
            <strong style={{ color: COLORS[MISSION[missionIndex]] }}>
              {LABELS[MISSION[missionIndex]]}
            </strong>
            <div>
              {MISSION.map((kind, i) => (
                <i
                  key={kind}
                  className={i === missionIndex ? styles.active : ""}
                  style={{ background: COLORS[kind] }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === "running" && (
          <>
            {feedback && (
              <div key={feedback.id} className={styles.feedback} role="status">
                {feedback.correct
                  ? "Doğru şerit · + puan"
                  : "Hedefi kontrol et · −10"}
              </div>
            )}
            <div className={styles.pedals}>
              {(["down", "up"] as const).map((direction) => (
                <button
                  key={direction}
                  aria-label={direction === "up" ? "Hızlan" : "Yavaşla"}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    inputRef.current[direction] = true;
                  }}
                  onPointerUp={() => {
                    inputRef.current[direction] = false;
                  }}
                  onPointerCancel={() => {
                    inputRef.current[direction] = false;
                  }}
                >
                  {direction === "up" ? "Gaz" : "Fren"}
                </button>
              ))}
            </div>
          </>
        )}
        {phase === "intro" && (
          <div className={styles.overlay}>
            <div className={styles.card}>
              <span className={styles.eyebrow}>FINAL / PRAXREF CITY</span>
              <h2>Şehrin ritmini yakala.</h2>
              <p>
                Trafik akarken hedef sırası değişecek. Aracı mouse veya ok/WASD
                tuşlarıyla yönlendir; doğru sembolün bulunduğu şeritten geç.
              </p>
              <p className={styles.note}>
                {audience === "teen"
                  ? "Teen: daha yoğun trafik, daha yüksek başlangıç hızı."
                  : "Kids: kontrollü trafik, daha geniş karar zamanı."}
              </p>
              <button
                onClick={() => {
                  setPhase("running");
                  viewport.current?.focus();
                }}
              >
                Şehre gir
              </button>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className={styles.overlay}>
            <div className={styles.card}>
              <span className={styles.eyebrow}>ŞEHİR GÖREVİ TAMAMLANDI</span>
              <h2>{score} puan</h2>
              <div className={styles.summary}>
                <span>
                  <b>{hits}</b> doğru geçiş
                </span>
                <span>
                  <b>{wrong}</b> yanlış geçiş
                </span>
                <span>
                  <b>{combo}</b> son seri
                </span>
              </div>
              <button onClick={() => window.location.reload()}>
                Yeniden sür
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>PraxRef Cognitive City · Final görev</span>
        <span>Mouse / WASD / oklar · ↑ hızlan · ↓ yavaşla</span>
      </footer>
    </section>
  );
}
