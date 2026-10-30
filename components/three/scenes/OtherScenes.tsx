"use client";

import { useLayoutEffect } from "react";
import { ATMOSPHERES, type AtmosphereId } from "@/lib/three/atmosphere";
import { buildOfficeCampus } from "@/lib/three/builders/office";
import { buildContextCity, buildGround } from "@/lib/three/builders/context";
import { buildCoworking } from "@/lib/three/builders/coworking";
import { buildRetail } from "@/lib/three/builders/retail";
import { useBuilt } from "./useBuilt";

export function OfficeScene({ preset }: { preset: AtmosphereId }) {
  const built = useBuilt((kit) => {
    const site = buildOfficeCampus(kit, { lit: 0.3 });
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

export function CoworkingScene({ preset }: { preset: AtmosphereId }) {
  const built = useBuilt((kit) => {
    const site = buildCoworking(kit);
    const ground = buildGround(kit);
    const city = buildContextCity({
      seed: 41,
      inner: 160,
      outer: 1400,
      count: 300,
      maxHeight: 60,
      lit: 0.25,
      light: "office",
      avoid: (x, z) => z > 40 && x < 40 && Math.hypot(x, z) < 480,
    });
    const setGlow = (g: number) => {
      site.glowing.forEach(({ material, base }) => (material.emissiveIntensity = base * g + 0.1));
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

export function RetailScene({ preset }: { preset: AtmosphereId }) {
  const built = useBuilt((kit) => {
    const site = buildRetail(kit);
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
