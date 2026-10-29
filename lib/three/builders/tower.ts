import * as THREE from "three";
import type { Kit } from "../kit";
import { createRng } from "../random";
import { makeFacadeTextures } from "../textures";
import { box, instanced, type Placement } from "./common";
import { buildCanopyTrees, buildShrubs } from "./landscape";

export type TowerOptions = {
  floors: number;
  floorHeight?: number;
  width: number;
  depth: number;
  seed: number;
  /** Share of lit rooms, 0..1. */
  lit: number;
  /** Floors with a recessed sky garden. */
  skyGardens?: number[];
};

export type Tower = {
  group: THREE.Group;
  height: number;
  floorHeight: number;
  floors: number;
  width: number;
  depth: number;
  /** Facade glass materials, so the scene can dim or brighten interior lights. */
  glass: THREE.MeshPhysicalMaterial[];
};

/**
 * A residential tower: glass curtain wall, crisp floor slabs, bronze fins on
 * the side elevations, staggered balconies on the main (+z) elevation and a
 * landscaped crown.
 */
export function buildResidentialTower(kit: Kit, o: TowerOptions): Tower {
  const fh = o.floorHeight ?? 3.25;
  const H = o.floors * fh;
  const group = new THREE.Group();
  const glass: THREE.MeshPhysicalMaterial[] = [];
  const rng = createRng(o.seed);
  const skyGardens = new Set(o.skyGardens ?? []);

  // Curtain wall: one plane per elevation so each keeps a correct window scale.
  const faces: Array<{ w: number; pos: [number, number, number]; rotY: number; seed: number }> = [
    { w: o.width, pos: [0, H / 2, o.depth / 2], rotY: 0, seed: o.seed + 1 },
    { w: o.width, pos: [0, H / 2, -o.depth / 2], rotY: Math.PI, seed: o.seed + 2 },
    { w: o.depth, pos: [o.width / 2, H / 2, 0], rotY: Math.PI / 2, seed: o.seed + 3 },
    { w: o.depth, pos: [-o.width / 2, H / 2, 0], rotY: -Math.PI / 2, seed: o.seed + 4 },
  ];
  for (const f of faces) {
    const bays = Math.max(4, Math.round(f.w / 1.65));
    const tex = makeFacadeTextures({ bays, floors: o.floors, seed: f.seed, lit: o.lit, spandrel: 0.2, glassLevel: 92 });
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex.map,
      emissiveMap: tex.emissiveMap,
      emissive: "#ffffff",
      emissiveIntensity: 1.6,
      roughnessMap: tex.roughnessMap,
      roughness: 0.22,
      metalness: 0.8,
      envMapIntensity: 1.5,
      clearcoat: 0.6,
      clearcoatRoughness: 0.08,
    });
    glass.push(mat);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(f.w, H), mat);
    plane.position.set(...f.pos);
    plane.rotation.y = f.rotY;
    plane.receiveShadow = true;
    group.add(plane);
  }
  // Glass core behind the planes so shadows and silhouettes are solid.
  const core = box(o.width - 0.05, H, o.depth - 0.05, kit.darkMetal, [0, H / 2, 0]);
  group.add(core);

  // Floor slabs, slightly proud of the glass.
  const slabGeo = new THREE.BoxGeometry(o.width + 0.7, 0.32, o.depth + 0.7);
  const slabs: Placement[] = [];
  for (let f = 0; f <= o.floors; f++) slabs.push({ position: [0, f * fh, 0] });
  group.add(instanced(slabGeo, kit.concrete, slabs, { name: "slabs" }));

  // Sky gardens: a deep dark recess band with planting along the edge.
  const shrubSpots: Array<[number, number, number]> = [];
  for (const f of skyGardens) {
    const y = f * fh;
    group.add(box(o.width + 0.2, fh - 0.3, o.depth + 0.2, kit.darkMetal, [0, y + fh / 2, 0]));
    for (let x = -o.width / 2 + 1; x < o.width / 2; x += 1.6) {
      shrubSpots.push([x, y + 0.15, o.depth / 2 + 0.05]);
      shrubSpots.push([x, y + 0.15, -o.depth / 2 - 0.05]);
    }
  }
  if (shrubSpots.length) group.add(buildShrubs(kit, shrubSpots, o.seed + 9, 1.1));

  // Bronze fins on the side elevations, with a gentle depth rhythm.
  const finGeo = new THREE.BoxGeometry(1, 1, 1);
  const fins: Placement[] = [];
  const finCount = Math.round(o.depth / 1.65);
  for (const side of [1, -1]) {
    for (let i = 0; i <= finCount; i++) {
      const z = -o.depth / 2 + (i / finCount) * o.depth;
      const depth = 0.55 + 0.45 * Math.sin((i / finCount) * Math.PI);
      fins.push({ position: [side * (o.width / 2 + depth / 2), H / 2, z], scale: [depth, H, 0.12] });
    }
  }
  // Slim fins on the main elevation every second bay.
  const frontBays = Math.round(o.width / 1.65);
  for (let i = 0; i <= frontBays; i += 2) {
    const x = -o.width / 2 + (i / frontBays) * o.width;
    fins.push({ position: [x, H / 2, -o.depth / 2 - 0.25], scale: [0.1, H, 0.5] });
  }
  group.add(instanced(finGeo, kit.bronze, fins, { name: "fins" }));

  // Staggered balconies on the main elevation.
  const deckW = o.width * 0.5;
  const deckGeo = new THREE.BoxGeometry(deckW, 0.26, 2.1);
  const railGeo = new THREE.BoxGeometry(deckW, 1.1, 0.04);
  const edgeGeo = new THREE.BoxGeometry(deckW, 0.08, 0.06);
  const decks: Placement[] = [];
  const rails: Placement[] = [];
  const edges: Placement[] = [];
  for (let f = 2; f < o.floors; f++) {
    if (skyGardens.has(f)) continue;
    const side = (f % 4 < 2 ? -1 : 1) * o.width * 0.24;
    const y = f * fh + 0.05;
    const z = o.depth / 2 + 1.05;
    decks.push({ position: [side, y, z] });
    rails.push({ position: [side, y + 0.68, z + 1.03] });
    edges.push({ position: [side, y + 1.24, z + 1.03] });
  }
  group.add(instanced(deckGeo, kit.concrete, decks, { name: "decks" }));
  group.add(instanced(railGeo, kit.balustrade, rails, { cast: false, name: "rails" }));
  group.add(instanced(edgeGeo, kit.bronze, edges, { cast: false, name: "rail-caps" }));

  // Crown: a setback pavilion with a pergola and rooftop trees.
  const crownH = fh * 1.6;
  group.add(box(o.width * 0.62, crownH, o.depth * 0.62, kit.darkMetal, [0, H + crownH / 2, 0]));
  const pergola: Placement[] = [];
  const pw = o.width + 0.7;
  for (let i = 0; i <= 18; i++) {
    pergola.push({ position: [-pw / 2 + (i / 18) * pw, H + crownH + 0.2, 0], scale: [0.14, 0.4, o.depth + 0.7] });
  }
  pergola.push({ position: [0, H + crownH + 0.45, 0], scale: [pw, 0.14, o.depth + 0.7] });
  group.add(instanced(finGeo, kit.bronze, pergola, { name: "pergola" }));
  const roofTrees: Array<[number, number, number]> = [];
  for (let i = 0; i < 6; i++) {
    roofTrees.push([(rng() - 0.5) * o.width * 0.9, H + 0.2, (rng() > 0.5 ? 1 : -1) * o.depth * 0.38]);
  }
  group.add(buildCanopyTrees(kit, roofTrees, o.seed + 5, 4.5));

  return { group, height: H + crownH, floorHeight: fh, floors: o.floors, width: o.width, depth: o.depth, glass };
}
