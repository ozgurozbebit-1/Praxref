"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { makeDemoTrial, respondDemo, type DemoState } from "./demo";
import { COLOR_LABELS, SHAPE_LABELS, mapTrialToWorld } from "./town-world";
import { createTownAudio } from "./town-audio";
import styles from "./town.module.css";

const TownScene = dynamic(() => import("./TownScene"), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>Sahil kasabası hazırlanıyor…</div>
  ),
});
const subscribeMotion = (notify: () => void) => {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", notify);
  return () => m.removeEventListener("change", notify);
};
const readMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function TownLab({ audience }: { audience: "kids" | "teen" }) {
  const teenTrialMs = 6500;
  const [state, setState] = useState<DemoState | null>(null),
    [muted, setMuted] = useState(false),
    [remainingMs, setRemainingMs] = useState(teenTrialMs),
    [audio] = useState(createTownAudio);
  const stateRef = useRef<DemoState | null>(null),
    next = useRef<ReturnType<typeof setTimeout> | null>(null),
    deadline = useRef<number | null>(null);
  const reduced = useSyncExternalStore(subscribeMotion, readMotion, () => true);
  useEffect(
    () => () => {
      if (next.current) clearTimeout(next.current);
      audio.dispose();
    },
    [audio],
  );
  useEffect(() => {
    if (audience !== "teen" || !state || state.response) return;
    const id = window.setInterval(() => {
      if (!deadline.current) return;
      const left = Math.max(0, deadline.current - performance.now());
      setRemainingMs(left);
      if (left <= 0) {
        deadline.current = null;
        const current = stateRef.current;
        if (!current || current.response) return;
        const fresh = {
          trial: makeDemoTrial(current.trial.id + 1),
          score: current.score,
          response: null,
        };
        stateRef.current = fresh;
        setState(fresh);
        deadline.current = performance.now() + teenTrialMs;
        setRemainingMs(teenTrialMs);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [audience, state, teenTrialMs]);
  function start() {
    audio.unlock();
    const initial = { trial: makeDemoTrial(1), score: 0, response: null };
    stateRef.current = initial;
    setState(initial);
    if (audience === "teen") {
      deadline.current = performance.now() + teenTrialMs;
      setRemainingMs(teenTrialMs);
    }
  }
  function select(id: string) {
    const current = stateRef.current;
    if (!current) return;
    deadline.current = null;
    const updated = respondDemo(current, id);
    if (updated === current) return;
    stateRef.current = updated;
    setState(updated);
    audio.play(updated.trial.id, updated.response!.correct);
    next.current = setTimeout(() => {
      const fresh = {
        trial: makeDemoTrial(updated.trial.id + 1),
        score: updated.score,
        response: null,
      };
      stateRef.current = fresh;
      setState(fresh);
      if (audience === "teen") {
        deadline.current = performance.now() + teenTrialMs;
        setRemainingMs(teenTrialMs);
      }
    }, 650);
  }
  // Stable synthetic preview, not a production trial and never saved as one.
  const preview = makeDemoTrial(0, () => 0.42);
  const placed = mapTrialToWorld((state?.trial ?? preview).stimuli).map(
    (item) => ({ ...item, active: !!state }),
  );
  return (
    <main
      className={styles.lab}
      aria-label="Sahil Kasabası görsel laboratuvarı"
    >
      <header className={styles.hud}>
        <div className={styles.brand}>
          <small>PRAXREF · GÖRSEL LABORATUVAR</small>
          <h1>Sahil Kasabası</h1>
        </div>
        <div className={styles.controls}>
          <span className={styles.score}>
            {state?.score ?? 0}
            <small> bulundu</small>
          </span>
          {audience === "teen" && state && (
            <span className={styles.score} aria-label="Kalan süre">
              {(remainingMs / 1000).toFixed(1)}
              <small> sn</small>
            </span>
          )}
          <button
            type="button"
            aria-pressed={muted}
            aria-label={muted ? "Sesi aç" : "Sesi kapat"}
            onClick={() => {
              audio.mute(!muted);
              setMuted(!muted);
              if (muted) audio.unlock();
            }}
          >
            {muted ? "Ses kapalı" : "Ses açık"}
          </button>
          <Link href={`/play/${audience}/selective-attention`}>Çıkış ↗</Link>
        </div>
      </header>
      <div className={styles.task}>
        <span>{state ? "KASABADA BUL" : "BİR SAHİL SABAHI"}</span>
        <strong>
          {state
            ? `${COLOR_LABELS[state.trial.target.color]} ${SHAPE_LABELS[state.trial.target.shape]} bul`
            : "Küçük ayrıntılar, büyük keşifler."}
        </strong>
      </div>
      <div className={styles.stage}>
        <TownScene
          placed={placed}
          response={state?.response ?? null}
          onSelect={select}
          reduced={reduced}
          audience={audience}
        />
        {!state && (
          <div className={styles.welcome}>
            <span>01 / SAHİL KASABASI</span>
            <h2>Kasabanın işaretlerini keşfet.</h2>
            <p>
              İpucundaki renk ve şekli tabelalarda, posta kutularında ve
              saksılarda ara. Bulduğun işarete dokun.
            </p>
            <button type="button" onClick={start}>
              Keşfe başla ↗
            </button>
            <small>
              {audience === "teen"
                ? "Daha geniş alan · 6,5 sn hedef süresi · yoğun hareket"
                : "Süre baskısı yok · 16 sabit işaret"}
            </small>
          </div>
        )}
        {state?.response && (
          <div
            key={state.trial.id}
            className={styles.feedback}
            role="status"
            data-correct={state.response.correct}
          >
            {state.response.correct ? "+1 · Buldun!" : "Bu işaret değildi."}
          </div>
        )}
      </div>
      <footer className={styles.footer}>
        <span>Dokun / tıkla · Tab ve Enter ile seç</span>
        <span>Deneysel demo · Klinik ölçüm veya kayıt yapılmaz</span>
      </footer>
    </main>
  );
}
