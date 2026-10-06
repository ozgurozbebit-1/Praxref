"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  COLORS,
  LANES,
  MISSION,
  createGates,
  crossGate,
  roadX,
  roadYaw,
  type DriveState,
  type InputState,
  type SymbolKind,
} from "./city-model";
function symbolGeometry(kind: SymbolKind) {
  if (kind === "circle") return new THREE.RingGeometry(0.3, 0.46, 32);
  const shape = new THREE.Shape(),
    n = kind === "star" ? 10 : kind === "triangle" ? 3 : 4;
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + (i * Math.PI * 2) / n,
      r = kind === "star" && i % 2 ? 0.23 : 0.5;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}
export function MissionSystem({
  input,
  drive,
  running,
  missionIndex,
  onHit,
}: {
  input: RefObject<InputState>;
  drive: RefObject<DriveState>;
  running: boolean;
  missionIndex: number;
  onHit: (kind: SymbolKind, correct: boolean) => void;
}) {
  const gates = useRef(createGates()),
    groups = useRef<(THREE.Group | null)[]>([]),
    supports = useRef<(THREE.Group | null)[]>([]),
    faces = useRef<(THREE.Mesh | null)[][]>([]);
  const shapes = useMemo(() => MISSION.map(symbolGeometry), []);
  useEffect(() => () => shapes.forEach((g) => g.dispose()), [shapes]);
  useFrame((_, dt) => {
    for (let i = 0; i < gates.current.length; i++) {
      const gate = gates.current[i],
        group = groups.current[i];
      if (!group) continue;
      if (running) {
        const previous = gate.z;
        gate.z += input.current.speed * dt;
        const result = crossGate(
          gate,
          previous,
          input.current.x,
          MISSION[missionIndex],
        );
        if (result !== null) onHit(gate.kind, result);
        if (gate.z > 11) {
          gate.z = -210 - Math.random() * 28;
          gate.kind = MISSION[Math.floor(Math.random() * 4)];
          gate.lane = Math.floor(Math.random() * 3);
          gate.passed = false;
        }
      }
      group.position.set(
        LANES[gate.lane] + roadX(drive.current.distance, gate.z),
        0,
        gate.z,
      );
      group.rotation.y = roadYaw(drive.current.distance, gate.z);
      group.visible = !gate.passed;
      const support = supports.current[i];
      if (support) {
        const edge = gate.lane === 0 ? -12.7 : 12.7;
        support.position.x = edge - LANES[gate.lane];
        support.scale.x = gate.lane === 0 ? -1 : 1;
        const arm = support.children[1];
        arm.scale.x = Math.abs(edge - LANES[gate.lane]);
        arm.position.x = -Math.abs(edge - LANES[gate.lane]) / 2;
      }
      for (let j = 0; j < 4; j++) {
        const face = faces.current[i]?.[j];
        if (face) face.visible = MISSION[j] === gate.kind;
      }
    }
  });
  return (
    <>
      {Array.from({ length: 28 }, (_, i) => (
        <group
          key={i}
          ref={(node) => {
            groups.current[i] = node;
          }}
        >
          <group
            ref={(node) => {
              supports.current[i] = node;
            }}
          >
            <mesh position={[0, 2.65, -0.15]}>
              <cylinderGeometry args={[0.065, 0.075, 5.3, 6]} />
              <meshStandardMaterial color="#748b95" metalness={0.5} />
            </mesh>
            <mesh position={[0, 5.25, -0.15]}>
              <boxGeometry args={[1, 0.085, 0.11]} />
              <meshStandardMaterial color="#748b95" metalness={0.5} />
            </mesh>
          </group>
          <mesh position={[0, 4.3, 0]} castShadow>
            <boxGeometry args={[1.8, 1.8, 0.13]} />
            <meshStandardMaterial
              color="#1a3b49"
              roughness={0.5}
              metalness={0.25}
            />
          </mesh>
          <mesh position={[0, 4.3, 0.078]}>
            <planeGeometry args={[1.65, 1.65]} />
            <meshBasicMaterial color="#dce8df" />
          </mesh>
          <mesh position={[0, 4.3, 0.086]}>
            <planeGeometry args={[1.57, 1.57]} />
            <meshBasicMaterial color="#153b4c" />
          </mesh>
          {MISSION.map((kind, j) => (
            <mesh
              key={kind}
              geometry={shapes[j]}
              position={[0, 4.45, 0.098]}
              ref={(node) => {
                (faces.current[i] ??= [])[j] = node;
              }}
            >
              <meshBasicMaterial color={COLORS[kind]} toneMapped={false} />
            </mesh>
          ))}
          <mesh position={[0, 3.81, 0.099]} rotation={[0, 0, Math.PI]}>
            <circleGeometry args={[0.16, 3]} />
            <meshBasicMaterial color="#e8ece0" />
          </mesh>
          <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.3, 1.2]} />
            <meshBasicMaterial
              color="#e7e5c4"
              transparent
              opacity={0.22}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
