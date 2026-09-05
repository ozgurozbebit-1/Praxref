"use client";
import { useEffect, useRef, useState } from "react";
import { CharacterArtwork, GameArtwork } from "@/components/artwork";
import { Button, ProgressBar } from "@/components/ui";
import {
  getNextDifficulty,
  buildFocusHuntSummary,
  classifyTrial,
  createStimulus,
  focusHuntConfig,
  FOCUS_HUNT_BLOCK_SIZE,
  FOCUS_HUNT_SESSION_SECONDS,
  getDifficultyParams,
  shouldAcceptResponse,
  type FocusHuntAudience,
  type FocusHuntStimulus,
  type FocusHuntTrial,
} from "@/features/focus-hunt";
import { localSessionStore } from "@/lib/session-store/local-session-store";
import { FocusHuntProductionScene } from "../scene/FocusHuntProductionScene";
import { focusHuntSceneMode } from "../scene/scene-config";
import { FocusHuntSpaceScene } from "./focus-hunt-space-scene";

type Phase = "intro" | "countdown" | "playing" | "complete";
const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `focus-${Math.random().toString(36).slice(2)}`;
export function FocusHuntGame({
  audience,
  visualLab = false,
}: {
  audience: FocusHuntAudience;
  visualLab?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("intro"),
    [countdown, setCountdown] = useState(3),
    [stimulus, setStimulus] = useState<FocusHuntStimulus | null>(null),
    [difficulty, setDifficulty] = useState<number>(
      focusHuntConfig[audience].initialDifficulty,
    ),
    [remaining, setRemaining] = useState(FOCUS_HUNT_SESSION_SECONDS),
    [trials, setTrials] = useState<FocusHuntTrial[]>([]),
    [rewardStars, setRewardStars] = useState(0),
    [feedback, setFeedback] = useState("");
  const sessionId = useRef(createId()),
    appearedAt = useRef(0),
    trialBase = useRef<Omit<
      FocusHuntTrial,
      | "respondedAt"
      | "reactionTimeMs"
      | "reactionTimeQualityFlag"
      | "responded"
      | "correct"
      | "errorType"
    > | null>(null),
    responded = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    endAt = useRef(0),
    trialsRef = useRef<FocusHuntTrial[]>([]),
    difficultyRef = useRef<number>(focusHuntConfig[audience].initialDifficulty),
    remainingRef = useRef(FOCUS_HUNT_SESSION_SECONDS);
  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const finish = (finishedTrials = trialsRef.current) => {
    clearTimer();
    const summary = buildFocusHuntSummary(
      sessionId.current,
      audience,
      finishedTrials,
      FOCUS_HUNT_SESSION_SECONDS - remainingRef.current,
      difficultyRef.current,
    );
    localSessionStore.saveSessionSummary(summary);
    setStimulus(null);
    setPhase("complete");
  };
  const record = (respondedAt: number | null) => {
    if (!trialBase.current || !shouldAcceptResponse(responded.current)) return;
    responded.current = true;
    const result = classifyTrial(
      trialBase.current,
      respondedAt,
      getDifficultyParams(audience, difficultyRef.current).responseWindowMs,
    );
    localSessionStore.saveTrial(result);
    const all = [...trialsRef.current, result];
    trialsRef.current = all;
    setTrials(all);
    setFeedback(
      result.correct
        ? "Güzel odak!"
        : result.errorType === "commission"
          ? "Devam et, sıradaki işareti bekle."
          : "",
    );
    const nextDifficulty =
      all.length % FOCUS_HUNT_BLOCK_SIZE === 0
        ? getNextDifficulty(
            difficultyRef.current,
            all.slice(-FOCUS_HUNT_BLOCK_SIZE),
          )
        : difficultyRef.current;
    difficultyRef.current = nextDifficulty;
    setDifficulty(nextDifficulty);
    clearTimer();
    if (performance.now() >= endAt.current) {
      finish(all);
      return;
    }
    timer.current = setTimeout(
      () => showTrial(nextDifficulty, all),
      getDifficultyParams(audience, nextDifficulty).interTrialMs,
    );
  };
  const showTrial = (
    level = difficultyRef.current,
    currentTrials = trialsRef.current,
  ) => {
    if (performance.now() >= endAt.current) {
      finish(currentTrials);
      return;
    }
    responded.current = false;
    const params = getDifficultyParams(audience, level),
      next = createStimulus(params.targetRate),
      now = performance.now();
    appearedAt.current = now;
    trialBase.current = {
      trialId: createId(),
      sessionId: sessionId.current,
      audience,
      difficultyLevel: level,
      stimulusType: next.type,
      isTarget: next.isTarget,
      appearedAt: now,
    };
    setStimulus(next);
    timer.current = setTimeout(() => {
      setStimulus(null);
      record(null);
    }, params.responseWindowMs);
  };
  const start = () => {
    setPhase("countdown");
    setCountdown(3);
  };
  useEffect(() => {
    if (phase !== "countdown") return;
    if (!countdown) {
      endAt.current = performance.now() + FOCUS_HUNT_SESSION_SECONDS * 1000;
      setPhase("playing");
      showTrial();
      return;
    }
    const id = setTimeout(() => setCountdown((value) => value - 1), 700);
    return () => clearTimeout(id);
  }, [phase, countdown]);
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      const next = Math.max(
        0,
        Math.ceil((endAt.current - performance.now()) / 1000),
      );
      remainingRef.current = next;
      setRemaining(next);
    }, 250);
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => () => clearTimer(), []);
  const params = getDifficultyParams(audience, difficulty);
  if (phase === "intro")
    return (
      <section className="focus-game">
        <GameArtwork
          game="focus-hunt"
          audience={audience}
          aspect="hero"
          priority
          alt="Odak Avı oyun dünyası"
          className="focus-game__hero"
        />
        <p className="eyebrow">
          Odak Avı · {audience === "kids" ? "Kids" : "Teen"}
        </p>
        <h1>
          {audience === "kids"
            ? "Parlayan yıldızı bul!"
            : "Hedef işareti yakala."}
        </h1>
        <p>Yalnızca parlak yıldız göründüğünde seç. Diğer işaretleri bekle.</p>
        <Button variant="secondary" onClick={start}>
          Başla
        </Button>
      </section>
    );
  if (phase === "countdown")
    return (
      <section className="focus-game focus-game--countdown" aria-live="polite">
        <CharacterArtwork
          audience={audience}
          character={audience === "kids" ? "cagan" : "yusuf"}
          state="focus"
          alt="Oyuna hazırlanan karakter"
        />
        <p>Hazırlan</p>
        <strong>{countdown || "Başla!"}</strong>
      </section>
    );
  if (phase === "complete") {
    const summary = buildFocusHuntSummary(
      sessionId.current,
      audience,
      trials,
      FOCUS_HUNT_SESSION_SECONDS - remaining,
      difficulty,
    );
    return (
      <section className="focus-game">
        <GameArtwork
          game="focus-hunt"
          audience={audience}
          aspect="hero"
          alt="Odak Avı tamamlandı"
          className="focus-game__hero"
        />
        <p className="eyebrow">Görev tamamlandı</p>
        <h1>Bugünkü performansın</h1>
        <div className="focus-game__summary">
          <span>
            <b>{summary.accuracyPercent ?? "—"}%</b>Doğruluk
          </span>
          <span>
            <b>{summary.meanReactionTimeMs ?? "—"} ms</b>Ortalama yanıt
          </span>
          <span>
            <b>{summary.sustainedAttentionScore ?? "Yetersiz veri"}</b>Odak
            Sürekliliği
          </span>
        </div>
        <p>Bu görev skoru tanı veya klinik değerlendirme değildir.</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Yeni tur
        </Button>
      </section>
    );
  }
  const crystals = rewardStars;
  const sceneProps = {
    stimulus,
    onTarget: () => {
      if (stimulus?.isTarget && !responded.current) {
        setRewardStars((value) => value + 1);
      }
      record(performance.now());
    },
    onDistractor: () => record(performance.now()),
  };
  return (
    <section
      className={`focus-game focus-game--playing focus-space-scene focus-space-scene--${audience}`}
    >
      <header className="space-hud">
        <span>ASTEROİT KUŞAĞI</span>
        <b>{Math.ceil(remaining / 60)} dk</b>
        <b>⚡ {Math.min(100, 54 + crystals * 3)}%</b>
        <b>✦ {crystals}</b>
      </header>
      <ProgressBar
        value={
          ((FOCUS_HUNT_SESSION_SECONDS - remaining) /
            FOCUS_HUNT_SESSION_SECONDS) *
          100
        }
        label="Görev ilerlemesi"
      />
      <div className="focus-game__field space-field">
        <p className="focus-game__hint">
          {feedback || "Hedef: Altın yıldız · Diğer şekillere tıklama."}
        </p>
        {visualLab || focusHuntSceneMode === "production" ? (
          <FocusHuntProductionScene
            visualLab={visualLab}
            {...sceneProps}
            audience={audience}
            remainingTime={remaining}
            crystals={crystals}
            score={crystals * 10}
          />
        ) : (
          <FocusHuntSpaceScene {...sceneProps} />
        )}
        <div className="atlas-cockpit">
          PRAXREF-ATLAS <span>ENERJİ ROTASI AKTİF</span>
        </div>
      </div>
      <small>
        Seviye {difficulty} · {trials.length} görev · {crystals * 10} yıldız
        puanı
      </small>
    </section>
  );
}
