"use client";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import {
  shipFallbackEnabled,
  shipModelPath,
  shipPosition,
  shipRotation,
  shipScale,
} from "../scene-config";
export type ShipMaterialOverride = {
  cockpitTint?: THREE.ColorRepresentation;
  emissiveAccent?: THREE.ColorRepresentation;
  thrusterGlow?: THREE.ColorRepresentation;
};

export type ShipFlightRefs = {
  currentPosition: MutableRefObject<THREE.Vector3>;
  targetPosition: MutableRefObject<THREE.Vector3>;
};

function useFlightMotion(
  group: MutableRefObject<THREE.Group | null>,
  flight?: ShipFlightRefs,
) {
  useFrame((_, delta) => {
    if (!group.current) return;
    if (flight) {
      const smoothing = 1 - Math.exp(-delta * 10);
      group.current.position.lerp(flight.targetPosition.current, smoothing);
      flight.currentPosition.current.copy(group.current.position);
      const bank = THREE.MathUtils.clamp(
        (flight.targetPosition.current.x - group.current.position.x) * -0.11,
        -0.16,
        0.16,
      );
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        bank,
        smoothing,
      );
    }
    // Heading remains stable until the player supplies a new flight target.
  });
}

export function PraxrefAtlasFallback({ flight }: { flight?: ShipFlightRefs }) {
  const group = useRef<THREE.Group>(null);
  useFlightMotion(group, flight);

  return (
    <group ref={group} position={shipPosition}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.55, 1, 1.2]}>
        <capsuleGeometry args={[0.4, 1.3, 8, 16]} />
        <meshStandardMaterial
          color="#285b96"
          metalness={0.78}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.18, -0.4]} scale={[0.45, 0.22, 0.58]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#07172d" metalness={0.8} roughness={0.1} />
      </mesh>
      <pointLight
        position={[0, 0, 0.85]}
        color="#5ce9ef"
        intensity={2}
        distance={4}
      />
    </group>
  );
}
export function PraxrefAtlasShip({
  overrides = {},
  flight,
}: {
  overrides?: ShipMaterialOverride;
  flight?: ShipFlightRefs;
}) {
  const { scene } = useGLTF(shipModelPath),
    group = useRef<THREE.Group>(null);
  useFlightMotion(group, flight);
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.material) return;
    const material = object.material as THREE.MeshStandardMaterial;
    if (overrides.emissiveAccent && material.emissive)
      material.emissive.set(overrides.emissiveAccent);
  });
  return (
    <primitive
      ref={group}
      object={scene}
      position={shipPosition}
      rotation={shipRotation}
      scale={shipScale}
    />
  );
}
export const AtlasShipFallbackEnabled = shipFallbackEnabled;
