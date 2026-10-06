"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
/** Small local sign typography; no font download, no change to the actual brand mark. */
export function CityLabel({
  text,
  width = 3,
  height = 0.38,
}: {
  text: string;
  width?: number;
  height?: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#e8ece6";
      context.font = "600 27px Arial";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(text, 256, 32, 490);
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
