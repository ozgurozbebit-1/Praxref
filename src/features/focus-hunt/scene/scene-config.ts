export const focusHuntSceneMode = "production" as const;
export const levelChunks = [
  "asteroid-canyon",
  "crystal-passage",
  "abandoned-relay",
  "energy-rift",
  "atlas-gate",
] as const;
export const assetPipeline = {
  ship: "/assets/3d/ships/praxref-atlas.glb",
  environment: "/assets/3d/environment/",
  props: "/assets/3d/props/",
  fx: "/assets/3d/fx/",
} as const;
export const shipDesignReferencePath =
  "/assets/3d/ships/reference/praxref_atlas.png";
export const shipModelPath = assetPipeline.ship;
export const shipScale = 2.4;
export const shipRotation = [0, 0, 0] as const;
export const shipPosition = [0, -1.55, 0.85] as const;
export const shipFallbackEnabled = true;
