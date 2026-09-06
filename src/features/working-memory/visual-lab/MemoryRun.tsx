"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import Link from "next/link";
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  useEffect,
  type RefObject,
} from "react";
import * as THREE from "three";
import styles from "./memory-run.module.css";
import type { WorkingMemoryAudience } from "../types";

type Phase = "intro" | "show" | "recall" | "feedback" | "done";

const PAD_POSITIONS: [number, number, number][] = [
  [-6.2, -2.8, 0],
  [-1.8, -3.8, 0],
  [3.0, -3.0, 0],
  [6.2, -1.4, 0],
  [-4.9, 0.7, 0],
  [0.1, 0.2, 0],
  [4.8, 1.0, 0],
  [-2.7, 3.8, 0],
  [2.7, 4.1, 0],
];

const PAD_COLORS = [
  "#38d6ff",
  "#6ae8a8",
  "#ffcf4a",
  "#ff6d8a",
  "#9b6cff",
  "#47e0d2",
  "#ff944d",
  "#5f9dff",
  "#d86cff",
];

function createSequence(length: number) {
  const pool = Array.from({ length: PAD_POSITIONS.length }, (_, i) => i);
  const out: number[] = [];
  while (out.length < length) {
    const index = pool[Math.floor(Math.random() * pool.length)];
    if (out[out.length - 1] !== index) out.push(index);
  }
  return out;
}

function CityBackdrop() {
  const buildings = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const side = i % 2 ? -1 : 1;
        return {
          x: side * (8.7 + Math.random() * 6.5),
          y: -5.8 + Math.random() * 12.5,
          h: 1.2 + Math.random() * 5.8,
          w: 0.8 + Math.random() * 1.2,
          glow: i % 3 === 0 ? "#2c81ff" : i % 3 === 1 ? "#6b2cff" : "#1ac9b8",
        };
      }),
    [],
  );
  return (
    <group position={[0, 0, -5]}>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.y, 0]}>
          <mesh position={[0, b.h / 2 - 4.5, 0]}>
            <boxGeometry args={[b.w, b.h, 1.5]} />
            <meshStandardMaterial color="#071525" metalness={0.55} roughness={0.38} />
          </mesh>
          {Array.from({ length: Math.max(2, Math.floor(b.h * 1.3)) }, (_, j) => (
            <mesh key={j} position={[0, -4.2 + j * 0.52, 0.78]}>
              <planeGeometry args={[b.w * 0.62, 0.08]} />
              <meshBasicMaterial color={b.glow} transparent opacity={0.28 + (j % 3) * 0.12} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Pad({
  index,
  lit,
  chosen,
  wrong,
  onSelect,
  enabled,
}: {
  index: number;
  lit: boolean;
  chosen: boolean;
  wrong: boolean;
  onSelect: (index: number) => void;
  enabled: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const pulse = lit ? 1 + Math.sin(clock.elapsedTime * 8) * 0.06 : 1;
    group.current.scale.setScalar(pulse);
  });
  const color = PAD_COLORS[index];
  return (
    <group
      ref={group}
      position={PAD_POSITIONS[index]}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (enabled) onSelect(index);
      }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.78, 0.9, 0.22, 32]} />
        <meshStandardMaterial
          color={wrong ? "#ff4257" : "#0e2435"}
          emissive={lit || chosen ? color : "#06121f"}
          emissiveIntensity={lit ? 2.8 : chosen ? 1.2 : 0.18}
          metalness={0.7}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 0.08, 0.03]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.055, 10, 40]} />
        <meshBasicMaterial
          color={wrong ? "#ff6d7b" : color}
          transparent
          opacity={lit ? 1 : chosen ? 0.78 : 0.42}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[0, 0.7, 0]}
        color={wrong ? "#ff4658" : color}
        intensity={lit ? 7 : chosen ? 2 : 0}
        distance={4}
      />
    </group>
  );
}

