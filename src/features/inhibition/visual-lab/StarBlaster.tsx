"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import Link from "next/link";
import {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";
import styles from "./star-blaster.module.css";
import type { InhibitionAudience } from "../types";

type SymbolKind = "target" | "circle" | "triangle" | "diamond" | "hex";
type Enemy = {
  id: number;
  kind: SymbolKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  spin: number;
  scale: number;
};
type Shot = { id: number; x: number; y: number; z: number; vy: number };

const SHIP = "/assets/3d/ships/praxref-atlas.glb";
const SHAPES = {
  target: "/assets/games/shapes/star-gold.glb",
  circle: "/assets/games/shapes/sphere-blue.glb",
  triangle: "/assets/games/shapes/triangle-pink.glb",
  diamond: "/assets/games/shapes/diamond-purple.glb",
  hex: "/assets/games/shapes/crystal-turquoise.glb",
} as const;

function cloneNormalized(scene: THREE.Group, size: number) {
  const model = scene.clone(true);
  const materials: THREE.Material[] = [];
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    const mat = Array.isArray(object.material)
      ? object.material.map((m) => m.clone())
      : object.material.clone();
    object.material = mat;
    (Array.isArray(mat) ? mat : [mat]).forEach((m) => materials.push(m));
  });
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const dims = box.getSize(new THREE.Vector3());
  model.position.sub(center);
  const wrapper = new THREE.Group();
  wrapper.add(model);
  wrapper.scale.setScalar(size / Math.max(dims.x, dims.y, dims.z, 0.001));
  return { object: wrapper, materials };
}

function Starfield() {
  const points = useMemo(() => {
    const data = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      data[i * 3] = (Math.random() - 0.5) * 42;
      data[i * 3 + 1] = (Math.random() - 0.5) * 30;
      data[i * 3 + 2] = -4 - Math.random() * 25;
    }
    return data;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d8ecff" size={0.055} sizeAttenuation />
    </points>
  );
}

