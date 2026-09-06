"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { FocusHuntAudience } from "../types";
import { COURSE, trackPoint } from "./course";
import { advanceLab, type LabRuntime } from "./runtime";
import { TrackWorld } from "./TrackWorld";

export const LAB_ASSETS = [
  "/assets/3d/ships/praxref-atlas.glb",
  ...[
    "star-gold",
    "star-blue",
    "star-green",
    "sphere-blue",
    "diamond-purple",
    "crystal-turquoise",
    "triangle-pink",
  ].map((name) => `/assets/games/shapes/${name}.glb`),
];
const colors = [
  "#FFD84A",
  "#2EA8FF",
  "#3DFF8A",
  "#2EA8FF",
  "#A855F7",
  "#18E3CF",
  "#FF4DB8",
];

function cloneModel(scene: THREE.Group, size: number, color?: string) {
  const model = scene.clone(true);
  const materials: THREE.Material[] = [];
  const helpers: THREE.Object3D[] = [];
  model.traverse((object) => {
    if (object instanceof THREE.Light || object instanceof THREE.Camera)
      helpers.push(object);
    if (!(object instanceof THREE.Mesh)) return;
    const cloneMaterial = (source: THREE.Material) => {
      const material = source.clone();
      if (material instanceof THREE.MeshStandardMaterial) {
        material.roughness = color ? 0.4 : 0.48;
        material.metalness = color ? 0.22 : 0.35;
        if (color) {
          material.color.set(color);
          material.emissive.set(color);
          material.emissiveIntensity = color === colors[0] ? 0.42 : 0.3;
        }
      }
      materials.push(material);
      return material;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(cloneMaterial)
      : cloneMaterial(object.material);
    object.castShadow = true;
    object.receiveShadow = true;
  });
  helpers.forEach((object) => object.removeFromParent());
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model),
    center = box.getCenter(new THREE.Vector3()),
    dimensions = box.getSize(new THREE.Vector3());
  model.position.sub(center);
  const wrapper = new THREE.Group();
  wrapper.add(model);
  wrapper.scale.setScalar(
    size / Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001),
  );
  return { object: wrapper, materials };
}

