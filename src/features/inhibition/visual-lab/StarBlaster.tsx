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
type Blast = {
  id: number;
  x: number;
  y: number;
  age: number;
  correct: boolean;
};

const SHIP = "/assets/3d/ships/praxref-atlas.glb";

function cloneNormalized(scene: THREE.Group, size: number) {
  const model = scene.clone(true);
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    const material = Array.isArray(object.material)
      ? object.material.map((m) => m.clone())
      : object.material.clone();
    object.material = material;
    (Array.isArray(material) ? material : [material]).forEach((m) => {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.metalness = 0.56;
        m.roughness = 0.28;
        m.envMapIntensity = 1.15;
      }
    });
  });
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const dims = box.getSize(new THREE.Vector3());
  model.position.sub(center);
  const wrapper = new THREE.Group();
  wrapper.add(model);
  wrapper.scale.setScalar(size / Math.max(dims.x, dims.y, dims.z, 0.001));
  return wrapper;
}

function Starfield() {
  const near = useMemo(() => {
    const data = new Float32Array(1100 * 3);
    for (let i = 0; i < 1100; i++) {
      data[i * 3] = (Math.random() - 0.5) * 44;
      data[i * 3 + 1] = (Math.random() - 0.5) * 31;
      data[i * 3 + 2] = -2 - Math.random() * 18;
    }
    return data;
  }, []);
  const far = useMemo(() => {
    const data = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      data[i * 3] = (Math.random() - 0.5) * 58;
      data[i * 3 + 1] = (Math.random() - 0.5) * 40;
      data[i * 3 + 2] = -18 - Math.random() * 26;
    }
    return data;
  }, []);
  return (
    <>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[near, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#dff6ff" size={0.052} sizeAttenuation />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[far, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#7fb7ff" size={0.032} sizeAttenuation transparent opacity={0.75} />
      </points>
    </>
  );
}

function Nebula() {
  return (
    <group position={[0, 1.6, -18]}>
      <mesh rotation={[0, 0, -0.25]} scale={[1.45, 0.55, 1]}>
        <circleGeometry args={[7.8, 64]} />
        <meshBasicMaterial color="#173b8f" transparent opacity={0.17} depthWrite={false} />
      </mesh>
      <mesh position={[3.8, 1.3, -1]} rotation={[0, 0, 0.3]} scale={[0.95, 0.42, 1]}>
        <circleGeometry args={[6.5, 64]} />
        <meshBasicMaterial color="#6a2da8" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh position={[-5, -1.5, -2]} rotation={[0, 0, 0.15]} scale={[0.9, 0.32, 1]}>
        <circleGeometry args={[6, 64]} />
        <meshBasicMaterial color="#0e8eaa" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

function NeonMaterial({ color, target = false }: { color: string; target?: boolean }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={target ? 2.4 : 1.25}
      metalness={0.18}
      roughness={0.18}
      toneMapped={false}
    />
  );
}

function SymbolMesh({ kind }: { kind: SymbolKind }) {
  if (kind === "target")
    return (
      <group>
        <mesh>
          <icosahedronGeometry args={[0.92, 0]} />
          <NeonMaterial color="#ffc928" target />
        </mesh>
        <mesh scale={1.22}>
          <torusGeometry args={[0.72, 0.055, 10, 40]} />
          <meshBasicMaterial color="#fff2a4" transparent opacity={0.65} toneMapped={false} />
        </mesh>
      </group>
    );
  if (kind === "circle")
    return (
      <group>
        <mesh>
          <torusGeometry args={[0.72, 0.16, 12, 36]} />
          <NeonMaterial color="#35e77b" />
        </mesh>
        <mesh scale={1.18}>
          <torusGeometry args={[0.74, 0.035, 8, 36]} />
          <meshBasicMaterial color="#b5ffd0" transparent opacity={0.45} toneMapped={false} />
        </mesh>
      </group>
    );
  if (kind === "triangle")
    return (
      <group>
        <mesh>
          <coneGeometry args={[0.86, 1.05, 3]} />
          <NeonMaterial color="#24b9ff" />
        </mesh>
        <mesh scale={1.18}>
          <coneGeometry args={[0.86, 1.05, 3]} />
          <meshBasicMaterial wireframe color="#b9eaff" transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </group>
    );
  if (kind === "diamond")
    return (
      <group>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1.05, 1.05, 0.32]} />
          <NeonMaterial color="#ff4a63" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]} scale={1.16}>
          <boxGeometry args={[1.05, 1.05, 0.34]} />
          <meshBasicMaterial wireframe color="#ffb0bb" transparent opacity={0.62} toneMapped={false} />
        </mesh>
      </group>
    );
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.8, 0.8, 0.34, 6]} />
        <NeonMaterial color="#a85cff" />
      </mesh>
      <mesh scale={1.18}>
        <cylinderGeometry args={[0.8, 0.8, 0.36, 6]} />
        <meshBasicMaterial wireframe color="#e1c5ff" transparent opacity={0.62} toneMapped={false} />
      </mesh>
    </group>
  );
}

