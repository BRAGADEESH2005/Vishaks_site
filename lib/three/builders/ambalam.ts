import * as THREE from "three";
import type { Kit } from "../kit";
import { makeFacadeTextures } from "../textures";
import { box, flat, instanced, type Placement } from "./common";
import { along, buildCanopyTrees, buildLamps, buildShrubs } from "./landscape";

export type OfficeBuild = { group: THREE.Group; glass: THREE.MeshPhysicalMaterial[] };

type BlockOptions = { floors: number; width: number; depth: number; seed: number; lit: number; floorHeight?: number };

/**
 * A Grade A office block: wide floor plates, deep horizontal bronze sunshades
 * on the long elevations and solid stone end cores.
 */
function buildOfficeBlock(kit: Kit, stone: THREE.Material, o: BlockOptions) {
  const fh = o.floorHeight ?? 4.2;
  const lobby = fh * 1.6;
  const H = lobby + (o.floors - 1) * fh;
  const group = new THREE.Group();
  const glass: THREE.MeshPhysicalMaterial[] = [];
  const core = 7;
  const glassW = o.width - core * 2;

  // Curtain wall on the long elevations.
  for (const side of [1, -1]) {
    const tex = makeFacadeTextures({
      bays: Math.round(glassW / 1.5),
      floors: o.floors - 1,
      seed: o.seed + side,
      lit: o.lit,
      light: "office",
      spandrel: 0.14,
      glassLevel: 96,
    });
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex.map,
      emissiveMap: tex.emissiveMap,
      emissive: "#ffffff",
      emissiveIntensity: 1,
      roughnessMap: tex.roughnessMap,
      roughness: 0.2,
      metalness: 0.8,
      envMapIntensity: 1.4,
      clearcoat: 0.5,
    });
    glass.push(mat);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(glassW, H - lobby), mat);
    plane.position.set(0, lobby + (H - lobby) / 2, (side * o.depth) / 2);
    plane.rotation.y = side === 1 ? 0 : Math.PI;
    plane.receiveShadow = true;
    group.add(plane);
  }
  group.add(box(glassW - 0.1, H - lobby, o.depth - 0.1, kit.darkMetal, [0, lobby + (H - lobby) / 2, 0]));

  // Lobby: tall glazing, lit.
  const lobbyTex = makeFacadeTextures({ bays: Math.round(glassW / 2), floors: 1, seed: o.seed + 9, lit: 0.9, light: "office", spandrel: 0.03 });
  const lobbyMat = new THREE.MeshStandardMaterial({
    map: lobbyTex.map,
    emissiveMap: lobbyTex.emissiveMap,
    emissive: "#ffffff",
    emissiveIntensity: 0.9,
    roughness: 0.15,
    metalness: 0.5,
  });
  group.add(box(glassW - 2, lobby, o.depth - 2, lobbyMat, [0, lobby / 2, 0]));

  // Stone end cores.
  for (const s of [1, -1]) group.add(box(core, H + 2.4, o.depth + 0.6, stone, [s * (o.width / 2 - core / 2), (H + 2.4) / 2, 0]));

  // Slabs and deep sunshades.
  const slabGeo = new THREE.BoxGeometry(glassW + 0.4, 0.4, o.depth + 0.8);
  const slabs: Placement[] = [];
  for (let f = 0; f < o.floors; f++) slabs.push({ position: [0, f === 0 ? lobby : lobby + f * fh, 0] });
  slabs.push({ position: [0, H, 0] });
  group.add(instanced(slabGeo, kit.concrete, slabs, { name: "office-slabs" }));
  const louvreGeo = new THREE.BoxGeometry(glassW, 0.09, 1);
  const louvres: Placement[] = [];
  for (let f = 1; f < o.floors; f++) {
    const y = lobby + f * fh - fh * 0.32;
    for (const s of [1, -1]) {
      louvres.push({ position: [0, y, s * (o.depth / 2 + 0.75)], scale: [1, 1, 1.4] });
      louvres.push({ position: [0, y - 0.55, s * (o.depth / 2 + 0.62)], scale: [1, 1, 1.1] });
    }
  }
  group.add(instanced(louvreGeo, kit.bronze, louvres, { name: "louvres" }));
  // Vertical mullion fins every 3 m.
  const finGeo = new THREE.BoxGeometry(0.12, H - lobby, 0.7);
  const fins: Placement[] = [];
  for (let x = -glassW / 2; x <= glassW / 2 + 0.01; x += 3) {
    for (const s of [1, -1]) fins.push({ position: [x, lobby + (H - lobby) / 2, s * (o.depth / 2 + 0.35)] });
  }
  group.add(instanced(finGeo, kit.bronze, fins, { name: "office-fins" }));

  // Rooftop plant screen.
  group.add(box(glassW * 0.6, 3, o.depth * 0.5, kit.darkMetal, [0, H + 1.5, 0]));
  return { group, glass, height: H };
}

/** Ambalam Offices (concept): two Grade A blocks around a shaded court with a water channel. */
export function buildAmbalam(kit: Kit, opts: { lit?: number } = {}): OfficeBuild {
  const lit = opts.lit ?? 0.2;
  const group = new THREE.Group();
  const stone = kit.stone.clone();
  stone.color.set("#b9a68e");
  const a = buildOfficeBlock(kit, stone, { floors: 11, width: 78, depth: 26, seed: 301, lit });
  a.group.position.set(-6, 0, -18);
  const b = buildOfficeBlock(kit, stone, { floors: 8, width: 52, depth: 24, seed: 401, lit });
  b.group.rotation.y = -Math.PI / 2;
  b.group.position.set(52, 0, 22);
  group.add(a.group, b.group);

  // Forecourt.
  group.add(flat(220, 120, kit.paving, [0, 0.04, 30]));
  // Linear water channel with a stone edge.
  group.add(box(4.4, 0.4, 58, kit.concrete, [12, 0.2, 34], { cast: false }));
  group.add(flat(3.6, 57, kit.pool, [12, 0.42, 34]));
  // Entrance canopy.
  group.add(box(26, 0.5, 10, kit.concrete, [-6, 7.2, -0.6]));
  group.add(box(26.2, 0.6, 0.2, kit.bronze, [-6, 7.2, 4.4]));
  group.add(box(22, 0.05, 8, kit.warmLight, [-6, 6.94, -0.6], { cast: false }));
  for (const x of [-17, 5]) group.add(box(0.5, 7, 0.5, kit.darkMetal, [x, 3.5, 3.6]));

  // Shade trees in a grid, benches, planters.
  const trees: Array<[number, number, number]> = [];
  for (let x = -60; x <= -16; x += 11) for (let z = 16; z <= 58; z += 11) trees.push([x, 0, z]);
  for (let z = 14; z <= 60; z += 9) trees.push([22, 0, z]);
  group.add(buildCanopyTrees(kit, trees, 33, 9));
  const benchGeo = new THREE.BoxGeometry(3.2, 0.45, 0.7);
  const benches: Placement[] = along([-58, 37], [-18, 37], 8, 0.23).map((p) => ({ position: p }));
  group.add(instanced(benchGeo, kit.concrete, benches, { name: "benches" }));
  group.add(buildShrubs(kit, along([-70, 8], [70, 8], 1.6, 0, 0.4, 2), 7, 1.2));
  group.add(buildLamps(kit, along([-70, 66], [90, 66], 16, 0), 6));

  return { group, glass: [...a.glass, ...b.glass] };
}
