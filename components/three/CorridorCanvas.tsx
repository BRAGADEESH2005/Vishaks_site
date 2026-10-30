"use client";
/* eslint-disable react-hooks/immutability -- Three.js uniforms, instanced meshes and the camera are mutable scene objects, updated in the render loop by design. */

import { Html, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { ATMOSPHERES } from "@/lib/three/atmosphere";
import { buildMapModel } from "@/lib/three/builders/mapModels";
import { CATEGORIES, categoryFor, CENTRE, COAST, CORRIDOR_PATHS, curveOf, toWorld, ZONES, type CorridorCode } from "@/lib/three/corridors";
import { createKit, disposeKit, disposeObject } from "@/lib/three/kit";
import { createRng } from "@/lib/three/random";
import { makeRippleNormal } from "@/lib/three/textures";
import { Atmosphere } from "./Atmosphere";
import { Finish } from "./Finish";

const CODES: CorridorCode[] = ["OMR", "GST", "SPR", "ORR"];
const MODEL_SCALE = 0.42;
const ease = (t: number) => 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 3);
const span = (p: number, a: number, b: number) => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);

/** Light pulses travelling outward along a corridor; drawn in only up to `reveal`. */
const flowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const flowFragment = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uActive;
  uniform float uDashed;
  uniform float uPulses;
  uniform vec3 uColor;
  uniform vec3 uHot;
  varying vec2 vUv;
  void main() {
    float u = vUv.x;
    if (u > uReveal) discard;
    if (uDashed > 0.5 && fract(u * 90.0) > 0.55) discard;
    float pulse = pow(1.0 - fract(u * uPulses - uTime * 0.35), 6.0);
    // smoothstep needs edge0 < edge1; the reversed form is undefined in GLSL and can produce NaN.
    float head = (1.0 - smoothstep(0.0, 0.035, uReveal - u)) * step(uReveal, 0.999);
    vec3 c = mix(uColor, uHot, clamp(pulse * 0.9 + head, 0.0, 1.0));
    float boost = 1.0 + (pulse * 2.4 + head * 3.0) * uActive;
    gl_FragColor = vec4(c * boost * mix(0.35, 1.0, uActive), mix(0.3, 1.0, uActive));
    #include <colorspace_fragment>
  }
`;

/** A soft vertical beam over a target zone. */
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    float a = pow(1.0 - vUv.y, 2.2) * uStrength;
    gl_FragColor = vec4(uColor * 2.0, a);
    #include <colorspace_fragment>
  }
`;

function flowMaterial(color: string, hot: string, pulses: number, dashed = false) {
  return new THREE.ShaderMaterial({
    vertexShader: flowVertex,
    fragmentShader: flowFragment,
    transparent: true,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uActive: { value: 1 },
      uDashed: { value: dashed ? 1 : 0 },
      uPulses: { value: pulses },
      uColor: { value: new THREE.Color(color) },
      uHot: { value: new THREE.Color(hot) },
    },
  });
}

/** Coast x position for a world z, sampled from the coastline curve. */
function coastLookup() {
  const curve = curveOf(COAST);
  const pts = curve.getSpacedPoints(400);
  return (z: number) => {
    let best = pts[0]!;
    for (const p of pts) if (Math.abs(p.z - z) < Math.abs(best.z - z)) best = p;
    return best.x;
  };
}