function BlastFx({ blast }: { blast: Blast }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    blast.age += delta;
    ref.current.scale.setScalar(0.6 + blast.age * 2.4);
    ref.current.rotation.z += delta * 1.7;
    ref.current.children.forEach((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = child.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - blast.age / 0.55);
    });
  });
  const color = blast.correct ? "#ffd63a" : "#ff5366";
  return (
    <group ref={ref} position={[blast.x, blast.y, 0.4]}>
      <mesh>
        <ringGeometry args={[0.18, 0.5, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 10) * Math.PI * 2) * 0.52,
            Math.sin((i / 10) * Math.PI * 2) * 0.52,
            0,
          ]}
          scale={[0.08, 0.22, 0.08]}
          rotation={[0, 0, (i / 10) * Math.PI * 2]}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
      <pointLight color={color} intensity={7} distance={4} />
    </group>
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
  inputRef: RefObject<{
    x: number;
    y: number;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  }>;
  fireRef: RefObject<number>;
  onHud: (data: {
    score: number;
    hits: number;
    wrong: number;
    missed: number;
    combo: number;
    remaining: number;
  }) => void;
  onFinish: () => void;
}) {
  const shipAsset = useGLTF(SHIP);
  const shipModel = useMemo(() => cloneNormalized(shipAsset.scene, 2.8), [shipAsset]);
  const ship = useRef<THREE.Group>(null);
  const enemyRefs = useRef<Map<number, THREE.Group>>(new Map());
  const shotRefs = useRef<Map<number, THREE.Group>>(new Map());
  const state = useRef({
    startedAt: 0,
    lastSpawn: 0,
    lastShotSignal: 0,
    nextId: 1,
    enemies: [] as Enemy[],
    shots: [] as Shot[],
    blasts: [] as Blast[],
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
      onHud({
        score: s.score,
        hits: s.hits,
        wrong: s.wrong,
        missed: s.missed,
        combo: s.combo,
        remaining: 0,
      });
      onFinish();
      return;
    }

    const input = inputRef.current;
    const speed = audience === "teen" ? 8.8 : 7.6;
    if (input.left) input.x -= speed * delta;
    if (input.right) input.x += speed * delta;
    if (input.up) input.y += speed * delta;
    if (input.down) input.y -= speed * delta;
    input.x = THREE.MathUtils.clamp(input.x, -7.1, 7.1);
    input.y = THREE.MathUtils.clamp(input.y, -6.1, -2.1);

    if (ship.current) {
      ship.current.position.lerp(
        new THREE.Vector3(input.x, input.y, 0),
        1 - Math.exp(-delta * 14),
      );
      ship.current.rotation.z = THREE.MathUtils.lerp(
        ship.current.rotation.z,
        -(input.x - ship.current.position.x) * 0.055,
        0.14,
      );
    }

    const spawnEvery = audience === "teen" ? 0.26 : 0.4;
    if (now - s.lastSpawn >= spawnEvery) {
      s.lastSpawn = now;
      const kinds: SymbolKind[] = ["circle", "triangle", "diamond", "hex"];
      const kind: SymbolKind =
        Math.random() < (audience === "teen" ? 0.31 : 0.36)
          ? "target"
          : kinds[Math.floor(Math.random() * kinds.length)];
      s.enemies.push({
        id: s.nextId++,
        kind,
        x: (Math.random() - 0.5) * 13.8,
        y: 9.4 + Math.random() * 2.3,
        z: -0.4 - Math.random() * 1.6,
        vx: (Math.random() - 0.5) * (audience === "teen" ? 3.2 : 2.2),
        vy: -(audience === "teen" ? 4.5 + Math.random() * 1.5 : 3.35 + Math.random() * 1.15),
        spin: (Math.random() - 0.5) * 2.6,
        scale: 0.82 + Math.random() * 0.32,
      });
    }

    if (fireRef.current !== s.lastShotSignal) {
      s.lastShotSignal = fireRef.current;
      s.shots.push({
        id: s.nextId++,
        x: input.x,
        y: input.y + 1.0,
        z: 0.25,
        vy: 15.8,
      });
    }

    for (const shot of s.shots) shot.y += shot.vy * delta;

    for (const enemy of s.enemies) {
      enemy.x += enemy.vx * delta;
      enemy.y += enemy.vy * delta;
      if (Math.abs(enemy.x) > 7.4) enemy.vx *= -1;
      const ref = enemyRefs.current.get(enemy.id);
      if (ref) {
        ref.position.set(enemy.x, enemy.y, enemy.z);
        ref.rotation.y += enemy.spin * delta;
        ref.rotation.z += enemy.spin * delta * 0.28;
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
        const dx = shot.x - enemy.x;
        const dy = shot.y - enemy.y;
        if (dx * dx + dy * dy < 0.78 * 0.78) {
          deadShots.add(shot.id);
          deadEnemies.add(enemy.id);
          const correct = enemy.kind === "target";
          s.blasts.push({
            id: s.nextId++,
            x: enemy.x,
            y: enemy.y,
            age: 0,
            correct,
          });
          if (correct) {
            s.hits++;
            s.combo++;
            s.score += 12 + Math.min(24, s.combo * 2);
          } else {
            s.wrong++;
            s.combo = 0;
            s.score = Math.max(0, s.score - 7);
          }
          break;
        }
      }
    }

    for (const enemy of s.enemies) {
      if (enemy.y < -7.4) {
        deadEnemies.add(enemy.id);
        if (enemy.kind === "target") {
          s.missed++;
          s.combo = 0;
          s.score = Math.max(0, s.score - 2);
        }
      }
    }

    s.shots = s.shots.filter(
      (shot) => shot.y < 10.8 && !deadShots.has(shot.id),
    );
    s.enemies = s.enemies.filter((enemy) => !deadEnemies.has(enemy.id));
    s.blasts = s.blasts.filter((blast) => blast.age < 0.58);

    if (now >= s.hudAt) {
      s.hudAt = now + 0.08;
      onHud({
        score: s.score,
        hits: s.hits,
        wrong: s.wrong,
        missed: s.missed,
        combo: s.combo,
        remaining,
      });
    }
  });

  return (
    <>
      <color attach="background" args={["#02040d"]} />
      <fog attach="fog" args={["#02040d", 22, 52]} />
      <ambientLight intensity={0.75} color="#9fc8ff" />
      <directionalLight position={[6, 10, 8]} intensity={2.4} color="#dcecff" />
      <pointLight position={[-7, 4, -8]} intensity={6} color="#335cff" distance={18} />
      <pointLight position={[8, 0, -10]} intensity={5} color="#9b45ff" distance={18} />
      <Starfield />
      <Nebula />

      <group ref={ship} position={[0, -5.1, 0]}>
        <primitive object={shipModel} dispose={null} />
        <pointLight position={[0, -0.3, 0.5]} color="#53e8ff" intensity={8} distance={6} />
        <mesh position={[-0.42, -0.12, 1.3]} scale={[0.11, 0.08, 0.85]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color="#53e8ff" transparent opacity={0.72} toneMapped={false} />
        </mesh>
        <mesh position={[0.42, -0.12, 1.3]} scale={[0.11, 0.08, 0.85]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color="#53e8ff" transparent opacity={0.72} toneMapped={false} />
        </mesh>
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
          <SymbolMesh kind={enemy.kind} />
        </group>
      ))}

      {state.current.shots.map((shot) => (
        <group
          key={shot.id}
          ref={(node) => {
            if (node) shotRefs.current.set(shot.id, node);
            else shotRefs.current.delete(shot.id);
          }}
        >
          <mesh scale={[0.12, 0.85, 0.12]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshBasicMaterial color="#ff4b5f" toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.72, 0]} scale={[0.05, 0.7, 0.05]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#ff9fa9" transparent opacity={0.5} toneMapped={false} />
          </mesh>
          <pointLight color="#ff5366" intensity={5} distance={2.8} />
        </group>
      ))}

      {state.current.blasts.map((blast) => (
        <BlastFx key={blast.id} blast={blast} />
      ))}
    </>
  );
}

