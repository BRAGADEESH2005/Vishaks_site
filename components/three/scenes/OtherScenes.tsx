"use client";

import { useLayoutEffect } from "react";
import { ATMOSPHERES, type AtmosphereId } from "@/lib/three/atmosphere";
import { buildAmbalam } from "@/lib/three/builders/ambalam";
import { buildContextCity, buildGround } from "@/lib/three/builders/context";
import { buildMarutham } from "@/lib/three/builders/marutham";
import { buildSandhai } from "@/lib/three/builders/sandhai";
import { useBuilt } from "./useBuilt";

export function AmbalamScene({ preset }: { preset: AtmosphereId }) {
  const built = useBuilt((kit) => {
    const site = buildAmbalam(kit, { lit: 0.3 });
    const ground = buildGround(kit);
    const city = buildContextCity({
      seed: 12,
      inner: 220,
      outer: 1500,
      count: 300,
      maxHeight: 80,
      lit: 0.2,
      light: "office",
      avoid: (x, z) => z > 60 && Math.abs(x) < 300 && Math.hypot(x, z) < 520,
    });
    const setGlow = (g: number) => {
      site.glass.forEach((m) => (m.emissiveIntensity = 1.2 * g + 0.15));
      kit.warmLight.emissiveIntensity = 2.2 * g + 0.2;
      city.material.emissiveIntensity = 1.1 * g;
    };
    return { site, ground, city, setGlow, roots: [site.group, ground, city.mesh] };
  });
  useLayoutEffect(() => built.setGlow(ATMOSPHERES[preset].glow), [preset, built]);
  return (
    <group>
      <primitive object={built.ground} />
      <primitive object={built.city.mesh} />
      <primitive object={built.site.group} />
    </group>
  );
}

export function MaruthamScene({ preset }: { preset: AtmosphereId }) {
  const built = useBuilt((kit) => {
    const site = buildMarutham(kit);
    kit.ground.color.set("#9aa07a"); // rural red earth and scrub, not city dust
    const ground = buildGround(kit);
    const setGlow = (g: number) => site.glowing.forEach((m) => (m.emissiveIntensity = 1.4 * g));
    return { site, ground, setGlow, roots: [site.group, ground] };
  });
  useLayoutEffect(() => built.setGlow(ATMOSPHERES[preset].glow), [preset, built]);
  return (
    <group>
      <primitive object={built.ground} />
      <primitive object={built.site.group} />
    </group>
  );
}

export function SandhaiScene({ preset }: { preset: AtmosphereId }) {
  const built = useBuilt((kit) => {
    const site = buildSandhai(kit);
    const ground = buildGround(kit);
    const city = buildContextCity({
      seed: 21,
      inner: 160,
      outer: 1300,
      count: 320,
      maxHeight: 60,
      lit: 0.3,
      avoid: (x, z) => z > 30 && Math.hypot(x, z) < 450,
    });
    const setGlow = (g: number) => {
      site.glowing.forEach(({ material, base }) => (material.emissiveIntensity = base * g));
      kit.warmLight.emissiveIntensity = 2.4 * g;
      city.material.emissiveIntensity = 1.1 * g;
    };
    return { site, ground, city, setGlow, roots: [site.group, ground, city.mesh] };
  });
  useLayoutEffect(() => built.setGlow(ATMOSPHERES[preset].glow), [preset, built]);
  return (
    <group>
      <primitive object={built.ground} />
      <primitive object={built.city.mesh} />
      <primitive object={built.site.group} />
    </group>
  );
}
