"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, RoundedBox, OrthographicCamera } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { Group, Mesh, MeshStandardMaterial, Shape } from "three";
import {
  ambientMotion,
  COLOR_LABELS,
  SHAPE_LABELS,
  TOWN_COLORS,
  townZoom,
  type PlacedStimulus,
} from "./town-world";
import type { DemoState } from "./demo";
import styles from "./town.module.css";

type V3 = [number, number, number];
function Block({
  position,
  size,
  color,
  radius = 0.09,
}: {
  position: V3;
  size: V3;
  color: string;
  radius?: number;
}) {
  return (
    <RoundedBox
      position={position}
      args={size}
      radius={radius}
      smoothness={2}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.78} />
    </RoundedBox>
  );
}
function Tree({
  position,
  reduced,
  variant = 0,
}: {
  position: V3;
  reduced: boolean;
  variant?: number;
}) {
  const leaves = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (leaves.current)
      leaves.current.rotation.z = ambientMotion(
        clock.elapsedTime + position[0],
        reduced,
      );
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.23, 1.8, 8]} />
        <meshStandardMaterial color="#987951" />
      </mesh>
      <group ref={leaves} position={[0, 1.6, 0]}>
        {[
          [0, 0.5, 0, 0.88],
          [-0.5, 0.2, 0.15, 0.63],
          [0.48, 0.32, 0, 0.7],
        ].map(([x, y, z, s], i) => (
          <mesh
            key={i}
            position={[x, y, z]}
            scale={[s, s * 1.25, s]}
            castShadow
          >
            <icosahedronGeometry args={[1, 2]} />
            <meshStandardMaterial
              color={
                variant
                  ? ["#66ac72", "#88bd77", "#4b9e68"][i]
                  : ["#3b947c", "#69ad7c", "#438969"][i]
              }
              roughness={0.95}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
function Shop({
  x,
  z,
  color,
  awning,
  kind,
}: {
  x: number;
  z: number;
  color: string;
  awning: string;
  kind: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <Block
        position={[0, 1.65, 0]}
        size={[3.9, 3.3, 3.1]}
        color={color}
        radius={0.16}
      />
      <Block position={[0, 3.35, 0]} size={[4.2, 0.23, 3.5]} color="#fff0d6" />
      <mesh
        position={[0, 3.8, 0]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[1, 0.34, 0.83]}
        castShadow
      >
        <coneGeometry args={[3, 2, 4]} />
        <meshStandardMaterial color={awning} roughness={0.72} />
      </mesh>
      {[-1.15, 1.15].map((xx) => (
        <group key={xx} position={[xx, 1.7, 1.59]}>
          <Block
            position={[0, 0, 0]}
            size={[0.95, 1.45, 0.16]}
            color="#fff2d9"
          />
          <Block
            position={[0, 0, 0.1]}
            size={[0.71, 1.17, 0.06]}
            color="#416f80"
          />
          <Block
            position={[0, 0, 0.15]}
            size={[0.06, 1.2, 0.06]}
            color="#fff4da"
          />
          <Block
            position={[0, 0, 0.15]}
            size={[0.75, 0.055, 0.06]}
            color="#fff4da"
          />
        </group>
      ))}
      <Block
        position={[0, 0.65, 1.64]}
        size={[0.85, 1.3, 0.16]}
        color="#376b76"
      />
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <mesh
            position={[-1.75 + i * 0.5, 2.45, 1.87]}
            rotation={[-0.18, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.49, 0.12, 1.0]} />
            <meshStandardMaterial color={i % 2 ? "#fff2dc" : awning} />
          </mesh>
          <mesh position={[-1.75 + i * 0.5, 2.27, 2.35]}>
            <sphereGeometry
              args={[0.245, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshStandardMaterial color={i % 2 ? "#fff2dc" : awning} />
          </mesh>
        </group>
      ))}
      <Block position={[0, 0.18, 1.75]} size={[4.4, 0.28, 1]} color="#eee1c5" />
      {kind === 0 && (
        <group position={[-1.7, 3.9, 0]}>
          <mesh>
            <coneGeometry args={[0.32, 0.85, 16]} />
            <meshStandardMaterial color="#dcb77a" />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.44, 16, 12]} />
            <meshStandardMaterial color="#efc1b1" />
          </mesh>
        </group>
      )}
      {kind === 2 &&
        [-1.5, 1.5].map((xx) => (
          <group key={xx} position={[xx, 0.55, 2.55]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.22, 0.5, 12]} />
              <meshStandardMaterial color="#d78a6b" />
            </mesh>
            {[-0.15, 0, 0.15].map((dx, i) => (
              <mesh key={i} position={[dx, 0.48, 0]}>
                <sphereGeometry args={[0.16, 10, 8]} />
                <meshStandardMaterial
                  color={["#f3cc78", "#d6808f", "#fff0dd"][i]}
                />
              </mesh>
            ))}
          </group>
        ))}
    </group>
  );
}
function Bench({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {[-0.65, 0.65].map((x) => (
        <Block
          key={x}
          position={[x, 0.28, 0]}
          size={[0.12, 0.56, 0.75]}
          color="#466e6d"
        />
      ))}
      {[-0.25, 0, 0.25].map((z) => (
        <Block
          key={z}
          position={[0, 0.61, z]}
          size={[1.9, 0.1, 0.18]}
          color="#c99867"
        />
      ))}
      <Block
        position={[0, 0.98, -0.33]}
        size={[1.9, 0.48, 0.1]}
        color="#c99867"
      />
    </group>
  );
}
function Lamp({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.045, 0.065, 2.4, 8]} />
        <meshStandardMaterial color="#46686c" />
      </mesh>
      <mesh position={[0, 2.45, 0]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial
          color="#fff3bd"
          emissive="#ffc768"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 2.67, 0]}>
        <coneGeometry args={[0.3, 0.2, 12]} />
        <meshStandardMaterial color="#46686c" />
      </mesh>
    </group>
  );
}
function Fountain({ reduced }: { reduced: boolean }) {
  const water = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (water.current)
      water.current.scale.y = 1 + ambientMotion(clock.elapsedTime, reduced) * 2;
  });
  return (
    <group position={[0, 0, 0.8]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.45, 1.6, 0.28, 32]} />
        <meshStandardMaterial color="#e8dcc1" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.21, 1.21, 0.16, 32]} />
        <meshStandardMaterial color="#66caca" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.23, 0.4, 1.2, 16]} />
        <meshStandardMaterial color="#f3e5c9" />
      </mesh>
      <mesh position={[0, 1.24, 0]}>
        <cylinderGeometry args={[0.66, 0.2, 0.16, 24]} />
        <meshStandardMaterial color="#f0debb" />
      </mesh>
      <mesh ref={water} position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#b2eeeb" transparent opacity={0.7} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.58, 0.87, Math.sin(a) * 0.58]}
          >
            <cylinderGeometry args={[0.017, 0.035, 0.65, 5]} />
            <meshStandardMaterial color="#a3e4df" transparent opacity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}
