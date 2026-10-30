import * as THREE from "three";
import type { Kit } from "../kit";
import { createRng } from "../random";
import { box, flat, instanced, type Placement } from "./common";
import { buildRoad } from "./context";
import { buildGlassTower, chamferedRect, facetedEllipse, rect, scaleFootprint, type GlassTower } from "./glassTower";
import { along, buildCanopyTrees, buildLamps, buildPalms, buildShrubs } from "./landscape";

export type DistrictTower = {
  id: string;
  name: string;
  type: string;
  floors: number;
  blurb: string;
  position: [number, number];
  tower: GlassTower;
  /** Half extents of the hover volume. */
  size: [number, number, number];
};

export type District = {
  group: THREE.Group;
  towers: DistrictTower[];
  /** Road centrelines the traffic follows: [x0, z0, x1, z1]. */
  lanes: Array<[number, number, number, number]>;
  glowing: Array<{ material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial; base: number }>;
  /** Pedestrian routes along the plaza and pavements: [x0, z0, x1, z1]. */
  walks: Array<[number, number, number, number]>;
};

export type DistrictOptions = {
  /** Trees, palms and hedges. The corporate hero turns these off for an all-urban scene. */
  landscape?: boolean;
};

/**
 * Vishaks Central (concept): a business district of glass towers set around a
 * landscaped plaza. Used by the pinned skyline section on the home page.
 */
