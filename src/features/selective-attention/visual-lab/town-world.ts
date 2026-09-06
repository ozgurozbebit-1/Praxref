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
  [-7.3, 1.8, -5.8],
  [-2.5, 1.8, -6.2],
  [2.5, 1.8, -5.9],
  [7.4, 1.8, -5.6],
  [-7.8, 1.15, -1.5],
  [-2.7, 1.15, -1.4],
  [2.6, 1.15, -1.2],
  [7.6, 1.15, -1.1],
  [-7.3, 1.05, 3.2],
  [-2.5, 1.05, 3.4],
  [2.6, 1.05, 3.5],
  [7.3, 1.05, 3.3],
  [-7.5, 1.0, 7.9],
  [-2.6, 1.0, 8.1],
  [2.5, 1.0, 8.0],
  [7.4, 1.0, 7.8],
  [-9, 1.3, -3.8],
  [-4.8, 1.2, -3.8],
  [0, 1.3, -4],
  [5, 1.2, -3.7],
  [-9, 1.2, 5.7],
  [-4.8, 1.2, 5.8],
  [0, 1.2, 5.6],
  [5, 1.2, 5.9],
];
const names = [
  "Dondurmacı levhası",
  "Fırın levhası",
  "Çiçekçi levhası",
  "Kafe levhası",
  "Park posta kutusu",
  "Meydan posta kutusu",
  "Çeşme posta kutusu",
  "Kafe posta kutusu",
  "Limon ağacı saksısı",
  "Bahçe saksısı",
  "Lavanta saksısı",
  "Sahil saksısı",
  "İskele dolabı",
  "Yelken kulübü dolabı",
  "Köprü dolabı",
  "Liman dolabı",
];
export const COAST_TOWN: WorldDefinition = {
  id: "sunny-coast",
  sockets: positions.map((position, i) => ({
    id: `coast-${i + 1}`,
    name: names[i] ?? `Kasaba levhası ${i + 1}`,
    position,
    host: i < 4 ? "shop" : i < 8 ? "mailbox" : i < 12 ? "planter" : "harbour",
    hitSize: 44,
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
  return Math.min(width / 22, height / (height < 300 ? 14 : 19.5));
}
export function ambientMotion(time: number, reduced: boolean) {
  return reduced ? 0 : Math.sin(time * 0.65) * 0.025;
}