function Sea({ reduced }: { reduced: boolean }) {
  const ripples = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ripples.current)
      ripples.current.position.z =
        ambientMotion(clock.elapsedTime * 0.45, reduced) * 5;
  });
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.7, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#62bec4" roughness={0.34} />
      </mesh>
      <group ref={ripples}>
        {Array.from({ length: 26 }, (_, i) => (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, -0.08]}
            position={[-18 + ((i * 7.1) % 36), -0.68, 11 + ((i * 3.7) % 15)]}
          >
            <planeGeometry args={[0.7 + (i % 4) * 0.7, 0.045]} />
            <meshBasicMaterial color="#c5f0e5" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function TownWalker({
  path,
  phase,
  shirt,
  reduced,
}: {
  path: [V3, V3];
  phase: number;
  shirt: string;
  reduced: boolean;
}) {
  const group = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    if (reduced) {
      leftArm.current?.rotation.set(0, 0, 0);
      rightArm.current?.rotation.set(0, 0, 0);
      leftLeg.current?.rotation.set(0, 0, 0);
      rightLeg.current?.rotation.set(0, 0, 0);
      return;
    }

    const speed = 0.48; // ~50% faster than the previous 0.32 pace.
    const cycle = clock.elapsedTime * speed + phase;
    const t = (Math.sin(cycle) + 1) / 2;
    const [a, b] = path;
    group.current.position.set(
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    );
    group.current.rotation.y = Math.cos(cycle) >= 0 ? 0 : Math.PI;

    const stride = Math.sin(clock.elapsedTime * 4.8 + phase) * 0.42;
    if (leftArm.current) leftArm.current.rotation.x = stride;
    if (rightArm.current) rightArm.current.rotation.x = -stride;
    if (leftLeg.current) leftLeg.current.rotation.x = -stride * 0.72;
    if (rightLeg.current) rightLeg.current.rotation.x = stride * 0.72;
  });

  const skin = "#d9ad88";
  const hair = "#4d4038";
  const trousers = "#53666d";
  const shoes = "#39484d";

  return (
    <group ref={group} position={path[0]} scale={0.82}>
      <mesh position={[0, 2.0, 0]} castShadow>
        <sphereGeometry args={[0.28, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.92} />
      </mesh>
      <mesh position={[0, 2.19, -0.03]} scale={[1.02, 0.55, 1.02]} castShadow>
        <sphereGeometry args={[0.29, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hair} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <capsuleGeometry args={[0.31, 0.74, 6, 12]} />
        <meshStandardMaterial color={shirt} roughness={0.9} />
      </mesh>
      <group ref={leftArm} position={[-0.38, 1.55, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.58, 5, 9]} />
          <meshStandardMaterial color={skin} roughness={0.92} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.38, 1.55, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.58, 5, 9]} />
          <meshStandardMaterial color={skin} roughness={0.92} />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.16, 0.78, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.58, 5, 9]} />
          <meshStandardMaterial color={trousers} roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.72, 0.08]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.34]} />
          <meshStandardMaterial color={shoes} roughness={0.95} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.16, 0.78, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.58, 5, 9]} />
          <meshStandardMaterial color={trousers} roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.72, 0.08]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.34]} />
          <meshStandardMaterial color={shoes} roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}
