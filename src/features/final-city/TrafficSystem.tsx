"use client";
import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  roadX,
  roadYaw,
  seeded,
  settings,
  streamZ,
  type Audience,
  type DriveState,
  type InputState,
} from "./city-model";
import { VehicleModel } from "./PlayerVehicle";
const PAINT = [
  "#d2d9db",
  "#537385",
  "#c6b490",
  "#303e55",
  "#698375",
  "#a96b4f",
];
export function TrafficSystem({
  audience,
  input,
  drive,
  running,
}: {
  audience: Audience;
  input: RefObject<InputState>;
  drive: RefObject<DriveState>;
  running: boolean;
}) {
  const groups = useRef<(THREE.Group | null)[]>([]),
    travel = useRef(new Float64Array(16));
  useFrame((_, dt) => {
    for (let i = 0; i < settings(audience).traffic; i++) {
      const car = groups.current[i];
      if (!car) continue;
      const oncoming = i % 4 === 0;
      if (running)
        travel.current[i] +=
          dt *
          (oncoming
            ? input.current.speed + 12
            : input.current.speed * (0.3 + seeded(i) * 0.27));
      const z = streamZ(-28 - i * 18, travel.current[i]),
        lane = oncoming ? -10.5 : ((i % 3) - 1) * 3.7;
      car.position.set(lane + roadX(drive.current.distance, z), 0, z);
      car.rotation.y =
        roadYaw(drive.current.distance, z) + (oncoming ? Math.PI : 0);
    }
  });
  return (
    <>
      {Array.from({ length: settings(audience).traffic }, (_, i) => (
        <group
          key={i}
          ref={(node) => {
            groups.current[i] = node;
          }}
        >
          <VehicleModel color={PAINT[i % 6]} variant={i % 3} />
        </group>
      ))}
    </>
  );
}
