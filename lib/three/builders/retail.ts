import * as THREE from "three";
import type { Kit } from "../kit";
import { makeFacadeTextures, makeJaaliAlpha } from "../textures";
import { box, flat, instanced, type Placement } from "./common";
import { along, buildCanopyTrees, buildLamps, buildPalms } from "./landscape";
import { buildRoad } from "./context";

export type RetailBuild = { group: THREE.Group; glowing: Array<{ material: THREE.MeshStandardMaterial; base: number }> };

/**
 * Retail Spaces (concept): a four-storey retail and showroom block. A deep stone
 * colonnade shades the shopfronts; the upper floors sit behind a jaali screen.
 */
export function buildRetail(kit: Kit): RetailBuild {
  const group = new THREE.Group();
  const glowing: RetailBuild["glowing"] = [];
  const W = 96;
  const D = 32;
  const arcadeH = 6.4;
  const upperH = 4.1;
  const floors = 3;
  const H = arcadeH + upperH * floors;
  const depth = 4.5; // colonnade depth

  // Shopfronts, recessed behind the colonnade.
  const shopTex = makeFacadeTextures({ bays: 24, floors: 1, seed: 501, lit: 0.95, spandrel: 0.12, cell: 32 });
  const shopMat = new THREE.MeshStandardMaterial({
    map: shopTex.map,
    emissiveMap: shopTex.emissiveMap,
    emissive: "#ffffff",
    emissiveIntensity: 1.6,
    roughness: 0.15,
    metalness: 0.4,
  });
  glowing.push({ material: shopMat, base: 1.6 });
  group.add(box(W - 2, arcadeH, D - depth * 2, shopMat, [0, arcadeH / 2, 0]));
  // Warm soffit under the arcade.
  const soffit = kit.warmLight.clone();
  soffit.emissiveIntensity = 0.5;
  glowing.push({ material: soffit, base: 0.5 });
  group.add(box(W, 0.1, depth, soffit, [0, arcadeH - 0.6, D / 2 - depth / 2], { cast: false }));

  // Upper floors: lit workspace glass behind a terracotta jaali screen.
  const upperTex = makeFacadeTextures({ bays: 40, floors, seed: 502, lit: 0.5, light: "office", spandrel: 0.18, glassLevel: 70 });
  const upperMat = new THREE.MeshStandardMaterial({
    map: upperTex.map,
    emissiveMap: upperTex.emissiveMap,
    emissive: "#ffffff",
    emissiveIntensity: 1.2,
    roughness: 0.2,
    metalness: 0.5,
  });
  glowing.push({ material: upperMat, base: 1.2 });
  group.add(box(W - 1.5, upperH * floors, D - 1.5, upperMat, [0, arcadeH + (upperH * floors) / 2, 0]));
  const jaali = makeJaaliAlpha();
  jaali.repeat.set(W / 3.2, (upperH * floors) / 3.2);
  const screenMat = new THREE.MeshStandardMaterial({
    color: "#b5774e",
    alphaMap: jaali,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    roughness: 0.85,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 12, upperH * floors - 0.6), screenMat);
  screen.position.set(-2, arcadeH + (upperH * floors) / 2, D / 2 + 0.9);
  screen.castShadow = true;
  group.add(screen);

  // Stone mass: floor bands, end walls, colonnade.
  const stone = kit.stone.clone();
  stone.color.set("#efe3d1");
  group.add(box(W + 0.6, 1.2, D + 0.6, stone, [0, arcadeH + 0.6 - 0.6, 0]));
  group.add(box(W + 0.6, 0.9, D + 2.6, stone, [0, H + 0.45, 0]));
  for (const s of [-1, 1]) group.add(box(5, H + 0.5, D + 2.6, stone, [s * (W / 2 - 2.5), (H + 0.5) / 2, 0]));
  const colGeo = new THREE.BoxGeometry(1.1, arcadeH, 1.1);
  const cols: Placement[] = [];
  for (let x = -W / 2 + 7; x <= W / 2 - 7; x += 5.8) cols.push({ position: [x, arcadeH / 2, D / 2 + depth / 2 - 0.2] });
  group.add(instanced(colGeo, stone, cols, { name: "colonnade" }));
  group.add(box(W - 4, 1.2, depth + 1, stone, [0, arcadeH - 0.1, D / 2 - 0.2 + depth / 2 - 2.25]));

  // Roof terrace pergola.
  const pergGeo = new THREE.BoxGeometry(0.18, 0.5, 14);
  const perg: Placement[] = [];
  for (let x = -30; x <= 30; x += 2) perg.push({ position: [x, H + 3.6, 4] });
  group.add(instanced(pergGeo, kit.bronze, perg, { name: "terrace-pergola" }));
  for (const x of [-30, 30]) for (const z of [-2.5, 10.5]) group.add(box(0.3, 3.4, 0.3, kit.darkMetal, [x, H + 1.9, z]));
  group.add(buildCanopyTrees(kit, along([-36, -6], [36, -6], 9, H + 0.9, 0.5, 4), 52, 4));

  // Plaza and street.
  group.add(flat(260, 40, kit.paving, [0, 0.04, D / 2 + 20]));
  const road = buildRoad(kit, 600, 14);
  road.rotation.y = Math.PI / 2;
  road.position.set(0, 0, D / 2 + 47);
  group.add(road);
  group.add(buildCanopyTrees(kit, along([-110, D / 2 + 30], [110, D / 2 + 30], 14, 0, 1, 7), 61, 8));
  group.add(buildPalms(kit, along([-120, D / 2 + 58], [120, D / 2 + 58], 14, 0, 1, 9), 62));
  group.add(buildLamps(kit, along([-120, D / 2 + 37], [120, D / 2 + 37], 18, 0), 6));
  // Kiosk planters along the arcade.
  const planterGeo = new THREE.BoxGeometry(2.4, 0.7, 2.4);
  const planters: Placement[] = along([-40, D / 2 + 9], [40, D / 2 + 9], 11.6, 0.35).map((p) => ({ position: p }));
  group.add(instanced(planterGeo, kit.concrete, planters, { name: "planters" }));

  return { group, glowing };
}
