"use client";
/* eslint-disable react-hooks/immutability -- Three.js lights, fog, uniforms and instanced meshes are mutable scene objects, updated in the render loop by design. */

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { ATMOSPHERES, type AtmosphereId } from "@/lib/three/atmosphere";
import { buildContextCity, buildGround } from "@/lib/three/builders/context";
import { buildDistrict, type District } from "@/lib/three/builders/district";
import { createRng } from "@/lib/three/random";
import { useBuilt } from "./useBuilt";

type Props = {
  preset?: AtmosphereId;
  /** Live window glow, 0..1.4, driven by the scroll timeline. */
  glow?: RefObject<number>;
  /** 0..1: towers rise out of the ground in sequence. */
  rise?: RefObject<number>;
  animate?: boolean;
  onBuilt?: (d: District) => void;
};

const CARS = 90;

/** Headlights and tail lights moving along the district's roads. */
function Traffic({ district }: { district: District }) {
  const { heads, tails, cars } = useMemo(() => {
    const rng = createRng(5);
    const geo = new THREE.BoxGeometry(0.9, 0.5, 2.2);
    const heads = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: "#fff1d6", toneMapped: false }), CARS);
    const tails = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: "#ff3b2f", toneMapped: false }), CARS);
    const cars = Array.from({ length: CARS }, (_, i) => ({
      lane: district.lanes[i % district.lanes.length] ?? [0, 0, 1, 1],
      t: rng(),
      speed: 0.018 + rng() * 0.02,
      head: i % 2 === 0,
    }));
    return { heads, tails, cars };
  }, [district]);

  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, delta) => {
    let h = 0;
    let t = 0;
    for (const c of cars) {
      c.t = (c.t + c.speed * Math.min(delta, 0.05)) % 1;
      const [x0, z0, x1, z1] = c.lane;
      o.position.set(x0 + (x1 - x0) * c.t, 0.6, z0 + (z1 - z0) * c.t);
      o.rotation.set(0, Math.atan2(x1 - x0, z1 - z0), 0);
      o.updateMatrix();
      if (c.head) heads.setMatrixAt(h++, o.matrix);
      else tails.setMatrixAt(t++, o.matrix);
    }
    heads.count = h;
    tails.count = t;
    heads.instanceMatrix.needsUpdate = true;
    tails.instanceMatrix.needsUpdate = true;
    state.invalidate();
  });

  return (
    <>
      <primitive object={heads} />
      <primitive object={tails} />
    </>
  );
}

export function DistrictScene({ preset = "dusk", glow, rise, animate = false, onBuilt }: Props) {
  const built = useBuilt((kit) => {
    const district = buildDistrict(kit);
    const ground = buildGround(kit);
    const city = buildContextCity({
      seed: 31,
      inner: 330,
      outer: 1800,
      count: 360,
      maxHeight: 95,
      lit: 0.25,
      light: "office",
      avoid: (x, z) => z > 150 && Math.abs(x) < 260 && Math.hypot(x, z) < 600,
    });
    const setGlow = (g: number) => {
      district.glowing.forEach(({ material, base }) => (material.emissiveIntensity = base * g));
      kit.warmLight.emissiveIntensity = 2.4 * g;
      kit.pool.emissiveIntensity = 0.6 * g;
      city.material.emissiveIntensity = 1.1 * g;
    };
    return { district, ground, city, setGlow, roots: [district.group, ground, city.mesh] };
  });

  useLayoutEffect(() => {
    built.setGlow(ATMOSPHERES[preset].glow);
    onBuilt?.(built.district);
  }, [preset, built, onBuilt]);

  useFrame((state) => {
    if (glow) built.setGlow(glow.current ?? 1);
    // Aviation lights blink once every 1.6 s.
    const on = Math.floor(state.clock.elapsedTime / 0.8) % 2 === 0;
    built.district.towers.forEach((t, i) => {
      if (t.tower.beacon) t.tower.beacon.visible = !animate || on;
      if (rise) {
        const p = rise.current ?? 1;
        const local = THREE.MathUtils.clamp(p * 1.6 - i * 0.12, 0, 1);
        const s = 1 - Math.pow(1 - local, 3);
        t.tower.group.scale.set(1, Math.max(0.001, s), 1);
      }
    });
  });

  return (
    <group>
      <primitive object={built.ground} />
      <primitive object={built.city.mesh} />
      <primitive object={built.district.group} />
      {animate && <Traffic district={built.district} />}
    </group>
  );
}
