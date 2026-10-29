import * as THREE from "three";
import type { Kit } from "../kit";
import { createRng, range } from "../random";
import { makeFacadeTextures } from "../textures";
import { box, flat, instanced, type Placement } from "./common";
import { along, buildCanopyTrees, buildPalms, buildShrubs } from "./landscape";

export type PlotsBuild = { group: THREE.Group; glowing: THREE.MeshStandardMaterial[] };

const PLOT_W = 14;
const PLOT_D = 22;
const ROAD = 10;

/**
 * Marutham (concept): a plotted community laid out before sale, with roads,
 * avenue trees, a central park and a share of plots already built on.
 */
export function buildMarutham(kit: Kit): PlotsBuild {
  const group = new THREE.Group();
  const rng = createRng(77);
  const cols = 12;
  const rows = 8;
  const blockCols = 6; // plots per block before a cross road
  const glowing: THREE.MeshStandardMaterial[] = [];

  const grass = ["#5b6a3c", "#64713f", "#56653a", "#6e7a45"];
  const soil = ["#9a7656", "#a17d5a", "#8f6c4f"];

  const plotGeo = new THREE.BoxGeometry(1, 0.2, 1);
  const plots: Placement[] = [];
  const walls: Placement[] = [];
  const villaSpots: Array<{ x: number; z: number; flip: boolean }> = [];
  const treeSpots: Array<[number, number, number]> = [];
  const xs: number[] = [];
  const zs: number[] = [];

  let x = 0;
  for (let c = 0; c < cols; c++) {
    if (c > 0 && c % blockCols === 0) x += ROAD + 12; // the central park strip
    xs.push(x);
    x += PLOT_W;
  }
  let z = 0;
  for (let r = 0; r < rows; r++) {
    if (r > 0 && r % 2 === 0) z += ROAD;
    zs.push(z);
    z += PLOT_D;
  }
  const totalW = x;
  const totalD = z;
  const ox = -totalW / 2;
  const oz = -totalD / 2;

  xs.forEach((px) =>
    zs.forEach((pz, r) => {
      const cx = ox + px + PLOT_W / 2;
      const cz = oz + pz + PLOT_D / 2;
      const built = rng() < 0.42;
      const cleared = !built && rng() < 0.4;
      plots.push({
        position: [cx, 0.1, cz],
        scale: [PLOT_W - 0.6, 1, PLOT_D - 0.6],
        color: cleared ? soil[Math.floor(rng() * soil.length)] : grass[Math.floor(rng() * grass.length)],
      });
      if (built) {
        villaSpots.push({ x: cx, z: cz, flip: r % 2 === 1 });
        // Compound walls on built plots.
        walls.push({ position: [cx, 0.6, cz - PLOT_D / 2 + 0.3], scale: [PLOT_W - 0.6, 1.2, 0.2] });
        walls.push({ position: [cx - PLOT_W / 2 + 0.3, 0.6, cz], scale: [0.2, 1.2, PLOT_D - 0.6] });
        walls.push({ position: [cx + PLOT_W / 2 - 0.3, 0.6, cz], scale: [0.2, 1.2, PLOT_D - 0.6] });
        if (rng() < 0.7) treeSpots.push([cx + range(rng, -4, 4), 0.2, cz + (r % 2 ? -6 : 6)]);
      }
    }),
  );
  group.add(instanced(plotGeo, kit.foliage, plots, { cast: false, name: "plots" }));
  group.add(instanced(new THREE.BoxGeometry(1, 1, 1), kit.concrete, walls, { name: "compound-walls" }));

  // Road network over a base slab.
  group.add(flat(totalW + 40, totalD + 40, kit.asphalt, [0, 0.02, 0]));
  // Kerbs around every plot row pair.
  const kerbGeo = new THREE.BoxGeometry(1, 0.22, 1);
  const kerbs: Placement[] = [];
  for (let r = 0; r < rows; r += 2) {
    const z0 = oz + (zs[r] ?? 0);
    const z1 = oz + (zs[r + 1] ?? 0) + PLOT_D;
    for (const half of [0, 1]) {
      const xa = ox + (xs[half * blockCols] ?? 0);
      const xb = ox + (xs[half * blockCols + blockCols - 1] ?? 0) + PLOT_W;
      kerbs.push({ position: [(xa + xb) / 2, 0.11, z0 - 0.2], scale: [xb - xa, 1, 0.4] });
      kerbs.push({ position: [(xa + xb) / 2, 0.11, z1 + 0.2], scale: [xb - xa, 1, 0.4] });
    }
  }
  group.add(instanced(kerbGeo, kit.concrete, kerbs, { name: "kerbs" }));

  // Central park strip with a pond.
  const parkX = ox + (xs[blockCols] ?? 0) - 11;
  group.add(flat(12, totalD, kit.lawn, [parkX, 0.06, 0]));
  group.add(flat(7, 40, kit.pool, [parkX, 0.12, -10]));
  for (let pz = oz + 6; pz < oz + totalD; pz += 9) treeSpots.push([parkX + (pz % 2 ? 4 : -4), 0.06, pz]);

  // Avenue trees along the long roads.
  for (let r = 0; r <= rows; r += 2) {
    const zr = r < rows ? oz + (zs[r] ?? 0) - ROAD / 2 : oz + totalD + ROAD / 2;
    for (const p of along([ox + 4, zr], [ox + totalW - 4, zr], 12, 0, 1.5, r + 1)) {
      if (Math.abs(p[0] - parkX) > 9) treeSpots.push([p[0], 0, p[2] + (r % 4 ? 4 : -4)]);
    }
  }
  group.add(buildCanopyTrees(kit, treeSpots, 18, 8));

  // Villas: two stacked volumes, a cantilevered roof, warm glazing.
  const villaTex = makeFacadeTextures({ bays: 6, floors: 2, seed: 9, lit: 0.55, spandrel: 0.1, glassLevel: 70 });
  const villaGlass = new THREE.MeshStandardMaterial({
    map: villaTex.map,
    emissiveMap: villaTex.emissiveMap,
    emissive: "#ffffff",
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.5,
  });
  glowing.push(villaGlass);
  const plaster = new THREE.MeshStandardMaterial({ color: "#efe6d8", roughness: 0.85 });
  const lower: Placement[] = [];
  const upper: Placement[] = [];
  const roofs: Placement[] = [];
  const glazing: Placement[] = [];
  for (const v of villaSpots) {
    const f = v.flip ? -1 : 1;
    const w = range(rng, 9, 11);
    const d = range(rng, 9, 12);
    lower.push({ position: [v.x, 1.7, v.z + f * 1], scale: [w, 3.4, d] });
    upper.push({ position: [v.x + range(rng, -1.5, 1.5), 4.9, v.z - f * 0.5], scale: [w * 0.78, 3, d * 0.8] });
    roofs.push({ position: [v.x, 6.55, v.z], scale: [w + 1.6, 0.3, d + 1] });
    glazing.push({ position: [v.x, 1.7, v.z + f * (1 + d / 2 + 0.02)], scale: [w * 0.7, 2.6, 0.05] });
    glazing.push({ position: [v.x, 4.9, v.z + f * (d * 0.4 - 0.5 + 0.02)], scale: [w * 0.5, 2.2, 0.05] });
  }
  const unit = new THREE.BoxGeometry(1, 1, 1);
  group.add(instanced(unit, plaster, lower, { name: "villa-lower" }));
  group.add(instanced(unit, plaster, upper, { name: "villa-upper" }));
  group.add(instanced(unit, kit.darkMetal, roofs, { name: "villa-roofs" }));
  group.add(instanced(unit, villaGlass, glazing, { cast: false, name: "villa-glazing" }));

  // Entrance: stone pylons with a bronze band and a palm avenue.
  const gateZ = oz + totalD + ROAD + 6;
  for (const s of [-1, 1]) {
    group.add(box(3, 7, 3, kit.stone, [parkX + s * 9, 3.5, gateZ]));
    group.add(box(3.1, 0.4, 3.1, kit.bronze, [parkX + s * 9, 6.2, gateZ]));
  }
  group.add(buildPalms(kit, [...along([parkX - 6, gateZ + 6], [parkX - 6, gateZ + 60], 10, 0), ...along([parkX + 6, gateZ + 6], [parkX + 6, gateZ + 60], 10, 0)], 3));
  group.add(flat(10, 70, kit.asphalt, [parkX, 0.03, gateZ + 32]));
  group.add(buildShrubs(kit, along([ox, oz + totalD + 14], [ox + totalW, oz + totalD + 14], 2.2, 0, 0.5, 6), 8, 1.4));

  // Farmland and scattered trees beyond the layout.
  const fields: Placement[] = [];
  for (let i = 0; i < 90; i++) {
    const a = rng() * Math.PI * 2;
    const r = range(rng, 230, 900);
    fields.push({
      position: [Math.cos(a) * r, 0.05, Math.sin(a) * r],
      rotation: [0, range(rng, -0.2, 0.2), 0],
      scale: [range(rng, 40, 120), 0.1, range(rng, 30, 90)],
      color: rng() > 0.5 ? grass[Math.floor(rng() * grass.length)] : soil[Math.floor(rng() * soil.length)],
    });
  }
  group.add(instanced(plotGeo, kit.foliage, fields, { cast: false, name: "fields" }));
  const farTrees: Array<[number, number, number]> = [];
  for (let i = 0; i < 260; i++) {
    const a = rng() * Math.PI * 2;
    const r = range(rng, 200, 800);
    farTrees.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
  }
  group.add(buildCanopyTrees(kit, farTrees, 41, 9));
  group.add(buildPalms(kit, farTrees.filter((_, i) => i % 4 === 0).map(([a, b, c]) => [a + 6, b, c + 4]), 42));

  return { group, glowing };
}
