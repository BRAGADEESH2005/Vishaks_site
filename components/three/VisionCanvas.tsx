"use client";
/* eslint-disable react-hooks/immutability -- Three.js materials, clipping planes and groups are mutable scene objects, updated in the render loop by design. */

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { flat, instanced, type Placement } from "@/lib/three/builders/common";
import { buildGround } from "@/lib/three/builders/context";
import { buildGlassTower, chamferedRect, type Point2, type Tier } from "@/lib/three/builders/glassTower";
import { along, buildCanopyTrees, buildPalms } from "@/lib/three/builders/landscape";
import { createKit, disposeKit, disposeObject } from "@/lib/three/kit";
import { Atmosphere } from "./Atmosphere";
import { Finish } from "./Finish";

/**
 * "Our vision" as a model: the same site goes from surveyed land, to a tower
 * rising floor by floor under a crane inside its blueprint, to a finished,
 * landscaped building. Scroll position drives the whole sequence.
 */

export const VISION_FLOORS = 48;
const FH = 4;
const TIERS: Tier[] = [
  { footprint: chamferedRect(40, 40, 7), floors: 22 },
  { footprint: chamferedRect(34, 34, 6), floors: 16 },
  { footprint: chamferedRect(27, 27, 5), floors: 10 },
];
const PLOT = 150;
const CRANE_AT: [number, number] = [34, -30];

const ease = (t: number) => 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 3);
const span = (p: number, a: number, b: number) => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);

/** Maps scroll progress to the building height reached, in metres above the plaza. */
export function buildFraction(p: number) {
  return ease(span(p, 0.22, 0.84));
}

/** A lattice pattern for the crane's mast and jib, as an alpha map. */
function latticeAlpha() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = "#fff";
  g.lineWidth = 6;
  g.strokeRect(3, 0, 58, 64);
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(64, 64);
  g.moveTo(64, 0);
  g.lineTo(0, 64);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The outline of the full building massing: every second floor line and the corners. */
function blueprintGeometry() {
  const pts: number[] = [];
  let y = 0;
  const loop = (fp: Point2[], h: number) => {
    for (let i = 0; i < fp.length; i++) {
      const a = fp[i]!;
      const b = fp[(i + 1) % fp.length]!;
      pts.push(a[0], h, a[1], b[0], h, b[1]);
    }
  };
  TIERS.forEach((t) => {
    for (let f = 0; f <= t.floors; f += 2) loop(t.footprint, y + f * FH);
    for (const [x, z] of t.footprint) pts.push(x, y, z, x, y + t.floors * FH, z);
    y += t.floors * FH + 0.7;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function footprintAt(h: number): Point2[] {
  let y = 0;
  for (const t of TIERS) {
    y += t.floors * FH + 0.7;
    if (h <= y) return t.footprint;
  }
  return TIERS[TIERS.length - 1]!.footprint;
}

function buildCrane(kit: ReturnType<typeof createKit>, lattice: THREE.Texture) {
  const white = new THREE.MeshStandardMaterial({ color: "#efe9df", roughness: 0.55, metalness: 0.2, alphaMap: lattice, alphaTest: 0.5, side: THREE.DoubleSide });
  const mastTex = lattice.clone();
  mastTex.needsUpdate = true;
  const mastMat = white.clone();
  mastMat.alphaMap = mastTex;
  const jibTex = lattice.clone();
  jibTex.needsUpdate = true;
  jibTex.repeat.set(30, 1);
  const jibMat = white.clone();
  jibMat.alphaMap = jibTex;

  const crane = new THREE.Group();
  const mastGeo = new THREE.BoxGeometry(2.4, 1, 2.4);
  mastGeo.translate(0, 0.5, 0);
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.castShadow = true;
  crane.add(mast);

  const head = new THREE.Group();
  const jib = new THREE.Mesh(new THREE.BoxGeometry(76, 2, 2), jibMat);
  jib.position.set(-30, 1, 0);
  jib.castShadow = true;
  head.add(jib);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(22, 1.6, 2), jibMat);
  counter.position.set(17, 1, 0);
  head.add(counter);
  const weight = new THREE.Mesh(new THREE.BoxGeometry(6, 3.4, 3), kit.concrete);
  weight.position.set(24, 0, 0);
  weight.castShadow = true;
  head.add(weight);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3, 3.4), new THREE.MeshStandardMaterial({ color: "#8a6440", roughness: 0.4, metalness: 0.6 }));
  cab.position.set(2.6, -1, 2.4);
  head.add(cab);
  const apex = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9, 4), mastMat);
  apex.position.set(0, 6.5, 0);
  head.add(apex);
  const trolley = new THREE.Group();
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 4), kit.darkMetal);
  cable.geometry.translate(0, -0.5, 0);
  trolley.add(cable);
  const load = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 1.6), kit.bronze);
  load.castShadow = true;
  trolley.add(load);
  trolley.position.set(-44, 0, 0);
  head.add(trolley);
  crane.add(head);
  crane.position.set(CRANE_AT[0], 0, CRANE_AT[1]);
  return { crane, mast, mastTex, head, trolley, cable, load, materials: [white, mastMat, jibMat, cab.material as THREE.Material] };
}

