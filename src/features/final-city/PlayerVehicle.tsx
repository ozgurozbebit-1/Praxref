"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { roadYaw, type DriveState, type InputState } from "./city-model";

/** Section-lofted coachwork: beveled shoulders, tapered nose and broad rear haunches. */
function coachwork(tall: boolean) {
  const sections = [
    [-2.25, 0.71, 0.48],
    [-1.85, 1.04, 0.72],
    [-0.8, 1.07, 0.8],
    [0.65, 1.08, 0.83],
    [1.8, 1.03, 0.72],
    [2.16, 0.85, 0.57],
  ];
  const vertices: number[] = [],
    indices: number[] = [];
  for (const [z, w, h] of sections) {
    const height = h + (tall ? 0.12 : 0);
    for (const [x, y] of [
      [-w * 0.88, 0.3],
      [-w, 0.43],
      [-w * 0.98, height * 0.87],
      [-w * 0.77, height],
      [w * 0.77, height],
      [w * 0.98, height * 0.87],
      [w, 0.43],
      [w * 0.88, 0.3],
    ])
      vertices.push(x, y, z);
  }
  for (let i = 0; i < sections.length - 1; i++)
    for (let j = 0; j < 8; j++) {
      const a = i * 8 + j,
        b = i * 8 + ((j + 1) % 8),
        c = a + 8,
        d = b + 8;
      indices.push(a, c, b, b, c, d);
    }
  for (let j = 1; j < 7; j++) {
    indices.push(0, j, j + 1);
    indices.push(40, 41 + j, 40 + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function cabin(tall: boolean) {
  const shape = new THREE.Shape();
  shape.moveTo(tall ? -1.3 : -1.03, 0.72);
  shape.lineTo(-0.45, tall ? 1.65 : 1.16);
  shape.quadraticCurveTo(-0.35, tall ? 1.77 : 1.27, 0.5, tall ? 1.7 : 1.22);
  shape.lineTo(tall ? 1.43 : 1.17, 0.75);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 1.5,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.065,
    bevelThickness: 0.065,
  });
  g.translate(0, 0, -0.75);
  g.rotateY(Math.PI / 2);
  return g;
}
export function VehicleModel({
  color = "#d52c38",
  variant = 0,
  player = false,
}: {
  color?: string;
  variant?: number;
  player?: boolean;
}) {
  const geometries = useMemo(
    () => ({ body: coachwork(variant === 2), glass: cabin(variant === 2) }),
    [variant],
  );
  useEffect(
    () => () => {
      geometries.body.dispose();
      geometries.glass.dispose();
    },
    [geometries],
  );
  return (
    <group scale={variant === 1 ? [0.94, 0.95, 1.06] : [1, 1, 1]}>
      <mesh geometry={geometries.body} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          metalness={0.3}
          roughness={0.28}
          clearcoat={0.85}
          clearcoatRoughness={0.22}
        />
      </mesh>
      <mesh geometry={geometries.glass} castShadow>
        <meshPhysicalMaterial
          color="#315765"
          emissive="#162c34"
          emissiveIntensity={0.25}
          metalness={0.3}
          roughness={0.18}
          clearcoat={1}
        />
      </mesh>
      <mesh
        position={[0, variant === 2 ? 1.76 : 1.26, 0.02]}
        scale={[1.52, 0.065, 0.7]}
      >
        <boxGeometry />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      {player &&
        [-0.58, 0.58].map((x) => (
          <group key={x} position={[x, 0.38, 2.2]}>
            <mesh>
              <torusGeometry args={[0.115, 0.026, 8, 16]} />
              <meshStandardMaterial
                color="#a8b7bb"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 0, -0.015]}>
              <circleGeometry args={[0.1, 16]} />
              <meshStandardMaterial color="#101820" />
            </mesh>
          </group>
        ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * 1.07, 0.95, -0.65]}
            scale={[0.25, 0.12, 0.32]}
            castShadow
          >
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial
              color={color}
              metalness={0.45}
              roughness={0.3}
            />
          </mesh>
          <mesh
            position={[side * 0.67, 0.66, 2.17]}
            scale={[0.53, 0.095, 0.035]}
          >
            <boxGeometry />
            <meshStandardMaterial
              color="#ff2435"
              emissive="#ff1c25"
              emissiveIntensity={0.8}
              toneMapped={false}
            />
          </mesh>
          <mesh
            position={[side * 0.66, 0.52, -2.19]}
            scale={[0.48, 0.09, 0.025]}
          >
            <boxGeometry />
            <meshStandardMaterial
              color="#ecf5f5"
              emissive="#d6eeff"
              emissiveIntensity={0.3}
            />
          </mesh>
          <mesh position={[side * 1.07, 0.39, 0]} scale={[0.04, 0.15, 2.52]}>
            <boxGeometry />
            <meshStandardMaterial color="#16232b" roughness={0.55} />
          </mesh>
          {[-1.35, 1.35].map((z) => (
            <group
              key={z}
              position={[side * 1.015, 0.4, z]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <mesh castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.26, 20]} />
                <meshStandardMaterial color="#161c22" roughness={0.92} />
              </mesh>
              <mesh position={[0, -side * 0.145, 0]}>
                <cylinderGeometry args={[0.285, 0.285, 0.025, 16]} />
                <meshStandardMaterial
                  color="#aebdc5"
                  metalness={0.85}
                  roughness={0.28}
                />
              </mesh>
              <mesh position={[0, -side * 0.164, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.025, 8]} />
                <meshStandardMaterial
                  color="#293842"
                  metalness={0.5}
                  roughness={0.5}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.4, 2.14]} scale={[1.6, 0.18, 0.075]}>
        <boxGeometry />
        <meshStandardMaterial color="#111d25" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.59, 2.195]} scale={[0.42, 0.12, 0.02]}>
        <boxGeometry />
        <meshStandardMaterial color="#edf0e7" />
      </mesh>
      {player && (
        <group position={[0, 0.96, 1.8]}>
          <mesh scale={[1.85, 0.065, 0.3]} castShadow>
            <boxGeometry />
            <meshStandardMaterial
              color={color}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
          {[-0.64, 0.64].map((x) => (
            <mesh key={x} position={[x, -0.12, 0]} scale={[0.065, 0.24, 0.15]}>
              <boxGeometry />
              <meshStandardMaterial color="#1b2730" />
            </mesh>
          ))}
        </group>
      )}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.025, 0]}
        scale={[1.15, 2.2, 1]}
      >
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial
          color="#12202b"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
export function PlayerVehicle({
  drive,
  input,
  reduced,
}: {
  drive: RefObject<DriveState>;
  input: RefObject<InputState>;
  reduced: boolean;
}) {
  const body = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!body.current) return;
    const s = drive.current;
    body.current.position.set(s.visualX, 0, 3.1);
    body.current.rotation.y =
      roadYaw(s.distance, 3.1) + s.steering * (reduced ? 0.014 : 0.035);
    body.current.rotation.z = THREE.MathUtils.damp(
      body.current.rotation.z,
      reduced ? 0 : -s.steering * 0.032,
      8,
      dt,
    );
    body.current.rotation.x = THREE.MathUtils.damp(
      body.current.rotation.x,
      reduced
        ? 0
        : (input.current.up ? -0.01 : 0) + (input.current.down ? 0.014 : 0),
      8,
      dt,
    );
  });
  return (
    <group ref={body}>
      <VehicleModel player />
    </group>
  );
}
