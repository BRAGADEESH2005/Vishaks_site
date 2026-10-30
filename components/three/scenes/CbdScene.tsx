"use client";
/* eslint-disable react-hooks/immutability -- Three.js materials and instanced meshes are mutable scene objects, updated in the render loop by design. */

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ATMOSPHERES, type AtmosphereId } from "@/lib/three/atmosphere";
import { buildContextCity, buildGround } from "@/lib/three/builders/context";
import { buildDistrict, type District } from "@/lib/three/builders/district";
import { buildGlassTower, chamferedRect, facetedEllipse, rect } from "@/lib/three/builders/glassTower";
import { createRng } from "@/lib/three/random";
import { useBuilt } from "./useBuilt";

/**
 * The corporate hero: Vishaks Central by day. Glass towers, a hardscaped
 * plaza and ring roads, with no planting, alive with traffic and people.
 */

const PEOPLE = 340;
const CARS_PER_LANE = 15;
const ATTIRE = ["#1f2a44", "#2c2d31", "#e9e6df", "#6f747c", "#8a6440", "#9fb4c9", "#3b4a5f", "#d8d2c6"];
const PAINT = ["#f1f1ee", "#c9ccd0", "#1b1c1f", "#2f3b52", "#8d9298", "#e9e6df", "#5b2a24", "#f1f1ee"];

/** Background skyline of glass towers beyond the district, so the frame reads as a CBD. */
function buildSkyline(kit: Parameters<typeof buildGlassTower>[0]) {
  const rng = createRng(4242);
  const group = new THREE.Group();
  const glass: THREE.MeshPhysicalMaterial[] = [];
  const spots: Array<[number, number]> = [
    [-330, -260],
    [-200, -360],
    [-40, -420],
    [130, -380],
    [300, -300],
    [380, -120],
    [-420, -90],
    [420, 60],
    [260, -470],
    [-300, -480],
    [520, -260],
    [-520, -300],
  ];
  spots.forEach(([x, z], i) => {
    const floors = 24 + Math.floor(rng() * 26);
    const w = 26 + rng() * 18;
    const kind = i % 3;
    const tiers =
      kind === 0
        ? [
            { footprint: chamferedRect(w, w * 0.9, 4), floors: Math.floor(floors * 0.7) },
            { footprint: chamferedRect(w * 0.8, w * 0.72, 3), floors: Math.ceil(floors * 0.3) },
          ]
        : kind === 1
          ? [{ footprint: facetedEllipse(w, w * 0.8, 14), floors }]
          : [{ footprint: rect(w * 1.3, w * 0.7), floors }];
    const t = buildGlassTower(kit, { tiers, seed: 300 + i, lit: 0.25, tint: i % 2 ? "#a9bccb" : "#93a8b9", mullionDepth: 0.4 });
    t.group.position.set(x, 0, z);
    t.group.rotation.y = (rng() - 0.5) * 0.5;
    group.add(t.group);
    glass.push(...t.glass);
  });
  return { group, glass };
}

function carGeometry() {
  const body = new THREE.BoxGeometry(1.84, 0.72, 4.5);
  body.translate(0, 0.56, 0);
  const cabin = new THREE.BoxGeometry(1.62, 0.62, 2.4);
  cabin.translate(0, 1.22, -0.25);
  const merged = mergeGeometries([body, cabin]);
  body.dispose();
  cabin.dispose();
  if (!merged) throw new Error("Could not merge car geometry");
  return merged;
}

function personGeometry() {
  const body = new THREE.CapsuleGeometry(0.22, 0.95, 3, 8);
  body.translate(0, 0.75, 0);
  const head = new THREE.SphereGeometry(0.13, 10, 8);
  head.translate(0, 1.62, 0);
  const merged = mergeGeometries([body.toNonIndexed(), head.toNonIndexed()]);
  body.dispose();
  head.dispose();
  if (!merged) throw new Error("Could not merge person geometry");
  return merged;
}

type Car = { lane: [number, number, number, number]; t: number; v: number; bus: boolean };
type Walker = { walk: [number, number, number, number]; len: number; t: number; dir: 1 | -1; v: number; phase: number; side: number };

function useTraffic(district: District) {
  return useMemo(() => {
    const rng = createRng(77);
    const cars: Car[] = [];
    district.lanes.forEach((lane) => {
      for (let i = 0; i < CARS_PER_LANE; i++) {
        cars.push({ lane, t: (i + rng() * 0.5) / CARS_PER_LANE, v: (11 + rng() * 5) / 900, bus: rng() < 0.08 });
      }
    });
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 });
    const bodies = new THREE.InstancedMesh(carGeometry(), bodyMat, cars.length);
    bodies.castShadow = true;
    bodies.receiveShadow = true;
    const c = new THREE.Color();
    cars.forEach((car, i) => bodies.setColorAt(i, c.set(car.bus ? "#e9e1d3" : (PAINT[Math.floor(rng() * PAINT.length)] ?? "#ffffff"))));
    const lightMat = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
    const lights = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.22, 0.08), lightMat, cars.length * 2);
    cars.forEach((_, i) => {
      lights.setColorAt(i * 2, c.set("#fff3dc"));
      lights.setColorAt(i * 2 + 1, c.set("#ff2f22"));
    });

    const walkers: Walker[] = Array.from({ length: PEOPLE }, (_, i) => {
      // Most people are on the promenades and the pavement nearest the camera.
      const pool = i % 3 === 0 ? district.walks : district.walks.filter(([, z0, , z1]) => z0 > 100 || z1 > 100);
      const walk = pool[Math.floor(rng() * pool.length)] ?? district.walks[0]!;
      const len = Math.hypot(walk[2] - walk[0], walk[3] - walk[1]);
      return { walk, len, t: rng(), dir: rng() < 0.5 ? 1 : -1, v: 1.1 + rng() * 0.5, phase: rng() * Math.PI * 2, side: (rng() - 0.5) * 3.2 };
    });
    const people = new THREE.InstancedMesh(personGeometry(), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 }), PEOPLE);
    people.castShadow = true;
    walkers.forEach((_, i) => people.setColorAt(i, c.set(ATTIRE[Math.floor(rng() * ATTIRE.length)] ?? "#333333")));
    return { cars, bodies, lights, lightMat, walkers, people };
  }, [district]);
}

