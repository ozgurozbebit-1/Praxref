"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import Link from "next/link";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";
import styles from "./city-run.module.css";

type Audience = "kids" | "teen";
type SymbolKind = "star" | "triangle" | "circle" | "diamond";

type InputState = {
  x: number;
  speed: number;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

type Gate = {
  id: number;
  z: number;
  lane: number;
  kind: SymbolKind;
  passed: boolean;
};

const LANES = [-3.7, 0, 3.7];
const COLORS: Record<SymbolKind, string> = {
  star: "#ffd83d",
  triangle: "#35bfff",
  circle: "#48ed8b",
  diamond: "#ff5572",
};
const LABELS: Record<SymbolKind, string> = {
  star: "Yıldız",
  triangle: "Üçgen",
  circle: "Daire",
  diamond: "Elmas",
};
const MISSION: SymbolKind[] = ["star", "triangle", "circle", "diamond"];

function seeded(i: number) {
  const x = Math.sin(i * 9283.13) * 43758.5453;
  return x - Math.floor(x);
}

function RoadsideTree({ x, z }: { x: number; z: number }) {
  return <group position={[x,0,z]}><mesh position={[0,.7,0]} castShadow><cylinderGeometry args={[.14,.2,1.4,10]}/><meshStandardMaterial color="#75543d"/></mesh><mesh position={[0,2.05,0]} castShadow><sphereGeometry args={[.95,14,10]}/><meshStandardMaterial color="#3f8f67" roughness={.82}/></mesh><mesh position={[.42,2.2,.1]} castShadow><sphereGeometry args={[.62,12,8]}/><meshStandardMaterial color="#65aa76" roughness={.85}/></mesh></group>;
}

function Building({
  x,
  z,
  index,
  side,
}: {
  x: number;
  z: number;
  index: number;
  side: -1 | 1;
}) {
  const h = 4.8 + seeded(index + 2) * 11;
  const w = 3.5 + seeded(index + 7) * 4.8;
  const d = 4 + seeded(index + 11) * 5.2;
  const accent =
    index % 4 === 0
      ? "#26d3e8"
      : index % 4 === 1
        ? "#5b74ff"
        : index % 4 === 2
          ? "#a04fff"
          : "#19c98c";
  return (
    <group position={[x, h / 2 - 0.2, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={index % 5 === 0 ? "#c96f54" : index % 5 === 1 ? "#6c93a5" : index % 5 === 2 ? "#d2a35f" : index % 5 === 3 ? "#628c83" : "#8b7d91"}
          metalness={0.12}
          roughness={0.58}
        />
      </mesh>
      {Array.from({ length: Math.floor(h / 1.15) }, (_, floor) =>
        Array.from({ length: 2 }, (_, col) => (
          <mesh
            key={`${floor}-${col}`}
            position={[
              (col ? 0.24 : -0.24) * w,
              -h / 2 + 1 + floor * 1.12,
              d / 2 + 0.012,
            ]}
          >
            <planeGeometry args={[w * 0.25, 0.12]} />
            <meshBasicMaterial
              color={floor % 3 === 0 ? "#bfe9ff" : accent}
              transparent
              opacity={0.52 + ((floor + col) % 3) * 0.12}
              toneMapped={false}
            />
          </mesh>
        )),
      )}
    </group>
  );
}

function StreetLight({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, 5, 10]} />
        <meshStandardMaterial color="#33485b" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0.34 * Math.sign(x), 4.9, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.11, 0.7, 0.14]} />
        <meshStandardMaterial color="#344d61" metalness={0.78} />
      </mesh>
      <pointLight
        position={[0.62 * Math.sign(x), 4.78, 0]}
        intensity={2.8}
        distance={6}
        color="#c8f3ff"
      />
    </group>
  );
}

