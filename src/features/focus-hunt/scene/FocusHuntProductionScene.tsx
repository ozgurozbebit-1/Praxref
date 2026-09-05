"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useGLTF } from "@react-three/drei";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import type {
  FocusHuntAudience,
  FocusHuntStimulus,
} from "@/features/focus-hunt";
import {
  PraxrefAtlasFallback,
  PraxrefAtlasShip,
  type ShipFlightRefs,
} from "./components/PraxrefAtlasShip";
import { preloadAtlasShip } from "./loaders/ship-loader";
import { levelChunks, shipFallbackEnabled, shipPosition } from "./scene-config";
import { VisualLabEnvironment, VisualLabExhaust } from "./VisualLabEnvironment";

preloadAtlasShip();
type Props = {
  visualLab?: boolean;
  audience: FocusHuntAudience;
  stimulus: FocusHuntStimulus | null;
  onTarget: () => void;
  onDistractor: () => void;
  reducedMotion?: boolean;
  remainingTime?: number;
  crystals?: number;
  score?: number;
};
class ShipBoundary extends Component<
  { children: ReactNode; flight: ShipFlightRefs },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed && shipFallbackEnabled ? (
      <PraxrefAtlasFallback flight={this.props.flight} />
    ) : (
      this.props.children
    );
  }
}
const bounds = { x: [-2.7, 2.7], y: [-2.05, 0.25], z: [0.35, 1.45] } as const;
const collideDistance = 0.78,
  collectDestination = new THREE.Vector3(0, -1.25, 0.72);
