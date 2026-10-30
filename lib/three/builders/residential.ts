import * as THREE from "three";
import type { Kit } from "../kit";
import { createRng } from "../random";
import { makeFacadeTextures } from "../textures";
import { box, flat, instanced, type Placement } from "./common";
import { along, buildCanopyTrees, buildLamps, buildPalms, buildShrubs } from "./landscape";
import { buildRoad } from "./context";
import { buildResidentialTower, type Tower } from "./tower";

export const RESIDENTIAL_PODIUM = { width: 84, depth: 58, lobbyHeight: 7.5, stoneHeight: 4.5 } as const;
export const RESIDENTIAL_DECK = RESIDENTIAL_PODIUM.lobbyHeight + RESIDENTIAL_PODIUM.stoneHeight;

export type ResidentialBuild = {
  group: THREE.Group;
  towers: Tower[];
  /** Materials whose glow follows the time of day. */
  glowing: Array<{ material: THREE.MeshStandardMaterial; base: number }>;
};

/**
 * Residential Spaces (concept): two residential towers on a landscaped podium
 * with a lap pool, palms and a shaded arrival court.
 */
export function buildResidential(kit: Kit, opts: { lit?: number } = {}): ResidentialBuild {
  const lit = opts.lit ?? 0.42;
  const group = new THREE.Group();
  const rng = createRng(31);
  const { width: PW, depth: PD, lobbyHeight: LH, stoneHeight: SH } = RESIDENTIAL_PODIUM;
  const glowing: ResidentialBuild["glowing"] = [];

  // Lobby: double-height glazing, warmly lit.
  const lobbyTex = makeFacadeTextures({ bays: 44, floors: 2, seed: 77, lit: 0.95, spandrel: 0.04, cell: 24 });
  const lobbyMat = new THREE.MeshStandardMaterial({
    map: lobbyTex.map,
    emissiveMap: lobbyTex.emissiveMap,
    emissive: "#ffffff",
    emissiveIntensity: 1.3,
    roughness: 0.2,
    metalness: 0.4,
  });
  glowing.push({ material: lobbyMat, base: 1.3 });
  group.add(box(PW - 4, LH, PD - 4, lobbyMat, [0, LH / 2, 0]));

  // Stone podium mass above the lobby, with a deep shadow gap.
  const stone = kit.stone.clone();
  stone.map = kit.stone.map?.clone() ?? null;
  if (stone.map) {
    stone.map.repeat.set(PW / 9, SH / 4.5);
    stone.map.needsUpdate = true;
  }
  group.add(box(PW, SH, PD, stone, [0, LH + SH / 2, 0]));
  group.add(box(PW - 3.2, 0.6, PD - 3.2, kit.darkMetal, [0, LH + 0.3, 0]));
  // Stone piers along the lobby rhythm.
  const pierGeo = new THREE.BoxGeometry(1.1, LH, 1.1);
  const piers: Placement[] = [];
  for (let x = -PW / 2 + 1; x <= PW / 2 - 1; x += 6.8) {
    piers.push({ position: [x, LH / 2, PD / 2 - 0.6] });
    piers.push({ position: [x, LH / 2, -PD / 2 + 0.6] });
  }
  for (let z = -PD / 2 + 1; z <= PD / 2 - 1; z += 6.8) {
    piers.push({ position: [PW / 2 - 0.6, LH / 2, z] });
    piers.push({ position: [-PW / 2 + 0.6, LH / 2, z] });
  }
  group.add(instanced(pierGeo, stone, piers, { name: "piers" }));

  // Arrival canopy: a thin cantilevered plane with a bronze edge.
  group.add(box(34, 0.45, 9, kit.concrete, [-6, 6.2, PD / 2 + 4.5]));
  group.add(box(34.2, 0.5, 0.18, kit.bronze, [-6, 6.2, PD / 2 + 9]));
  const canopyLight = box(30, 0.05, 6, kit.warmLight, [-6, 5.95, PD / 2 + 4.5], { cast: false });
  group.add(canopyLight);

  // Podium deck.
  const deck = flat(PW, PD, kit.paving, [0, RESIDENTIAL_DECK + 0.01, 0]);
  group.add(deck);
  // Parapet.
  for (const [w, d, x, z] of [
    [PW, 0.4, 0, PD / 2 - 0.2],
    [PW, 0.4, 0, -PD / 2 + 0.2],
    [0.4, PD, PW / 2 - 0.2, 0],
    [0.4, PD, -PW / 2 + 0.2, 0],
  ] as const) {
    group.add(box(w, 1.1, d, kit.concrete, [x, RESIDENTIAL_DECK + 0.55, z]));
  }

  // Towers.
  const towerA = buildResidentialTower(kit, { floors: 34, width: 26, depth: 19, seed: 101, lit, skyGardens: [12, 24] });
  towerA.group.position.set(-17, RESIDENTIAL_DECK, -6);
  const towerB = buildResidentialTower(kit, { floors: 26, width: 22, depth: 18, seed: 202, lit, skyGardens: [14] });
  towerB.group.position.set(23, RESIDENTIAL_DECK, -10);
  group.add(towerA.group, towerB.group);

  // Lap pool and deck landscape.
  const poolX = 14;
  const poolZ = 16;
  group.add(box(30, 0.5, 8.4, kit.concrete, [poolX, RESIDENTIAL_DECK + 0.1, poolZ], { cast: false }));
  const pool = flat(28, 6.6, kit.pool, [poolX, RESIDENTIAL_DECK + 0.38, poolZ]);
  group.add(pool);
  // Loungers along the pool.
  const loungerGeo = new THREE.BoxGeometry(0.75, 0.35, 2);
  const loungers: Placement[] = [];
  for (let i = 0; i < 8; i++) loungers.push({ position: [poolX - 12 + i * 3.4, RESIDENTIAL_DECK + 0.2, poolZ + 5.6] });
  group.add(instanced(loungerGeo, kit.concrete, loungers, { name: "loungers" }));

  // Planters and lawn.
  group.add(flat(26, 14, kit.lawn, [-17, RESIDENTIAL_DECK + 0.03, 19]));
  const deckTrees: Array<[number, number, number]> = [];
  for (let i = 0; i < 9; i++) deckTrees.push([-28 + (i % 3) * 7 + (rng() - 0.5) * 2, RESIDENTIAL_DECK, 15 + Math.floor(i / 3) * 4.5]);
  group.add(buildCanopyTrees(kit, deckTrees, 12, 6.5));
  group.add(
    buildPalms(kit, [
      [poolX - 15, RESIDENTIAL_DECK, poolZ - 5],
      [poolX + 15, RESIDENTIAL_DECK, poolZ - 6],
      [poolX + 3, RESIDENTIAL_DECK, poolZ - 6.5],
      [36, RESIDENTIAL_DECK, 22],
    ], 5),
  );
  group.add(buildShrubs(kit, along([-40, PD / 2 - 1.5], [40, PD / 2 - 1.5], 1.8, RESIDENTIAL_DECK, 0.4, 3), 6, 1.3));

  // Street frontage: road, footpath, palms and lamps.
  const road = buildRoad(kit, 900, 16);
  road.rotation.y = Math.PI / 2;
  road.position.set(0, 0, PD / 2 + 26);
  group.add(road);
  group.add(flat(900, 12, kit.paving, [0, 0.05, PD / 2 + 12]));
  group.add(flat(900, 8, kit.paving, [0, 0.05, PD / 2 + 38]));
  const palmLine = along([-160, PD / 2 + 16], [160, PD / 2 + 16], 13, 0, 0.6, 8);
  group.add(buildPalms(kit, palmLine, 9));
  group.add(buildLamps(kit, along([-200, PD / 2 + 19], [200, PD / 2 + 19], 26, 0), 7));
  group.add(buildPalms(kit, along([-220, PD / 2 + 39], [220, PD / 2 + 39], 15, 0, 1.2, 4), 14));

  return { group, towers: [towerA, towerB], glowing };
}
