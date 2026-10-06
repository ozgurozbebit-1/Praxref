"use client";
import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { roadX, type DriveState, type InputState } from "./city-model";
export function ChaseCamera({
  drive,
  input,
  reduced,
}: {
  drive: RefObject<DriveState>;
  input: RefObject<InputState>;
  reduced: boolean;
}) {
  const aim = useRef(new THREE.Vector3(0, 1, -32));
  useFrame(({ camera, size }, dt) => {
    const mobile = size.width < size.height;
    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      drive.current.visualX * (mobile ? 0.9 : 0.6),
      reduced ? 10 : 3.5,
      dt,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      mobile ? 4.8 : 3.5,
      4,
      dt,
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      mobile ? 13.8 : 10.8,
      4,
      dt,
    );
    aim.current.x = THREE.MathUtils.damp(
      aim.current.x,
      roadX(drive.current.distance, -35) +
        drive.current.visualX * (mobile ? 0.7 : 0.3),
      3.5,
      dt,
    );
    camera.lookAt(aim.current);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(
        camera.fov,
        (mobile ? 65 : 57) + (reduced ? 0 : (input.current.speed - 22) * 0.14),
        3,
        dt,
      );
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
