"use client";
import { useEffect, useRef, useState } from "react";
import { PrismWorkshop } from "./PrismWorkshop";
import {
  SELECTIVE_ATTENTION_BLOCK_SIZE,
  SELECTIVE_ATTENTION_SESSION_SECONDS,
  buildSelectiveSummary,
  classifySelectiveTrial,
  createTrialSet,
  getNextDifficulty,
  getSelectiveParams,
  type SelectiveAttentionAudience,
  type SelectiveAttentionTrial,
  type Stimulus,
  type TrialType,
} from "@/features/selective-attention";
import { selectiveAttentionStore } from "../local-session-store";
type Phase = "intro" | "countdown" | "playing" | "complete";
const makeId = () => `selective-${Math.random().toString(36).slice(2)}`;
export function SelectiveAttentionGame({
  audience,
}: {
  audience: SelectiveAttentionAudience;
}) {
  const [phase, setPhase] = useState<Phase>("intro"),
    [count, setCount] = useState(3),
    [rule, setRule] = useState(""),
    [stimuli, setStimuli] = useState<Stimulus[]>([]),
    [difficulty, setDifficulty] = useState(audience === "kids" ? 2 : 4),
    [trials, setTrials] = useState<SelectiveAttentionTrial[]>([]),
    [remaining, setRemaining] = useState(SELECTIVE_ATTENTION_SESSION_SECONDS),
    [feedback, setFeedback] = useState("");
  const sessionId = useRef(makeId()),
    base = useRef<Omit<
      SelectiveAttentionTrial,
      | "respondedAt"
      | "reactionTimeMs"
      | "selectedStimulus"
      | "responded"
      | "correct"
      | "errorType"
      | "reactionTimeQualityFlag"
    > | null>(null),
    seen = useRef(false),
    trialsRef = useRef<SelectiveAttentionTrial[]>([]),
    levelRef = useRef(difficulty),
    endAt = useRef(0),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const finish = () => {
    clear();
    selectiveAttentionStore.saveSessionSummary(
      buildSelectiveSummary(
        sessionId.current,
        audience,
        trialsRef.current,
        levelRef.current,
      ),
    );
    setStimuli([]);
    setPhase("complete");
  };
  const show = (level = levelRef.current) => {
    if (performance.now() >= endAt.current) return finish();
    seen.current = false;
    const params = getSelectiveParams(audience, level),
      type: TrialType =
        Math.random() < params.conjunctionRate
          ? "conjunction"
          : params.similarity > 0.55 && Math.random() < 0.45
            ? "similarity"
            : "feature",
      set = createTrialSet(type, params.distractorCount, params.similarity),
      appearedAt = performance.now();
    base.current = {
      trialId: makeId(),
      sessionId: sessionId.current,
      audience,
      difficultyLevel: level,
      trialType: type,
      targetRule: set.rule,
      targetStimulus: set.target,
      distractorCount: params.distractorCount,
      distractorSimilarity: params.similarity,
      appearedAt,
    };
    setRule(set.rule);
    setStimuli(set.stimuli);
    timer.current = setTimeout(() => record(null), params.responseWindowMs);
  };
  const record = (selected: Stimulus | null) => {
    if (!base.current || seen.current) return;
    seen.current = true;
    const result = classifySelectiveTrial(
        base.current,
        selected,
        selected ? performance.now() : null,
        getSelectiveParams(audience, levelRef.current).responseWindowMs,
      ),
      all = [...trialsRef.current, result];
    selectiveAttentionStore.saveTrial(result);
    trialsRef.current = all;
    setTrials(all);
    setFeedback(result.correct ? "Hedefi buldun!" : "Sıradaki hedefe odaklan.");
    const next =
      all.length % SELECTIVE_ATTENTION_BLOCK_SIZE === 0
        ? getNextDifficulty(levelRef.current, all.slice(-10))
        : levelRef.current;
    levelRef.current = next;
    setDifficulty(next);
    clear();
    timer.current = setTimeout(() => show(next), 420);
  };
  useEffect(() => {
    if (phase !== "countdown") return;
    if (!count) {
      endAt.current =
        performance.now() + SELECTIVE_ATTENTION_SESSION_SECONDS * 1000;
      setPhase("playing");
      show();
      return;
    }
    const id = setTimeout(() => setCount((n) => n - 1), 700);
    return () => clearTimeout(id);
  }, [phase, count]);
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(
      () =>
        setRemaining(
          Math.max(0, Math.ceil((endAt.current - performance.now()) / 1000)),
        ),
      250,
    );
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => () => clear(), []);
  return (
    <PrismWorkshop
      audience={audience}
      phase={phase}
      count={count}
      rule={rule}
      stimuli={stimuli}
      size={getSelectiveParams(audience, difficulty).stimulusSize}
      difficulty={difficulty}
      remaining={remaining}
      trials={trials}
      feedback={feedback}
      summary={
        phase === "complete"
          ? buildSelectiveSummary(
              sessionId.current,
              audience,
              trials,
              difficulty,
            )
          : null
      }
      onStart={() => {
        setPhase("countdown");
        setCount(3);
      }}
      onSelect={record}
      onReplay={() => window.location.reload()}
    />
  );
}