export function buildDistrict(kit: Kit, opts: DistrictOptions = {}): District {
  const landscape = opts.landscape ?? true;
  const group = new THREE.Group();
  const rng = createRng(909);
  const glowing: District["glowing"] = [];

  const specs: Array<Omit<DistrictTower, "tower" | "size"> & { opts: Parameters<typeof buildGlassTower>[1] }> = [
    {
      id: "central",
      name: "Vishaks Central",
      type: "Grade A office tower",
      floors: 52,
      blurb: "A chamfered prism that steps back twice and finishes in a lit lantern and spire.",
      position: [0, 0],
      opts: {
        seed: 11,
        lit: 0.42,
        tiers: [
          { footprint: chamferedRect(44, 44, 7), floors: 24 },
          { footprint: chamferedRect(38, 38, 6), floors: 18 },
          { footprint: chamferedRect(30, 30, 5), floors: 10 },
        ],
        spire: 34,
        lantern: true,
        mullionDepth: 0.55,
      },
    },
    {
      id: "harbour",
      name: "Harbour House",
      type: "Corporate headquarters",
      floors: 38,
      blurb: "A faceted oval tower, its sixteen glass facets catching the light differently through the day.",
      position: [78, -46],
      opts: {
        seed: 22,
        lit: 0.38,
        tint: "#a9bccb",
        tiers: [
          { footprint: facetedEllipse(40, 30, 16), floors: 30 },
          { footprint: facetedEllipse(34, 25, 16), floors: 8 },
        ],
        lantern: true,
      },
    },
    {
      id: "exchange",
      name: "The Exchange",
      type: "Office slab",
      floors: 30,
      blurb: "A long, slender slab with wide floor plates sized for large occupiers, stepping back near the top.",
      position: [-86, -30],
      opts: {
        seed: 33,
        lit: 0.35,
        tint: "#8fa4b6",
        tiers: [
          { footprint: rect(56, 22), floors: 26 },
          { footprint: scaleFootprint(rect(56, 22), 0.9), floors: 4 },
        ],
      },
    },
    {
      id: "meridian",
      name: "Meridian Residences",
      type: "Luxury residential tower",
      floors: 44,
      blurb: "A slim residential tower in bronze-tinted glass, set back above the podium for sky terraces.",
      position: [-40, 88],
      opts: {
        seed: 44,
        lit: 0.5,
        light: "warm",
        tint: "#c2a98f",
        floorHeight: 3.4,
        tiers: [
          { footprint: chamferedRect(30, 26, 4), floors: 30 },
          { footprint: chamferedRect(26, 22, 4), floors: 14 },
        ],
        spire: 12,
      },
    },
    {
      id: "pavilion",
      name: "Garden Pavilion",
      type: "Mixed-use podium",
      floors: 12,
      blurb: "A low, wide building of shops, restaurants and a conference hall around a planted court.",
      position: [62, 74],
      opts: {
        seed: 55,
        lit: 0.6,
        light: "warm",
        tint: "#b9a58e",
        tiers: [
          { footprint: chamferedRect(70, 40, 10), floors: 8 },
          { footprint: chamferedRect(52, 28, 8), floors: 4 },
        ],
      },
    },
    {
      id: "north",
      name: "North Tower",
      type: "Office tower",
      floors: 34,
      blurb: "A crisp square tower with deep mullions that turn the facade almost solid at an angle.",
      position: [24, -118],
      opts: {
        seed: 66,
        lit: 0.3,
        tiers: [{ footprint: rect(34, 34), floors: 34 }],
        mullionDepth: 0.9,
      },
    },
  ];

  const towers: DistrictTower[] = specs.map((s) => {
    const tower = buildGlassTower(kit, s.opts);
    tower.group.position.set(s.position[0], 0, s.position[1]);
    const box3 = new THREE.Box3().setFromObject(tower.group);
    const size = box3.getSize(new THREE.Vector3());
    group.add(tower.group);
    tower.glass.forEach((m) => glowing.push({ material: m, base: 1 }));
    if (tower.lantern) glowing.push({ material: tower.lantern, base: 1.6 });
    return { id: s.id, name: s.name, type: s.type, floors: s.floors, blurb: s.blurb, position: s.position, tower, size: [size.x / 2, size.y / 2, size.z / 2] };
  });

  // Plaza: stone paving, a reflecting pool on the axis, trees and planters.
  const plaza = kit.paving.clone();
  plaza.color.set("#a39686");
  group.add(flat(380, 380, plaza, [0, 0.03, 0]));
  group.add(box(12, 0.5, 120, kit.stone, [0, 0.2, 70], { cast: false }));
  group.add(flat(10.4, 118, kit.pool, [0, 0.47, 70]));
  const trees: Array<[number, number, number]> = [];
  for (let z = 30; z <= 140; z += 11) {
    trees.push([-14, 0, z], [14, 0, z]);
  }
  for (let i = 0; i < 40; i++) {
    const a = rng() * Math.PI * 2;
    const r = 120 + rng() * 60;
    trees.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
  }
  if (landscape) {
    group.add(buildCanopyTrees(kit, trees, 71, 9));
    group.add(buildPalms(kit, [...along([-30, -40], [-30, 40], 10, 0), ...along([30, -40], [30, 40], 10, 0)].filter(([, , z]) => Math.abs(z) > 26), 72));
    group.add(buildShrubs(kit, along([-170, 170], [170, 170], 2.4, 0, 0.6, 3), 73, 1.4));
  } else {
    // Urban hardscape instead of planting: granite pavement bands, stone benches and bollards.
    const bands: Placement[] = [];
    for (let i = -170; i <= 170; i += 20) {
      bands.push({ position: [i, 0.05, 0], scale: [0.6, 0.04, 340] }, { position: [0, 0.05, i], scale: [340, 0.04, 0.6] });
    }
    group.add(instanced(new THREE.BoxGeometry(1, 1, 1), kit.stone, bands, { cast: false, name: "paving-bands" }));
    const benches: Placement[] = [];
    for (let z = 34; z <= 136; z += 17) benches.push({ position: [-22, 0.25, z], scale: [1.4, 0.5, 6] }, { position: [22, 0.25, z], scale: [1.4, 0.5, 6] });
    group.add(instanced(new THREE.BoxGeometry(1, 1, 1), kit.stone, benches, { name: "benches" }));
    const bollards: Placement[] = [];
    for (let x = -180; x <= 180; x += 6) bollards.push({ position: [x, 0.5, 188], scale: [0.35, 1, 0.35] }, { position: [x, 0.5, -188], scale: [0.35, 1, 0.35] });
    group.add(instanced(new THREE.CylinderGeometry(0.5, 0.5, 1, 8), kit.darkMetal, bollards, { cast: false, name: "bollards" }));
  }
  group.add(buildLamps(kit, [...along([-8, 30], [-8, 140], 14, 0), ...along([8, 30], [8, 140], 14, 0)], 5));

  // Ring of roads around the plaza, with traffic.
  const lanes: District["lanes"] = [];
  for (const [rx, rz, rot, len] of [
    [0, 200, Math.PI / 2, 900],
    [0, -200, Math.PI / 2, 900],
    [200, 0, 0, 900],
    [-200, 0, 0, 900],
  ] as const) {
    const road = buildRoad(kit, len, 18);
    road.rotation.y = rot;
    road.position.set(rx, 0, rz);
    group.add(road);
    if (rot) {
      lanes.push([-450, rz - 4, 450, rz - 4], [450, rz + 4, -450, rz + 4]);
    } else {
      lanes.push([rx - 4, 450, rx - 4, -450], [rx + 4, -450, rx + 4, 450]);
    }
  }

  // Zebra crossings where the plaza axes meet the ring roads.
  const zebra: Placement[] = [];
  for (const [cx, cz, alongX] of [
    [0, 200, false],
    [0, -200, false],
    [200, 0, true],
    [-200, 0, true],
  ] as const) {
    for (let k = -7; k <= 7; k += 1.6) {
      zebra.push({ position: alongX ? [cx, 0.06, cz + k] : [cx + k, 0.06, cz], scale: alongX ? [14, 0.02, 0.8] : [0.8, 0.02, 14] });
    }
  }
  group.add(instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: "#e8e4dc", roughness: 0.7 }), zebra, { cast: false, name: "crossings" }));

  // Pavements either side of each road, and the plaza promenades.
  const walks: District["walks"] = [];
  for (const off of [-12.5, 12.5]) {
    walks.push([-430, 200 + off, 430, 200 + off], [-430, -200 + off, 430, -200 + off], [200 + off, -430, 200 + off, 430], [-200 + off, -430, -200 + off, 430]);
  }
  walks.push([-18, 30, -18, 186], [18, 186, 18, 30], [-186, 150, 186, 150], [186, -150, -186, -150], [-150, -186, -150, 186], [150, 186, 150, -186], [0, 186, 0, 150], [-186, 0, -30, 0], [30, 0, 186, 0]);

  return { group, towers, lanes, glowing, walks };
}
