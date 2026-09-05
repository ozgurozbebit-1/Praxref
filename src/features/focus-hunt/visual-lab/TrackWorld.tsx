"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  COURSE,
  COURSE_SECTIONS,
  deckHeight,
  trackPoint,
  visualRandom,
} from "./course";

function roadGeometry(
  start: number,
  end: number,
  left: number,
  right: number,
  lift = 0,
) {
  const vertices: number[] = [];
  for (let s = start; s < end; s++) {
    if (deckHeight(s + 0.5) < 0) continue;
    const a = trackPoint(s, left),
      b = trackPoint(s, right);
    const c = trackPoint(s + 1, left),
      d = trackPoint(s + 1, right);
    // At a take-off edge, end the surface at the crest rather than the void.
    if (c.y < 0) c.y = a.y;
    if (d.y < 0) d.y = b.y;
    for (const p of [a, b, c, b, d, c]) vertices.push(p.x, p.y + lift, p.z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

/** Reusable continuous ribbon segment: its physics surface comes from course.ts. */
function TrackSegment({ index }: { index: number }) {
  const geometry = useMemo(
    () => [
      roadGeometry(index * 108, (index + 1) * 108, -4.2, 4.2),
      roadGeometry(index * 108, (index + 1) * 108, -4.2, -3.85, 0.045),
      roadGeometry(index * 108, (index + 1) * 108, 3.85, 4.2, 0.045),
    ],
    [index],
  );
  useEffect(() => () => geometry.forEach((g) => g.dispose()), [geometry]);
  return (
    <group>
      <mesh geometry={geometry[0]} receiveShadow>
        <meshStandardMaterial
          color={index % 2 ? "#30607d" : "#274e6b"}
          roughness={0.72}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      {geometry.slice(1).map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial
            color="#f0c278"
            emissive="#f4a12a"
            emissiveIntensity={0.12}
            roughness={0.45}
          />
        </mesh>
      ))}
      {[18, 54, 90].map((offset) => {
        const p = trackPoint(index * 108 + offset);
        if (p.y < 0) return null;
        return (
          <group
            key={offset}
            position={[p.x, 0, p.z]}
            rotation={[0, -p.yaw, 0]}
          >
            <mesh position={[0, p.y - 0.48, 0]} castShadow receiveShadow>
              <boxGeometry args={[8.6, 0.8, 1]} />
              <meshStandardMaterial color="#c3d3d8" roughness={0.8} />
            </mesh>
            {[-3.2, 3.2].map((x) => (
              <mesh key={x} position={[x, p.y / 2 - 0.4, 0]}>
                <cylinderGeometry args={[0.4, 0.7, p.y, 6]} />
                <meshStandardMaterial color="#d4b78f" roughness={0.85} />
              </mesh>
            ))}
          </group>
        );
      })}
      {[12, 32, 52, 72, 92].map((offset) => {
        const p = trackPoint(index * 108 + offset);
        return p.y < 0 ? null : (
          <mesh
            key={offset}
            position={[p.x, p.y + 0.025, p.z]}
            rotation={[-Math.PI / 2, 0, p.yaw]}
          >
            <planeGeometry args={[0.09, 3]} />
            <meshBasicMaterial color="#80bbc9" transparent opacity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

function Gate({ at, finish = false }: { at: number; finish?: boolean }) {
  const p = trackPoint(at);
  return (
    <group position={[p.x, COURSE.deck, p.z]} rotation={[0, -p.yaw, 0]}>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 3.2, 0]} castShadow>
          <boxGeometry args={[0.8, 6.4, 1.2]} />
          <meshStandardMaterial
            color={finish ? "#f1ba60" : "#d4e9e4"}
            roughness={0.45}
          />
        </mesh>
      ))}
      <mesh position={[0, 6.5, 0]} castShadow>
        <boxGeometry args={[10.8, 0.8, 1.2]} />
        <meshStandardMaterial color={finish ? "#f1ba60" : "#d4e9e4"} />
      </mesh>
      <mesh position={[0, 6.48, 0.66]}>
        <boxGeometry args={[8.5, 0.12, 0.03]} />
        <meshBasicMaterial color="#31dfcd" />
      </mesh>
      {finish &&
        Array.from({ length: 16 }, (_, i) => (
          <mesh
            key={i}
            position={[-3.9 + (i % 8) * 1.1, 0.04, Math.floor(i / 8) * 0.6]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[1.1, 0.6]} />
            <meshBasicMaterial
              color={(i + Math.floor(i / 8)) % 2 ? "#172e42" : "#f6f1d7"}
            />
          </mesh>
        ))}
    </group>
  );
}

function Islands() {
  const islands = useMemo(() => {
    const random = visualRandom(24294);
    return Array.from({ length: 32 }, (_, i) => {
      const p = trackPoint(i * 30, (i % 2 ? 1 : -1) * (14 + random() * 21));
      return {
        x: p.x,
        z: p.z,
        size: 3 + random() * 6,
        angle: random() * Math.PI,
      };
    });
  }, []);
  return (
    <group>
      {islands.map((p, i) => (
        <group key={i} position={[p.x, -1.2, p.z]} rotation={[0, p.angle, 0]}>
          <mesh scale={[p.size, 3, p.size * 1.2]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#dab886"
              roughness={0.92}
              flatShading
            />
          </mesh>
          <mesh
            position={[0, 2.2, 0]}
            scale={[p.size * 0.85, 0.7, p.size]}
            receiveShadow
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={i % 2 ? "#48a78a" : "#72bb8c"}
              roughness={0.9}
              flatShading
            />
          </mesh>
          <mesh position={[0, 4.3, 0]} rotation={[0, i, 0]} castShadow>
            <coneGeometry args={[1.1, 4, 5]} />
            <meshStandardMaterial color="#206e6e" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function TrackWorld() {
  const landmark = trackPoint(920, 36);
  return (
    <>
      <color attach="background" args={["#abdce6"]} />
      <fog attach="fog" args={["#abdce6", 55, 190]} />
      <hemisphereLight args={["#dbf6ff", "#659ca0", 1.5]} />
      {/* Ship-local shadow light follows the player in RunnerScene. */}
      <directionalLight
        position={[-50, 90, 35]}
        color="#fff1cc"
        intensity={2.2}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, -460]}
        receiveShadow
      >
        <planeGeometry args={[1600, 1600]} />
        <meshStandardMaterial
          color="#168d9f"
          metalness={0.22}
          roughness={0.32}
        />
      </mesh>
      <Islands />
      {COURSE_SECTIONS.map((_, i) => (
        <TrackSegment key={i} index={i} />
      ))}
      {[2, 326, 350, 374, 855].map((at) => (
        <Gate key={at} at={at} />
      ))}
      <Gate at={COURSE.length} finish />
      {Array.from({ length: 15 }, (_, i) => {
        const p = trackPoint(438 + i * 5.5);
        return (
          <group
            key={i}
            position={[p.x, COURSE.deck, p.z]}
            rotation={[0, -p.yaw, 0]}
          >
            <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry
                args={[5.7, 5.7, 5.6, 14, 1, true, Math.PI / 2, Math.PI]}
              />
              <meshStandardMaterial
                color="#265969"
                side={THREE.DoubleSide}
                roughness={0.6}
              />
            </mesh>
          </group>
        );
      })}
      <group position={[landmark.x, 0, landmark.z]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[i * 9, 0, -i * 4]}>
            <mesh position={[0, 15 + i * 5, 0]} castShadow>
              <cylinderGeometry args={[2.5, 5, 30 + i * 10, 8]} />
              <meshStandardMaterial
                color="#d2e3d8"
                metalness={0.2}
                roughness={0.5}
              />
            </mesh>
            <mesh position={[0, 30 + i * 10, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[6, 0.4, 6, 24]} />
              <meshStandardMaterial
                color="#eca851"
                emissive="#ae6b24"
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}
