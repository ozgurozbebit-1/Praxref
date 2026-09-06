"use client";

import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  COURSE,
  COURSE_SECTIONS,
  RAMPS,
  deckHeight,
  trackPoint,
  visualRandom,
} from "./course";

/** Static vertex colours/normals give depth without textures or a water shader. */
function Sea({ reduced }: { reduced: boolean }) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const geometry = useMemo(() => {
    const surface = new THREE.PlaneGeometry(1600, 1600, 64, 64);
    const positions = surface.attributes.position;
    const colours = new Float32Array(positions.count * 3);
    const deep = new THREE.Color("#147c98");
    const shallow = new THREE.Color("#43baaf");
    const colour = new THREE.Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i);
      const wave = Math.sin(x * 0.12 + y * 0.07) * Math.cos(y * 0.09);
      positions.setZ(i, wave * 0.12);
      colour.copy(deep).lerp(shallow, 0.35 + 0.22 * wave);
      colour.toArray(colours, i * 3);
    }
    surface.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    surface.computeVertexNormals();
    return surface;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    if (material.current)
      material.current.roughness = reduced
        ? 0.4
        : 0.4 + Math.sin(clock.elapsedTime * 0.45) * 0.025;
  });
  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.22, -460]}
      receiveShadow
    >
      <meshStandardMaterial
        ref={material}
        vertexColors
        metalness={0.18}
        roughness={0.4}
      />
    </mesh>
  );
}

function RampMarkings() {
  const strips = useMemo(
    () =>
      RAMPS.flatMap((ramp) =>
        [-1, 1].map((side) =>
          roadGeometry(
            ramp.start,
            ramp.crest,
            side < 0 ? -3.6 : 3.4,
            side < 0 ? -3.4 : 3.6,
            0.06,
          ),
        ),
      ),
    [],
  );
  useEffect(() => () => strips.forEach((g) => g.dispose()), [strips]);
  return (
    <group>
      {strips.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshBasicMaterial color="#ffd17a" />
        </mesh>
      ))}
    </group>
  );
}

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
          color={index % 2 ? "#244659" : "#203c53"}
          roughness={0.58}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {geometry.slice(1).map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial
            color="#f5d49b"
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
  const praxrefLogo = useTexture("/assets/brand/logo/praxref-primary.png");

  if (finish) {
    return (
      <group position={[p.x, COURSE.deck, p.z]} rotation={[0, -p.yaw, 0]}>
        {[-5.25, 5.25].map((x) => (
          <group key={x} position={[x, 3.25, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.9, 6.5, 1.05]} />
              <meshStandardMaterial
                color="#102f43"
                metalness={0.32}
                roughness={0.36}
              />
            </mesh>
            <mesh position={[0, 0, 0.56]}>
              <boxGeometry args={[0.16, 5.7, 0.035]} />
              <meshBasicMaterial color="#e6bb59" toneMapped={false} />
            </mesh>
          </group>
        ))}

        <mesh position={[0, 6.55, 0]} castShadow>
          <boxGeometry args={[11.4, 2.15, 1.05]} />
          <meshStandardMaterial
            color="#102f43"
            metalness={0.34}
            roughness={0.32}
          />
        </mesh>

        <mesh position={[0, 6.62, 0.545]}>
          <planeGeometry args={[4.7, 1.05]} />
          <meshBasicMaterial
            map={praxrefLogo}
            transparent
            toneMapped={false}
          />
        </mesh>

        {Array.from({ length: 14 }, (_, i) => {
          const x = -5.15 + i * 0.79;
          const light = i % 2 === 0;
          return (
            <mesh key={i} position={[x, 5.62, 0.555]}>
              <planeGeometry args={[0.79, 0.28]} />
              <meshBasicMaterial
                color={light ? "#f5f0dc" : "#173346"}
                toneMapped={false}
              />
            </mesh>
          );
        })}

        <mesh position={[0, 7.52, 0.555]}>
          <planeGeometry args={[10.25, 0.08]} />
          <meshBasicMaterial color="#54e2d3" toneMapped={false} />
        </mesh>

        {Array.from({ length: 16 }, (_, i) => (
          <mesh
            key={i}
            position={[-3.9 + (i % 8) * 1.1, 0.04, Math.floor(i / 8) * 0.6]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[1.1, 0.6]} />
            <meshBasicMaterial
              color={(i + Math.floor(i / 8)) % 2 ? "#173346" : "#f5f0dc"}
            />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={[p.x, COURSE.deck, p.z]} rotation={[0, -p.yaw, 0]}>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 3.2, 0]} castShadow>
          <boxGeometry args={[0.8, 6.4, 1.2]} />
          <meshStandardMaterial color="#d4e9e4" roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 6.5, 0]} castShadow>
        <boxGeometry args={[10.8, 0.8, 1.2]} />
        <meshStandardMaterial color="#d4e9e4" />
      </mesh>
      <mesh position={[0, 6.48, 0.66]}>
        <boxGeometry args={[8.5, 0.12, 0.03]} />
        <meshBasicMaterial color="#31dfcd" />
      </mesh>
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
          <mesh
            scale={[p.size, i % 4 === 3 ? 6.5 : 3, p.size * 1.2]}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={["#627c87", "#b49d7f", "#ebd8af", "#586b7e"][i % 4]}
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
              color={["#829e97", "#53a78a", "#f2dfb4", "#71908c"][i % 4]}
              roughness={0.9}
              flatShading
            />
          </mesh>
          {i % 4 === 1 ? (
            <group position={[0, 2.6, 0]}>
              <mesh position={[0, 1.6, 0]} rotation={[0, 0, 0.12]} castShadow>
                <cylinderGeometry args={[0.13, 0.24, 3.2, 6]} />
                <meshStandardMaterial color="#977652" roughness={0.9} />
              </mesh>
              {[0, 1, 2, 3].map((leaf) => (
                <mesh
                  key={leaf}
                  position={[0.2, 3.3, 0]}
                  rotation={[0, (leaf * Math.PI) / 2, 0.2]}
                  scale={[2.2, 0.16, 0.65]}
                >
                  <octahedronGeometry args={[1, 0]} />
                  <meshStandardMaterial color="#267c67" roughness={0.85} />
                </mesh>
              ))}
            </group>
          ) : (
            i % 4 !== 2 && (
              <mesh
                position={[0, i % 4 === 3 ? 5 : 2.6, 0]}
                rotation={[0.15, i, 0.2]}
                castShadow
              >
                <coneGeometry
                  args={[i % 4 === 3 ? 2 : 1.5, i % 4 === 3 ? 7 : 2, 5]}
                />
                <meshStandardMaterial
                  color="#607985"
                  roughness={0.88}
                  flatShading
                />
              </mesh>
            )
          )}
        </group>
      ))}
    </group>
  );
}