function Scene({
  audience,
  running,
  inputRef,
  fireRef,
  onHud,
  onFinish,
}: {
  audience: InhibitionAudience;
  running: boolean;
  inputRef: RefObject<{ x: number; y: number; left: boolean; right: boolean; up: boolean; down: boolean }>;
  fireRef: RefObject<number>;
  onHud: (data: { score: number; hits: number; wrong: number; missed: number; combo: number; remaining: number }) => void;
  onFinish: () => void;
}) {
  const assets = useGLTF([SHIP, ...Object.values(SHAPES)]);
  const shipModel = useMemo(() => cloneNormalized(assets[0].scene, 2.5), [assets]);
  const symbolModels = useMemo(() => {
    const keys = Object.keys(SHAPES) as SymbolKind[];
    return Object.fromEntries(
      keys.map((key, i) => [key, cloneNormalized(assets[i + 1].scene, key === "target" ? 1.15 : 1.0)]),
    ) as Record<SymbolKind, ReturnType<typeof cloneNormalized>>;
  }, [assets]);
  const ship = useRef<THREE.Group>(null);
  const enemyRefs = useRef<Map<number, THREE.Group>>(new Map());
  const shotRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const state = useRef({
    startedAt: 0,
    lastSpawn: 0,
    lastShotSignal: 0,
    nextId: 1,
    enemies: [] as Enemy[],
    shots: [] as Shot[],
    score: 0,
    hits: 0,
    wrong: 0,
    missed: 0,
    combo: 0,
    ended: false,
    hudAt: 0,
  });

  useFrame(({ clock }, delta) => {
    if (!running || state.current.ended) return;
    const now = clock.elapsedTime;
    const s = state.current;
    if (!s.startedAt) {
      s.startedAt = now;
      s.lastSpawn = now;
    }
    const duration = audience === "teen" ? 55 : 60;
    const elapsed = now - s.startedAt;
    const remaining = Math.max(0, duration - elapsed);
    if (remaining <= 0) {
      s.ended = true;
      onHud({ score: s.score, hits: s.hits, wrong: s.wrong, missed: s.missed, combo: s.combo, remaining: 0 });
      onFinish();
      return;
    }

    const input = inputRef.current;
    const speed = audience === "teen" ? 8.3 : 7.2;
    if (input.left) input.x -= speed * delta;
    if (input.right) input.x += speed * delta;
    if (input.up) input.y += speed * delta;
    if (input.down) input.y -= speed * delta;
    input.x = THREE.MathUtils.clamp(input.x, -7.2, 7.2);
    input.y = THREE.MathUtils.clamp(input.y, -6.3, -2.4);
    if (ship.current) {
      ship.current.position.lerp(new THREE.Vector3(input.x, input.y, 0), 1 - Math.exp(-delta * 12));
      ship.current.rotation.z = THREE.MathUtils.lerp(ship.current.rotation.z, -input.x * 0.015, 0.08);
    }

    const spawnEvery = audience === "teen" ? 0.34 : 0.52;
    if (now - s.lastSpawn >= spawnEvery) {
      s.lastSpawn = now;
      const kinds: SymbolKind[] = ["target", "circle", "triangle", "diamond", "hex"];
      const targetRate = audience === "teen" ? 0.32 : 0.38;
      const kind = Math.random() < targetRate ? "target" : kinds[1 + Math.floor(Math.random() * 4)];
      const x = (Math.random() - 0.5) * 14;
      s.enemies.push({
        id: s.nextId++,
        kind,
        x,
        y: 9.4 + Math.random() * 1.8,
        z: -0.5,
        vx: (Math.random() - 0.5) * (audience === "teen" ? 2.4 : 1.6),
        vy: -(audience === "teen" ? 3.8 + Math.random() * 1.4 : 2.8 + Math.random() * 1.1),
        spin: (Math.random() - 0.5) * 2.4,
        scale: 0.85 + Math.random() * 0.3,
      });
    }

    if (fireRef.current !== s.lastShotSignal) {
      s.lastShotSignal = fireRef.current;
      s.shots.push({ id: s.nextId++, x: input.x, y: input.y + 0.8, z: 0.1, vy: 13.5 });
    }

    for (const shot of s.shots) shot.y += shot.vy * delta;
    for (const enemy of s.enemies) {
      enemy.x += enemy.vx * delta;
      enemy.y += enemy.vy * delta;
      if (Math.abs(enemy.x) > 7.7) enemy.vx *= -1;
      const ref = enemyRefs.current.get(enemy.id);
      if (ref) {
        ref.position.set(enemy.x, enemy.y, enemy.z);
        ref.rotation.y += enemy.spin * delta;
        ref.rotation.z += enemy.spin * delta * 0.35;
      }
    }
    for (const shot of s.shots) {
      const ref = shotRefs.current.get(shot.id);
      if (ref) ref.position.set(shot.x, shot.y, shot.z);
    }

    const deadShots = new Set<number>();
    const deadEnemies = new Set<number>();
    for (const shot of s.shots) {
      for (const enemy of s.enemies) {
        if (deadEnemies.has(enemy.id)) continue;
        const dx = shot.x - enemy.x, dy = shot.y - enemy.y;
        if (dx * dx + dy * dy < 0.72 * 0.72) {
          deadShots.add(shot.id);
          deadEnemies.add(enemy.id);
          if (enemy.kind === "target") {
            s.hits++;
            s.combo++;
            s.score += 10 + Math.min(20, s.combo * 2);
          } else {
            s.wrong++;
            s.combo = 0;
            s.score = Math.max(0, s.score - 6);
          }
          break;
        }
      }
    }
    for (const enemy of s.enemies) {
      if (enemy.y < -7.2) {
        deadEnemies.add(enemy.id);
        if (enemy.kind === "target") {
          s.missed++;
          s.combo = 0;
          s.score = Math.max(0, s.score - 2);
        }
      }
    }
    s.shots = s.shots.filter((shot) => shot.y < 10.5 && !deadShots.has(shot.id));
    s.enemies = s.enemies.filter((enemy) => !deadEnemies.has(enemy.id));

    if (now >= s.hudAt) {
      s.hudAt = now + 0.1;
      onHud({ score: s.score, hits: s.hits, wrong: s.wrong, missed: s.missed, combo: s.combo, remaining });
    }
  });

  return (
    <>
      <color attach="background" args={["#030817"]} />
      <fog attach="fog" args={["#030817", 18, 36]} />
      <ambientLight intensity={0.7} color="#8db9ff" />
      <directionalLight position={[6, 10, 8]} intensity={2.2} color="#d8e9ff" />
      <Starfield />
      <mesh position={[0, 2, -15]}>
        <planeGeometry args={[26, 20]} />
        <meshBasicMaterial color="#14295c" transparent opacity={0.18} />
      </mesh>
      <group ref={ship} position={[0, -5.1, 0]}>
        <primitive object={shipModel.object} dispose={null} />
        <pointLight position={[0, -0.4, 0.4]} color="#55dfff" intensity={5} distance={5} />
      </group>
      {state.current.enemies.map((enemy) => (
        <group
          key={enemy.id}
          ref={(node) => {
            if (node) enemyRefs.current.set(enemy.id, node);
            else enemyRefs.current.delete(enemy.id);
          }}
          scale={enemy.scale}
        >
          <primitive object={symbolModels[enemy.kind].object.clone(true)} dispose={null} />
        </group>
      ))}
      {state.current.shots.map((shot) => (
        <mesh
          key={shot.id}
          ref={(node) => {
            if (node) shotRefs.current.set(shot.id, node);
            else shotRefs.current.delete(shot.id);
          }}
        >
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshBasicMaterial color="#ff4f63" />
          <pointLight color="#ff4f63" intensity={3} distance={2.4} />
        </mesh>
      ))}
    </>
  );
}

