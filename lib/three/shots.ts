import type { AtmosphereId } from "./atmosphere";

export type SceneId = "kadal" | "marutham" | "ambalam" | "sandhai";

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

const KADAL_SHADOW: ShotFrame = { extent: 170, target: [0, 40, 0], distance: 500, mapSize: 4096 };

/**
 * Camera set-ups for every concept image on the site. The dev-only /studio
 * route renders any of these so the imagery can be regenerated after the
 * models change (see README, "Regenerating concept images").
 */
export const SHOTS = {
  "kadal-hero": {
    scene: "kadal",
    preset: "dusk",
    position: [-128, 7, 150],
    target: [2, 66, -12],
    fov: 40,
    shadow: KADAL_SHADOW,
    size: [2400, 1350],
    shiftX: 0.16,
  },
  "kadal-facade": {
    scene: "kadal",
    preset: "dusk",
    position: [-48, 30, 44],
    target: [-14, 92, -4],
    fov: 40,
    shadow: KADAL_SHADOW,
    size: [1600, 2000],
  },
  "kadal-deck": {
    scene: "kadal",
    preset: "dusk",
    position: [32, 15.6, 30],
    target: [-2, 17, 6],
    fov: 52,
    shadow: KADAL_SHADOW,
    size: [2000, 1400],
  },
  "kadal-street": {
    scene: "kadal",
    preset: "blue",
    position: [-62, 1.7, 74],
    target: [-10, 10, 20],
    fov: 46,
    shadow: KADAL_SHADOW,
    size: [2000, 1300],
  },
  "marutham-aerial": {
    scene: "marutham",
    preset: "golden",
    position: [170, 92, 205],
    target: [-14, 0, 6],
    fov: 36,
    shadow: { extent: 260, target: [0, 0, 0], distance: 600, mapSize: 4096 },
    size: [2400, 1500],
  },
  "marutham-avenue": {
    scene: "marutham",
    preset: "golden",
    position: [-44, 24, 156],
    target: [-20, 0, 40],
    fov: 44,
    shadow: { extent: 200, target: [-40, 0, 60], distance: 500, mapSize: 4096 },
    size: [2000, 1300],
  },
  "ambalam-exterior": {
    scene: "ambalam",
    preset: "golden",
    position: [15.5, 1.7, 76],
    target: [-6, 20, -10],
    fov: 46,
    shadow: { extent: 150, target: [0, 10, 0], distance: 500, mapSize: 4096 },
    size: [2400, 1450],
  },
  "ambalam-louvres": {
    scene: "ambalam",
    preset: "golden",
    position: [36, 1.7, 7],
    target: [-14, 30, -6],
    fov: 50,
    shadow: { extent: 120, target: [0, 20, 0], distance: 500, mapSize: 4096 },
    size: [1600, 2000],
  },
  "sandhai-street": {
    scene: "sandhai",
    preset: "dusk",
    position: [58, 3.2, 74],
    target: [-6, 10, 12],
    fov: 42,
    shadow: { extent: 140, target: [0, 8, 0], distance: 500, mapSize: 4096 },
    size: [2400, 1450],
  },
  "sandhai-arcade": {
    scene: "sandhai",
    preset: "dusk",
    position: [38, 1.7, 22.4],
    target: [-10, 3.2, 19],
    fov: 56,
    shadow: { extent: 120, target: [0, 8, 0], distance: 500, mapSize: 4096 },
    size: [2000, 1400],
  },
} satisfies Record<string, Shot>;

export type ShotId = keyof typeof SHOTS;

export const SHOT_IDS = Object.keys(SHOTS) as ShotId[];

export function getShot(id: string): Shot | undefined {
  return (SHOTS as Record<string, Shot>)[id];
}
