import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Kit } from "../kit";
import { createRng, range } from "../random";
import { makeFacadeTextures } from "../textures";
import { worldUVBox } from "./common";

export type ContextOptions = {
  seed: number;
  /** Buildings are scattered in this ring around the origin. */
  inner: number;
  outer: number;
  count: number;
  maxHeight: number;
  lit: number;
  /** Skip a sector (radians) where the camera looks through, e.g. toward the sea. */
  avoid?: (x: number, z: number) => boolean;
  light?: "warm" | "office";
};

/**
 * Low-detail surrounding city, merged into a single mesh. Windows tile at a
 * real-world scale so distant blocks read as buildings, not boxes.
 */
export function buildContextCity(o: ContextOptions) {
  const rng = createRng(o.seed);
  const tileW = 1.6 * 8;
  const tileH = 3.2 * 8;
  const tex = makeFacadeTextures({
    bays: 8,
    floors: 8,
    seed: o.seed,
    lit: o.lit,
    repeat: true,
    cell: 24,
    light: o.light,
    glass: "#2a2723",
    spandrel: 0.38,
  });
  const geos: THREE.BufferGeometry[] = [];
  let placed = 0;
  let guard = 0;
  while (placed < o.count && guard++ < o.count * 20) {
    const a = rng() * Math.PI * 2;
    const r = o.inner + Math.pow(rng(), 0.7) * (o.outer - o.inner);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (o.avoid?.(x, z)) continue;
    const nearFactor = 1 - (r - o.inner) / (o.outer - o.inner);
    const tall = rng() < 0.18;
    const h = tall ? range(rng, 40, o.maxHeight) : range(rng, 9, 30) * (0.6 + nearFactor * 0.6);
    const w = range(rng, 14, 36);
    const d = range(rng, 14, 30);
    // A random texture offset per block, so lit rooms never line up across the skyline.
    const g = worldUVBox(w, h, d, tileW, tileH, [Math.floor(rng() * 8) / 8, Math.floor(rng() * 8) / 8]);
    g.rotateY(Math.round(rng() * 4) * (Math.PI / 2) + range(rng, -0.08, 0.08));
    g.translate(x, h / 2, z);
    geos.push(g);
    placed++;
  }
  const merged = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  if (!merged) throw new Error("Could not merge context buildings");
  const mat = new THREE.MeshStandardMaterial({
    map: tex.map,
    color: "#8f8780",
    emissiveMap: tex.emissiveMap,
    emissive: "#ffffff",
    emissiveIntensity: 0.9,
    roughness: 0.8,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(merged, mat);
  // Distant blocks receive shadow but do not cast it: at dusk their long
  // shadows would swallow the whole site.
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.name = "context-city";
  return { mesh, material: mat };
}

/** Large ground with optional sea beyond a coastline at x = coastX. */
export function buildGround(kit: Kit, opts: { size?: number; coastX?: number } = {}) {
  const size = opts.size ?? 9000;
  const group = new THREE.Group();
  const land = new THREE.Mesh(new THREE.PlaneGeometry(size, size), kit.ground);
  land.rotation.x = -Math.PI / 2;
  land.receiveShadow = true;
  if (opts.coastX !== undefined) {
    const landW = size / 2 + opts.coastX;
    land.geometry.dispose();
    land.geometry = new THREE.PlaneGeometry(landW, size);
    land.position.x = -size / 2 + landW / 2;
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(size, size), kit.water);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(opts.coastX + size / 2, -0.4, 0);
    sea.receiveShadow = true;
    sea.name = "sea";
    group.add(sea);
    // A pale strip of beach along the coast.
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(60, size), new THREE.MeshStandardMaterial({ color: "#b9a583", roughness: 1 }));
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(opts.coastX - 20, 0.02, 0);
    beach.receiveShadow = true;
    group.add(beach);
  }
  group.add(land);
  return group;
}

/** A straight road with kerbs and centre markings, centred on the origin, along z. */
export function buildRoad(kit: Kit, length: number, width: number) {
  const group = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(width, length), kit.asphalt);
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.03;
  road.receiveShadow = true;
  group.add(road);
  for (const s of [-1, 1]) {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, length), kit.concrete);
    kerb.position.set((s * width) / 2, 0.09, 0);
    kerb.receiveShadow = true;
    group.add(kerb);
  }
  const markGeo = new THREE.PlaneGeometry(0.14, 3);
  const markMat = new THREE.MeshStandardMaterial({ color: "#d8d0c2", roughness: 0.8 });
  const n = Math.floor(length / 9);
  const marks = new THREE.InstancedMesh(markGeo, markMat, n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    o.position.set(0, 0.04, -length / 2 + i * 9);
    o.rotation.set(-Math.PI / 2, 0, 0);
    o.updateMatrix();
    marks.setMatrixAt(i, o.matrix);
  }
  marks.receiveShadow = true;
  group.add(marks);
  return group;
}