export function StarBlaster({ audience, development = true }: { audience: InhibitionAudience; development?: boolean }) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [hud, setHud] = useState({ score: 0, hits: 0, wrong: 0, missed: 0, combo: 0, remaining: audience === "teen" ? 55 : 60 });
  const inputRef = useRef({ x: 0, y: -5.1, left: false, right: false, up: false, down: false });
  const fireRef = useRef(0);
  const viewport = useRef<HTMLDivElement>(null);

  const fire = useCallback(() => {
    if (phase !== "running") return;
    fireRef.current += 1;
  }, [phase]);

  return (
    <section className={styles.game}>
      <header className={styles.header}>
        <div>
          <span>PRAXREF · ATTENTION BLASTER</span>
          <h1>Yıldız Savunması{audience === "teen" ? " · Teen" : ""}</h1>
        </div>
        <div className={styles.stats}>
          <b>{Math.ceil(hud.remaining)} sn</b>
          <b>{hud.score} puan</b>
          <span>🔥 {hud.combo}</span>
          <Link href={development ? `/play/${audience}/inhibition` : `/play/${audience}`}>Çıkış ↗</Link>
        </div>
      </header>
      <div
        ref={viewport}
        className={styles.viewport}
        tabIndex={0}
        onKeyDown={(event) => {
          const key = event.key.toLowerCase();
          if (["arrowleft","arrowright","arrowup","arrowdown","a","d","w","s"," "].includes(key)) event.preventDefault();
          if (key === "arrowleft" || key === "a") inputRef.current.left = true;
          if (key === "arrowright" || key === "d") inputRef.current.right = true;
          if (key === "arrowup" || key === "w") inputRef.current.up = true;
          if (key === "arrowdown" || key === "s") inputRef.current.down = true;
          if (key === " ") fire();
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
          inputRef.current.x = ((event.clientX - rect.left) / rect.width * 2 - 1) * 7.2;
          inputRef.current.y = THREE.MathUtils.clamp(6.4 - ((event.clientY - rect.top) / rect.height) * 13, -6.3, -2.4);
        }}
        onPointerDown={() => {
          viewport.current?.focus();
          fire();
        }}
      >
        <Canvas camera={{ position: [0, 0, 18], fov: 48, near: 0.1, far: 80 }} dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <Scene
              audience={audience}
              running={phase === "running"}
              inputRef={inputRef}
              fireRef={fireRef}
              onHud={setHud}
              onFinish={() => setPhase("done")}
            />
          </Suspense>
        </Canvas>
        {phase === "intro" && (
          <div className={styles.overlay}>
            <div className={styles.card}>
              <span className={styles.eyebrow}>03 / YILDIZ SAVUNMASI</span>
              <h2>Sarı yıldızları vur. Diğer sembolleri bırak.</h2>
              <p>
                Semboller uzayın derinliğinden gemine doğru akacak. Gemiyi mouse veya
                ok/WASD tuşlarıyla hareket ettir; tıklayarak ya da Space ile ateş et.
              </p>
              <p className={styles.note}>
                {audience === "teen"
                  ? "Teen: daha hızlı akış, daha yoğun sembol trafiği."
                  : "Kids: kontrollü hız, daha geniş karar zamanı."}
              </p>
              <button
                onClick={() => {
                  setPhase("running");
                  viewport.current?.focus();
                }}
              >
                Göreve başla
              </button>
            </div>
          </div>
        )}
        {phase === "done" && (
          <div className={styles.overlay}>
            <div className={styles.card}>
              <span className={styles.eyebrow}>GÖREV TAMAMLANDI</span>
              <h2>{hud.score} puan</h2>
              <div className={styles.summary}>
                <span><b>{hud.hits}</b> yıldız</span>
                <span><b>{hud.wrong}</b> yanlış hedef</span>
                <span><b>{hud.missed}</b> kaçan yıldız</span>
              </div>
              <button onClick={() => window.location.reload()}>Yeniden oyna</button>
            </div>
          </div>
        )}
      </div>
      <footer className={styles.footer}>
        <span>Hedef: sarı yıldız ★</span>
        <span>Mouse / WASD / oklar · Ateş: tıkla veya Space</span>
      </footer>
    </section>
  );
}
