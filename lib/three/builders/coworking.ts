import * as THREE from "three";
import type { Kit } from "../kit";
import { buildOfficeBlock } from "./office";
import { flat, instanced, type Placement } from "./common";
import { buildGlassTower, chamferedRect } from "./glassTower";
import { buildLamps } from "./landscape";

export type CoworkingBuild = {
  group: THREE.Group;
  height: number;
  glowing: Array<{ material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial; base: number }>;
};

/**
 * Coworking Spaces (concept): a terraced, low-rise workspace campus. Two
 * office blocks with bronze sunshades meet at an L, a glass meeting pavilion
 * sits on the taller roof, and lit terraces give every floor shared outdoor
 * space. The forecourt is hard-landscaped, with no planting.
 */
export function buildCoworking(kit: Kit, opts: { lit?: number; texCell?: number; forecourt?: boolean } = {}): CoworkingBuild {
  const lit = opts.lit ?? 0.6;
  const group = new THREE.Group();
  const glowing: CoworkingBuild["glowing"] = [];
  const a = buildOfficeBlock(kit, kit.stone, { floors: 7, width: 56, depth: 22, seed: 860, lit });
  a.group.position.set(-4, 0, -10);
  group.add(a.group);
  const b = buildOfficeBlock(kit, kit.stone, { floors: 5, width: 40, depth: 20, seed: 861, lit: Math.min(1, lit + 0.05) });
  b.group.position.set(12, 0, 18);
  b.group.rotation.y = Math.PI / 2;
  group.add(b.group);
  [...a.glass, ...b.glass].forEach((m) => glowing.push({ material: m, base: 1 }));

  // The shared heart of the workspace: a glass meeting pavilion on the roof.
  const pavilion = buildGlassTower(kit, {
    seed: 862,
    lit: 0.9,
    light: "warm",
    tint: "#c8d4dc",
    floorHeight: 4.5,
    lobbyFloors: 0,
    tiers: [{ footprint: chamferedRect(18, 18, 4), floors: 2 }],
    lantern: true,
    texCell: opts.texCell,
  });
  pavilion.group.position.set(-4, a.height + 0.2, -10);
  group.add(pavilion.group);
  pavilion.glass.forEach((m) => glowing.push({ material: m, base: 1.2 }));
  if (pavilion.lantern) glowing.push({ material: pavilion.lantern, base: 1.6 });

  const deckMat = new THREE.MeshStandardMaterial({ color: "#2a1d12", emissive: "#ffb46a", emissiveIntensity: 0.9 });
  glowing.push({ material: deckMat, base: 0.9 });
  const decks: Placement[] = [
    { position: [-24, a.height + 0.25, -10], scale: [12, 0.3, 18] },
    { position: [12, b.height + 0.25, 30], scale: [16, 0.3, 10] },
  ];
  group.add(instanced(new THREE.BoxGeometry(1, 1, 1), deckMat, decks, { cast: false, name: "terraces" }));
  // Terrace balustrades in glass.
  const rails: Placement[] = [
    { position: [-24, a.height + 0.8, -1.2], scale: [12, 1.1, 0.06] },
    { position: [-30, a.height + 0.8, -10], scale: [0.06, 1.1, 18] },
    { position: [12, b.height + 0.8, 35], scale: [16, 1.1, 0.06] },
  ];
  group.add(instanced(new THREE.BoxGeometry(1, 1, 1), kit.balustrade, rails, { cast: false, name: "terrace-rails" }));

  if (opts.forecourt ?? true) {
    group.add(flat(150, 130, kit.paving, [0, 0.03, 10]));
    const bands: Placement[] = [];
    for (let x = -70; x <= 70; x += 14) bands.push({ position: [x, 0.05, 10], scale: [0.5, 0.04, 128] });
    group.add(instanced(new THREE.BoxGeometry(1, 1, 1), kit.stone, bands, { cast: false, name: "paving-bands" }));
    const benches: Placement[] = [];
    for (let x = -40; x <= 0; x += 10) benches.push({ position: [x, 0.25, 30], scale: [6, 0.5, 1.4] });
    group.add(instanced(new THREE.BoxGeometry(1, 1, 1), kit.stone, benches, { name: "benches" }));
    group.add(buildLamps(kit, [[-46, 0, 44], [-26, 0, 44], [-6, 0, 44], [38, 0, 10], [38, 0, -14]], 5));
  }
  return { group, height: a.height + 14, glowing };
}