function TownEnvironment({ reduced }: { reduced: boolean }) {
  return (
    <>
      <Sea reduced={reduced} />
      <Block
        position={[0, -0.4, -0.3]}
        size={[23, 0.65, 23]}
        color="#d7cfac"
        radius={0.3}
      />
      <Block
        position={[0, -0.03, -0.5]}
        size={[22.7, 0.18, 22.4]}
        color="#e5dbc0"
      />
      <Block
        position={[0, 0.075, 0.7]}
        size={[4, 0.04, 19.5]}
        color="#f2e7cd"
      />
      <Block
        position={[0, 0.085, 1.0]}
        size={[21.7, 0.04, 3.2]}
        color="#f2e7cd"
      />
      {[-9.8, 9.8].map((x) => (
        <Block
          key={x}
          position={[x, 0.12, 1.9]}
          size={[2.4, 0.2, 15.5]}
          color="#8ab790"
          radius={0.3}
        />
      ))}
      <Shop x={-7.3} z={-7.9} color="#f0c6a3" awning="#d98778" kind={0} />
      <Shop x={-2.5} z={-8.3} color="#f4dca1" awning="#729fa5" kind={1} />
      <Shop x={2.5} z={-8.0} color="#c0d9bb" awning="#af8bab" kind={2} />
      <Shop x={7.4} z={-7.7} color="#abd1d2" awning="#d59e62" kind={3} />
      {[
        [-10, 0, -5],
        [-10, 0, 0],
        [-10, 0, 5],
        [10, 0, -4],
        [10, 0, 1],
        [10, 0, 6],
        [-5, 0, 4.5],
        [5, 0, 5],
      ].map((p, i) => (
        <Tree key={i} position={p as V3} reduced={reduced} variant={i % 2} />
      ))}
      <Fountain reduced={reduced} />
      <TownWalker path={[[ -8.8, 0, 2.5 ], [ -5.8, 0, 2.5 ]]} phase={0} shirt="#7d9f8c" reduced={reduced} />
      <TownWalker path={[[ 4.6, 0, 3.0 ], [ 7.7, 0, 3.0 ]]} phase={2.2} shirt="#c69a74" reduced={reduced} />
      <TownWalker path={[[ -1.2, 0, 7.0 ], [ 1.8, 0, 7.0 ]]} phase={4.1} shirt="#718c9b" reduced={reduced} />
      <Bench position={[-5.1, 0, 0.5]} />
      <Bench position={[5.1, 0, 0.5]} />
      <Bench position={[-5.1, 0, 5.8]} />
      {[
        [-9, 0, -3],
        [9, 0, -3],
        [-9, 0, 8.7],
        [9, 0, 8.7],
      ].map((p, i) => (
        <Lamp key={i} position={p as V3} />
      ))}
      <group position={[5.1, 0.8, 5.7]}>
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <torusGeometry args={[0.36, 0.055, 6, 18]} />
            <meshStandardMaterial color="#537a7e" />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 3]}>
          <torusGeometry args={[0.42, 0.045, 6, 3]} />
          <meshStandardMaterial color="#d3946d" />
        </mesh>
        <Block
          position={[0.25, 0.4, 0]}
          size={[0.4, 0.07, 0.16]}
          color="#58706c"
        />
      </group>
      <group position={[0, 0, 10.5]}>
        {Array.from({ length: 24 }, (_, i) => (
          <Block
            key={i}
            position={[-11.5 + i, 0.18, 0]}
            size={[0.9, 0.12, 1.2]}
            color={i % 2 ? "#c8a985" : "#d6b792"}
          />
        ))}
        {[-10, -5, 0, 5, 10].map((x) => (
          <mesh key={x} position={[x, -0.12, 0.1]}>
            <cylinderGeometry args={[0.12, 0.12, 1.4, 8]} />
            <meshStandardMaterial color="#aa906e" />
          </mesh>
        ))}
      </group>
      <group position={[12, -0.35, -10]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.8, 1.25, 6, 20]} />
          <meshStandardMaterial color="#f6e9d3" />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.93, 1, 0.6, 20]} />
          <meshStandardMaterial color="#e09674" />
        </mesh>
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.8, 16]} />
          <meshStandardMaterial color="#5d99a3" />
        </mesh>
        <mesh position={[0, 3.8, 0]}>
          <coneGeometry args={[1.15, 0.8, 16]} />
          <meshStandardMaterial color="#d39073" />
        </mesh>
      </group>
      <group position={[-13, -0.35, 5]} rotation={[0, 0.3, 0]}>
        <mesh scale={[0.65, 0.4, 1.7]}>
          <sphereGeometry args={[1, 18, 10]} />
          <meshStandardMaterial color="#f0e9ce" />
        </mesh>
        <Block
          position={[0, 1.1, 0]}
          size={[0.065, 2.5, 0.065]}
          color="#8b8974"
        />
        <mesh position={[0.3, 1.2, 0]}>
          <coneGeometry args={[0.75, 1.8, 3]} />
          <meshStandardMaterial color="#edb08c" />
        </mesh>
      </group>
    </>
  );
}
function symbolShape(kind: string) {
  const shape = new Shape();
  if (kind === "circle") {
    shape.absarc(0, 0, 0.4, 0, Math.PI * 2, false);
    return shape;
  }
  const points = kind === "star" ? 10 : kind === "triangle" ? 3 : 4;
  for (let i = 0; i < points; i++) {
    const a =
      Math.PI / 2 +
      (i * Math.PI * 2) / points +
      (kind === "square" ? Math.PI / 4 : 0);
    const r = kind === "star" && i % 2 ? 0.22 : 0.46;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}
function TownSymbol({
  placed,
  response,
  onSelect,
  reduced,
}: {
  placed: PlacedStimulus;
  response: DemoState["response"];
  onSelect: (id: string) => void;
  reduced: boolean;
}) {
  const { socket, stimulus } = placed;
  const face = useRef<Group>(null),
    material = useRef<MeshStandardMaterial>(null),
    age = useRef(0);
  const shape = useMemo(() => symbolShape(stimulus.shape), [stimulus.shape]);
  const hostFace = useMemo(() => {
    const outline = new Shape();
    if (socket.host === "planter") {
      outline.moveTo(-0.78, 0.64);
      outline.lineTo(0.78, 0.64);
      outline.lineTo(0.56, -0.7);
      outline.lineTo(-0.56, -0.7);
    } else if (socket.host === "mailbox") {
      outline.moveTo(-0.74, -0.7);
      outline.lineTo(0.74, -0.7);
      outline.lineTo(0.74, 0.28);
      outline.quadraticCurveTo(0.74, 0.8, 0, 0.8);
      outline.quadraticCurveTo(-0.74, 0.8, -0.74, 0.28);
    } else {
      const x = socket.host === "shop" ? 0.87 : 0.75;
      outline.moveTo(-x, -0.66);
      outline.lineTo(x, -0.66);
      outline.lineTo(x, 0.66);
      outline.lineTo(-x, 0.66);
    }
    outline.closePath();
    return outline;
  }, [socket.host]);
  const chosen = response?.id === stimulus.id;
  useEffect(() => {
    age.current = 0;
  }, [response]);
  useFrame((_, delta) => {
    age.current += delta;
    if (face.current)
      face.current.scale.setScalar(
        chosen && !reduced
          ? 1 + Math.sin(Math.min(1, age.current / 0.22) * Math.PI) * 0.055
          : 1,
      );
    if (material.current)
      material.current.emissiveIntensity = chosen
        ? Math.max(0, 0.32 * (1 - age.current / 0.3))
        : 0;
  });
  return (
    <group position={socket.position}>
      {socket.host === "planter" ? (
        <>
          <mesh position={[0, -0.55, 0]} castShadow>
            <cylinderGeometry args={[0.85, 0.63, 1.1, 16]} />
            <meshStandardMaterial color="#d6aa89" />
          </mesh>
          {[-0.4, 0.4].map((x) => (
            <mesh key={x} position={[x, 0.5, -0.35]} scale={[0.22, 0.5, 0.2]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color="#609b78" />
            </mesh>
          ))}
        </>
      ) : socket.host === "mailbox" ? (
        <>
          <Block
            position={[0, -0.52, -0.2]}
            size={[0.16, 1.3, 0.16]}
            color="#496d70"
          />
          <Block
            position={[0, 0, -0.24]}
            size={[1.6, 1.1, 0.65]}
            color="#efe4ce"
          />
        </>
      ) : socket.host === "harbour" ? (
        <Block
          position={[0, -0.4, -0.2]}
          size={[1.75, 1.5, 0.8]}
          color="#a0c3bb"
        />
      ) : (
        <Block
          position={[0, 0, -0.2]}
          size={[1.85, 1.6, 0.22]}
          color="#eee2c7"
        />
      )}
      <Block
        position={[0, -0.58, 0.4]}
        size={[0.16, 0.16, 1.0]}
        color="#617f78"
      />
      <group position={[0, 0, 0.9]} rotation={[-0.62, 0, 0]} ref={face}>
        <mesh position={[0, 0, -0.42]} castShadow receiveShadow>
          <extrudeGeometry
            args={[
              hostFace,
              {
                depth: 0.57,
                bevelEnabled: true,
                bevelSize: 0.04,
                bevelThickness: 0.03,
                bevelSegments: 2,
                steps: 1,
                curveSegments: 12,
              },
            ]}
          />
          <meshStandardMaterial
            ref={material}
            color={TOWN_COLORS[stimulus.color]}
            roughness={0.65}
            emissive={response?.correct ? "#b8ead7" : "#bd7864"}
            emissiveIntensity={0}
          />
        </mesh>
        {socket.host === "mailbox" && (
          <Block
            position={[0, 0.57, 0.19]}
            size={[0.62, 0.07, 0.05]}
            color="#375862"
          />
        )}
        {socket.host === "planter" && (
          <Block
            position={[0, 0.66, 0.12]}
            size={[1.63, 0.12, 0.18]}
            color="#e3c7aa"
          />
        )}
        {socket.host === "harbour" && (
          <>
            <Block
              position={[-0.62, 0, 0.19]}
              size={[0.04, 1.1, 0.03]}
              color="#cfe2d7"
            />
            <Block
              position={[0.6, -0.2, 0.2]}
              size={[0.09, 0.18, 0.07]}
              color="#efdec0"
            />
          </>
        )}
        <mesh position={[0, 0, 0.18]}>
          <extrudeGeometry
            args={[
              shape,
              {
                depth: 0.035,
                bevelEnabled: true,
                bevelSegments: 1,
                steps: 1,
                bevelSize: 0.01,
                bevelThickness: 0.01,
                curveSegments: 16,
              },
            ]}
          />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
        <mesh position={[-0.64, 0.53, 0.18]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#e4d8bd" />
        </mesh>
        <mesh position={[0.64, -0.53, 0.18]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#e4d8bd" />
        </mesh>
      </group>
      <Html center position={[0, 0.04, 0.98]} zIndexRange={[20, 0]}>
        <button
          className={styles.hotspot}
          type="button"
          data-hotspot={socket.id}
          aria-label={`${COLOR_LABELS[stimulus.color]} ${SHAPE_LABELS[stimulus.shape]} — ${socket.name}`}
          disabled={!placed.active}
          onClick={() => onSelect(stimulus.id)}
          style={{ width: socket.hitSize, height: socket.hitSize }}
        >
          <span className={styles.srOnly}>{socket.name}</span>
        </button>
      </Html>
    </group>
  );
}
function Framing() {
  const { size } = useThree();
  return (
    <OrthographicCamera
      makeDefault
      position={[0, 21, size.height < 300 ? 24.5 : 24]}
      rotation={[-Math.PI / 4, 0, 0]}
      zoom={townZoom(size.width, size.height)}
      near={0.1}
      far={150}
    />
  );
}
export default function TownScene({
  placed,
  response,
  onSelect,
  reduced,
}: {
  placed: PlacedStimulus[];
  response: DemoState["response"];
  onSelect: (id: string) => void;
  reduced: boolean;
}) {
  return (
    <Canvas
      orthographic
      shadows
      frameloop={reduced ? "demand" : "always"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 21, 24], zoom: 25, near: 0.1, far: 150 }}
      gl={{ antialias: true, alpha: false }}
      fallback={
        <p className={styles.noWebgl}>
          Bu görsel laboratuvar için WebGL destekli bir tarayıcı gerekli.
        </p>
      }
    >
      <color attach="background" args={["#a6dcd9"]} />
      <fog attach="fog" args={["#a6dcd9", 65, 110]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff2dc", "#78a7a0", 0.9]} />
      <directionalLight
        position={[-12, 22, 8]}
        intensity={2.1}
        color="#fff0d3"
        castShadow
        shadow-autoUpdate={false}
        shadow-needsUpdate
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-normalBias={0.06}
        shadow-bias={-0.0001}
      />
      <Framing />
      <TownEnvironment reduced={reduced} />
      {placed.map((item) => (
        <TownSymbol
          key={item.socket.id}
          placed={item}
          response={response}
          onSelect={onSelect}
          reduced={reduced}
        />
      ))}
    </Canvas>
  );
}
