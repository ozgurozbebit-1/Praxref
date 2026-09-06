import type { Color, Shape, Stimulus } from "../types";

export type TownSocket = {
  id: string;
  name: string;
  position: [number, number, number];
  host: "shop" | "mailbox" | "planter" | "harbour";
  hitSize: number;
};
export type WorldDefinition = { id: string; sockets: TownSocket[] };
const positions: [number, number, number][] = [
  [-8.91, 2.15, -7.13],
  [-2.65, 2.05, -7.48],
  [3.24, 2.18, -7.08],
  [8.91, 2.0, -6.79],
  [-10.21, 1.15, -2.20],
  [-5.01, 1.05, 1.91],
  [4.54, 1.1, -1.04],
  [9.68, 1.0, 1.80],
  [-9.85, 0.95, 5.74],
  [-3.89, 0.95, 6.55],
  [1.95, 0.95, 5.51],
  [8.08, 0.95, 6.32],
  [-9.20, 1.0, 9.45],
  [-2.36, 1.0, 9.80],
  [4.07, 1.0, 9.34],
  [9.32, 1.0, 8.93],
  [-11.15, 1.25, -4.93],
  [-6.43, 1.15, -3.71],
  [-1, 1.3, -5.05],
  [5.43, 1.15, -3.65],
  [-10.80, 1.15, 7.25],
  [-6.67, 1.1, 7.95],
  [0.41, 1.1, 7.25],
  [6.55, 1.1, 7.71],
];
const names = [
  "Dondurmacı tabelası",
  "Fırın menü panosu",
  "Çiçekçi kapı levhası",
  "Kafe tente tabelası",
  "Park posta kutusu",
  "Bank yanındaki posta kutusu",
  "Çeşme yanı posta kutusu",
  "Kafe köşesi posta kutusu",
  "Limonluk saksısı",
  "Meydan çiçekliği",
  "Lavanta küpü",
  "Sahil seramik saksısı",
  "İskele servis dolabı",
  "Yelken kulübü dolabı",
  "Köprü ekipman kutusu",
  "Liman dolabı",
];
export const COAST_TOWN: WorldDefinition = {
  id: "sunny-coast",
  sockets: positions.map((position, i) => ({
    id: `coast-${i + 1}`,
    name: names[i] ?? `Kasaba levhası ${i + 1}`,
    position,
    host: i < 4 ? "shop" : i < 8 ? "mailbox" : i < 12 ? "planter" : "harbour",
    hitSize: 55,
  })),
};
export const TOWN_COLORS: Record<Color, string> = {
  blue: "#3479c9",
  gold: "#d99b25",
  purple: "#8861c4",
  coral: "#d66b65",
};
export const COLOR_LABELS: Record<Color, string> = {
  blue: "Mavi",
  gold: "Altın",
  purple: "Mor",
  coral: "Mercan",
};
export const SHAPE_LABELS: Record<Shape, string> = {
  star: "yıldız",
  circle: "daire",
  triangle: "üçgen",
  square: "kare",
};
export type PlacedStimulus = {
  socket: TownSocket;
  stimulus: Stimulus;
  active: boolean;
};
/** The future production adapter can supply its original stimuli without regeneration. */
export function mapTrialToWorld(
  stimuli: Stimulus[],
  world = COAST_TOWN,
): PlacedStimulus[] {
  if (stimuli.length > world.sockets.length)
    throw new Error("World hotspot capacity exceeded");
  return stimuli.map((stimulus, i) => ({
    socket: world.sockets[i],
    stimulus,
    active: true,
  }));
}
export function townZoom(width: number, height: number) {
  return Math.min(width / 27.5, height / (height < 300 ? 17 : 23.5));
}
export function ambientMotion(time: number, reduced: boolean) {
  return reduced ? 0 : Math.sin(time * 0.65) * 0.025;
}
