"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { FocusHuntStimulus } from "@/features/focus-hunt";
type Props = {
  stimulus: FocusHuntStimulus | null;
  onTarget: () => void;
  onDistractor: () => void;
  reducedMotion?: boolean;
};
function Ship() {
  const group = useRef<THREE.Group>(null),
    left = useRef<THREE.Mesh>(null),
    right = useRef<THREE.Mesh>(null);
  useFrame(({ pointer }, d) => {
    if (!group.current) return;
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      pointer.x * 2.05,
      0.045,
    );
    group.current.position.y = THREE.MathUtils.lerp(
      group.current.position.y,
      pointer.y * 0.55 - 1.35,
      0.045,
    );
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      -pointer.x * 0.17,
      0.045,
    );
    group.current.position.y += Math.sin(performance.now() / 900) * d * 0.035;
    if (left.current) left.current.rotation.y += d * 0.8;
    if (right.current) right.current.rotation.y += d * 0.8;
  });
  const hull = (
      <meshStandardMaterial color="#285b96" metalness={0.78} roughness={0.24} />
    ),
    cyan = (
      <meshStandardMaterial
        color="#7cf1f5"
        emissive="#22bed8"
        emissiveIntensity={2.05}
        metalness={0.3}
      />
    );
  return (
    <group ref={group} position={[0, -1.35, 1.2]} rotation={[0, 0, 0]}>
      <directionalLight
        position={[-3, 4, 2]}
        color="#94d7ff"
        intensity={1.45}
      />
      <pointLight
        position={[0, 0.8, -1]}
        color="#51dbe8"
        intensity={1.6}
        distance={5}
      />
      {/* replaceable Atlas model slot: procedural meshes below can be swapped for GLB */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.7, 1, 1.45]}>
        {<capsuleGeometry args={[0.42, 1.55, 8, 16]} />} {hull}
      </mesh>
      <mesh
        position={[0, 0.24, -0.52]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.54, 0.3, 0.72]}
      >
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial
          color="#07172d"
          metalness={0.7}
          roughness={0.14}
        />
      </mesh>
      <mesh
        position={[-0.74, -0.03, 0.16]}
        rotation={[0, 0.04, -0.18]}
        scale={[1.1, 0.08, 0.52]}
      >
        <boxGeometry args={[1, 1, 1]} />
        {hull}
      </mesh>
      <mesh
        position={[0.74, -0.03, 0.16]}
        rotation={[0, -0.04, 0.18]}
        scale={[1.1, 0.08, 0.52]}
      >
        <boxGeometry args={[1, 1, 1]} />
        {hull}
      </mesh>
      <mesh position={[0, 0.04, 0.82]} scale={[0.58, 0.38, 0.35]}>
        <boxGeometry args={[1, 1, 1]} />
        {hull}
      </mesh>
      <mesh position={[-0.34, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.07, 10, 20]} />
        {cyan}
      </mesh>
      <mesh position={[0.34, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.07, 10, 20]} />
        {cyan}
      </mesh>
      <mesh
        ref={left}
        position={[-0.34, 0, 1.13]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.1, 16]} />
        {cyan}
      </mesh>
      <mesh
        ref={right}
        position={[0.34, 0, 1.13]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.1, 16]} />
        {cyan}
      </mesh>
      <mesh
        position={[0, 0.52, 0.55]}
        rotation={[0, 0, 0]}
        scale={[0.13, 0.36, 0.4]}
      >
        <boxGeometry args={[1, 1, 1]} />
        {hull}
      </mesh>
      <mesh position={[0, 0.02, -0.05]} scale={[0.08, 0.06, 1.3]}>
        <boxGeometry args={[1, 1, 1]} />
        {cyan}
      </mesh>
      <mesh position={[-0.57, 0.01, 0.25]} scale={[0.42, 0.035, 0.06]}>
        <boxGeometry args={[1, 1, 1]} />
        {cyan}
      </mesh>
      <mesh position={[0.57, 0.01, 0.25]} scale={[0.42, 0.035, 0.06]}>
        <boxGeometry args={[1, 1, 1]} />
        {cyan}
      </mesh>
      <pointLight
        position={[0, 0, 1.15]}
        color="#64eaff"
        intensity={3}
        distance={4}
      />
    </group>
  );
}
function Asteroids() {
  const objects = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        p: [((i * 37) % 12) - 6, ((i * 19) % 8) - 4, -4 - ((i * 13) % 28)] as [
          number,
          number,
          number,
        ],
        s: 0.18 + (i % 5) * 0.11,
        r: (i % 7) * 0.2,
      })),
    [],
  );
  return (
    <>
      {objects.map((item, i) => (
        <Asteroid key={i} {...item} />
      ))}
    </>
  );
}
function Asteroid({
  p,
  s,
  r,
}: {
  p: [number, number, number];
  s: number;
  r: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const tint = ["#76656a", "#5d6473", "#806a5d", "#535c6b"][
    Math.round((s * 100) % 4)
  ];
  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.position.z += d * (1.3 + s);
    ref.current.rotation.x += d * r;
    ref.current.rotation.y += d * (r + 0.2);
    if (ref.current.position.z > 3) ref.current.position.z = -30;
  });
  return (
    <mesh ref={ref} position={p} scale={s}>
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={tint} roughness={0.82} metalness={0.08} />
    </mesh>
  );
}
function EnvironmentSegment() {
  const gate = useRef<THREE.Group>(null),
    planet = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (gate.current) {
      gate.current.position.z += delta * 0.7;
      if (gate.current.position.z > 3) gate.current.position.z = -24;
    }
    if (planet.current) planet.current.rotation.y += delta * 0.03;
  });
  return (
    <>
      <mesh ref={planet} position={[-6, 3.5, -18]}>
        <sphereGeometry args={[3.3, 24, 20]} />
        <meshStandardMaterial
          color="#26356c"
          emissive="#202449"
          emissiveIntensity={0.35}
          roughness={0.78}
        />
      </mesh>
      <mesh position={[3.8, -2.5, -13]} scale={[3.5, 2.1, 0.45]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshBasicMaterial color="#4c3177" transparent opacity={0.13} />
      </mesh>
      <group ref={gate} position={[0, 0, -18]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.8, 0.07, 10, 40]} />
          <meshStandardMaterial
            color="#47cbd6"
            emissive="#16899a"
            emissiveIntensity={1.1}
          />
        </mesh>
        <pointLight color="#49d8e5" intensity={1.2} distance={7} />
      </group>
      <mesh position={[-4.2, 0.6, -10]} scale={[2.2, 3.8, 1.4]}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#4c424e" roughness={0.9} />
      </mesh>
      <mesh position={[4.5, 1.2, -12]} scale={[1.8, 3.2, 1.1]}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#514553" roughness={0.9} />
      </mesh>
    </>
  );
}
function AsteroidCanyon() {
  const walls = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        side: index % 2 ? 1 : -1,
        z: -4 - Math.floor(index / 2) * 3.2,
        y: ((index * 7) % 6) - 2.4,
        scale: 1.1 + (index % 4) * 0.42,
      })),
    [],
  );
  const beacons = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        x: index % 2 ? 1.65 : -1.65,
        z: -3 - index * 2.4,
      })),
    [],
  );
  return (
    <>
      <group>
        {walls.map((wall, index) => (
          <CanyonRock key={index} {...wall} />
        ))}
      </group>
      {beacons.map((beacon, index) => (
        <mesh key={index} position={[beacon.x, -1.65, beacon.z]}>
          <cylinderGeometry args={[0.035, 0.07, 0.7, 8]} />
          <meshStandardMaterial
            color="#5ae7e6"
            emissive="#1ca9b3"
            emissiveIntensity={1.25}
          />
        </mesh>
      ))}
    </>
  );
}
function CanyonRock({
  side,
  z,
  y,
  scale,
}: {
  side: number;
  z: number;
  y: number;
  scale: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.z += delta * (0.75 + scale * 0.08);
    if (ref.current.position.z > 3) ref.current.position.z = -32;
  });
  return (
    <mesh
      ref={ref}
      position={[side * (3.5 + (scale % 1)), y, z]}
      rotation={[0.2 * side, 0.35, 0.1]}
      scale={[scale, scale * 1.35, scale * 0.85]}
    >
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={side > 0 ? "#635768" : "#556274"}
        roughness={0.86}
        metalness={0.06}
      />
    </mesh>
  );
}
const positions: [
  [number, number, number],
  [number, number, number],
  [number, number, number],
  [number, number, number],
  [number, number, number],
] = [
  [-2.4, 1.4, -2],
  [2.3, 1.3, -3],
  [0, 0.15, -2.5],
  [2, -1.2, -2.3],
  [-2, -1.1, -3.2],
];
function Target({
  hit,
  onHit,
  position,
}: {
  hit: boolean;
  onHit: () => void;
  position: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.rotation.y += d;
    ref.current.position.z += d * (hit ? 8 : 0.32);
    if (!hit)
      ref.current.scale.setScalar(
        1 + Math.sin(performance.now() / 230) * 0.045,
      );
    if (hit)
      ref.current.scale.setScalar(
        Math.max(0.01, ref.current.scale.x - d * 0.9),
      );
  });
  return (
    <mesh ref={ref} position={position} onClick={onHit}>
      <dodecahedronGeometry args={[0.48, 0]} />
      <meshStandardMaterial
        color="#ffc54d"
        emissive="#ffab29"
        emissiveIntensity={2.2}
        metalness={0.45}
      />
    </mesh>
  );
}
function Distractor({
  index,
  onClick,
}: {
  index: number;
  onClick: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null),
    position = positions[(index + 2) % positions.length];
  useFrame((_, d) => {
    if (ref.current) {
      ref.current.rotation.x += d * 0.45;
      ref.current.position.z += d * 0.2;
      if (ref.current.position.z > 2) ref.current.position.z = -3.5;
    }
  });
  const color = ["#4fa9ff", "#b878ff", "#43e5d1", "#ff7a9d", "#6e8cff"][
    index % 5
  ];
  return (
    <mesh ref={ref} position={position} onClick={onClick}>
      <icosahedronGeometry args={[0.38 + (index % 2) * 0.09, index % 3]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}
function Scene({ stimulus, onTarget, onDistractor, reducedMotion }: Props) {
  const [hit, setHit] = useState(false),
    [slot, setSlot] = useState(0);
  useEffect(() => {
    setHit(false);
    setSlot((value) => (value + 1) % positions.length);
  }, [stimulus]);
  const distractors = stimulus
    ? stimulus.isTarget
      ? 1 + (slot % 2)
      : 2 + (slot % 2)
    : 0;
  return (
    <>
      <color attach="background" args={["#101a38"]} />
      <ambientLight intensity={0.72} color="#8da6d5" />
      <directionalLight position={[3, 5, 2]} color="#b5d9ff" intensity={1.7} />
      <pointLight
        position={[-4, 2, -6]}
        color="#8057b8"
        intensity={1.4}
        distance={16}
      />
      <pointLight
        position={[4, -1, -4]}
        color="#d58c5c"
        intensity={0.65}
        distance={12}
      />
      <Stars
        radius={60}
        depth={35}
        count={reducedMotion ? 500 : 1400}
        factor={3}
        saturation={0.4}
        fade
        speed={reducedMotion ? 0 : 1.2}
      />
      <fog attach="fog" args={["#101a38", 7, 40]} />
      <EnvironmentSegment />
      <AsteroidCanyon />
      <Asteroids />
      <Ship />
      {stimulus?.isTarget && (
        <Target
          position={positions[slot]}
          hit={hit}
          onHit={() => {
            setHit(true);
            onTarget();
          }}
        />
      )}
      {stimulus &&
        Array.from({ length: distractors }, (_, index) => (
          <Distractor
            key={`${stimulus.type}-${index}`}
            index={index}
            onClick={onDistractor}
          />
        ))}
    </>
  );
}
export function FocusHuntSpaceScene(props: Props) {
  return (
    <div className="focus-3d-canvas">
      <Canvas camera={{ position: [0, 1.2, 5], fov: 55 }} dpr={[1, 1.5]}>
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