function useVisionScene() {
  const built = useMemo(() => {
    const kit = createKit();
    const ground = buildGround(kit);
    const plaza = new THREE.Group();
    plaza.add(flat(PLOT, PLOT, kit.paving, [0, 0.04, 0]));
    plaza.add(flat(70, 14, kit.pool, [-8, 0.1, 58]));
    const lawnSpots: Array<[number, number]> = [
      [-52, -48],
      [52, 48],
      [-52, 30],
    ];
    lawnSpots.forEach(([x, z]) => plaza.add(flat(34, 30, kit.lawn, [x, 0.07, z])));

    // Daylight ground: a pale, clean site rather than the dark dusk soil.
    kit.ground.map = null;
    kit.ground.color.set("#cfc7b8");
    kit.ground.needsUpdate = true;

    const tower = buildGlassTower(kit, { tiers: TIERS, seed: 77, lit: 0, floorHeight: FH, spire: 26, lantern: true, mullionDepth: 0.55, tint: "#c3d4e2" });
    // Crisp daytime glass: brighter sky reflections, no lit rooms.
    tower.glass.forEach((g) => {
      g.emissiveIntensity = 0;
      g.envMapIntensity = 2.6;
      g.color.set("#d4e2ee");
      g.metalness = 0.82;
    });

    // Build plane: everything below it exists; the blueprint above it is still a drawing.
    const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const ghostClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    tower.group.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      if (!m) return;
      (Array.isArray(m) ? m : [m]).forEach((mat) => (mat.clippingPlanes = [clip]));
    });

    const blueprint = new THREE.LineSegments(
      blueprintGeometry(),
      new THREE.LineBasicMaterial({ color: "#a47a4c", transparent: true, opacity: 0, clippingPlanes: [ghostClip], depthWrite: false }),
    );

    // The floor being cast: a glowing edge and a translucent slab at the build height.
    const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color("#ffc58a").multiplyScalar(5), toneMapped: false, transparent: true });
    const edge = new THREE.LineLoop(new THREE.BufferGeometry(), edgeMat);
    const slabMat = new THREE.MeshBasicMaterial({ color: "#ffd2a0", transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
    const slab = new THREE.Mesh(new THREE.BufferGeometry(), slabMat);
    let edgeFor: Point2[] | null = null;
    const setEdge = (fp: Point2[]) => {
      if (edgeFor === fp) return;
      edgeFor = fp;
      const s = 1.015;
      edge.geometry.dispose();
      edge.geometry = new THREE.BufferGeometry().setFromPoints(fp.map(([x, z]) => new THREE.Vector3(x * s, 0, z * s)));
      const shape = new THREE.Shape(fp.map(([x, z]) => new THREE.Vector2(x, -z)));
      slab.geometry.dispose();
      const g = new THREE.ShapeGeometry(shape);
      g.rotateX(-Math.PI / 2);
      slab.geometry = g;
    };
    setEdge(footprintAt(0));

    // The site survey: a plot boundary and pegs.
    const h = PLOT / 2 + 6;
    const boundary = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-h, 0.3, -h), new THREE.Vector3(h, 0.3, -h), new THREE.Vector3(h, 0.3, h), new THREE.Vector3(-h, 0.3, h)]),
      new THREE.LineDashedMaterial({ color: new THREE.Color("#ffb978").multiplyScalar(4), dashSize: 4, gapSize: 3, toneMapped: false, transparent: true }),
    );
    boundary.computeLineDistances();
    const pegMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffc58a").multiplyScalar(5), toneMapped: false });
    const pegPlacements: Placement[] = [];
    for (const sx of [-1, 0, 1]) for (const sz of [-1, 0, 1]) if (sx || sz) pegPlacements.push({ position: [sx * h, 1.4, sz * h], scale: [0.7, 2.8, 0.7] });
    const pegs = instanced(new THREE.BoxGeometry(1, 1, 1), pegMat, pegPlacements, { cast: false, name: "survey-pegs" });

    // A sun path over the site: the building is set out against it before it is styled.
    const arcPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI;
      arcPts.push(new THREE.Vector3(Math.cos(a) * 170, Math.sin(a) * 150 + 8, Math.sin(a) * 40 - 30));
    }
    const sunArc = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcPts),
      new THREE.LineDashedMaterial({ color: "#c7953f", dashSize: 3, gapSize: 4, transparent: true, opacity: 0 }),
    );
    sunArc.computeLineDistances();
    const sunDot = new THREE.Mesh(new THREE.SphereGeometry(4.5, 20, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd29a").multiplyScalar(6), toneMapped: false, transparent: true }));

    const lattice = latticeAlpha();
    const crane = buildCrane(kit, lattice);

    const trees = new THREE.Group();
    trees.add(buildCanopyTrees(kit, [...along([-70, -66], [-70, 66], 12, 0, 2, 3), ...along([70, -66], [70, 30], 12, 0, 2, 4)], 8, 9));
    trees.add(buildPalms(kit, along([-40, 70], [40, 70], 10, 0, 1.5, 5), 6));
    trees.scale.setScalar(0.001);

    const roots = [ground, plaza, tower.group, blueprint, edge, slab, boundary, pegs, sunArc, sunDot, crane.crane, trees];
    return { kit, ground, plaza, tower, clip, ghostClip, blueprint, edge, slab, setEdge, boundary, pegs, sunArc, sunDot, crane, trees, lattice, roots };
  }, []);

  useEffect(
    () => () => {
      built.roots.forEach(disposeObject);
      built.lattice.dispose();
      built.crane.mastTex.dispose();
      disposeKit(built.kit);
    },
    [built],
  );
  return built;
}

