import * as THREE from "three";
import type { Kit } from "../kit";
import type { CategoryId } from "../corridors";
import { buildCoworking } from "./coworking";
import { instanced, type Placement } from "./common";
import { buildGlassTower, chamferedRect, facetedEllipse, rect } from "./glassTower";
import { buildResidentialTower } from "./tower";

/**
 * Architectural models for the corridor map's four target zones, built in
 * metres from the same builders as the concept projects. Each one has its
 * own identity: a towered business park, a cluster of residential towers, a
 * shopping centre and a terraced coworking campus.
 */
export type MapModel = {
  group: THREE.Group;
  /** Height of the tallest part, in metres. */
  height: number;
  glowing: Array<{ material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial; base: number }>;
};

function plinth(kit: Kit, radius: number) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 2, 1.6, 48), kit.darkMetal);
  base.position.y = 0.8;
  base.receiveShadow = true;
  base.castShadow = true;
  g.add(base);
  const top = new THREE.Mesh(new THREE.CircleGeometry(radius - 1.5, 48), kit.paving);
  top.rotation.x = -Math.PI / 2;
  top.position.y = 1.62;
  top.receiveShadow = true;
  g.add(top);
  return g;
}

function office(kit: Kit): MapModel {
  const group = new THREE.Group();
  const glowing: MapModel["glowing"] = [];
  const add = (t: ReturnType<typeof buildGlassTower>, x: number, z: number, r = 0) => {
    t.group.position.set(x, 1.6, z);
    t.group.rotation.y = r;
    group.add(t.group);
    t.glass.forEach((m) => glowing.push({ material: m, base: 1 }));
    if (t.lantern) glowing.push({ material: t.lantern, base: 1.6 });
    return t.height;
  };
  const h = Math.max(
    add(buildGlassTower(kit, { texCell: 10, seed: 801, lit: 0.45, tiers: [{ footprint: chamferedRect(30, 30, 5), floors: 26 }, { footprint: chamferedRect(24, 24, 4), floors: 14 }], spire: 26, lantern: true, mullionDepth: 0.55 }), -16, -12),
    add(buildGlassTower(kit, { texCell: 10, seed: 802, lit: 0.4, tint: "#a9bccb", tiers: [{ footprint: facetedEllipse(28, 20, 14), floors: 30 }] }), 20, 4, 0.4),
    add(buildGlassTower(kit, { texCell: 10, seed: 803, lit: 0.35, tint: "#8fa4b6", tiers: [{ footprint: rect(40, 16), floors: 18 }, { footprint: rect(34, 14), floors: 4 }] }), -6, 28, -0.2),
  );
  group.add(plinth(kit, 52));
  return { group, height: h, glowing };
}

function residential(kit: Kit): MapModel {
  const group = new THREE.Group();
  const glowing: MapModel["glowing"] = [];
  let h = 0;
  const specs: Array<[number, number, number, number]> = [
    [36, -18, -10, 0.2],
    [30, 16, -16, -0.3],
    [24, 2, 22, 0.05],
  ];
  specs.forEach(([floors, x, z, r], i) => {
    const t = buildResidentialTower(kit, { floors, width: 22, depth: 16, seed: 820 + i, lit: 0.55, skyGardens: [Math.floor(floors / 2)] });
    t.group.position.set(x, 1.6, z);
    t.group.rotation.y = r;
    group.add(t.group);
    t.glass.forEach((m) => glowing.push({ material: m, base: 1 }));
    h = Math.max(h, t.height);
  });
  group.add(plinth(kit, 50));
  return { group, height: h, glowing };
}

function retail(kit: Kit): MapModel {
  const group = new THREE.Group();
  const glowing: MapModel["glowing"] = [];
  const mall = buildGlassTower(kit, {
    seed: 840,
    lit: 0.9,
    light: "warm",
    tint: "#b9a58e",
    floorHeight: 6,
    lobbyFloors: 1,
    tiers: [
      { footprint: chamferedRect(78, 46, 10), floors: 3 },
      { footprint: chamferedRect(52, 30, 8), floors: 1 },
    ],
  });
  mall.group.position.y = 1.6;
  group.add(mall.group);
  mall.glass.forEach((m) => glowing.push({ material: m, base: 1.2 }));
  // A faceted glass atrium rising through the roof.
  const atrium = buildGlassTower(kit, { texCell: 10, seed: 841, lit: 0.95, light: "warm", tint: "#d8c8b0", floorHeight: 5, lobbyFloors: 0, tiers: [{ footprint: facetedEllipse(22, 22, 12), floors: 2 }], lantern: true });
  atrium.group.position.set(0, 1.6 + 24.7, 0);
  group.add(atrium.group);
  atrium.glass.forEach((m) => glowing.push({ material: m, base: 1.4 }));
  if (atrium.lantern) glowing.push({ material: atrium.lantern, base: 1.8 });
  // Bronze entrance canopies and lit shopfront bands along the street faces.
  const canopies: Placement[] = [
    { position: [0, 1.6 + 7.2, 24.5], scale: [40, 0.6, 7] },
    { position: [0, 1.6 + 7.2, -24.5], scale: [40, 0.6, 7] },
    { position: [40.5, 1.6 + 7.2, 0], scale: [7, 0.6, 24] },
  ];
  group.add(instanced(new THREE.BoxGeometry(1, 1, 1), kit.bronze, canopies, { name: "canopies" }));
  const signMat = new THREE.MeshStandardMaterial({ color: "#2a1d12", emissive: "#ffc98a", emissiveIntensity: 1.6 });
  glowing.push({ material: signMat, base: 1.6 });
  const signs: Placement[] = [];
  for (let x = -32; x <= 32; x += 8) signs.push({ position: [x, 1.6 + 9.6, 23.8], scale: [5.4, 1.1, 0.3] }, { position: [x, 1.6 + 9.6, -23.8], scale: [5.4, 1.1, 0.3] });
  group.add(instanced(new THREE.BoxGeometry(1, 1, 1), signMat, signs, { cast: false, name: "shop-signs" }));
  group.add(plinth(kit, 52));
  return { group, height: 36, glowing };
}

function coworking(kit: Kit): MapModel {
  const campus = buildCoworking(kit, { texCell: 10, forecourt: false });
  campus.group.position.y = 1.6;
  const group = new THREE.Group();
  group.add(campus.group);
  group.add(plinth(kit, 50));
  return { group, height: campus.height, glowing: campus.glowing };
}

export function buildMapModel(kit: Kit, id: CategoryId): MapModel {
  switch (id) {
    case "office":
      return office(kit);
    case "residential":
      return residential(kit);
    case "retail":
      return retail(kit);
    case "coworking":
      return coworking(kit);
  }
}
