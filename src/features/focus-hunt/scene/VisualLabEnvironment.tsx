"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Fixed visual seed; never consume the engine's Math.random stream.
function makeRock(seed: number) {
  const geometry = new THREE.IcosahedronGeometry(1, 3);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const normal = new THREE.Vector3();
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    normal.fromBufferAttribute(positions, i).normalize();
    const { x, y, z } = normal;
    const strata = Math.sin(x * 13 + y * 8 + seed) * Math.cos(z * 11 - seed);
    const crater = Math.exp(
      -((x - 0.4) ** 2 + (y - 0.5) ** 2 + (z - 0.6) ** 2) * 18,
    );
    const radius =
      0.9 + 0.13 * strata + 0.12 * Math.sin(y * 5 + seed) - crater * 0.3;
    positions.setXYZ(
      i,
      x * radius * (1 + seed * 0.07),
      y * radius * 0.78,
      z * radius,
    );
    color.setRGB(
      0.13 + strata * 0.025,
      0.16 + strata * 0.025,
      0.21 + strata * 0.03,
    );
    colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function RockLayer({ layer, reduced }: { layer: number; reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const resources = useMemo(
    () => ({
      geometry: makeRock(layer + 1),
      material: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92,
        metalness: 0.08,
        color: layer === 2 ? "#73849d" : "#ffffff",
      }),
      transform: new THREE.Object3D(),
    }),
    [layer],
  );
  const elapsed = useRef(0);
  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.material.dispose();
    },
    [resources],
  );
  useFrame((_, delta) => {
    if (!mesh.current) return;
    elapsed.current += reduced ? 0 : delta * [1.7, 0.8, 0.28][layer];
    for (let i = 0; i < 28; i++) {
      const angle = i * 2.399963 + layer;
      const z = -48 + ((i * 1.91 + elapsed.current) % 48);
      // Keep the projected central passage clear even at distant depths.
      const radius = (4.8 + (i % 4) * 0.7) * (1 + -z / 18);
      resources.transform.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.8,
        z - layer * 6,
      );
      resources.transform.rotation.set(i * 0.73, i * 0.39, i * 0.51);
      const size = (0.55 + (i % 5) * 0.23) * (1 + -z / 22);
      resources.transform.scale.set(size, size * (0.65 + (i % 3) * 0.2), size);
      resources.transform.updateMatrix();
      mesh.current.setMatrixAt(i, resources.transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[resources.geometry, resources.material, 28]}
      frustumCulled={false}
      raycast={() => {}}
    />
  );
}

export function VisualLabEnvironment({ reduced }: { reduced: boolean }) {
  return (
    <>
      <color attach="background" args={["#070d1b"]} />
      <fog attach="fog" args={["#101b30", 13, 60]} />
      <hemisphereLight args={["#8fa9c9", "#121520", 0.75]} />
      <directionalLight position={[-7, 8, 4]} color="#ffcf9f" intensity={2.3} />
      <directionalLight position={[5, 2, -6]} color="#71c5e5" intensity={1.3} />
      <directionalLight
        position={[0, -3, 4]}
        color="#718caf"
        intensity={0.35}
      />
      {[0, 1, 2].map((layer) => (
        <RockLayer key={layer} layer={layer} reduced={reduced} />
      ))}
    </>
  );
}

export function VisualLabExhaust({
  ship,
}: {
  ship: MutableRefObject<THREE.Vector3>;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current)
      group.current.position.set(
        ship.current.x,
        ship.current.y - 0.12,
        ship.current.z + 1.35,
      );
  });
  return (
    <group ref={group} raycast={() => {}}>
      {[-0.14, 0.14].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh
              key={i}
              position={[0, 0, i * 0.1]}
              scale={[0.065 + i * 0.009, 0.045 + i * 0.006, 0.27]}
              raycast={() => {}}
            >
              <sphereGeometry args={[1, 10, 8]} />
              <meshBasicMaterial
                color={i < 2 ? "#bbf3ff" : "#29aacc"}
                transparent
                opacity={0.32 * (1 - i / 9) ** 2}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