function Courier({
  active,
  from,
  to,
  progress,
}: {
  active: boolean;
  from: number;
  to: number;
  progress: number;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 1.6;
  });
  const a = PAD_POSITIONS[from] ?? PAD_POSITIONS[0];
  const b = PAD_POSITIONS[to] ?? a;
  const x = THREE.MathUtils.lerp(a[0], b[0], progress);
  const y = THREE.MathUtils.lerp(a[1], b[1], progress);
  const arc = Math.sin(progress * Math.PI) * 1.25;
  return (
    <group ref={group} visible={active} position={[x, y, 1.2 + arc]}>
      <mesh>
        <octahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial
          color="#dff9ff"
          emissive="#43eaff"
          emissiveIntensity={2.5}
          metalness={0.62}
          roughness={0.16}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.55}>
        <torusGeometry args={[0.36, 0.035, 8, 28]} />
        <meshBasicMaterial color="#69edff" transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <pointLight color="#53eaff" intensity={8} distance={5} />
    </group>
  );
}

function Scene({
  litIndex,
  chosen,
  wrongIndex,
  phase,
  courierFrom,
  courierTo,
  courierProgress,
  onSelect,
}: {
  litIndex: number | null;
  chosen: number[];
  wrongIndex: number | null;
  phase: Phase;
  courierFrom: number;
  courierTo: number;
  courierProgress: number;
  onSelect: (index: number) => void;
}) {
  return (
    <>
      <color attach="background" args={["#030817"]} />
      <fog attach="fog" args={["#030817", 12, 34]} />
      <ambientLight intensity={0.7} color="#6e96ce" />
      <directionalLight position={[6, 10, 10]} intensity={2.2} color="#cfe8ff" />
      <pointLight position={[0, 5, -2]} intensity={8} color="#5537ff" distance={18} />
      <CityBackdrop />
      <mesh position={[0, 0, -1.6]} rotation={[0, 0, 0]}>
        <planeGeometry args={[18, 13]} />
        <meshStandardMaterial color="#071321" metalness={0.52} roughness={0.42} />
      </mesh>
      <gridHelper
        args={[18, 18, "#16445e", "#0b2335"]}
        position={[0, 0, -1.45]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      {PAD_POSITIONS.map((_, index) => (
        <Pad
          key={index}
          index={index}
          lit={litIndex === index}
          chosen={chosen.includes(index)}
          wrong={wrongIndex === index}
          enabled={phase === "recall"}
          onSelect={onSelect}
        />
      ))}
      <Courier
        active={phase === "show"}
        from={courierFrom}
        to={courierTo}
        progress={courierProgress}
      />
    </>
  );
}

export function MemoryRun({
  audience,
  development = true,
}: {
  audience: WorkingMemoryAudience;
  development?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sequence, setSequence] = useState<number[]>([]);
  const [shown, setShown] = useState(0);
  const [litIndex, setLitIndex] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number[]>([]);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [courierProgress, setCourierProgress] = useState(0);
  const [courierFrom, setCourierFrom] = useState(0);
  const [courierTo, setCourierTo] = useState(0);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRound = () => {
    const base = audience === "teen" ? 4 : 3;
    const max = audience === "teen" ? 7 : 5;
    const length = Math.min(max, base + Math.floor(round / 2));
    const seq = createSequence(length);
    setSequence(seq);
    setChosen([]);
    setWrongIndex(null);
    setShown(0);
    setCourierFrom(seq[0]);
    setCourierTo(seq[0]);
    setCourierProgress(0);
    setLitIndex(seq[0]);
    setPhase("show");
  };

  useEffect(() => {
    if (phase !== "show" || !sequence.length) return;
    const hold = audience === "teen" ? 430 : 650;
    const travel = audience === "teen" ? 300 : 430;

    if (shown >= sequence.length) {
      showTimer.current = setTimeout(() => {
        setLitIndex(null);
        setPhase("recall");
      }, hold);
      return;
    }

    setLitIndex(sequence[shown]);
    const previous = shown === 0 ? sequence[shown] : sequence[shown - 1];
    const next = sequence[shown];
    setCourierFrom(previous);
    setCourierTo(next);
    setCourierProgress(0);

    const started = performance.now();
    const animate = () => {
      const p = Math.min(1, (performance.now() - started) / travel);
      setCourierProgress(p);
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    showTimer.current = setTimeout(() => {
      setLitIndex(null);
      stepTimer.current = setTimeout(
        () => setShown((value) => value + 1),
        90,
      );
    }, hold);

    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (stepTimer.current) clearTimeout(stepTimer.current);
    };
  }, [phase, shown, sequence, audience]);

  useEffect(() => {
    if (phase === "show" && sequence.length && shown === sequence.length) {
      const delay = audience === "teen" ? 260 : 420;
      showTimer.current = setTimeout(() => {
        setLitIndex(null);
        setPhase("recall");
      }, delay);
    }
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, [phase, shown, sequence.length, audience]);

  useEffect(
    () => () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (stepTimer.current) clearTimeout(stepTimer.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    },
    [],
  );

  const onSelect = (index: number) => {
    if (phase !== "recall") return;
    const expected = sequence[chosen.length];
    if (index !== expected) {
      setWrongIndex(index);
      setScore((value) => Math.max(0, value - 4));
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongIndex(null), 450);
      return;
    }

    const next = [...chosen, index];
    setChosen(next);
    setScore((value) => value + 10 + next.length * 2);

    if (next.length === sequence.length) {
      setPhase("feedback");
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => {
        const nextRound = round + 1;
        setRound(nextRound);
        if (nextRound >= (audience === "teen" ? 7 : 6)) {
          setPhase("done");
          return;
        }

        const base = audience === "teen" ? 4 : 3;
        const max = audience === "teen" ? 7 : 5;
        const length = Math.min(max, base + Math.floor(nextRound / 2));
        const seq = createSequence(length);
        setSequence(seq);
        setChosen([]);
        setWrongIndex(null);
        setShown(0);
        setCourierFrom(seq[0]);
        setCourierTo(seq[0]);
        setCourierProgress(0);
        setLitIndex(seq[0]);
        setPhase("show");
      }, 850);
    }
  };

  return (
    <section className={styles.game}>
      <header className={styles.header}>
        <div>
          <span>PRAXREF · WORKING MEMORY</span>
          <h1>Neon Rota{audience === "teen" ? " · Teen" : ""}</h1>
        </div>
        <div className={styles.stats}>
          <b>{score} puan</b>
          <span>Tur {Math.min(round + 1, audience === "teen" ? 7 : 6)}</span>
          <Link href={development ? `/play/${audience}/working-memory` : `/play/${audience}`}>
            Çıkış ↗
          </Link>
        </div>
      </header>

      <div className={styles.viewport}>
        <Canvas
          camera={{ position: [0, 0, 19], fov: 47, near: 0.1, far: 80 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            <Scene
              litIndex={litIndex}
              chosen={chosen}
              wrongIndex={wrongIndex}
              phase={phase}
              courierFrom={courierFrom}
              courierTo={courierTo}
              courierProgress={courierProgress}
              onSelect={onSelect}
            />
          </Suspense>
        </Canvas>

        {phase === "intro" && (
          <div className={styles.overlay}>
            <div className={styles.card}>
              <span className={styles.eyebrow}>04 / NEON ROTA</span>
              <h2>Işık rotasını izle. Sonra aynı yolu yeniden kur.</h2>
              <p>
                Kurye drone platformlara sırayla uğrayacak. Rota kaybolduğunda
                platformlara aynı sırayla dokun.
              </p>
              <p className={styles.note}>
                {audience === "teen"
                  ? "Teen: daha uzun diziler ve daha hızlı gösterim."
                  : "Kids: kısa diziler ve daha uzun izleme zamanı."}
              </p>
              <button onClick={startRound}>Rotayı başlat</button>
            </div>
          </div>
        )}

        {phase === "show" && (
          <div className={styles.badge}>İZLE · HENÜZ SEÇME</div>
        )}
        {phase === "recall" && (
          <div className={styles.badge}>
            ROTAYI TEKRARLA · {chosen.length}/{sequence.length}
          </div>
        )}
        {phase === "feedback" && (
          <div className={styles.feedback}>ROTA TAMAMLANDI ✓</div>
        )}

        {phase === "done" && (
          <div className={styles.overlay}>
            <div className={styles.card}>
              <span className={styles.eyebrow}>GÖREV TAMAMLANDI</span>
              <h2>{score} puan</h2>
              <p>
                Tamamladığın rota uzunluğu: {sequence.length} platform.
              </p>
              <button onClick={() => window.location.reload()}>Yeniden oyna</button>
            </div>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>Görev: sırayı akılda tut</span>
        <span>Gösterim bittikten sonra platformlara dokun</span>
      </footer>
    </section>
  );
}
