"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { roadX, roadYaw, streamZ, type DriveState } from "./city-model";

const COUNT = 40;
export function CityRoad({ drive }: { drive: RefObject<DriveState> }) {
  const road = useRef<THREE.InstancedMesh>(null),
    pavement = useRef<THREE.InstancedMesh>(null),
    dashes = useRef<THREE.InstancedMesh>(null),
    curbs = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    if (!road.current || !pavement.current || !dashes.current || !curbs.current)
      return;
    let dash = 0,
      edge = 0;
    for (let i = 0; i < COUNT; i++) {
      const z = streamZ(-i * 8, drive.current.distance);
      const x = roadX(drive.current.distance, z),
        yaw = roadYaw(drive.current.distance, z);
      dummy.rotation.set(0, yaw, 0);
      dummy.position.set(x, -0.12, z);
      dummy.scale.set(25.8, 0.22, 8.12);
      dummy.updateMatrix();
      road.current.setMatrixAt(i, dummy.matrix);
      for (const side of [-1, 1]) {
        dummy.position.set(x + side * 15.4, 0.02, z);
        dummy.scale.set(5, 0.25, 8.12);
        dummy.updateMatrix();
        pavement.current.setMatrixAt(
          i * 2 + (side === 1 ? 1 : 0),
          dummy.matrix,
        );
        dummy.position.set(x + side * 12.88, 0.16, z);
        dummy.scale.set(0.16, 0.28, 8.1);
        dummy.updateMatrix();
        curbs.current.setMatrixAt(edge++, dummy.matrix);
      }
      for (const lane of [-10.6, -5.55, -1.85, 1.85, 5.55, 10.6]) {
        dummy.position.set(x + lane, 0.012, z);
        dummy.scale.set(0.09, 0.018, 3.5);
        dummy.updateMatrix();
        dashes.current.setMatrixAt(dash++, dummy.matrix);
      }
    }
    road.current.instanceMatrix.needsUpdate = true;
    pavement.current.instanceMatrix.needsUpdate = true;
    curbs.current.instanceMatrix.needsUpdate = true;
    dashes.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.3, -120]}
        receiveShadow
      >
        <planeGeometry args={[650, 650]} />
        <meshStandardMaterial color="#bbbcae" roughness={1} />
      </mesh>
      <instancedMesh
        ref={road}
        args={[undefined, undefined, COUNT]}
        frustumCulled={false}
        receiveShadow
      >
        <boxGeometry />
        <meshStandardMaterial color="#303c48" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={pavement}
        args={[undefined, undefined, COUNT * 2]}
        frustumCulled={false}
        receiveShadow
      >
        <boxGeometry />
        <meshStandardMaterial color="#c4c7bc" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={curbs}
        args={[undefined, undefined, COUNT * 2]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial color="#eeeadd" roughness={0.8} />
      </instancedMesh>
      <instancedMesh
        ref={dashes}
        args={[undefined, undefined, COUNT * 6]}
        frustumCulled={false}
      >
        <boxGeometry />
        <meshStandardMaterial color="#ecebdf" roughness={0.7} />
      </instancedMesh>
      {[0, 1, 2, 3].map((i) => (
        <Intersection key={i} index={i} drive={drive} />
      ))}
    </>
  );
}
function Intersection({
  index,
  drive,
}: {
  index: number;
  drive: RefObject<DriveState>;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const z = streamZ(-index * 80, drive.current.distance);
    group.current.position.set(roadX(drive.current.distance, z), 0.028, z);
    group.current.rotation.y = roadYaw(drive.current.distance, z);
  });
  return (
    <group ref={group}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[70, 0.04, 12]} />
        <meshStandardMaterial color="#39434a" roughness={0.9} />
      </mesh>
      {[-5, 5].map((z) => (
        <group key={z}>
          {Array.from({ length: 18 }, (_, i) => (
            <mesh key={i} position={[-11.8 + i * 1.38, 0.03, z]}>
              <boxGeometry args={[0.64, 0.025, 2.5]} />
              <meshStandardMaterial color="#f1eddf" roughness={0.75} />
            </mesh>
          ))}
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 13.6, 0, 5]}>
          <mesh position={[0, 2.7, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 5.4, 8]} />
            <meshStandardMaterial color="#5e6e72" metalness={0.5} />
          </mesh>
          <mesh position={[0, 4.8, 0]}>
            <boxGeometry args={[0.45, 1.25, 0.4]} />
            <meshStandardMaterial color="#172c35" />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 5.18 - i * 0.36, 0.22]}>
              <circleGeometry args={[0.115, 12]} />
              <meshStandardMaterial
                color={i === 2 ? "#83b799" : "#53655c"}
                emissive={i === 2 ? "#4aaa75" : "#000000"}
                emissiveIntensity={0.4}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
