"use client";

import { useLayoutEffect } from "react";
import { ATMOSPHERES, type AtmosphereId } from "@/lib/three/atmosphere";
import { buildContextCity, buildGround } from "@/lib/three/builders/context";
import { buildResidential } from "@/lib/three/builders/residential";
import { useBuilt } from "./useBuilt";

export const RESIDENTIAL_COAST_X = 520;

export function ResidentialScene({ preset }: { preset: AtmosphereId }) {
  const built = useBuilt((kit) => {
    const residential = buildResidential(kit, { lit: 0.3 });
    const ground = buildGround(kit, { coastX: RESIDENTIAL_COAST_X });
    const city = buildContextCity({
      seed: 4,
      inner: 320,
      outer: 1700,
      count: 300,
      maxHeight: 70,
      lit: 0.2,
      avoid: (x, z) => x > RESIDENTIAL_COAST_X - 70 || (x < 70 && z > 40 && Math.hypot(x, z) < 520),
    });
    const setGlow = (g: number) => {
      residential.towers.forEach((t) => t.glass.forEach((m) => (m.emissiveIntensity = 2.1 * g)));
      residential.glowing.forEach(({ material, base }) => (material.emissiveIntensity = base * g));
      kit.warmLight.emissiveIntensity = 2.4 * g;
      kit.pool.emissiveIntensity = 0.6 * g;
      city.material.emissiveIntensity = 1.2 * g;
    };
    return { residential, ground, city, setGlow, roots: [residential.group, ground, city.mesh] };
  });

  useLayoutEffect(() => built.setGlow(ATMOSPHERES[preset].glow), [preset, built]);

  return (
    <group>
      <primitive object={built.ground} />
      <primitive object={built.city.mesh} />
      <primitive object={built.residential.group} />
    </group>
  );
}
