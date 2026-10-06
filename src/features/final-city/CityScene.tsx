"use client";
import { useFrame } from "@react-three/fiber";
import { memo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  advanceInput,
  type Audience,
  type DriveState,
  type InputState,
  type SymbolKind,
} from "./city-model";
import { CityRoad } from "./CityRoad";
import { CityBlocks } from "./CityBlocks";
import { PlayerVehicle } from "./PlayerVehicle";
import { TrafficSystem } from "./TrafficSystem";
import { MissionSystem } from "./MissionSystem";
import { ChaseCamera } from "./ChaseCamera";
function CitySceneContent({
  audience,
  running,
  inputRef,
  onGate,
  missionIndex,
  reduced,
}: {
  audience: Audience;
  running: boolean;
  inputRef: RefObject<InputState>;
  onGate: (kind: SymbolKind, correct: boolean) => void;
  missionIndex: number;
  reduced: boolean;
}) {
  const drive = useRef<DriveState>({ distance: 0, visualX: 0, steering: 0 });
  useFrame((_, dt) => {
    if (!running) return;
    advanceInput(inputRef.current, dt);
    const s = drive.current,
      old = s.visualX;
    s.visualX = THREE.MathUtils.damp(s.visualX, inputRef.current.x, 10, dt);
    s.steering =
      dt > 0 ? THREE.MathUtils.clamp((s.visualX - old) / dt, -3, 3) : 0;
    s.distance += inputRef.current.speed * dt;
  }, -2);
  return (
    <>
      <color attach="background" args={["#aacdde"]} />
      <fog attach="fog" args={["#c3d6dc", 95, 265]} />
      <hemisphereLight color="#e6f4ff" groundColor="#837668" intensity={1.6} />
      <directionalLight
        position={[-24, 35, 18]}
        color="#fff1d6"
        intensity={2.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
      />
      <CityRoad drive={drive} />
      <CityBlocks drive={drive} />
      <TrafficSystem
        drive={drive}
        input={inputRef}
        audience={audience}
        running={running}
      />
      <MissionSystem
        drive={drive}
        input={inputRef}
        running={running}
        missionIndex={missionIndex}
        onHit={onGate}
      />
      <PlayerVehicle drive={drive} input={inputRef} reduced={reduced} />
      <ChaseCamera drive={drive} input={inputRef} reduced={reduced} />
    </>
  );
}

// The 100 ms HUD timer must not reconcile the entire city tree.
export const CityScene = memo(CitySceneContent);
