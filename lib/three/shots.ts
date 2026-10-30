import type { AtmosphereId } from "./atmosphere";

export type SceneId = "residential" | "coworking" | "office" | "retail" | "district" | "cbd";

export type ShotFrame = { extent: number; target?: [number, number, number]; distance?: number; mapSize?: number };

export type Shot = {
  scene: SceneId;
  preset: AtmosphereId;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  shadow: ShotFrame;
  /** Output image size in pixels. */
  size: [number, number];
  /** Shift the subject sideways, as a share of the frame width (camera view offset). */
  shiftX?: number;
};

const RESIDENTIAL_SHADOW: ShotFrame = { extent: 170, target: [0, 40, 0], distance: 500, mapSize: 4096 };

/**
 * Camera set-ups for every concept image on the site. The dev-only /studio
 * route renders any of these so the imagery can be regenerated after the
 * models change (see README, "Regenerating concept images").
 */
export const SHOTS = {
  "cbd-hero": {
    scene: "cbd",
    preset: "daylight",
    position: [-262, 9, 252],
    target: [-14, 104, -14],
    fov: 44,
    shadow: { extent: 320, target: [0, 60, 0], distance: 800, mapSize: 4096 },
    size: [2400, 1350],
    shiftX: 0.16,
  },
  "residential-hero": {
    scene: "residential",
    preset: "dusk",
    position: [-128, 7, 150],
    target: [2, 66, -12],
    fov: 40,
    shadow: RESIDENTIAL_SHADOW,
    size: [2400, 1350],
    shiftX: 0.16,
  },
  "residential-facade": {
    scene: "residential",
    preset: "dusk",
    position: [-48, 30, 44],
    target: [-14, 92, -4],
    fov: 40,
    shadow: RESIDENTIAL_SHADOW,
    size: [1600, 2000],
  },
  "residential-deck": {
    scene: "residential",
    preset: "dusk",
    position: [32, 15.6, 30],
    target: [-2, 17, 6],
    fov: 52,
    shadow: RESIDENTIAL_SHADOW,
    size: [2000, 1400],
  },
  "residential-street": {
    scene: "residential",
    preset: "blue",
    position: [-62, 1.7, 74],
    target: [-10, 10, 20],
    fov: 46,
    shadow: RESIDENTIAL_SHADOW,
    size: [2000, 1300],
  },
  "coworking-exterior": {
    scene: "coworking",
    preset: "golden",
    position: [-62, 5, 96],
    target: [2, 17, 0],
    fov: 44,
    shadow: { extent: 110, target: [0, 10, 0], distance: 400, mapSize: 4096 },
    size: [2400, 1500],
  },
  "coworking-terrace": {
    scene: "coworking",
    preset: "dusk",
    position: [-62, 44, 34],
    target: [-6, 32, -10],
    fov: 46,
    shadow: { extent: 110, target: [0, 10, 0], distance: 400, mapSize: 4096 },
    size: [2000, 1300],
  },
  "office-exterior": {
    scene: "office",
    preset: "golden",
    position: [15.5, 1.7, 76],
    target: [-6, 20, -10],
    fov: 46,
    shadow: { extent: 150, target: [0, 10, 0], distance: 500, mapSize: 4096 },
    size: [2400, 1450],
  },
  "office-louvres": {
    scene: "office",
    preset: "golden",
    position: [36, 1.7, 7],
    target: [-14, 30, -6],
    fov: 50,
    shadow: { extent: 120, target: [0, 20, 0], distance: 500, mapSize: 4096 },
    size: [1600, 2000],
  },
  "retail-street": {
    scene: "retail",
    preset: "dusk",
    position: [58, 3.2, 74],
    target: [-6, 10, 12],
    fov: 42,
    shadow: { extent: 140, target: [0, 8, 0], distance: 500, mapSize: 4096 },
    size: [2400, 1450],
  },
  "retail-arcade": {
    scene: "retail",
    preset: "dusk",
    position: [38, 1.7, 22.4],
    target: [-10, 3.2, 19],
    fov: 56,
    shadow: { extent: 120, target: [0, 8, 0], distance: 500, mapSize: 4096 },
    size: [2000, 1400],
  },
  "district-golden": {
    scene: "district",
    preset: "golden",
    position: [-210, 70, 330],
    target: [0, 90, 0],
    fov: 38,
    shadow: { extent: 260, target: [0, 60, 0], distance: 700, mapSize: 4096 },
    size: [2400, 1350],
  },
  "district-dusk": {
    scene: "district",
    preset: "dusk",
    position: [150, 22, 260],
    target: [0, 110, -10],
    fov: 40,
    shadow: { extent: 260, target: [0, 60, 0], distance: 700, mapSize: 4096 },
    size: [2400, 1350],
  },
  "district-crown": {
    scene: "district",
    preset: "dusk",
    position: [-70, 205, 120],
    target: [0, 205, 0],
    fov: 40,
    shadow: { extent: 260, target: [0, 60, 0], distance: 700, mapSize: 4096 },
    size: [2000, 1400],
  },
  "district-night": {
    scene: "district",
    preset: "blue",
    position: [-120, 6, 230],
    target: [0, 70, 0],
    fov: 46,
    shadow: { extent: 260, target: [0, 60, 0], distance: 700, mapSize: 4096 },
    size: [2400, 1350],
  },
} satisfies Record<string, Shot>;

export type ShotId = keyof typeof SHOTS;

export const SHOT_IDS = Object.keys(SHOTS) as ShotId[];

export function getShot(id: string): Shot | undefined {
  return (SHOTS as Record<string, Shot>)[id];
}