type Props = {
  progress: RefObject<number>;
  /** Horizontal drag offset in radians. */
  orbit: RefObject<number>;
  active: boolean;
  reduced: boolean;
  onReady: () => void;
};

function Model({ progress, orbit, reduced, onReady }: Omit<Props, "active">) {
  const s = useVisionScene();
  const gl = useThree((st) => st.gl);
  const total = s.tower.height;
  const bodyTop = TIERS.reduce((a, t) => a + t.floors * FH + 0.7, 0);
  const look = useRef(new THREE.Vector3(0, 30, 0));
  const smooth = useRef({ p: 0, orbit: 0 });
  const ready = useRef(false);
  const frames = useRef(0);

  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const sm = smooth.current;
    sm.p += ((progress.current ?? 0) - sm.p) * (1 - Math.exp(-dt * 4));
    sm.orbit += ((orbit.current ?? 0) - sm.orbit) * (1 - Math.exp(-dt * 5));
    const p = sm.p;
    const t = state.clock.elapsedTime;

    // 01 Land: the plot is surveyed and pegged out.
    const land = ease(span(p, 0.02, 0.2));
    const boundaryMat = s.boundary.material as THREE.LineDashedMaterial;
    boundaryMat.opacity = land * (1 - span(p, 0.86, 0.98) * 0.85);
    s.pegs.visible = land > 0.01 && p < 0.9;
    s.pegs.scale.set(1, Math.max(0.001, land), 1);

    // 02 Climate and build: the sun path is drawn, then the tower rises inside its blueprint.
    const arc = span(p, 0.12, 0.3) * (1 - span(p, 0.7, 0.86));
    (s.sunArc.material as THREE.LineDashedMaterial).opacity = arc * 0.9;
    const sunA = (0.15 + ((t * 0.06) % 0.7)) * Math.PI;
    s.sunDot.position.set(Math.cos(sunA) * 170, Math.sin(sunA) * 150 + 8, Math.sin(sunA) * 40 - 30);
    (s.sunDot.material as THREE.MeshBasicMaterial).opacity = arc;
    s.sunDot.visible = arc > 0.01;

    const f = buildFraction(p);
    const hNow = reduced ? total : Math.max(0.01, f * (total + 1));
    s.clip.constant = hNow;
    s.ghostClip.constant = -hNow;
    (s.blueprint.material as THREE.LineBasicMaterial).opacity = span(p, 0.08, 0.24) * 0.55 * (1 - span(p, 0.84, 0.92));
    const building = f > 0.001 && f < 0.995;
    s.edge.visible = s.slab.visible = building && hNow < bodyTop;
    s.setEdge(footprintAt(hNow));
    s.edge.position.y = s.slab.position.y = hNow;
    (s.edge.material as THREE.LineBasicMaterial).opacity = 0.6 + Math.sin(t * 6) * 0.4;

    // The crane climbs with the building, slews slowly, and is taken down at completion.
    const c = s.crane;
    const mastH = Math.min(hNow, bodyTop) + 16;
    c.mast.scale.y = mastH;
    c.mastTex.repeat.set(1, mastH / 2.4);
    c.head.position.y = mastH;
    c.head.rotation.y = Math.sin(t * 0.25) * 0.9 + 0.6;
    const drop = 6 + Math.sin(t * 0.5) * 4;
    c.cable.scale.y = drop;
    c.load.position.y = -drop;
    c.trolley.position.x = -30 - Math.sin(t * 0.18) * 14;
    const dismantle = ease(span(p, 0.86, 0.97));
    c.crane.position.y = -dismantle * (mastH + 10);
    c.crane.visible = p > 0.18 && dismantle < 0.999;

    // 03 Open: the landscape grows in and the crown lights up.
    s.trees.scale.setScalar(Math.max(0.001, ease(span(p, 0.84, 1))));
    if (s.tower.lantern) s.tower.lantern.emissiveIntensity = 0.3 + span(p, 0.84, 1) * 1.6;

    // Camera: a slow turntable that pulls back and up as the building grows.
    const orbitA = -0.75 + p * 1.1 + sm.orbit + (reduced ? 0 : t * 0.035);
    const dist = 190 + f * 330;
    const ty = 16 + f * total * 0.46;
    const cy = 70 + f * total * 0.5;
    state.camera.position.set(Math.sin(orbitA) * dist, cy, Math.cos(orbitA) * dist);
    look.current.lerp(new THREE.Vector3(0, ty, 0), 1 - Math.exp(-dt * 6));
    state.camera.lookAt(look.current);

    frames.current += 1;
    if (!ready.current && frames.current > 3) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <>
      {s.roots.map((r) => (
        <primitive key={r.uuid} object={r} />
      ))}
    </>
  );
}

export default function VisionCanvas({ progress, orbit, active, reduced, onReady }: Props) {
  const [dpr, setDpr] = useState(1.5);
  const [quality, setQuality] = useState<"high" | "lite">(() =>
    typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) >= 8 ? "high" : "lite",
  );
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 34, position: [-120, 60, 130], near: 1, far: 9000 }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setQuality("lite");
        }}
        flipflops={2}
        onFallback={() => setQuality("lite")}
      />
      <Atmosphere preset="daylight" shadow={{ extent: 140, target: [0, 40, 0], distance: 500, mapSize: 2048 }} />
      <Model progress={progress} orbit={orbit} reduced={reduced} onReady={onReady} />
      <Finish quality={quality} bloomThreshold={2.2} />
    </Canvas>
  );
}
