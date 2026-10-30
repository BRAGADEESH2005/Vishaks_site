import * as THREE from "three";
import type { Kit } from "../kit";
import { createRng } from "../random";
import { makeFacadeTextures, makePanelNormal } from "../textures";
import { instanced, type Placement } from "./common";

export type Point2 = [number, number];
export type Tier = { footprint: Point2[]; floors: number };

export type GlassTowerOptions = {
  tiers: Tier[];
  seed: number;
  /** Share of lit rooms, 0..1. */
  lit: number;
  floorHeight?: number;
  /** Floors of tier 0 given over to a double-height recessed lobby. */
  lobbyFloors?: number;
  light?: "office" | "warm";
  /** Glass body tint: a blue-grey reads corporate, a bronze reads hospitality. */
  tint?: string;
  /** Height of a spire above the crown, in metres. 0 for none. */
  spire?: number;
  /** Lantern crown: a screened top storey lit from inside at night. */
  lantern?: boolean;
  /** Depth of the vertical mullions; deeper reads more premium and casts finer shadows. */
  mullionDepth?: number;
  /** Pixels per facade cell in the generated textures. Smaller saves GPU memory for distant or miniature towers. */
  texCell?: number;
};

export type GlassTower = {
  group: THREE.Group;
  height: number;
  glass: THREE.MeshPhysicalMaterial[];
  lantern: THREE.MeshStandardMaterial | null;
  beacon: THREE.Mesh | null;
};

const BAY = 1.5; // metres between mullions
const TEX_BAYS = 16;
const TEX_FLOORS = 32;

/** A rectangle with chamfered corners: the classic corporate prism footprint. */
export function chamferedRect(w: number, d: number, c: number): Point2[] {
  const x = w / 2;
  const z = d / 2;
  return [
    [-x + c, -z],
    [x - c, -z],
    [x, -z + c],
    [x, z - c],
    [x - c, z],
    [-x + c, z],
    [-x, z - c],
    [-x, -z + c],
  ];
}

export function rect(w: number, d: number): Point2[] {
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ];
}

/** A rounded footprint approximated by n flat facets, like a faceted curtain wall. */
export function facetedEllipse(w: number, d: number, n: number): Point2[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * (w / 2), Math.sin(a) * (d / 2)] as Point2;
  });
}

export function scaleFootprint(p: Point2[], s: number, ox = 0, oz = 0): Point2[] {
  return p.map(([x, z]) => [x * s + ox, z * s + oz]);
}

type Edge = { a: Point2; b: Point2; len: number; mid: Point2; rotY: number; normal: Point2 };

function edgesOf(footprint: Point2[]): Edge[] {
  const cx = footprint.reduce((s, p) => s + p[0], 0) / footprint.length;
  const cz = footprint.reduce((s, p) => s + p[1], 0) / footprint.length;
  return footprint.map((a, i) => {
    const b = footprint[(i + 1) % footprint.length] ?? a;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const mid: Point2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let nx = dz / len;
    let nz = -dx / len;
    if (nx * (mid[0] - cx) + nz * (mid[1] - cz) < 0) {
      nx = -nx;
      nz = -nz;
    }
    return { a, b, len, mid, normal: [nx, nz], rotY: Math.atan2(nx, nz) };
  });
}

/** A plane facing outward from an edge, with UVs scaled so the facade texture keeps a true bay size. */
function facadePlane(edge: Edge, y0: number, h: number, floors: number, fh: number, uOffset: number, vOffset: number) {
  const g = new THREE.PlaneGeometry(edge.len, h);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  const uScale = edge.len / (BAY * TEX_BAYS);
  const vScale = floors / TEX_FLOORS;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * uScale + uOffset, uv.getY(i) * vScale + vOffset);
  uv.needsUpdate = true;
  g.rotateY(edge.rotY);
  g.translate(edge.mid[0], y0 + h / 2, edge.mid[1]);
  void fh;
  return g;
}