const slots: [number, number, number][] = [
  [-2.3, 1.25, -4],
  [2.15, 1.15, -4.45],
  [0, 0.1, -3.85],
  [2, -1.1, -4.1],
  [-2, -1.05, -4.55],
];
const star = new THREE.Shape();
for (let i = 0; i < 10; i += 1) {
  const r = i % 2 ? 0.44 : 1,
    a = Math.PI / 2 + (i * Math.PI) / 5,
    x = Math.cos(a) * r,
    y = Math.sin(a) * r;
  if (!i) star.moveTo(x, y);
  else star.lineTo(x, y);
}
star.closePath();
const items = [
  {
    color: "#2EA8FF",
    emissive: "#0077FF",
    position: [-2.05, 0.65, -3.8] as [number, number, number],
    kind: "star-blue",
    asset: "/assets/games/shapes/star-blue.png",
  },
  {
    color: "#18E3CF",
    emissive: "#00DCCB",
    position: [2.15, 0.55, -4.2] as [number, number, number],
    kind: "star-green",
    asset: "/assets/games/shapes/star-green.png",
  },
  {
    color: "#2EA8FF",
    emissive: "#0077FF",
    position: [-2.05, 0.65, -3.8] as [number, number, number],
    kind: "sphere",
    asset: "/assets/games/shapes/sphere-blue.png",
  },
  {
    color: "#A855F7",
    emissive: "#8B00FF",
    position: [2.15, 0.55, -4.2] as [number, number, number],
    kind: "diamond",
    asset: "/assets/games/shapes/diamond-purple.png",
  },
  {
    color: "#18E3CF",
    emissive: "#00DCCB",
    position: [-1.25, -1.2, -3.55] as [number, number, number],
    kind: "hexagon",
    asset: "/assets/games/shapes/crystal-turquoise.png",
  },
  {
    color: "#FF4DB8",
    emissive: "#FF008C",
    position: [2.2, -1.05, -3.7] as [number, number, number],
    kind: "triangle",
    asset: "/assets/games/shapes/triangle-pink.png",
  },
] as const;
const extrude = {
  depth: 0.16,
  bevelEnabled: true,
  bevelSize: 0.03,
  bevelThickness: 0.03,
};
const objectScale = 1.4;
const targetSpriteScale = 0.9;
const spawnLanes = [
  [-3.3, 1.75],
  [-1.7, 1.75],
  [0, 1.75],
  [1.7, 1.75],
  [3.3, 1.75],
  [-3.3, 0.5],
  [-1.7, 0.5],
  [0, 0.5],
  [1.7, 0.5],
  [3.3, 0.5],
  [-3.3, -0.75],
  [-1.7, -0.75],
  [0, -0.75],
  [1.7, -0.75],
  [3.3, -0.75],
  [-3.3, -1.75],
  [-1.7, -1.75],
  [0, -1.75],
  [1.7, -1.75],
  [3.3, -1.75],
  [-4.1, 1.1],
  [4.1, 1.1],
  [-4.1, -1.1],
  [4.1, -1.1],
  [-2.5, 2.25],
  [2.5, 2.25],
  [-2.5, -2.15],
  [2.5, -2.15],
] as const;
const createWave = () => {
  const requestedCount = 3 + Math.floor(Math.random() * 3);
  const candidates = [...spawnLanes].sort(() => Math.random() - 0.5);
  const selected: (typeof spawnLanes)[number][] = [];
  const maxAttempts = Math.min(28, candidates.length);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = candidates[attempt];
    const separated = selected.every(
      ([x, y]) =>
        Math.abs(candidate[0] - x) >= 4 || Math.abs(candidate[1] - y) >= 3,
    );
    if (separated) selected.push(candidate);
    if (selected.length === requestedCount) break;
  }
  return selected.map(
    ([x, y]) => [x, y, -4.6 - Math.random() * 2.8] as [number, number, number],
  );
};
function useApproach(
  ref: RefObject<THREE.Object3D | null>,
  ship: MutableRefObject<THREE.Vector3>,
  resolve: () => void,
  reduced: boolean,
  speed: number,
  spin = 1,
  motion = { x: 0.22, y: 0.38, z: 0.16, bob: 0.025, chase: false },
) {
  const hit = useRef(false);
  const elapsed = useRef(0);
  const baseY = useRef<number | null>(null);
  const baseX = useRef<number | null>(null);
  useFrame((_, d) => {
    if (!ref.current || hit.current) return;
    elapsed.current += d;
    if (baseY.current === null) baseY.current = ref.current.position.y;
    if (baseX.current === null) baseX.current = ref.current.position.x;
    ref.current.position.z += d * speed;
    if (!reduced) {
      ref.current.rotation.x += d * motion.x * spin;
      ref.current.rotation.y += d * motion.y * spin;
      ref.current.rotation.z += d * motion.z * spin;
      const frequency = motion.chase ? 0.9 : 0.7;
      const xAmplitude = motion.chase ? 0.45 : 0.035;
      const yAmplitude = motion.chase ? 0.28 : motion.bob;
      ref.current.position.y =
        baseY.current +
        Math.sin(elapsed.current * frequency * Math.PI * 2 + 0.6) * yAmplitude;
      ref.current.position.x =
        baseX.current +
        Math.cos(elapsed.current * frequency * Math.PI * 2 + 0.25) * xAmplitude;
    }
    if (ref.current.position.distanceTo(ship.current) <= collideDistance) {
      hit.current = true;
      resolve();
    }
  });
}
function Distractor({
  onHit,
  ship,
  reduced,
  ...item
}: (typeof items)[number] & {
  onHit: () => void;
  ship: MutableRefObject<THREE.Vector3>;
  reduced: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null),
    texture = useTexture(item.asset);
  const { scene } = useGLTF(item.asset.replace(".png", ".glb"));
  const model = useMemo(() => {
    if (
      ![
        "star-blue",
        "star-green",
        "sphere",
        "diamond",
        "hexagon",
        "triangle",
      ].includes(item.kind)
    )
      return null;
    const clone = scene.clone(true);
    const palette =
      item.kind === "star-blue" || item.kind === "sphere"
        ? { color: "#2EA8FF", emissive: "#0077FF" }
        : item.kind === "diamond"
          ? { color: "#A855F7", emissive: "#8B00FF" }
          : item.kind === "hexagon"
            ? { color: "#18E3CF", emissive: "#00DCCB" }
            : item.kind === "triangle"
              ? { color: "#FF4DB8", emissive: "#FF008C" }
              : { color: "#3DFF8A", emissive: "#00D968" };
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const source = Array.isArray(object.material)
        ? object.material[0]
        : object.material;
      const material = source.clone() as THREE.MeshStandardMaterial;
      material.color.set(palette.color);
      material.emissive.set(palette.emissive);
      material.emissiveIntensity = 2.2;
      material.toneMapped = false;
      object.material = material;
    });
    return clone;
  }, [item.kind, scene]);
  const motion =
    item.kind === "diamond"
      ? { x: 0.48, y: 0.62, z: 0.18, bob: 0.04, chase: false }
      : item.kind === "hexagon"
        ? { x: 0.32, y: 0.42, z: 0.24, bob: 0.035, chase: false }
        : item.kind === "triangle"
          ? { x: 0.18, y: 0.55, z: 0.5, bob: 0.045, chase: false }
          : { x: 0.2, y: 0.42, z: 0.3, bob: 0.03, chase: false };
  useApproach(
    ref,
    ship,
    onHit,
    reduced,
    0.78,
    item.kind === "sphere" ? 1.1 : 1.45,
    motion,
  );
  return (
    <mesh
      ref={ref}
      position={item.position}
      scale={objectScale}
      rotation={[0.18, -0.24, 0.1]}
    >
      {model ? (
        <primitive object={model} />
      ) : (
        <>
          <planeGeometry args={[0.7, 0.7]} />
          <meshBasicMaterial
            map={texture}
            transparent
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </>
      )}
    </mesh>
  );
}
function Collect({
  position,
  reduced,
}: {
  position: [number, number, number];
  reduced: boolean;
}) {
  const orb = useRef<THREE.Group>(null),
    plume = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (orb.current) {
      orb.current.position.lerp(collectDestination, Math.min(1, d * 3.4));
      orb.current.rotation.z += d * 2.4;
      orb.current.scale.setScalar(
        Math.max(0.05, orb.current.scale.x - d * 0.55),
      );
    }
    if (plume.current && !reduced) {
      plume.current.position.y += d * 1.2;
      plume.current.scale.multiplyScalar(1 - Math.min(0.45, d * 0.7));
    }
  });
  return (
    <>
      <group ref={orb} position={position}>
        <mesh scale={0.24}>
          <extrudeGeometry args={[star, extrude]} />
          <meshStandardMaterial
            color="#ffd34f"
            emissive="#ffb31f"
            emissiveIntensity={2.8}
            metalness={0.5}
            roughness={0.22}
          />
        </mesh>
      </group>
      <group ref={plume} position={position}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[(i - 3) * 0.055, i * 0.07, (i % 2) * 0.06]}>
            <sphereGeometry args={[0.035 + (i % 2) * 0.012, 8, 8]} />
            <meshBasicMaterial color="#ffca38" transparent opacity={0.86} />
          </mesh>
        ))}
      </group>
    </>
  );
}
function Targets({
  stimulus,
  onTarget,
  onDistractor,
  ship,
  reduced = false,
  onPickup,
}: {
  stimulus: FocusHuntStimulus | null;
  onTarget: () => void;
  onDistractor: () => void;
  ship: MutableRefObject<THREE.Vector3>;
  reduced?: boolean;
  onPickup: () => void;
}) {
  const [slot, setSlot] = useState(0),
    [collected, setCollected] = useState<[number, number, number] | null>(null),
    [wave, setWave] = useState(createWave),
    target = useRef<THREE.Group>(null),
    reticle = useRef<THREE.Mesh>(null),
    lockProgress = useRef(0),
    resolved = useRef(false);
  const { scene: goldStarScene } = useGLTF(
    "/assets/games/shapes/star-gold.glb",
  );
  const goldStarModel = useMemo(() => {
    const model = goldStarScene.clone(true);
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const source = Array.isArray(object.material)
        ? object.material[0]
        : object.material;
      const material = source.clone() as THREE.MeshStandardMaterial;
      material.color.set("#FFD84A");
      material.emissive.set("#FFB800");
      material.emissiveIntensity = 2.6;
      material.metalness = 0.35;
      material.roughness = 0.32;
      material.toneMapped = false;
      object.material = material;
    });
    return model;
  }, [goldStarScene]);
  useEffect(() => {
    setSlot((v) => (v + 1) % slots.length);
    setCollected(null);
    setWave(createWave());
    lockProgress.current = 0;
    resolved.current = false;
  }, [stimulus]);
  const good = () => {
      if (resolved.current || !target.current) return;
      resolved.current = true;
      setCollected(
        target.current.position.toArray() as [number, number, number],
      );
      onPickup();
      onTarget();
    },
    bad = () => {
      if (resolved.current) return;
      resolved.current = true;
      onDistractor();
    };
  useFrame((_, delta) => {
    if (!target.current || !stimulus?.isTarget || resolved.current) return;
    const offsetX = Math.abs(target.current.position.x - ship.current.x);
    const offsetY = Math.abs(target.current.position.y - ship.current.y);
    const forwardDistance = ship.current.z - target.current.position.z;
    const inLockCone =
      offsetX <= 1.1 &&
      offsetY <= 0.9 &&
      forwardDistance >= 1.4 &&
      forwardDistance <= 4.8;
    lockProgress.current = inLockCone
      ? Math.min(1, lockProgress.current + delta / 0.4)
      : 0;
    if (reticle.current) {
      reticle.current.visible = inLockCone;
      reticle.current.scale.setScalar(1 + lockProgress.current * 0.22);
      (reticle.current.material as THREE.MeshBasicMaterial).opacity =
        0.28 + lockProgress.current * 0.7;
    }
    if (lockProgress.current === 1) good();
  });
  useApproach(target, ship, good, reduced, 0.86, 0.48, {
    x: 0.08,
    y: 0.22,
    z: 0.04,
    bob: 0.018,
    chase: true,
  });
  if (!stimulus) return null;
  return (
    <>
      {stimulus.isTarget && !collected && (
        <group
          ref={target}
          position={slots[slot]}
          scale={targetSpriteScale}
          rotation={[0.08, -0.12, 0.04]}
          onPointerDown={(event) => {
            event.stopPropagation();
            good();
          }}
        >
          <primitive object={goldStarModel} />
          <mesh ref={reticle} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.72, 0.025, 8, 32]} />
            <meshBasicMaterial color="#63E7FF" transparent opacity={0.28} />
          </mesh>
        </group>
      )}
      {collected && <Collect position={collected} reduced={reduced} />}{" "}
      {wave.map((position, index) => (
        <Distractor
          key={`${stimulus.type}-${index}`}
          {...items[Math.abs(Math.floor(position[2] * 100)) % items.length]}
          position={position}
          onHit={bad}
          ship={ship}
          reduced={reduced}
        />
      ))}
    </>
  );
}
function LogoPickupOverlay({ pickupId }: { pickupId: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!pickupId) return;
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => setVisible(false), 1000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pickupId]);
  if (!pickupId) return null;
  const side = pickupId % 2 === 0 ? "right" : "left";
  return (
    <img
      key={pickupId}
      src="/assets/brand/logo/logo1.png"
      alt=""
      aria-hidden="true"
      style={{
        position: "absolute",
        [side]: "10%",
        top: "46%",
        width: 84,
        height: 84,
        objectFit: "contain",
        pointerEvents: "none",
        zIndex: 3,
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? "-22px" : "10px"}) scale(${visible ? 1 : 0.55})`,
        transition:
          "opacity 180ms ease, transform 180ms cubic-bezier(.2,.8,.2,1)",
      }}
    />
  );
}
function CameraRig({ ship }: { ship: MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  const targetCamera = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    targetCamera.current.set(ship.current.x * 0.16, ship.current.y + 2.4, 7.2);
    camera.position.lerp(targetCamera.current, 1 - Math.exp(-delta * 2.8));
    camera.lookAt(ship.current.x * 0.22, ship.current.y - 0.2, -3.5);
  });
  return null;
}

/**
 * Presentation-only depth layer. It deliberately owns no gameplay state: the
 * game engine remains the source of truth for each stimulus and response.
 */
function DeepSpace({ reduced }: { reduced: boolean }) {
  const near = useRef<THREE.Points>(null);
  const far = useRef<THREE.Points>(null);
  const nearPositions = useMemo(() => {
    const positions = new Float32Array(120 * 3);
    for (let index = 0; index < 120; index += 1) {
      const offset = index * 3;
      positions[offset] = (((index * 47) % 113) / 113) * 14 - 7;
      positions[offset + 1] = (((index * 71) % 97) / 97) * 8 - 4;
      positions[offset + 2] = -2 - (((index * 31) % 89) / 89) * 28;
    }
    return positions;
  }, []);
  const farPositions = useMemo(() => {
    const positions = new Float32Array(180 * 3);
    for (let index = 0; index < 180; index += 1) {
      const offset = index * 3;
      positions[offset] = (((index * 59) % 127) / 127) * 20 - 10;
      positions[offset + 1] = (((index * 83) % 101) / 101) * 12 - 6;
      positions[offset + 2] = -10 - (((index * 41) % 139) / 139) * 44;
    }
    return positions;
  }, []);
  useFrame((_, delta) => {
    if (!reduced && near.current) {
      near.current.position.z += delta * 1.8;
      if (near.current.position.z > 8) near.current.position.z = -8;
    }
    if (far.current) {
      far.current.position.z += delta * (reduced ? 0.08 : 0.3);
      if (far.current.position.z > 14) far.current.position.z = -14;
    }
  });
  return (
    <>
      <points ref={far}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[farPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#7899dc"
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </points>
      <points ref={near}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nearPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#9deeff"
          size={0.065}
          sizeAttenuation
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </points>
    </>
  );
}
function AsteroidCanyon() {
  const rocks = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (rocks.current) {
      rocks.current.position.z += delta * 1.1;
      if (rocks.current.position.z > 16) rocks.current.position.z = -12;
    }
  });
  return (
    <group ref={rocks} position={[0, 0, -12]}>
      {Array.from({ length: 72 }, (_, index) => {
        const layer = Math.floor(index / 9),
          angle = ((index * 137.5) % 360) * (Math.PI / 180),
          corridorRadius = 4.3 + (index % 4) * 0.8,
          depth = -layer * 4.1 - (index % 3) * 0.8,
          x = Math.cos(angle) * corridorRadius,
          y = Math.sin(angle) * corridorRadius * 0.72,
          scale = 0.38 + (index % 6) * 0.22;
        return (
          <mesh
            key={index}
            position={[x, y, depth]}
            rotation={[index * 0.21, index * 0.37, index * 0.13]}
            scale={[scale * 1.25, scale * 0.72, scale]}
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={index % 3 ? "#26384f" : "#343550"}
              emissive={index % 5 === 0 ? "#0b6477" : "#07121f"}
              emissiveIntensity={index % 5 === 0 ? 0.38 : 0.08}
              roughness={0.78}
              metalness={0.22}
            />
          </mesh>
        );
      })}
    </group>
  );
}
function EngineTrail({ ship }: { ship: MutableRefObject<THREE.Vector3> }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.set(
      ship.current.x,
      ship.current.y - 0.12,
      ship.current.z + 1.35,
    );
  });
  return (
    <group ref={group}>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh
          key={index}
          position={[((index % 3) - 1) * 0.12, 0, index * 0.24]}
          scale={[0.03, 0.03, 0.32]}
        >
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial
            color="#3be7ff"
            transparent
            opacity={0.8 - index * 0.05}
          />
        </mesh>
      ))}
    </group>
  );
}
export function FocusHuntProductionScene({
  visualLab = false,
  audience,
  stimulus,
  onTarget,
  onDistractor,
  reducedMotion,
}: Props) {
  const [rightHeld, setRightHeld] = useState(false),
    [pickupId, setPickupId] = useState(0),
    target = useRef(new THREE.Vector3(...shipPosition)),
    current = useRef(new THREE.Vector3(...shipPosition)),
    flight: ShipFlightRefs = {
      currentPosition: current,
      targetPosition: target,
    };
  useEffect(() => {
    const move = (e: PointerEvent) => {
        if (!rightHeld) return;
        target.current.x = THREE.MathUtils.clamp(
          target.current.x + e.movementX * 0.02,
          ...bounds.x,
        );
        target.current.y = THREE.MathUtils.clamp(
          target.current.y - e.movementY * 0.016,
          ...bounds.y,
        );
      },
      up = () => setRightHeld(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [rightHeld]);
  return (
    <div
      className="focus-3d-canvas"
      aria-label={`${audience === "kids" ? "Kids" : "Teen"} Praxref-Atlas görevi`}
    >
      <Canvas
        camera={{ position: [0, 1.15, 5.8], fov: 52 }}
        dpr={[1, 1.5]}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (e.button === 2) setRightHeld(true);
        }}
        onWheel={(e) => {
          target.current.z = THREE.MathUtils.clamp(
            target.current.z + e.deltaY * 0.0015,
            ...bounds.z,
          );
        }}
      >
        {!visualLab && (
          <>
            <color attach="background" args={["#101a38"]} />
            <ambientLight intensity={0.32} />
            <directionalLight
              position={[-4, 6, 3]}
              color="#b9dcff"
              intensity={1.4}
            />
            <pointLight
              position={[4, 1, -5]}
              color="#36dff5"
              intensity={1.8}
              distance={15}
            />
            <pointLight
              position={[-3, -1, -4]}
              color="#f39a5b"
              intensity={0.6}
              distance={10}
            />
            <fog attach="fog" args={["#101a38", 8, 36]} />
          </>
        )}
        <CameraRig ship={current} />
        <DeepSpace reduced={Boolean(reducedMotion)} />
        {visualLab ? (
          <VisualLabEnvironment reduced={Boolean(reducedMotion)} />
        ) : (
          <AsteroidCanyon />
        )}
        {visualLab ? (
          <VisualLabExhaust ship={current} />
        ) : (
          <EngineTrail ship={current} />
        )}
        <Suspense fallback={<PraxrefAtlasFallback flight={flight} />}>
          <ShipBoundary flight={flight}>
            <PraxrefAtlasShip flight={flight} />
          </ShipBoundary>
        </Suspense>
        {levelChunks.map((chunk, index) => (
          <group key={chunk} position={[0, 0, -index * 8]} />
        ))}
        <Targets
          stimulus={stimulus}
          onTarget={onTarget}
          onDistractor={onDistractor}
          onPickup={() => setPickupId((current) => current + 1)}
          ship={current}
          reduced={reducedMotion}
        />
      </Canvas>
      <LogoPickupOverlay pickupId={pickupId} />
    </div>
  );
}