function buildMap() {
  const coastX = coastLookup();
  const rng = createRng(2026);
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

  // Land: a pale plate west of the coastline.
  const coastPts = curveOf(COAST).getSpacedPoints(160);
  const shape = new THREE.Shape();
  shape.moveTo(-2200, 1200);
  shape.lineTo(-2200, -900);
  coastPts.forEach((p) => shape.lineTo(p.x, -p.z));
  shape.lineTo(coastPts[coastPts.length - 1]!.x, -1200);
  shape.lineTo(-2200, -1200);
  const landGeo = track(new THREE.ShapeGeometry(shape, 1));
  landGeo.rotateX(-Math.PI / 2);
  const landMat = track(new THREE.MeshStandardMaterial({ color: "#2b2825", roughness: 0.96 }));
  const land = new THREE.Mesh(landGeo, landMat);
  land.receiveShadow = true;

  const ripple = track(makeRippleNormal(11));
  ripple.repeat.set(60, 60);
  const sea = new THREE.Mesh(
    track(new THREE.PlaneGeometry(6000, 6000)),
    track(new THREE.MeshPhysicalMaterial({ color: "#15212b", roughness: 0.18, metalness: 0.1, normalMap: ripple, normalScale: new THREE.Vector2(0.3, 0.3), clearcoat: 0.6 })),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(1800, -1.2, 0);
  sea.receiveShadow = true;

  const shore = new THREE.Mesh(
    track(new THREE.TubeGeometry(curveOf(COAST, 0.05), 300, 2.2, 4, false)),
    track(new THREE.MeshStandardMaterial({ color: "#5a4c3d", roughness: 1 })),
  );
  shore.scale.y = 0.15;

  // The city: dense and tall around the centre, thinning along each corridor.
  const blocks: Array<{ x: number; z: number; w: number; d: number; h: number; c: THREE.Color }> = [];
  const centre = toWorld(CENTRE);
  const curves = Object.fromEntries(CODES.map((c) => [c, curveOf(CORRIDOR_PATHS[c], 1.2)])) as Record<CorridorCode, THREE.CurvePath<THREE.Vector3>>;
  const glassTone = new THREE.Color("#55636f");
  const stoneTone = new THREE.Color("#4b4743");
  const warmTone = new THREE.Color("#3e3a36");
  const place = (x: number, z: number, h: number, size: number) => {
    if (x > coastX(z) - 6) return;
    // Leave clear ground around each target zone for its model.
    for (const zc of CODES) {
      const zw = toWorld(ZONES[zc]);
      if (Math.hypot(zw.x - x, zw.z - z) < 31) return;
    }
    for (const c of CODES) {
      // Keep the corridors themselves clear.
      const n = c === "ORR" ? 60 : 40;
      for (let i = 0; i <= n; i++) {
        const p = curves[c].getPointAt(i / n);
        if (Math.hypot(p.x - x, p.z - z) < 4.5) return;
      }
    }
    const r = rng();
    blocks.push({ x, z, w: size * (0.7 + rng() * 0.6), d: size * (0.7 + rng() * 0.6), h, c: h > 30 ? glassTone.clone().offsetHSL(0, 0, (r - 0.5) * 0.08) : (r > 0.5 ? stoneTone : warmTone).clone() });
  };
  for (let i = 0; i < 700; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.pow(rng(), 0.7) * 95;
    const x = centre.x + Math.cos(a) * r;
    const z = centre.z + Math.sin(a) * r * 1.2;
    const h = 3 + Math.pow(rng(), 2.4) * 64 * Math.exp(-r / 45);
    place(x, z, h, 3 + rng() * 3.5);
  }
  for (const c of ["OMR", "GST", "SPR"] as const) {
    for (let i = 0; i < 260; i++) {
      const t = Math.pow(rng(), 1.3);
      const p = curves[c].getPointAt(t);
      const tan = curves[c].getTangentAt(t);
      const side = (rng() < 0.5 ? -1 : 1) * (7 + rng() * 26);
      const h = 2 + Math.pow(rng(), 2) * (c === "OMR" ? 34 : 18) * (1 - t * 0.6);
      place(p.x - tan.z * side, p.z + tan.x * side, h, 2.5 + rng() * 3);
    }
  }
  for (let i = 0; i < 260; i++) {
    const x = -260 + rng() * 460;
    const z = -230 + rng() * 460;
    place(x, z, 1.5 + rng() * 4, 2 + rng() * 2);
  }
  const boxGeo = track(new THREE.BoxGeometry(1, 1, 1));
  boxGeo.translate(0, 0.5, 0);
  const blockMat = track(new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.55, metalness: 0.15 }));
  const city = new THREE.InstancedMesh(boxGeo, blockMat, blocks.length);
  const o = new THREE.Object3D();
  blocks.forEach((b, i) => {
    o.position.set(b.x, 0, b.z);
    o.rotation.set(0, (rng() - 0.5) * 0.2, 0);
    o.scale.set(b.w, b.h, b.d);
    o.updateMatrix();
    city.setMatrixAt(i, o.matrix);
    city.setColorAt(i, b.c);
  });
  city.castShadow = true;
  city.receiveShadow = true;
  const cityGroup = new THREE.Group();
  cityGroup.add(city);

  // Corridors: a glowing flow line on a soft road bed.
  const corridors = CODES.map((code) => {
    const curve = curves[code];
    const orr = code === "ORR";
    const mat = track(orr ? flowMaterial("#6f7f8c", "#e7eef3", 5, true) : flowMaterial("#b88452", "#ffe2bd", 7));
    const tube = new THREE.Mesh(track(new THREE.TubeGeometry(curve, 240, orr ? 1.1 : 1.6, 10, false)), mat);
    const bed = new THREE.Mesh(
      track(new THREE.TubeGeometry(curveOf(CORRIDOR_PATHS[code], 0.1), 240, orr ? 3.2 : 4.5, 4, false)),
      track(new THREE.MeshStandardMaterial({ color: "#3d3833", roughness: 0.9 })),
    );
    bed.scale.y = 0.05;
    bed.receiveShadow = true;
    // A wide invisible tube takes the pointer.
    const hit = new THREE.Mesh(track(new THREE.TubeGeometry(curve, 80, 12, 6, false)), track(new THREE.MeshBasicMaterial({ visible: false })));
    hit.userData.code = code;
    const length = curve.getLength();
    return { code, curve, mat, tube, bed, hit, length };
  });

  // Traffic: small bright cars both ways along the radial corridors.
  const CARS = 180;
  const carMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff3df").multiplyScalar(3.6), toneMapped: false }));
  const cars = new THREE.InstancedMesh(track(new THREE.SphereGeometry(0.85, 8, 6)), carMat, CARS);
  const carState = Array.from({ length: CARS }, (_, i) => ({
    c: corridors[i % corridors.length]!,
    t: rng(),
    v: (0.012 + rng() * 0.018) * (rng() < 0.5 ? 1 : -1),
    lane: (rng() < 0.5 ? -1 : 1) * 1.6,
  }));

  // Target zones: a ring, a soft disc, a light beam and the category's model. Indicative only.
  const kit = createKit();
  const hitMat = track(new THREE.MeshBasicMaterial({ visible: false }));
  const beamGeo = track(new THREE.CylinderGeometry(22, 22, 80, 40, 1, true));
  beamGeo.translate(0, 40, 0);
  const ringGeo = track(new THREE.RingGeometry(24, 25.6, 64));
  ringGeo.rotateX(-Math.PI / 2);
  const discGeo = track(new THREE.CircleGeometry(24, 64));
  discGeo.rotateX(-Math.PI / 2);
  const pulseGeo = track(new THREE.RingGeometry(0.92, 1, 64));
  pulseGeo.rotateX(-Math.PI / 2);
  const zones = CODES.map((code) => {
    const at = toWorld(ZONES[code]);
    const g = new THREE.Group();
    g.position.set(at.x, 0.4, at.z);
    const beamMat = track(
      new THREE.ShaderMaterial({
        vertexShader: flowVertex,
        fragmentShader: beamFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: { uColor: { value: new THREE.Color("#d9a46a") }, uStrength: { value: 0 } },
      }),
    );
    const beam = new THREE.Mesh(beamGeo, beamMat);
    const ringMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color("#e8b47a").multiplyScalar(4), toneMapped: false, transparent: true }));
    const ring = new THREE.Mesh(ringGeo, ringMat);
    const discMat = track(new THREE.MeshBasicMaterial({ color: "#c79c70", transparent: true, opacity: 0.22, depthWrite: false }));
    const disc = new THREE.Mesh(discGeo, discMat);
    const pulseMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color("#f0c38e").multiplyScalar(3.4), toneMapped: false, transparent: true, depthWrite: false }));
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    g.add(disc, ring, pulse, beam);

    // The category's architectural model, built in metres and scaled to the map.
    const model = buildMapModel(kit, categoryFor(code).id);
    const glow = ATMOSPHERES.blue.glow;
    model.glowing.forEach(({ material, base }) => (material.emissiveIntensity = base * glow));
    const holder = new THREE.Group();
    holder.position.set(at.x, 0.2, at.z);
    holder.add(model.group);
    const height = model.height * MODEL_SCALE;
    // An invisible volume around the model takes the pointer, for mouse and touch.
    const hit = new THREE.Mesh(track(new THREE.CylinderGeometry(26, 26, height + 20, 16)), hitMat);
    hit.position.set(at.x, (height + 20) / 2, at.z);
    hit.userData.code = code;
    return { code, group: g, beamMat, ringMat, discMat, pulse, pulseMat, holder, height, hit, at };
  });

  // The centre: a beacon at the heart of the city.
  const hubMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffffff").multiplyScalar(3), toneMapped: false }));
  const hub = new THREE.Mesh(track(new THREE.CylinderGeometry(1.4, 1.4, 90, 12)), hubMat);
  hub.geometry.translate(0, 45, 0);
  hub.position.set(centre.x, 0, centre.z);
  const hubRing = new THREE.Mesh(pulseGeo, track(new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffffff").multiplyScalar(1.6), toneMapped: false, transparent: true, depthWrite: false })));
  hubRing.position.set(centre.x, 0.6, centre.z);

  const roots: THREE.Object3D[] = [land, sea, shore, cityGroup, hub, hubRing, cars, ...corridors.flatMap((c) => [c.bed, c.tube, c.hit]), ...zones.flatMap((z) => [z.group, z.holder, z.hit])];
  return { roots, cityGroup, corridors, cars, carState, zones, hub, hubRing, centre, disposables, ripple, kit };
}

type Props = {
  progress: RefObject<number>;
  pointer: RefObject<{ x: number; y: number }>;
  focus: CorridorCode | null;
  hover: CorridorCode | null;
  onHover: (c: CorridorCode | null) => void;
  onSelect: (c: CorridorCode) => void;
  active: boolean;
  reduced: boolean;
  onReady: () => void;
  onFail?: () => void;
};

// Camera keys: from a top-down view that matches the schematic, to an oblique model view.
const PLAN = { pos: new THREE.Vector3(10, 720, 30), target: new THREE.Vector3(10, 0, 0) };
const OBLIQUE = { pos: new THREE.Vector3(-370, 390, 610), target: new THREE.Vector3(-25, 0, 30) };
const NAMES: Record<CorridorCode, string> = { OMR: "OMR", GST: "GST Road", SPR: "Sriperumbudur", ORR: "Outer Ring Road" };
/** Camera direction for each zone close-up, chosen so neighbouring models do not block the view. */
const FOCUS_ANGLE: Record<CorridorCode, number> = { OMR: -0.5, GST: -0.9, SPR: -1.3, ORR: -1.0 };

function MapScene({ progress, pointer, focus, hover, onHover, onSelect, reduced, onReady }: Omit<Props, "active">) {
  const m = useMemo(() => buildMap(), []);
  useEffect(
    () => () => {
      m.disposables.forEach((d) => d.dispose());
      m.zones.forEach((z) => disposeObject(z.holder));
      disposeKit(m.kit);
    },
    [m],
  );
  const lookAt = useRef(PLAN.target.clone());
  const goalPos = useRef(new THREE.Vector3());
  const goalTarget = useRef(new THREE.Vector3());
  const smooth = useRef({ p: 0, x: 0, y: 0, shift: 0 });
  const o = useMemo(() => new THREE.Object3D(), []);
  const frames = useRef(0);
  const ready = useRef(false);
  const labelPos = useMemo(
    () => Object.fromEntries(m.zones.map((z) => [z.code, new THREE.Vector3(z.at.x, z.height + 16, z.at.z)])) as Record<CorridorCode, THREE.Vector3>,
    [m],
  );
  const lift = useRef<Record<string, number>>({});
  const compact = useThree((st) => st.size.width < 560);
  const focusAt = useRef<{ code: CorridorCode | null; t: number }>({ code: null, t: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const sm = smooth.current;
    sm.p += ((progress.current ?? 0) - sm.p) * (1 - Math.exp(-dt * 3.5));
    const pt = pointer.current ?? { x: 0, y: 0 };
    sm.x += (pt.x - sm.x) * (1 - Math.exp(-dt * 2.5));
    sm.y += (pt.y - sm.y) * (1 - Math.exp(-dt * 2.5));
    const p = reduced ? 1 : sm.p;

    // Scroll: the plan tilts into a model, the city rises, the corridors draw outward, the zones light up.
    const tilt = ease(span(p, 0, 0.55));
    m.cityGroup.scale.y = Math.max(0.001, ease(span(p, 0.15, 0.6)));
    const lit = focus ?? hover;
    m.corridors.forEach((c, i) => {
      const u = c.mat.uniforms as Record<string, THREE.IUniform>;
      u.uTime!.value = t;
      u.uReveal!.value = ease(span(p, 0.25 + i * 0.06, 0.7 + i * 0.06)) * 1.001;
      const goal = !lit || lit === c.code ? 1 : 0.15;
      u.uActive!.value += (goal - u.uActive!.value) * (1 - Math.exp(-dt * 6));
    });
    m.zones.forEach((z, i) => {
      const on = ease(span(p, 0.45 + i * 0.05, 0.75 + i * 0.03));
      const strong = !lit || lit === z.code ? 1 : 0.25;
      (z.beamMat.uniforms.uStrength as THREE.IUniform).value = on * strong * (focus === z.code ? 0.05 : lit === z.code ? 0.85 : 0.45);
      z.ringMat.opacity = on * (0.4 + strong * 0.6);
      z.discMat.opacity = on * 0.22 * strong;
      const k = (t * 0.5 + i * 0.25) % 1;
      z.pulse.scale.setScalar(25 + k * 26);
      z.pulseMat.opacity = on * (1 - k) * strong;
      z.group.scale.setScalar(Math.max(0.001, on));
      // The model rises out of the ground as its zone lights, and lifts a little when hovered or chosen.
      const rise = ease(span(p, 0.4 + i * 0.05, 0.75 + i * 0.03));
      const want = lit === z.code ? 1.08 : 1;
      const cur = (lift.current[z.code] ??= 1);
      lift.current[z.code] = cur + (want - cur) * (1 - Math.exp(-dt * 6));
      const sc = MODEL_SCALE * lift.current[z.code]!;
      z.holder.scale.set(sc, Math.max(0.001, sc * rise), sc);
    });
    const hk = (t * 0.4) % 1;
    m.hubRing.scale.setScalar(6 + hk * 40);
    (m.hubRing.material as THREE.MeshBasicMaterial).opacity = (1 - hk) * ease(span(p, 0.1, 0.4));
    m.hub.scale.y = Math.max(0.001, ease(span(p, 0.1, 0.45)));

    // Traffic follows the corridors once they are drawn.
    m.carState.forEach((car, i) => {
      car.t = (car.t + car.v * dt + 1) % 1;
      const reveal = (car.c.mat.uniforms.uReveal as THREE.IUniform).value as number;
      const pos = car.c.curve.getPointAt(car.t);
      const tan = car.c.curve.getTangentAt(car.t);
      o.position.set(pos.x - tan.z * car.lane, 1.6, pos.z + tan.x * car.lane);
      const visible = car.t < reveal && car.c.code !== "ORR" ? 1 : car.c.code === "ORR" && car.t < reveal ? 0.7 : 0;
      o.scale.setScalar(Math.max(0.001, visible * ((!lit || lit === car.c.code) ? 1 : 0.4)));
      o.updateMatrix();
      m.cars.setMatrixAt(i, o.matrix);
    });
    m.cars.instanceMatrix.needsUpdate = true;
    m.ripple.offset.set(t * 0.004, t * 0.002);

    // Camera: plan to oblique on scroll, or fly to a chosen corridor's target zone.
    if (focus) {
      // Close-up: a slow orbit around the chosen zone's model.
      const zone = m.zones.find((z) => z.code === focus)!;
      if (focusAt.current.code !== focus) focusAt.current = { code: focus, t };
      // Start from a fixed, unobstructed side, then drift slowly round the model.
      const a = FOCUS_ANGLE[focus] + (reduced ? 0 : (t - focusAt.current.t) * 0.06);
      goalTarget.current.set(zone.at.x, zone.height * 0.42, zone.at.z);
      goalPos.current.set(zone.at.x + Math.sin(a) * 150, zone.height * 0.42 + 52, zone.at.z + Math.cos(a) * 150);
    } else {
      goalPos.current.copy(PLAN.pos).lerp(OBLIQUE.pos, tilt);
      goalTarget.current.copy(PLAN.target).lerp(OBLIQUE.target, tilt);
      // Portrait frames are narrow: step back so all four zones and their labels fit.
      const aspect = state.size.width / state.size.height;
      const back = aspect < 1.25 ? 1 + (1.25 - aspect) * 0.7 : 1;
      if (back > 1) goalPos.current.sub(goalTarget.current).multiplyScalar(back).add(goalTarget.current);
      const drift = reduced ? 0 : Math.sin(t * 0.12) * 18;
      goalPos.current.x += drift;
    }
    goalPos.current.x += sm.x * 26;
    goalPos.current.y -= sm.y * 18;
    // With a detail card open on a wide frame, slide the scene left so the model stays clear of the card.
    const { width, height } = state.size;
    const wantShift = focus && width > height * 1.05 && width >= 640 ? 0.2 : 0;
    sm.shift += (wantShift - sm.shift) * (1 - Math.exp(-dt * 3));
    const cam = state.camera as THREE.PerspectiveCamera;
    if (sm.shift > 0.001) cam.setViewOffset(width, height, sm.shift * width, 0, width, height);
    else if (cam.view?.enabled) cam.clearViewOffset();
    const damp = 1 - Math.exp(-dt * (focus ? 2 : 4));
    state.camera.position.lerp(goalPos.current, damp);
    lookAt.current.lerp(goalTarget.current, damp);
    state.camera.lookAt(lookAt.current);

    frames.current += 1;
    if (!ready.current && frames.current > 3) {
      ready.current = true;
      onReady();
    }
  });

  return (
    <>
      {m.roots.map((r) => (
        <primitive
          key={r.uuid}
          object={r}
          {...(r.userData.code
            ? {
                onPointerOver: (e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  onHover(r.userData.code as CorridorCode);
                },
                onPointerOut: () => onHover(null),
                onClick: (e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  onSelect(r.userData.code as CorridorCode);
                },
              }
            : {})}
        />
      ))}
      {CODES.map((code) => {
        const sel = focus ?? hover;
        const n = CATEGORIES.findIndex((c) => c.corridor === code) + 1;
        const on = sel === code;
        const dim = !!focus && focus !== code;
        const cat = categoryFor(code);
        return (
          <Html key={code} position={labelPos[code]} center zIndexRange={[20, 0]}>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onPointerEnter={() => onHover(code)}
              onPointerLeave={() => onHover(null)}
              onClick={() => onSelect(code)}
              className={`group flex flex-col whitespace-nowrap border text-left shadow-[0_8px_24px_-12px_rgb(0_0_0/0.6)] backdrop-blur-md transition-all duration-500 ${compact ? "h-9 w-9 items-center justify-center rounded-full" : "items-start rounded-xl px-3.5 py-2"} ${
                on ? "border-bronze-light bg-bronze text-ivory" : "border-ivory/15 bg-ink/75 text-ivory hover:border-bronze-light"
              } ${focus === code ? "pointer-events-none opacity-0" : dim ? "opacity-40" : "opacity-100"}`}
            >
              {compact ? (
                // Narrow screens: a numbered marker that matches the list, so labels never collide.
                <span className="font-mono text-[0.78rem] tabular-nums">{String(n).padStart(2, "0")}</span>
              ) : (
                <>
                  <span className="font-display text-[1.05rem] leading-tight">{cat.title}</span>
                  <span className={`font-mono text-[0.62rem] uppercase tracking-[0.16em] ${on ? "text-ivory/85" : "text-bronze-light"}`}>{NAMES[code]}</span>
                </>
              )}
            </button>
          </Html>
        );
      })}
      <Html position={[m.centre.x, 96, m.centre.z]} center zIndexRange={[20, 0]}>
        <span aria-hidden="true" className="label whitespace-nowrap rounded-full border border-ivory/20 bg-ivory/90 px-3 py-1.5 text-ink">
          City centre
        </span>
      </Html>
      <Html position={[300, 2, -60]} center zIndexRange={[20, 0]}>
        <span aria-hidden="true" className="label whitespace-nowrap text-ivory/85 [text-shadow:0_1px_6px_rgb(0_0_0/0.35)]">
          Bay of Bengal
        </span>
      </Html>
    </>
  );
}

export default function CorridorCanvas(props: Props) {
  const { active, onFail, ...rest } = props;
  const [dpr, setDpr] = useState(1.5);
  const [quality, setQuality] = useState<"high" | "lite">("lite");
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 36, position: PLAN.pos.toArray(), near: 2, far: 9000 }}
      aria-hidden="true"
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail?.();
        });
      }}
    >
      <PerformanceMonitor
        onIncline={() => setQuality("high")}
        onDecline={() => {
          setDpr(1);
          setQuality("lite");
        }}
        flipflops={2}
      />
      <Atmosphere preset="blue" shadow={{ extent: 360, target: [40, 0, 0], distance: 900, mapSize: 2048 }} />
      <MapScene {...rest} />
      <Finish quality={quality} />
    </Canvas>
  );
}
