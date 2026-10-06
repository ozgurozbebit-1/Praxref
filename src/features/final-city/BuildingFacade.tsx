"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { seeded } from "./city-model";

const PALETTE = ["#d7d0bd", "#bf8972", "#e1ddd2", "#869ba6", "#d4b184"];
/** Five merged material batches per building, regardless of its number of windows. */
function facade(index: number) {
  const type = index % 4,
    h = 9 + seeded(index + 2) * 22,
    w = 8 + seeded(index + 7) * 4,
    d = 10;
  const buckets: THREE.BufferGeometry[][] = Array.from({ length: 5 }, () => []);
  function box(
    material: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    g.translate(x, y, z);
    buckets[material].push(g);
  }
  box(0, 0, h / 2, 0, w, h, d);
  box(2, 0, h + 0.1, 0, w + 0.4, 0.3, d + 0.4);
  box(3, 1, h + 0.8, -1, 2.2, 1.3, 2.6);
  // Recessed shop glazing, columns and deep canvas awning.
  box(1, 0, 1.45, 5.04, w - 0.3, 2.8, 0.15);
  for (let c = -2; c <= 2; c++) box(2, (c * w) / 5, 1.5, 5.3, 0.17, 3, 0.4);
  box(4, 0, 3.15, 5.65, w + 0.1, 0.18, 1.5);
  box(4, 0, 2.96, 6.3, w + 0.1, 0.3, 0.06);
  box(3, 0, 2.48, 5.3, w * 0.65, 0.24, 0.12);
  const floors = Math.floor((h - 3.4) / 2.35),
    cols = type === 3 ? 5 : 4;
  for (let f = 0; f < floors; f++) {
    const y = 4.55 + f * 2.35;
    for (let c = 0; c < cols; c++) {
      const x = ((c - (cols - 1) / 2) * (w - 0.65)) / cols,
        ww = ((w - 0.9) / cols) * 0.73;
      box(2, x, y, 5.04, ww + 0.18, 1.67, 0.17);
      box(1, x, y, 5.14, ww, 1.45, 0.08);
      box(2, x, y - 0.81, 5.28, ww + 0.22, 0.12, 0.4);
      if (type === 1 && c % 2 === 0) {
        box(2, x, y - 0.87, 5.7, ww + 0.4, 0.17, 1.4);
        box(3, x, y - 0.4, 6.3, ww + 0.35, 0.075, 0.045);
        for (const side of [-1, 1])
          box(
            3,
            x + (side * (ww + 0.3)) / 2,
            y - 0.62,
            6.3,
            0.045,
            0.55,
            0.045,
          );
      }
    }
    for (const side of [-1, 1])
      for (let c = 0; c < 4; c++) {
        const z = (c - 1.5) * 2.22;
        box(2, side * (w / 2 + 0.045), y, z, 0.13, 1.67, 1.8);
        box(1, side * (w / 2 + 0.12), y, z, 0.04, 1.45, 1.58);
      }
    if (type === 3) box(2, 0, y - 0.96, 5.18, w + 0.12, 0.18, 0.25);
  }
  // Setback roof volume and vertical architectural fins break repeated silhouettes.
  if (type === 0) {
    box(0, 0, h + 1.45, -1, w * 0.64, 2.7, 6);
    box(2, 0, h + 2.85, -1, w * 0.67, 0.14, 6.2);
  }
  if (type === 3)
    for (const x of [-w * 0.45, w * 0.45])
      box(2, x, h * 0.5, 5.45, 0.18, h + 0.4, 0.8);
  return buckets.map((bucket) => {
    const merged = mergeGeometries(bucket);
    bucket.forEach((g) => g.dispose());
    return merged!;
  });
}
export function BuildingFacade({ index }: { index: number }) {
  const geometries = useMemo(() => facade(index), [index]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  const colors = [
    PALETTE[index % 5],
    "#497687",
    "#e0dfd3",
    "#3e5662",
    index % 2 ? "#7f403d" : "#385f68",
  ];
  return (
    <group>
      {geometries.map((geometry, i) => (
        <mesh
          key={i}
          geometry={geometry}
          castShadow={i === 0 || i === 2}
          receiveShadow
        >
          <meshStandardMaterial
            color={colors[i]}
            roughness={i === 1 ? 0.24 : 0.74}
            metalness={i === 1 ? 0.35 : 0.06}
          />
        </mesh>
      ))}
    </group>
  );
}
