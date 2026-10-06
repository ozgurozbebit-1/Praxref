"use client";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { memo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { roadX, roadYaw, seeded, streamZ, type DriveState } from "./city-model";
import { VehicleModel } from "./PlayerVehicle";
import { BuildingFacade } from "./BuildingFacade";
import { CityLabel } from "./CityLabel";

const ROWS = 20;
function Tree() {
  return (
    <group>
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.24, 2.7, 7]} />
        <meshStandardMaterial color="#78664b" roughness={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[(i - 1) * 0.65, 3.3 + i * 0.28, (i % 2) * 0.4]}
          scale={[1, 1.3, 1]}
          castShadow
        >
          <icosahedronGeometry args={[1.1, 1]} />
          <meshStandardMaterial
            color={i % 2 ? "#6e9562" : "#46765a"}
            roughness={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}
function StreetFurniture({ index }: { index: number }) {
  return (
    <group>
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.055, 0.1, 5.6, 7]} />
        <meshStandardMaterial
          color="#4c606b"
          metalness={0.6}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[-0.85, 5.56, 0]}>
        <boxGeometry args={[1.8, 0.1, 0.13]} />
        <meshStandardMaterial color="#4c606b" metalness={0.6} />
      </mesh>
      <mesh position={[-1.45, 5.48, 0]}>
        <boxGeometry args={[0.65, 0.1, 0.35]} />
        <meshStandardMaterial color="#eef0dd" />
      </mesh>
      {index % 4 === 0 && (
        <group position={[1.5, 0, -3]}>
          <mesh position={[0, 2.5, 0]} castShadow>
            <boxGeometry args={[2.4, 0.14, 4.1]} />
            <meshStandardMaterial color="#254653" metalness={0.45} />
          </mesh>
          {[-1.7, 1.7].map((z) => (
            <mesh key={z} position={[1, 1.25, z]}>
              <cylinderGeometry args={[0.055, 0.055, 2.5, 6]} />
              <meshStandardMaterial color="#6a8088" />
            </mesh>
          ))}
          <mesh position={[1, 1.4, 0]}>
            <boxGeometry args={[0.055, 2, 3.7]} />
            <meshPhysicalMaterial
              color="#91c5ce"
              transparent
              opacity={0.36}
              roughness={0.1}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0.7, 0.65, 0]}>
            <boxGeometry args={[0.65, 0.15, 2.8]} />
            <meshStandardMaterial color="#a78462" />
          </mesh>
        </group>
      )}
    </group>
  );
}
const BlockRow = memo(function BlockRow({
  index,
  drive,
}: {
  index: number;
  drive: RefObject<DriveState>;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const z = streamZ(-index * 16, drive.current.distance);
    group.current.position.set(roadX(drive.current.distance, z), 0, z);
    group.current.rotation.y = roadYaw(drive.current.distance, z);
  });
  const plaza = index % 5 === 0;
  return (
    <group ref={group}>
      {[-1, 1].map((side) => (
        <group key={side}>
          {!plaza && (
            <group
              position={[side * (22 + seeded(index) * 3), 0, 0]}
              rotation={[0, (-side * Math.PI) / 2, 0]}
            >
              <BuildingFacade index={index + (side === 1 ? 27 : 0)} />
            </group>
          )}
          <group position={[side * 15.1, 0, 2]}>
            <Tree />
          </group>
          <group
            position={[side * 13.5, 0, -5]}
            rotation={[0, side === -1 ? Math.PI : 0, 0]}
          >
            <StreetFurniture index={index} />
          </group>
          {!plaza && index % 3 === 0 && (
            <group
              position={[side * 11.35, 0.02, -2]}
              rotation={[0, side === 1 ? 0 : Math.PI, 0]}
            >
              <VehicleModel
                color={index % 2 ? "#d8d2c2" : "#596d7e"}
                variant={index % 3}
              />
            </group>
          )}
          {plaza && (
            <>
              <mesh position={[side * 25, 0.18, -1]} receiveShadow>
                <cylinderGeometry args={[6, 6, 0.3, 24]} />
                <meshStandardMaterial color="#d0cbb9" roughness={0.9} />
              </mesh>
              <mesh position={[side * 25, 1.7, -1]}>
                <torusGeometry args={[1.7, 0.18, 8, 24]} />
                <meshStandardMaterial
                  color="#a8babd"
                  metalness={0.7}
                  roughness={0.3}
                />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
});
function BrandGate({
  drive,
  index,
}: {
  drive: RefObject<DriveState>;
  index: number;
}) {
  const ref = useRef<THREE.Group>(null),
    logo = useTexture("/assets/brand/logo/praxref-primary.png");
  useFrame(() => {
    if (!ref.current) return;
    const z = streamZ(-60 - index * 160, drive.current.distance);
    ref.current.position.set(roadX(drive.current.distance, z), 0, z);
    ref.current.rotation.y = roadYaw(drive.current.distance, z);
  });
  return (
    <group ref={ref}>
      {index === 1 && (
        <group position={[0, 6.2, -1.4]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[27, 0.32, 2.6]} />
            <meshStandardMaterial color="#c3c9c4" roughness={0.75} />
          </mesh>
          {[-1.2, 1.2].map((z) => (
            <group key={z} position={[0, 0.55, z]}>
              <mesh>
                <boxGeometry args={[27, 0.065, 0.065]} />
                <meshStandardMaterial color="#67808a" metalness={0.55} />
              </mesh>
              {Array.from({ length: 19 }, (_, i) => (
                <mesh key={i} position={[-13 + i * 1.44, -0.3, 0]}>
                  <boxGeometry args={[0.035, 0.6, 0.035]} />
                  <meshStandardMaterial color="#67808a" metalness={0.55} />
                </mesh>
              ))}
            </group>
          ))}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 13, -3.1, 0]} castShadow>
              <boxGeometry args={[0.6, 6.2, 2]} />
              <meshStandardMaterial color="#c3c9c4" roughness={0.8} />
            </mesh>
          ))}
        </group>
      )}
      {[-12, 12].map((x) => (
        <mesh key={x} position={[x, 4, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 8, 10]} />
          <meshStandardMaterial color="#71858f" metalness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 7.7, 0]} castShadow>
        <boxGeometry args={[24, 0.22, 0.3]} />
        <meshStandardMaterial color="#71858f" metalness={0.6} />
      </mesh>
      <mesh position={[0, 7.1, 0]}>
        <boxGeometry args={[5.8, 1.8, 0.18]} />
        <meshStandardMaterial color="#f3f3e9" roughness={0.65} />
      </mesh>
      <mesh position={[0, 7.1, 0.11]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial map={logo} transparent toneMapped={false} />
      </mesh>
      <group position={[0, 5.95, 0.13]}>
        <mesh>
          <boxGeometry args={[5.8, 0.48, 0.14]} />
          <meshStandardMaterial color="#244754" />
        </mesh>
        <group position={[0, 0, 0.09]}>
          <CityLabel
            text="COGNITIVE CITY  /  BULVAR 01"
            width={5.4}
            height={0.38}
          />
        </group>
      </group>
    </group>
  );
}
export function CityBlocks({ drive }: { drive: RefObject<DriveState> }) {
  return (
    <>
      <group>
        {Array.from({ length: ROWS }, (_, i) => (
          <BlockRow key={i} index={i} drive={drive} />
        ))}
      </group>
      <BrandGate index={0} drive={drive} />
      <BrandGate index={1} drive={drive} />
    </>
  );
}
