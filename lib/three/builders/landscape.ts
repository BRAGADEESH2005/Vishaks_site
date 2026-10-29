import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import type { Kit } from "../kit";
import { createRng, range } from "../random";
import { instanced, type Placement } from "./common";

const FOLIAGE = ["#3f4a2a", "#4a5230", "#36412a", "#535a33", "#2f3a26"];

/** Broadleaf canopy: three jittered lumps over a trunk (unit height ~ 1). */
function canopyGeometry(seed: number) {
  const rng = createRng(seed);
  const parts: THREE.BufferGeometry[] = [];
  const lumps: Array<[number, number, number, number]> = [
    [0, 0.72, 0, 0.42],
    [0.22, 0.62, 0.1, 0.3],
    [-0.18, 0.66, -0.14, 0.32],
    [0.02, 0.9, -0.05, 0.26],
  ];
  for (const [x, y, z, r] of lumps) {
    const raw = new THREE.IcosahedronGeometry(r, 3);
    raw.deleteAttribute("normal");
    raw.deleteAttribute("uv");
    const g = mergeVertices(raw);
    raw.dispose();
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i);
      const vy = p.getY(i);
      const vz = p.getZ(i);
      // Low-frequency lumps so the crown reads as foliage, not a ball.
      const k = 1 + 0.16 * Math.sin(vx * 9 + seed) * Math.cos(vz * 8) + (rng() - 0.5) * 0.06;
      p.setXYZ(i, vx * k + x, vy * k * 0.8 + y, vz * k + z);
    }
    g.computeVertexNormals();
    parts.push(g);
  }
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  if (!merged) throw new Error("Could not merge canopy geometry");
  return merged;
}

export function buildCanopyTrees(kit: Kit, spots: Array<[number, number, number]>, seed = 1, height = 8) {
  const rng = createRng(seed);
  const group = new THREE.Group();
  const canopy = canopyGeometry(seed);
  const trunk = new THREE.CylinderGeometry(0.03, 0.05, 0.6, 6);
  trunk.translate(0, 0.3, 0);
  const crowns: Placement[] = [];
  const trunks: Placement[] = [];
  for (const [x, y, z] of spots) {
    const s = height * range(rng, 0.75, 1.25);
    const rot: [number, number, number] = [0, rng() * Math.PI * 2, 0];
    crowns.push({
      position: [x, y, z],
      rotation: rot,
      scale: [s * range(rng, 0.9, 1.2), s, s * range(rng, 0.9, 1.2)],
      color: FOLIAGE[Math.floor(rng() * FOLIAGE.length)],
    });
    trunks.push({ position: [x, y, z], rotation: rot, scale: s });
  }
  group.add(instanced(canopy, kit.foliage, crowns, { name: "canopies" }));
  group.add(instanced(trunk, kit.trunk, trunks, { name: "trunks" }));
  return group;
}

/** Coconut palm: curved trunk with drooping fronds. Built once, instanced many times. */
function palmGeometries() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.25, 3.5, 0),
    new THREE.Vector3(0.75, 7, 0),
    new THREE.Vector3(1.3, 10, 0),
  ]);
  const trunk = new THREE.TubeGeometry(curve, 24, 0.16, 7, false);
  const top = curve.getPoint(1);
  const fronds: THREE.BufferGeometry[] = [];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const g = new THREE.PlaneGeometry(2.1, 5.6, 1, 12);
    // Lay the frond along +x, then droop it.
    g.rotateX(-Math.PI / 2);
    g.rotateY(Math.PI / 2);
    g.translate(2.8, 0, 0);
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    const lift = i % 3 === 0 ? 0.55 : 0;
    for (let v = 0; v < p.count; v++) {
      const x = p.getX(v);
      const t = x / 5.6;
      p.setY(v, p.getY(v) + (lift + 0.9) * t * 2 - t * t * 4.2);
      // A slight V-fold across the frond.
      p.setY(v, p.getY(v) - Math.abs(p.getZ(v)) * 0.35);
    }
    g.computeVertexNormals();
    g.rotateY((i / count) * Math.PI * 2 + (i % 2) * 0.2);
    g.translate(top.x, top.y, top.z);
    fronds.push(g);
  }
  const frondGeo = mergeGeometries(fronds);
  fronds.forEach((g) => g.dispose());
  if (!frondGeo) throw new Error("Could not merge frond geometry");
  return { trunk, frondGeo };
}

export function buildPalms(kit: Kit, spots: Array<[number, number, number]>, seed = 2) {
  const rng = createRng(seed);
  const { trunk, frondGeo } = palmGeometries();
  const placements: Placement[] = spots.map(([x, y, z]) => ({
    position: [x, y, z],
    rotation: [0, rng() * Math.PI * 2, 0],
    scale: range(rng, 0.85, 1.2),
  }));
  const group = new THREE.Group();
  group.add(instanced(trunk, kit.trunk, placements, { name: "palm-trunks" }));
  group.add(instanced(frondGeo, kit.frond, placements, { name: "palm-fronds" }));
  return group;
}

/** Low shrub masses for planters and hedges. */
export function buildShrubs(kit: Kit, spots: Array<[number, number, number]>, seed = 4, size = 1.2) {
  const rng = createRng(seed);
  const g = new THREE.IcosahedronGeometry(0.5, 1);
  g.scale(1, 0.6, 1);
  const placements: Placement[] = spots.map(([x, y, z]) => ({
    position: [x, y + 0.2, z],
    rotation: [0, rng() * Math.PI, 0],
    scale: [size * range(rng, 0.7, 1.4), size * range(rng, 0.6, 1), size * range(rng, 0.7, 1.4)],
    color: FOLIAGE[Math.floor(rng() * FOLIAGE.length)],
  }));
  return instanced(g, kit.foliage, placements, { name: "shrubs" });
}

/** Evenly spaced points along a line, for avenues and planters. */
export function along(a: [number, number], b: [number, number], step: number, y = 0, jitter = 0, seed = 1) {
  const rng = createRng(seed);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.floor(len / step));
  const pts: Array<[number, number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      a[0] + (b[0] - a[0]) * t + (rng() - 0.5) * jitter,
      y,
      a[1] + (b[1] - a[1]) * t + (rng() - 0.5) * jitter,
    ]);
  }
  return pts;
}

/** Street lamps: a slim pole with a warm head. */
export function buildLamps(kit: Kit, spots: Array<[number, number, number]>, height = 6) {
  const pole = new THREE.CylinderGeometry(0.06, 0.08, height, 6);
  pole.translate(0, height / 2, 0);
  const head = new THREE.BoxGeometry(0.9, 0.12, 0.28);
  head.translate(0.35, height, 0);
  const placements: Placement[] = spots.map((p) => ({ position: p }));
  const group = new THREE.Group();
  group.add(instanced(pole, kit.darkMetal, placements, { name: "lamp-poles" }));
  group.add(instanced(head, kit.warmLight, placements, { cast: false, name: "lamp-heads" }));
  return group;
}