function LogoGantries() {
  const logo = useTexture("/assets/brand/logo/praxref-primary.png");
  return (
    <>
      {[-18, -92, -166].map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[-6.2, 3.2, 0]} castShadow>
            <boxGeometry args={[0.22, 6.4, 0.22]} />
            <meshStandardMaterial color="#17354a" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[6.2, 3.2, 0]} castShadow>
            <boxGeometry args={[0.22, 6.4, 0.22]} />
            <meshStandardMaterial color="#17354a" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0, 6.05, 0]} castShadow>
            <boxGeometry args={[13.2, 2.25, 0.42]} />
            <meshStandardMaterial color="#071727" metalness={0.62} roughness={0.22} />
          </mesh>
          <mesh position={[0, 6.08, 0.23]}>
            <planeGeometry args={[4.9, 1.2]} />
            <meshBasicMaterial map={logo} transparent toneMapped={false} />
          </mesh>
          <mesh position={[4.2, 6.07, 0.24]}>
            <planeGeometry args={[2.7, 0.5]} />
            <meshBasicMaterial
              color={i % 2 ? "#5be8ff" : "#ffd864"}
              transparent
              opacity={0.75}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function CityWorld() {
  const buildings = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        z: -8 - i * 7.2,
        leftX: -11.2 - seeded(i) * 3.8,
        rightX: 11.2 + seeded(i + 100) * 3.8,
      })),
    [],
  );
  return (
    <group>
      <mesh position={[0, -0.16, -104]} receiveShadow>
        <boxGeometry args={[15.6, 0.3, 228]} />
        <meshStandardMaterial color="#30343a" roughness={0.9} metalness={0.02} />
      </mesh>
      {[-5.25, -1.75, 1.75, 5.25].map((x) => (
        <group key={x}>
          {Array.from({ length: 28 }, (_, i) => (
            <mesh key={i} position={[x, 0.03, 6 - i * 8.2]}>
              <boxGeometry args={[0.055, 0.015, 3.2]} />
              <meshBasicMaterial color="#d9edf1" transparent opacity={0.72} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[-8.2, 0.05, -104]}>
        <boxGeometry args={[0.62, 0.14, 228]} />
        <meshStandardMaterial color="#d7d9d5" roughness={0.86} />
      </mesh>
      <mesh position={[8.2, 0.05, -104]}>
        <boxGeometry args={[0.62, 0.14, 228]} />
        <meshStandardMaterial color="#d7d9d5" roughness={0.86} />
      </mesh>

      {buildings.map((b, i) => (
        <group key={i}>
          <Building x={b.leftX} z={b.z} index={i} side={-1} />
          <Building x={b.rightX} z={b.z} index={i + 80} side={1} />
          {i % 2 === 0 && (
            <>
              <StreetLight x={-7.45} z={b.z + 1.5} />
              <StreetLight x={7.45} z={b.z + 1.5} />
              <RoadsideTree x={-9.1} z={b.z - 1.3} />
              <RoadsideTree x={9.1} z={b.z - 1.3} />
            </>
          )}
        </group>
      ))}
      <LogoGantries />
    </group>
  );
}

function PlayerCar({
  inputRef,
  running,
}: {
  inputRef: RefObject<InputState>;
  running: boolean;
}) {
  const car = useRef<THREE.Group>(null);
  const wheelFL = useRef<THREE.Mesh>(null);
  const wheelFR = useRef<THREE.Mesh>(null);
  const wheelRL = useRef<THREE.Mesh>(null);
  const wheelRR = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const input = inputRef.current;
    if (!running) return;
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const accel = (input.up ? 1 : 0) - (input.down ? 1 : 0);
    input.speed = THREE.MathUtils.clamp(
      input.speed + accel * delta * 14,
      14,
      38,
    );
    input.x = THREE.MathUtils.clamp(input.x + steer * delta * 8.6, -5.35, 5.35);
    if (car.current) {
      car.current.position.x = THREE.MathUtils.lerp(
        car.current.position.x,
        input.x,
        1 - Math.exp(-delta * 10),
      );
      car.current.rotation.z = THREE.MathUtils.lerp(
        car.current.rotation.z,
        -steer * 0.09,
        0.12,
      );
    }
    [wheelFL.current, wheelFR.current, wheelRL.current, wheelRR.current].forEach(
      (wheel) => {
        if (wheel) wheel.rotation.x -= input.speed * delta * 0.78;
      },
    );
  });

  const Wheel = ({
    x,
    z,
    wheelRef,
  }: {
    x: number;
    z: number;
    wheelRef: RefObject<THREE.Mesh | null>;
  }) => (
    <mesh
      ref={wheelRef}
      position={[x, 0.38, z]}
      rotation={[0, 0, Math.PI / 2]}
      castShadow
    >
      <cylinderGeometry args={[0.32, 0.32, 0.24, 16]} />
      <meshStandardMaterial color="#020406" metalness={0.3} roughness={0.72} />
    </mesh>
  );

  return (
    <group ref={car} position={[0, 0, 3.1]}>
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[2.12, 0.48, 4.05]} />
        <meshStandardMaterial
          color="#d64c3e"
          emissive="#0d3045"
          emissiveIntensity={0.22}
          metalness={0.72}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 1.02, -0.2]} castShadow>
        <boxGeometry args={[1.62, 0.48, 1.82]} />
        <meshStandardMaterial color="#18222d" metalness={0.78} roughness={0.16} />
      </mesh>
      <mesh position={[0, .86, 1.62]} rotation={[-.32,0,0]}>
        <boxGeometry args={[1.54, .72, .06]} />
        <meshStandardMaterial
          color="#b9e6f4"
          emissive="#41b9e8"
          emissiveIntensity={0.62}
          metalness={0.2}
          roughness={0.08}
        />
      </mesh>
      <mesh position={[0,.72,2.02]} castShadow><boxGeometry args={[1.75,.16,.18]}/><meshStandardMaterial color="#b52d2b" metalness={.45}/></mesh>\n      {[-0.67, 0.67].map((x) => (
        <mesh key={x} position={[x, 0.6, -1.89]}>
          <boxGeometry args={[0.38, 0.16, 0.08]} />
          <meshBasicMaterial color="#ff5368" toneMapped={false} />
        </mesh>
      ))}
      {[-0.67, 0.67].map((x) => (
        <mesh key={x} position={[x, 0.62, 1.89]}>
          <boxGeometry args={[0.38, 0.16, 0.08]} />
          <meshBasicMaterial color="#dffcff" toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0, 0.5, 2.2]} color="#c7f7ff" intensity={7} distance={8} />
      <pointLight position={[0, 0.35, -2.0]} color="#ff3558" intensity={3} distance={4} />
      <Wheel x={-1.0} z={1.1} wheelRef={wheelFL} />
      <Wheel x={1.0} z={1.1} wheelRef={wheelFR} />
      <Wheel x={-1.0} z={-1.1} wheelRef={wheelRL} />
      <Wheel x={1.0} z={-1.1} wheelRef={wheelRR} />
    </group>
  );
}

