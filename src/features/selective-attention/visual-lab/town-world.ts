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
  [-7.55, 2.15, -6.15],
  [-2.25, 2.05, -6.45],
  [2.75, 2.18, -6.1],
  [7.55, 2.0, -5.85],
  [-8.65, 1.15, -1.9],
  [-4.25, 1.05, 1.65],
  [3.85, 1.1, -0.9],
  [8.2, 1.0, 1.55],
  [-8.35, 0.95, 4.95],
  [-3.3, 0.95, 5.65],
  [1.65, 0.95, 4.75],
  [6.85, 0.95, 5.45],
  [-7.8, 1.0, 8.15],
  [-2.0, 1.0, 8.45],
  [3.45, 1.0, 8.05],
  [7.9, 1.0, 7.7],
  [-9.45, 1.25, -4.25],
  [-5.45, 1.15, -3.2],
  [-0.85, 1.3, -4.35],
  [4.6, 1.15, -3.15],
  [-9.15, 1.15, 6.25],
  [-5.65, 1.1, 6.85],
  [0.35, 1.1, 6.25],
  [5.55, 1.1, 6.65],
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