function capGeometry(footprint: Point2[], y: number) {
  const shape = new THREE.Shape(footprint.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

function merge(geos: THREE.BufferGeometry[]) {
  // Planes and caps share attribute layouts, so a manual merge keeps one draw call per material.
  const nonIndexed = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = nonIndexed.reduce((s, g) => s + g.getAttribute("position").count, 0);
  const out = new THREE.BufferGeometry();
  for (const name of ["position", "normal", "uv"] as const) {
    const size = name === "uv" ? 2 : 3;
    const arr = new Float32Array(total * size);
    let o = 0;
    for (const g of nonIndexed) {
      const a = g.getAttribute(name) as THREE.BufferAttribute;
      arr.set(a.array as Float32Array, o);
      o += a.count * size;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  geos.forEach((g) => g.dispose());
  nonIndexed.forEach((g) => g.dispose());
  out.computeBoundingSphere();
  return out;
}

/**
 * A corporate glass tower, assembled from set-back tiers. Every piece that
 * reads at close range is real geometry: projecting mullions, floor transoms,
 * set-back ledges, a recessed lobby behind piers, and a screened crown.
 */
export function buildGlassTower(kit: Kit, o: GlassTowerOptions): GlassTower {
  const fh = o.floorHeight ?? 4;
  const rng = createRng(o.seed);
  const group = new THREE.Group();
  const lobbyFloors = o.lobbyFloors ?? 2;
  const lobbyH = lobbyFloors * fh;
  const md = o.mullionDepth ?? 0.42;

  const facade = makeFacadeTextures({
    bays: TEX_BAYS,
    floors: TEX_FLOORS,
    seed: o.seed,
    lit: o.lit,
    light: o.light ?? "office",
    spandrel: 0.16,
    glassLevel: 118,
    repeat: true,
    cell: o.texCell ?? 24,
  });
  const panel = makePanelNormal(TEX_BAYS, TEX_FLOORS, o.seed + 7);
  const glass = new THREE.MeshPhysicalMaterial({
    color: o.tint ?? "#9fb3c4",
    map: facade.map,
    emissiveMap: facade.emissiveMap,
    emissive: "#ffffff",
    emissiveIntensity: 1,
    roughnessMap: panel.roughness,
    roughness: 1,
    metalness: 0.92,
    normalMap: panel.normal,
    normalScale: new THREE.Vector2(1, 1),
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.25,
  });
  // Facade textures belong to this tower's material; disposeObject frees them.

  const mullionGeo = new THREE.BoxGeometry(1, 1, 1);
  const mullions: Placement[] = [];
  const transoms: Placement[] = [];
  const ledges: Placement[] = [];
  const parapets: Placement[] = [];
  const facadeGeos: THREE.BufferGeometry[] = [];
  const capGeos: THREE.BufferGeometry[] = [];

  let y = 0;
  let lastFootprint: Point2[] = o.tiers[0]?.footprint ?? rect(30, 30);
  o.tiers.forEach((tier, ti) => {
    const edges = edgesOf(tier.footprint);
    const start = ti === 0 ? lobbyH : y;
    const floors = ti === 0 ? tier.floors - lobbyFloors : tier.floors;
    const h = floors * fh;
    for (const e of edges) {
      facadeGeos.push(facadePlane(e, start, h, floors, fh, Math.floor(rng() * TEX_BAYS) / TEX_BAYS, Math.floor(rng() * TEX_FLOORS) / TEX_FLOORS));
      // Vertical mullions at every bay, standing proud of the glass.
      const n = Math.max(1, Math.round(e.len / BAY));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = e.a[0] + (e.b[0] - e.a[0]) * t + e.normal[0] * (md / 2);
        const z = e.a[1] + (e.b[1] - e.a[1]) * t + e.normal[1] * (md / 2);
        const corner = i === 0 || i === n;
        mullions.push({ position: [x, start + h / 2, z], rotation: [0, e.rotY, 0], scale: [corner ? 0.22 : 0.1, h, corner ? md * 1.4 : md] });
      }
      // A slim transom at every floor line.
      for (let f = 1; f < floors; f++) {
        transoms.push({
          position: [e.mid[0] + e.normal[0] * 0.08, start + f * fh, e.mid[1] + e.normal[1] * 0.08],
          rotation: [0, e.rotY, 0],
          scale: [e.len, 0.09, 0.18],
        });
      }
      // Ledge at the top of the tier: a stone band that marks the set-back.
      ledges.push({
        position: [e.mid[0] + e.normal[0] * 0.3, start + h + 0.35, e.mid[1] + e.normal[1] * 0.3],
        rotation: [0, e.rotY, 0],
        scale: [e.len + 0.6, 0.7, 0.9],
      });
      parapets.push({
        position: [e.mid[0] - e.normal[0] * 0.2, start + h + 1.2, e.mid[1] - e.normal[1] * 0.2],
        rotation: [0, e.rotY, 0],
        scale: [e.len, 1.0, 0.25],
      });
    }
    capGeos.push(capGeometry(tier.footprint, start + h + 0.71));
    y = start + h + 0.7;
    lastFootprint = tier.footprint;
  });

  const facadeMesh = new THREE.Mesh(merge(facadeGeos), glass);
  facadeMesh.receiveShadow = true;
  facadeMesh.castShadow = true;
  facadeMesh.name = "curtain-wall";
  group.add(facadeMesh);
  const caps = new THREE.Mesh(merge(capGeos), kit.darkMetal);
  caps.receiveShadow = true;
  group.add(caps);
  group.add(instanced(mullionGeo, kit.darkMetal, mullions, { name: "mullions" }));
  group.add(instanced(mullionGeo, kit.darkMetal, transoms, { cast: false, name: "transoms" }));
  group.add(instanced(mullionGeo, kit.stone, ledges, { name: "ledges" }));
  group.add(instanced(mullionGeo, kit.concrete, parapets, { name: "parapets" }));

  // Lobby: recessed, double-height, warmly lit, behind stone piers.
  const base = o.tiers[0]?.footprint ?? rect(30, 30);
  const lobbyTex = makeFacadeTextures({ bays: 12, floors: 1, seed: o.seed + 3, lit: 0.95, light: "warm", spandrel: 0.03, cell: 32 });
  const lobbyMat = new THREE.MeshStandardMaterial({
    map: lobbyTex.map,
    emissiveMap: lobbyTex.emissiveMap,
    emissive: "#ffffff",
    emissiveIntensity: 1.2,
    roughness: 0.12,
    metalness: 0.5,
  });
  const inset = scaleFootprint(base, 0.92);
  const lobbyGeos = edgesOf(inset).map((e) => {
    const g = new THREE.PlaneGeometry(e.len, lobbyH);
    g.rotateY(e.rotY);
    g.translate(e.mid[0], lobbyH / 2, e.mid[1]);
    return g;
  });
  group.add(new THREE.Mesh(merge(lobbyGeos), lobbyMat));
  const piers: Placement[] = [];
  for (const e of edgesOf(base)) {
    const n = Math.max(1, Math.round(e.len / 7.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      piers.push({
        position: [e.a[0] + (e.b[0] - e.a[0]) * t, lobbyH / 2, e.a[1] + (e.b[1] - e.a[1]) * t],
        rotation: [0, e.rotY, 0],
        scale: [1.1, lobbyH, 1.1],
      });
    }
  }
  group.add(instanced(mullionGeo, kit.stone, piers, { name: "lobby-piers" }));
  group.add(new THREE.Mesh(capGeometry(base, lobbyH - 0.05), kit.concrete));

  // Crown: a screened lantern storey and an optional spire with an aviation light.
  let lantern: THREE.MeshStandardMaterial | null = null;
  let top = y;
  if (o.lantern) {
    const lanternH = fh * 2.2;
    const ring = scaleFootprint(lastFootprint, 0.86);
    lantern = new THREE.MeshStandardMaterial({ color: "#2a1d12", emissive: "#ffb46a", emissiveIntensity: 1.6, roughness: 0.5 });
    const lanternGeos = edgesOf(ring).map((e) => {
      const g = new THREE.PlaneGeometry(e.len, lanternH);
      g.rotateY(e.rotY);
      g.translate(e.mid[0], y + lanternH / 2, e.mid[1]);
      return g;
    });
    group.add(new THREE.Mesh(merge(lanternGeos), lantern));
    const fins: Placement[] = [];
    for (const e of edgesOf(ring)) {
      const n = Math.max(1, Math.round(e.len / 0.9));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        fins.push({
          position: [e.a[0] + (e.b[0] - e.a[0]) * t + e.normal[0] * 0.3, y + lanternH / 2, e.a[1] + (e.b[1] - e.a[1]) * t + e.normal[1] * 0.3],
          rotation: [0, e.rotY, 0],
          scale: [0.12, lanternH, 0.6],
        });
      }
    }
    group.add(instanced(mullionGeo, kit.bronze, fins, { name: "lantern-fins" }));
    group.add(new THREE.Mesh(capGeometry(ring, y + lanternH), kit.darkMetal));
    top = y + lanternH;
  }

  let beacon: THREE.Mesh | null = null;
  if (o.spire) {
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.4, o.spire, 12), kit.bronze);
    spire.position.y = top + o.spire / 2;
    spire.castShadow = true;
    group.add(spire);
    beacon = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), new THREE.MeshBasicMaterial({ color: "#ff3b2f", toneMapped: false }));
    beacon.position.y = top + o.spire + 0.4;
    group.add(beacon);
    top += o.spire;
  }

  return { group, height: top, glass: [glass], lantern, beacon };
}