export function CbdScene({ preset = "daylight", animate = true }: { preset?: AtmosphereId; animate?: boolean }) {
  const built = useBuilt((kit) => {
    const district = buildDistrict(kit, { landscape: false });
    const ground = buildGround(kit);
    const skyline = buildSkyline(kit);
    const city = buildContextCity({
      seed: 57,
      inner: 260,
      outer: 2200,
      count: 620,
      maxHeight: 140,
      lit: 0.25,
      light: "office",
      // Keep the district, its roads and the camera's corner clear.
      avoid: (x, z) => (Math.abs(x) < 235 && Math.abs(z) < 235) || (x < -120 && z > 120) || (Math.abs(x) < 240 && z < -380 && z > -500),
    });
    // An urban ground plane: pale concrete, not soil.
    kit.ground.map = null;
    kit.ground.color.set("#5d5953");
    kit.ground.needsUpdate = true;
    city.material.color.set("#a7a39d");
    // Brighter sky reflections on the curtain walls, so the glass reads clean by day.
    [...district.towers.flatMap((t) => t.tower.glass), ...skyline.glass].forEach((g) => {
      g.envMapIntensity = 2.3;
      g.color.lerp(new THREE.Color("#d6e3ee"), 0.4);
    });
    const setGlow = (g: number) => {
      district.glowing.forEach(({ material, base }) => (material.emissiveIntensity = base * g));
      skyline.glass.forEach((m) => (m.emissiveIntensity = g));
      kit.warmLight.emissiveIntensity = 2.4 * g;
      kit.pool.emissiveIntensity = 0.6 * g;
      city.material.emissiveIntensity = 1.1 * g;
    };
    return { district, ground, skyline, city, setGlow, roots: [district.group, ground, skyline.group, city.mesh] };
  });
  const traffic = useTraffic(built.district);
  const o = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const g = ATMOSPHERES[preset].glow;
    built.setGlow(g);
    traffic.lightMat.color.setScalar(0.35 + g * 2.6);
  }, [preset, built, traffic]);

  useLayoutEffect(
    () => () => {
      [traffic.bodies, traffic.lights, traffic.people].forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
    },
    [traffic],
  );

  useFrame((state, delta) => {
    const dt = animate ? Math.min(delta, 0.05) : 0;
    const time = state.clock.elapsedTime;
    traffic.cars.forEach((car, i) => {
      car.t = (car.t + car.v * dt) % 1;
      const [x0, z0, x1, z1] = car.lane;
      const yaw = Math.atan2(x1 - x0, z1 - z0);
      const x = x0 + (x1 - x0) * car.t;
      const z = z0 + (z1 - z0) * car.t;
      o.position.set(x, 0, z);
      o.rotation.set(0, yaw, 0);
      o.scale.set(car.bus ? 1.4 : 1, car.bus ? 2.2 : 1, car.bus ? 2.6 : 1);
      o.updateMatrix();
      traffic.bodies.setMatrixAt(i, o.matrix);
      const len = car.bus ? 5.9 : 2.27;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      o.scale.set(car.bus ? 1.4 : 1, 1, 1);
      o.position.set(x + fx * len, 0.62, z + fz * len);
      o.updateMatrix();
      traffic.lights.setMatrixAt(i * 2, o.matrix);
      o.position.set(x - fx * len, 0.75, z - fz * len);
      o.updateMatrix();
      traffic.lights.setMatrixAt(i * 2 + 1, o.matrix);
    });
    traffic.bodies.instanceMatrix.needsUpdate = true;
    traffic.lights.instanceMatrix.needsUpdate = true;

    traffic.walkers.forEach((w, i) => {
      w.t += (w.dir * w.v * dt) / w.len;
      if (w.t > 1 || w.t < 0) {
        w.dir = (w.dir * -1) as 1 | -1;
        w.t = THREE.MathUtils.clamp(w.t, 0, 1);
      }
      const [x0, z0, x1, z1] = w.walk;
      const dx = (x1 - x0) / w.len;
      const dz = (z1 - z0) / w.len;
      const stride = Math.abs(Math.sin(time * 5.2 * w.v + w.phase));
      o.position.set(x0 + (x1 - x0) * w.t - dz * w.side, stride * 0.05, z0 + (z1 - z0) * w.t + dx * w.side);
      o.rotation.set(0, Math.atan2(dx * w.dir, dz * w.dir), Math.sin(time * 5.2 * w.v + w.phase) * 0.03);
      o.scale.setScalar(0.92 + (i % 7) * 0.025);
      o.updateMatrix();
      traffic.people.setMatrixAt(i, o.matrix);
    });
    traffic.people.instanceMatrix.needsUpdate = true;

    // Aviation lights blink once every 1.6 s.
    const on = Math.floor(time / 0.8) % 2 === 0;
    built.district.towers.forEach((t) => {
      if (t.tower.beacon) t.tower.beacon.visible = on;
    });
    if (animate) state.invalidate();
  });

  return (
    <group>
      {built.roots.map((r) => (
        <primitive key={r.uuid} object={r} />
      ))}
      <primitive object={traffic.bodies} />
      <primitive object={traffic.lights} />
      <primitive object={traffic.people} />
    </group>
  );
}
