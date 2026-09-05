import { useGLTF } from "@react-three/drei";
import { shipModelPath } from "../scene-config";
export const preloadAtlasShip = () => useGLTF.preload(shipModelPath);
export const useAtlasShip = () => useGLTF(shipModelPath);
