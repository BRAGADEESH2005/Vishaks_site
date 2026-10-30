import type { SceneId } from "./shots";

export type ModelView = {
  scene: SceneId;
  target: [number, number, number];
  /** Starting camera position. */
  position: [number, number, number];
  minDistance: number;
  maxDistance: number;
  shadow: { extent: number; target: [number, number, number]; distance: number };
};

/** Camera set-ups for each project's concept model, in scene metres. */
export const MODEL_VIEWS: Record<string, ModelView> = {
  "coworking-spaces": {
    scene: "coworking",
    target: [0, 14, 4],
    position: [110, 62, 140],
    minDistance: 60,
    maxDistance: 280,
    shadow: { extent: 110, target: [0, 10, 0], distance: 400 },
  },
  "office-spaces": {
    scene: "office",
    target: [0, 16, 0],
    position: [150, 74, 196],
    minDistance: 70,
    maxDistance: 300,
    shadow: { extent: 150, target: [0, 10, 0], distance: 500 },
  },
  "retail-spaces": {
    scene: "retail",
    target: [0, 8, 8],
    position: [86, 40, 104],
    minDistance: 50,
    maxDistance: 260,
    shadow: { extent: 140, target: [0, 8, 0], distance: 500 },
  },
};