export const RunnerScene = memo(function RunnerScene({
  runtimeRef,
  reduced,
  lowQuality,
  onReady,
  onUpdate,
  onFinish,
  audience,
}: {
  runtimeRef: RefObject<LabRuntime>;
  reduced: boolean;
  lowQuality: boolean;
  onReady: () => void;
  onUpdate: () => void;
  onFinish: () => void;
  audience: FocusHuntAudience;
}) {
  const assets = useGLTF(LAB_ASSETS);
  const ship = useRef<THREE.Group>(null),
    exhaust = useRef<THREE.Group>(null),
    pickup = useRef<THREE.Group>(null),
    burst = useRef<THREE.Group>(null),
    shadow = useRef<THREE.Mesh>(null),
    sun = useRef<THREE.DirectionalLight>(null),
    trafficRefs = useRef<(THREE.Group | null)[]>([]);
  const notified = useRef(false);
  const objects = useMemo(
    () =>
      assets.map((asset, i) =>
        cloneModel(
          asset.scene,
          i === 0 ? 2.7 : i === 1 ? 1.35 : 1.15,
          i === 0 ? undefined : colors[i - 1],
        ),
      ),
    [assets],
  );
  const trafficShips = useMemo(
    () =>
      Array.from({ length: audience === "teen" ? 8 : 4 }, () =>
        cloneModel(assets[0].scene, audience === "teen" ? 2.0 : 1.8),
      ),
    [assets, audience],
  );
  const vectors = useMemo(
    () => ({
      desired: new THREE.Vector3(),
      look: new THREE.Vector3(),
      aim: new THREE.Vector3(),
      roll: new THREE.Quaternion(),
      axis: new THREE.Vector3(0, 0, 1),
    }),
    [],
  );
  useEffect(() => {
    const runtime = runtimeRef.current;
    objects.slice(1).forEach((model, index) =>
      model.object.traverse((object) => {
        if (object instanceof THREE.Mesh)
          object.onAfterRender = () => {
            const item = runtime.pickup;
            if (runtime.running && item?.model === index)
              runtime.session.presented(item.id, performance.now());
          };
      }),
    );
    onReady();
    return () => {
      objects.forEach((model) =>
        model.materials.forEach((material) => material.dispose()),
      );
      trafficShips.forEach((model) =>
        model.materials.forEach((material) => material.dispose()),
      );
    };
  }, [objects, onReady, runtimeRef, trafficShips]);

  useFrame(({ camera }, delta) => {
    const runtime = runtimeRef.current;
    const now = performance.now();
    advanceLab(runtime, delta, now);
    const state = runtime.runner,
      p = trackPoint(state.distance, state.lateral),
      ahead = trackPoint(state.distance + 15);
    if (ship.current) {
      ship.current.position.set(p.x, state.height + 0.8 - state.landing, p.z);
      ship.current.rotation.set(
        state.airborne
          ? -Math.atan2(state.verticalVelocity, COURSE.speed) * 0.28
          : 0,
        -p.yaw,
        -state.lateralVelocity * 0.025,
      );
    }
    if (exhaust.current) exhaust.current.scale.z = state.airborne ? 1.35 : 1;
    if (shadow.current) {
      shadow.current.visible = p.y >= 0;
      shadow.current.position.set(p.x, p.y + 0.06, p.z);
      const heightAboveDeck = Math.max(0, state.height - p.y);
      const landingAccent = reduced ? 0 : state.landing;
      const shadowSize = 1 + heightAboveDeck * 0.1;
      shadow.current.scale.set(
        shadowSize * (1 + landingAccent * 0.5),
        shadowSize * (1 - landingAccent * 0.4),
        1,
      );
      // Airborne softness and a tiny landing compression; simulation is read-only.
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = reduced
        ? 0.24
        : Math.max(0.12, 0.24 - heightAboveDeck * 0.018) + landingAccent * 0.2;
    }
    if (sun.current) {
      sun.current.position.set(p.x - 12, state.height + 24, p.z + 9);
      sun.current.target.position.set(p.x, state.height, p.z);
      sun.current.target.updateMatrixWorld();
    }
    vectors.desired.set(
      p.x - Math.sin(p.yaw) * 10,
      state.height + 5.6,
      p.z + Math.cos(p.yaw) * 10,
    );
    camera.position.lerp(
      vectors.desired,
      runtime.running ? 1 - Math.exp(-delta * 6) : 1,
    );
    vectors.look.set(ahead.x, Math.max(ahead.y, COURSE.deck) + 1.1, ahead.z);
    vectors.aim.lerp(
      vectors.look,
      runtime.running ? 1 - Math.exp(-delta * 7) : 1,
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(vectors.aim);
    if (!reduced) {
      vectors.roll.setFromAxisAngle(
        vectors.axis,
        Math.max(
          -0.07,
          Math.min(
            0.07,
            (ahead.yaw - p.yaw) * 0.24 - state.lateralVelocity * 0.006,
          ),
        ),
      );
      camera.quaternion.multiply(vectors.roll);
    }
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = reduced
        ? 58
        : 60 +
          Math.min(
            6,
            (Math.hypot(COURSE.speed, state.verticalVelocity) - COURSE.speed) *
              1.2,
          ) +
          Math.abs(ahead.yaw - p.yaw) * 7;
      camera.fov = THREE.MathUtils.lerp(
        camera.fov,
        fov,
        1 - Math.exp(-delta * 4),
      );
      camera.updateProjectionMatrix();
    }
    const trafficCount = lowQuality
      ? Math.min(trafficShips.length, audience === "teen" ? 4 : 2)
      : trafficShips.length;
    trafficRefs.current.forEach((traffic, i) => {
      if (!traffic) return;
      traffic.visible = i < trafficCount && runtime.running;
      if (!traffic.visible) return;
      const cycle =
        (state.elapsed * (audience === "teen" ? 34 : 26) + i * 83) % 180;
      const relative = 70 - cycle;
      const trafficDistance = THREE.MathUtils.clamp(
        state.distance + relative,
        8,
        COURSE.length - 8,
      );
      const side = i % 2 === 0 ? -1 : 1;
      const tp = trackPoint(
        trafficDistance,
        side * (9.5 + (i % 3) * 1.8),
      );
      traffic.position.set(tp.x, COURSE.deck - 3.9, tp.z);
      traffic.rotation.set(0, -tp.yaw + Math.PI, 0);
    });

    const item = runtime.pickup;
    if (pickup.current) {
      pickup.current.visible = !!item;
      if (item) {
        const ip = trackPoint(item.distance, item.lateral);
        pickup.current.position.set(ip.x, item.height + 0.85, ip.z);
        pickup.current.rotation.y =
          -ip.yaw + (reduced ? 0 : state.elapsed * 0.28);
        objects.slice(1).forEach((object, index) => {
          object.object.visible = index === item.model;
        });
      }
    }
    if (burst.current) {
      burst.current.visible = runtime.fx.age < 0.7;
      if (burst.current.visible) {
        const fxp = trackPoint(runtime.fx.distance, runtime.fx.lateral);
        burst.current.position.set(fxp.x, runtime.fx.height + 0.9, fxp.z);
        burst.current.scale.setScalar(reduced ? 0.4 : 0.3 + runtime.fx.age * 2);
        burst.current.children.forEach((object) => {
          ((object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
            Math.max(0, 1 - runtime.fx.age / 0.7);
        });
      }
    }
    if (runtime.running && !runtime.paused && now >= runtime.hudAt) {
      runtime.hudAt = now + 100;
      onUpdate();
    }
    if (state.finished && !notified.current) {
      notified.current = true;
      onFinish();
    }
  });

  return (
    <>
      <TrackWorld reduced={reduced} audience={audience} />
      {!lowQuality && (
        <directionalLight
          ref={sun}
          castShadow
          intensity={0.75}
          color="#fff2d2"
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-camera-near={1}
          shadow-camera-far={65}
          shadow-bias={-0.001}
        />
      )}
      <group>
        {trafficShips.map((model, i) => (
          <group
            key={i}
            ref={(node) => {
              trafficRefs.current[i] = node;
            }}
            visible={false}
          >
            <primitive object={model.object} dispose={null} />
          </group>
        ))}
      </group>
      <group ref={ship}>
        <primitive object={objects[0].object} dispose={null} />
        <group ref={exhaust} position={[0, -0.1, 1.1]}>
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} position={[x, 0, 0.28]} scale={[0.1, 0.07, 0.65]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshBasicMaterial
                color="#60e7ff"
                transparent
                opacity={0.48}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 24]} />
        <meshBasicMaterial
          color="#173f51"
          transparent
          opacity={0.24}
          depthWrite={false}
        />
      </mesh>
      <group ref={pickup} visible={false}>
        {objects.slice(1).map((model, i) => (
          <primitive key={i} object={model.object} dispose={null} />
        ))}
      </group>
      <group ref={burst} visible={false}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh
            key={i}
            position={[
              Math.sin(i * 2.4) * 0.7,
              Math.cos(i * 2.4) * 0.6,
              Math.sin(i * 1.2) * 0.4,
            ]}
          >
            <octahedronGeometry args={[0.045]} />
            <meshBasicMaterial
              color={i % 3 ? "#ffd457" : "#79edee"}
              transparent
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
});