export function StarBlaster({
  audience,
  development = true,
}: {
  audience: InhibitionAudience;
  development?: boolean;
}) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [hud, setHud] = useState({
    score: 0,
    hits: 0,
    wrong: 0,
    missed: 0,
    combo: 0,
    remaining: audience === "teen" ? 55 : 60,
  });
  const inputRef = useRef({
    x: 0,
    y: -5.1,
    left: false,
    right: false,
    up: false,
    down: false,
  });
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
          <Link href={development ? `/play/${audience}/inhibition` : `/play/${audience}`}>
            Çıkış ↗
          </Link>
        </div>
      </header>

      <div
        ref={viewport}
        className={styles.viewport}
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
              " ",
            ].includes(key)
          )
            event.preventDefault();
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
          inputRef.current.x =
            (((event.clientX - rect.left) / rect.width) * 2 - 1) * 7.1;
          inputRef.current.y = THREE.MathUtils.clamp(
            6.4 - ((event.clientY - rect.top) / rect.height) * 13,
            -6.1,
            -2.1,
          );
        }}
        onPointerDown={() => {
          viewport.current?.focus();
          fire();
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 18], fov: 47, near: 0.1, far: 90 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
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
                Semboller uzayın derinliğinden gemine doğru akacak. Gemiyi mouse
                veya ok/WASD tuşlarıyla hareket ettir; tıklayarak ya da Space ile
                ateş et.
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
                <span>
                  <b>{hud.hits}</b> yıldız
                </span>
                <span>
                  <b>{hud.wrong}</b> yanlış hedef
                </span>
                <span>
                  <b>{hud.missed}</b> kaçan yıldız
                </span>
              </div>
              <button onClick={() => window.location.reload()}>
                Yeniden oyna
              </button>
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
