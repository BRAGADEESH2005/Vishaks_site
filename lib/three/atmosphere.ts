/**
 * Time-of-day presets. All scenes share these so the imagery reads as one
 * body of work: the same sky language, the same warm stone and bronze.
 */
export type AtmosphereId = "dusk" | "golden" | "afternoon" | "blue";

export type Atmosphere = {
  sky: { zenith: string; horizon: string; belt: string; ground: string; beltStrength: number; glow: number };
  sun: { azimuth: number; elevation: number; color: string; intensity: number };
  hemi: { sky: string; ground: string; intensity: number };
  fog: { color: string; density: number };
  exposure: number;
  /** Multiplier for interior lights and lamps. */
  glow: number;
  env: { warm: number; cool: number };
};

export const ATMOSPHERES: Record<AtmosphereId, Atmosphere> = {
  // Just after sunset, looking east over the Bay of Bengal: the warm light comes
  // from behind the camera and a pink band (the Belt of Venus) sits on the horizon.
  dusk: {
    sky: { zenith: "#1f2c52", horizon: "#d7a38c", belt: "#e9a283", ground: "#2a221f", beltStrength: 0.8, glow: 0.5 },
    sun: { azimuth: 292, elevation: 6, color: "#ff9a5c", intensity: 2.8 },
    hemi: { sky: "#6f7899", ground: "#33261d", intensity: 0.5 },
    fog: { color: "#6a5560", density: 0.0016 },
    exposure: 1.0,
    glow: 1,
    env: { warm: 2.2, cool: 0.9 },
  },
  blue: {
    sky: { zenith: "#121828", horizon: "#5b5f78", belt: "#8a7486", ground: "#1d1a1f", beltStrength: 0.45, glow: 0.2 },
    sun: { azimuth: 295, elevation: 2, color: "#c9a4a2", intensity: 0.6 },
    hemi: { sky: "#58607c", ground: "#21191a", intensity: 0.5 },
    fog: { color: "#3f4256", density: 0.0011 },
    exposure: 1.15,
    glow: 1.25,
    env: { warm: 0.6, cool: 0.8 },
  },
  golden: {
    sky: { zenith: "#5f7a96", horizon: "#e9c39a", belt: "#f0c8a0", ground: "#5a4632", beltStrength: 0.25, glow: 1 },
    sun: { azimuth: 285, elevation: 13, color: "#ffc08a", intensity: 3.4 },
    hemi: { sky: "#b8c3cf", ground: "#5d4a36", intensity: 0.75 },
    fog: { color: "#e2c7a6", density: 0.0006 },
    exposure: 1,
    glow: 0.35,
    env: { warm: 2, cool: 1 },
  },
  afternoon: {
    sky: { zenith: "#6f8fad", horizon: "#e3d8c6", belt: "#eadfcf", ground: "#6b5a46", beltStrength: 0.1, glow: 0.6 },
    sun: { azimuth: 305, elevation: 34, color: "#fff0dc", intensity: 3.6 },
    hemi: { sky: "#c9d4df", ground: "#6a5642", intensity: 0.9 },
    fog: { color: "#d9d2c6", density: 0.0006 },
    exposure: 0.95,
    glow: 0.08,
    env: { warm: 1.4, cool: 1.4 },
  },
};

/** Unit direction toward the sun from azimuth (degrees: 0 = +z south, 90 = +x east toward the sea, 270 = -x west) and elevation. */
export function sunDirection(azimuth: number, elevation: number): [number, number, number] {
  const az = (azimuth * Math.PI) / 180;
  const el = (elevation * Math.PI) / 180;
  return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
}