/** Fixed scenery outside the driving corridor; no interaction or collision. */
function CoastalMarkers() {
  const lighthouse = trackPoint(530, -30);
  return (
    <group>
      <group position={[lighthouse.x, 0, lighthouse.z]}>
        <mesh position={[0, 0.2, 0]} scale={[4, 1.4, 3]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#789190" roughness={0.9} />
        </mesh>
        <mesh position={[0, 5, 0]}>
          <cylinderGeometry args={[0.9, 1.5, 9, 8]} />
          <meshStandardMaterial color="#e8ddbe" roughness={0.75} />
        </mesh>
        <mesh position={[0, 9.8, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 1, 8]} />
          <meshStandardMaterial
            color="#cce4d9"
            emissive="#eac886"
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh position={[0, 10.8, 0]}>
          <coneGeometry args={[1.7, 1.1, 8]} />
          <meshStandardMaterial color="#264b60" roughness={0.65} />
        </mesh>
      </group>
      {[90, 180, 340, 530, 700, 900].map((at, i) => {
        const p = trackPoint(at, i % 2 ? 11 : -11);
        return (
          <group key={at} position={[p.x, 0.25, p.z]}>
            <mesh>
              <cylinderGeometry args={[0.5, 0.8, 0.6, 8]} />
              <meshStandardMaterial color="#506e7b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <cylinderGeometry args={[0.1, 0.14, 1.3, 6]} />
              <meshStandardMaterial color="#d9c49c" roughness={0.8} />
            </mesh>
          </group>
        );
      })}
      {RAMPS.map((ramp, index) => {
        const p = trackPoint(ramp.start - 4, 5.3);
        return (
          <group
            key={ramp.start}
            position={[p.x, p.y, p.z]}
            rotation={[0, -p.yaw, 0]}
          >
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 2.2, 6]} />
              <meshStandardMaterial color="#a5babd" />
            </mesh>
            <mesh position={[0.55, 1.75, 0]}>
              <planeGeometry args={[1.1, 0.7]} />
              <meshStandardMaterial color="#244659" side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: index + 1 }, (_, bar) => (
              <mesh key={bar} position={[0.25 + bar * 0.28, 1.75, 0.012]}>
                <planeGeometry args={[0.09, 0.42]} />
                <meshBasicMaterial color="#e9c882" side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function splitFactor(s: number, start: number, end: number) {
  const t = THREE.MathUtils.clamp((s - start) / (end - start), 0, 1);
  return Math.sin(t * Math.PI);
}

function forkRibbonGeometry(
  start: number,
  end: number,
  side: -1 | 1,
  innerBase = 0.55,
  outerBase = 4.2,
) {
  const vertices: number[] = [];
  for (let s = start; s < end; s++) {
    if (deckHeight(s + 0.5) < 0) continue;
    const f0 = splitFactor(s, start, end);
    const f1 = splitFactor(s + 1, start, end);
    const inner0 = side * (innerBase + f0 * 2.0);
    const outer0 = side * (outerBase + f0 * 1.8);
    const inner1 = side * (innerBase + f1 * 2.0);
    const outer1 = side * (outerBase + f1 * 1.8);
    const a = trackPoint(s, side < 0 ? outer0 : inner0);
    const b = trackPoint(s, side < 0 ? inner0 : outer0);
    const c = trackPoint(s + 1, side < 0 ? outer1 : inner1);
    const d = trackPoint(s + 1, side < 0 ? inner1 : outer1);
    for (const p of [a, b, c, b, d, c]) vertices.push(p.x, p.y + 0.085, p.z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

function forkGapGeometry(start: number, end: number) {
  const vertices: number[] = [];
  for (let s = start; s < end; s++) {
    if (deckHeight(s + 0.5) < 0) continue;
    const f0 = splitFactor(s, start, end);
    const f1 = splitFactor(s + 1, start, end);
    const half0 = 0.42 + f0 * 2.05;
    const half1 = 0.42 + f1 * 2.05;
    const a = trackPoint(s, -half0);
    const b = trackPoint(s, half0);
    const c = trackPoint(s + 1, -half1);
    const d = trackPoint(s + 1, half1);
    for (const p of [a, b, c, b, d, c]) vertices.push(p.x, p.y + 0.12, p.z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

function ForkSection() {
  const start = 575;
  const end = 735;
  const left = useMemo(() => forkRibbonGeometry(start, end, -1), []);
  const right = useMemo(() => forkRibbonGeometry(start, end, 1), []);
  const gap = useMemo(() => forkGapGeometry(start, end), []);
  useEffect(
    () => () => {
      left.dispose();
      right.dispose();
      gap.dispose();
    },
    [left, right, gap],
  );
  const entry = trackPoint(start - 9);
  const merge = trackPoint(end + 8);
  return (
    <group>
      <mesh geometry={left} receiveShadow>
        <meshStandardMaterial
          color="#1c4058"
          roughness={0.56}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={right} receiveShadow>
        <meshStandardMaterial
          color="#1c4058"
          roughness={0.56}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={gap}>
        <meshStandardMaterial
          color="#38aeb0"
          emissive="#1d7f8c"
          emissiveIntensity={0.08}
          roughness={0.38}
          metalness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[entry, merge].map((p, index) => (
        <group
          key={index}
          position={[p.x, p.y + 1.55, p.z]}
          rotation={[0, -p.yaw, 0]}
        >
          <mesh castShadow>
            <boxGeometry args={[7.8, 0.82, 0.28]} />
            <meshStandardMaterial color="#16384d" roughness={0.5} />
          </mesh>
          {[-2.2, 2.2].map((x) => (
            <mesh key={x} position={[x, 0, 0.16]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.58, 0.58, 0.08]} />
              <meshBasicMaterial color="#f4cf8a" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function TrackWorld({
  reduced = false,
  audience,
}: {
  reduced?: boolean;
  audience: "kids" | "teen";
}) {
  const landmark = trackPoint(920, 36);
  return (
    <>
      <color attach="background" args={["#b9dfe5"]} />
      <fog attach="fog" args={["#b9dfe5", 55, 190]} />
      <hemisphereLight args={["#dbf6ff", "#659ca0", 1.5]} />
      {/* Ship-local shadow light follows the player in RunnerScene. */}
      <directionalLight
        position={[-50, 90, 35]}
        color="#fff1cc"
        intensity={2.2}
      />
      <Sea reduced={reduced} />
      <Islands />
      {audience === "teen" && (
        <group>
          {[130, 260, 390, 575, 735, 880].map((at, i) => {
            const p = trackPoint(at, i % 2 ? 12 : -12);
            return (
              <mesh key={at} position={[p.x, 1.2, p.z]}>
                <octahedronGeometry args={[0.55]} />
                <meshStandardMaterial
                  color={i % 2 ? "#a855f7" : "#2ea8ff"}
                  emissive={i % 2 ? "#6d2ca8" : "#1768a0"}
                  emissiveIntensity={0.22}
                />
              </mesh>
            );
          })}
        </group>
      )}
      <CoastalMarkers />
      <RampMarkings />
      <ForkSection />
      {COURSE_SECTIONS.map((_, i) => (
        <TrackSegment key={i} index={i} />
      ))}
      {[2, 326, 350, 374, 436, 520, 855].map((at) => (
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
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 4.75, 2.2, 0]}>
                <boxGeometry args={[0.08, 0.12, 5.4]} />
                <meshBasicMaterial color="#8cd8d7" />
              </mesh>
            ))}
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