function Traffic({
  running,
  audience,
  speedRef,
}: {
  running: boolean;
  audience: Audience;
  speedRef: RefObject<number>;
}) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const cars = useMemo(
    () =>
      Array.from({ length: audience === "teen" ? 18 : 12 }, (_, i) => ({
        lane: i % 3,
        offset: 22 + i * 14 + seeded(i + 50) * 9,
        speedBias: 0.55 + seeded(i + 11) * 0.95,
        color:
          i % 4 === 0
            ? "#5b8cff"
            : i % 4 === 1
              ? "#a258ff"
              : i % 4 === 2
                ? "#27c7a2"
                : "#da6c4f",
      })),
    [audience],
  );

  useFrame(({ clock }) => {
    if (!running) return;
    const t = clock.elapsedTime;
    cars.forEach((car, i) => {
      const ref = refs.current[i];
      if (!ref) return;
      const laneX = LANES[car.lane] + Math.sin(t * 0.22 + i) * 0.38;
      const loop = 205;
      const z =
        8 -
        ((t * (7.5 + speedRef.current * 0.32 * car.speedBias) + car.offset) %
          loop);
      ref.position.set(laneX, 0, z);
      ref.rotation.y = 0;
    });
  });

  return (
    <>
      {cars.map((car, i) => (
        <group
          key={i}
          ref={(node) => {
            refs.current[i] = node;
          }}
        >
          <mesh position={[0, 0.46, 0]} castShadow>
            <boxGeometry args={[1.65, 0.42, 3]} />
            <meshStandardMaterial color={car.color} metalness={0.58} roughness={0.27} />
          </mesh>
          <mesh position={[0, 0.82, -0.1]}>
            <boxGeometry args={[1.26, 0.36, 1.35]} />
            <meshStandardMaterial color="#112637" metalness={0.6} roughness={0.18} />
          </mesh>
          <mesh position={[-0.52, 0.5, -1.53]}>
            <boxGeometry args={[0.3, 0.12, 0.04]} />
            <meshBasicMaterial color="#ff4057" toneMapped={false} />
          </mesh>
          <mesh position={[0.52, 0.5, -1.53]}>
            <boxGeometry args={[0.3, 0.12, 0.04]} />
            <meshBasicMaterial color="#ff4057" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function SymbolShape({ kind }: { kind: SymbolKind }) {
  const color = COLORS[kind];
  if (kind === "star")
    return (
      <group>
        <mesh>
          <icosahedronGeometry args={[0.72, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.2}
            metalness={0.14}
            roughness={0.18}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={1.25}>
          <torusGeometry args={[0.62, 0.04, 10, 36]} />
          <meshBasicMaterial color="#fff4aa" transparent opacity={0.72} toneMapped={false} />
        </mesh>
      </group>
    );
  if (kind === "triangle")
    return (
      <mesh>
        <coneGeometry args={[0.75, 0.9, 3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.7} toneMapped={false} />
      </mesh>
    );
  if (kind === "circle")
    return (
      <mesh>
        <torusGeometry args={[0.6, 0.15, 12, 36]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    );
  return (
    <mesh rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.9, 0.9, 0.26]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.65} toneMapped={false} />
    </mesh>
  );
}

function Gates({
  missionIndex,
  onHit,
  inputRef,
  running,
}: {
  missionIndex: number;
  onHit: (kind: SymbolKind, correct: boolean) => void;
  inputRef: RefObject<InputState>;
  running: boolean;
}) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const gates = useRef<Gate[]>(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      z: -24 - i * 8.3,
      lane: i % 3,
      kind: MISSION[(i + (i % 3)) % MISSION.length],
      passed: false,
    })),
  );

  useFrame((_, delta) => {
    if (!running) return;
    const scroll = inputRef.current.speed * delta;
    gates.current.forEach((gate, i) => {
      gate.z += scroll;
      if (gate.z > 11) {
        gate.z = -210 - seeded(i + Date.now() * 0.0001) * 28;
        gate.kind = MISSION[Math.floor(Math.random() * MISSION.length)];
        gate.lane = Math.floor(Math.random() * 3);
        gate.passed = false;
      }
      const ref = refs.current[i];
      if (ref) ref.position.set(LANES[gate.lane], 1.55, gate.z);
      if (!gate.passed && gate.z > 1.1 && gate.z < 4.8) {
        gate.passed = true;
        const dx = Math.abs(inputRef.current.x - LANES[gate.lane]);
        if (dx < 1.45) {
          const correct = gate.kind === MISSION[missionIndex % MISSION.length];
          onHit(gate.kind, correct);
        }
      }
    });
  });

  return (
    <>
      {gates.current.map((gate, i) => (
        <group
          key={gate.id}
          ref={(node) => {
            refs.current[i] = node;
          }}
          position={[LANES[gate.lane], 1.55, gate.z]}
        >
          <SymbolShape kind={gate.kind} />
          <pointLight color={COLORS[gate.kind]} intensity={4.5} distance={5} />
        </group>
      ))}
    </>
  );
}

function Scene({
  audience,
  running,
  inputRef,
  onGate,\n  missionIndex,\n}: {\n  audience: Audience;
  running: boolean;
  inputRef: RefObject<InputState>;
  onGate: (kind: SymbolKind, correct: boolean) => void;\n  missionIndex: number;\n}) {
  const speedRef = useRef(22);
  useFrame(() => {
    speedRef.current = inputRef.current.speed;
  });
  return (
    <>
      <color attach="background" args={["#82c8ee"]} />\n      <fog attach="fog" args={["#b9d9e6", 72, 230]} />\n      <hemisphereLight intensity={2.1} color="#eaf8ff" groundColor="#6f756e" />\n      <ambientLight intensity={1.35} color="#fff4df" />\n      <directionalLight position={[-12, 24, 14]} intensity={3.8} color="#fff3d2" castShadow shadow-mapSize={[1024,1024]} />
      <CityWorld />
      <Traffic running={running} audience={audience} speedRef={speedRef} />
      <Gates missionIndex={missionIndex} onHit={onGate} inputRef={inputRef} running={running} />
      <PlayerCar inputRef={inputRef} running={running} />
    </>
  );
}

export function PraxrefCity({
  audience,
  development = true,
}: {
  audience: Audience;
  development?: boolean;
}) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [remaining, setRemaining] = useState(audience === "teen" ? 65 : 75);
  const [missionIndex, setMissionIndex] = useState(0);
  const inputRef = useRef<InputState>({
    x: 0,
    speed: audience === "teen" ? 27 : 22,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  useEffect(() => {
    if (phase !== "running") return;
    const started = performance.now();
    const duration = (audience === "teen" ? 65 : 75) * 1000;
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
    (kind: SymbolKind, correct: boolean) => {
      if (phase !== "running") return;
      if (correct) {
        setHits((v) => v + 1);
        setCombo((v) => v + 1);
        setScore((v) => v + 20 + Math.min(40, combo * 3));
        setMissionIndex((v) => (v + 1) % MISSION.length);
      } else {
        setWrong((v) => v + 1);
        setCombo(0);
        setScore((v) => Math.max(0, v - 10));
      }
    },
    [combo, phase],
  );

  return (
    <section className={styles.game}>
      <header className={styles.header}>
        <div>
          <span>PRAXREF · COGNITIVE CITY</span>
          <h1>PraxRef City{audience === "teen" ? " · Teen" : ""}</h1>
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
        tabIndex={0}
        onKeyDown={(event) => {
          const key = event.key.toLowerCase();
          if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s"].includes(key))
            event.preventDefault();
          if (key === "arrowleft" || key === "a") inputRef.current.left = true;
          if (key === "arrowright" || key === "d") inputRef.current.right = true;
          if (key === "arrowup" || key === "w") inputRef.current.up = true;
          if (key === "arrowdown" || key === "s") inputRef.current.down = true;
        }}
        onKeyUp={(event) => {
          const key = event.key.toLowerCase();
          if (key === "arrowleft" || key === "a") inputRef.current.left = false;
          if (key === "arrowright" || key === "d") inputRef.current.right = false;
          if (key === "arrowup" || key === "w") inputRef.current.up = false;
          if (key === "arrowdown" || key === "s") inputRef.current.down = false;
        }}
        onPointerMove={(event) => {
          if (phase !== "running") return;
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
          camera={{ position: [0, 3.25, 9.2], fov: 58, near: 0.1, far: 280 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ camera }) => camera.lookAt(0, 1.15, -34)}
        >
          <Suspense fallback={null}>
            <Scene
              audience={audience}
              running={phase === "running"}
              inputRef={inputRef}
              onGate={onGate}\n              missionIndex={missionIndex}\n            />
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

        {phase === "intro" && (
          <div className={styles.overlay}>
            <div className={styles.card}>
              <span className={styles.eyebrow}>FINAL / PRAXREF CITY</span>
              <h2>Şehre gir. Rotayı oku. Doğru sembol şeridini seç.</h2>
              <p>
                Trafik akarken hedef sırası değişecek. Aracı mouse veya ok/WASD
                tuşlarıyla yönlendir; doğru sembolün bulunduğu şeritten geç.
              </p>
              <p className={styles.note}>
                {audience === "teen"
                  ? "Teen: daha yoğun trafik, daha yüksek başlangıç hızı."
                  : "Kids: kontrollü trafik, daha geniş karar zamanı."}
              </p>
              <button onClick={() => setPhase("running")}>Şehre gir</button>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className={styles.overlay}>
            <div className={styles.card}>
              <span className={styles.eyebrow}>ŞEHİR GÖREVİ TAMAMLANDI</span>
              <h2>{score} puan</h2>
              <div className={styles.summary}>
                <span><b>{hits}</b> doğru geçiş</span>
                <span><b>{wrong}</b> yanlış geçiş</span>
                <span><b>{combo}</b> son seri</span>
              </div>
              <button onClick={() => window.location.reload()}>Yeniden sür</button>
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
