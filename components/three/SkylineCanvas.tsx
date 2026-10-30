"use client";
/* eslint-disable react-hooks/immutability -- Three.js lights, fog, uniforms and instanced meshes are mutable scene objects, updated in the render loop by design. */

import { Environment, Html } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { ATMOSPHERES, sunDirection, type AtmosphereId } from "@/lib/three/atmosphere";
import type { District } from "@/lib/three/builders/district";
import { makeSkyMaterial } from "./Atmosphere";
import { Finish } from "./Finish";
import { DistrictScene } from "./scenes/DistrictScene";

/**
 * Camera and light keyframes for the pinned skyline sequence. Progress 0..1
 * comes from the scroll timeline; each chapter occupies a quarter.
 */
const PATH = {
  positions: [
    [-320, 150, 470],
    [-210, 70, 330],
    [150, 22, 260],
    [-60, 196, 118],
    [-120, 6, 230],
  ] as Array<[number, number, number]>,
  targets: [
    [0, 60, 0],
    [0, 90, 0],
    [0, 110, -10],
    [0, 204, 0],
    [0, 70, 0],
  ] as Array<[number, number, number]>,
};
const LIGHT_KEYS: Array<{ at: number; preset: AtmosphereId; glow: number }> = [
  { at: 0, preset: "golden", glow: 0.35 },
  { at: 0.3, preset: "golden", glow: 0.45 },
  { at: 0.55, preset: "dusk", glow: 1 },
  { at: 0.72, preset: "dusk", glow: 1.1 },
  { at: 0.92, preset: "blue", glow: 1.35 },
];

const posCurve = new THREE.CatmullRomCurve3(PATH.positions.map((p) => new THREE.Vector3(...p)), false, "centripetal");
const tgtCurve = new THREE.CatmullRomCurve3(PATH.targets.map((p) => new THREE.Vector3(...p)), false, "centripetal");

function lightAt(p: number) {
  let i = 0;
  while (i < LIGHT_KEYS.length - 2 && p > (LIGHT_KEYS[i + 1]?.at ?? 1)) i++;
  const a = LIGHT_KEYS[i] ?? LIGHT_KEYS[0]!;
  const b = LIGHT_KEYS[i + 1] ?? a;
  const t = THREE.MathUtils.smoothstep(p, a.at, b.at);
  return { a: ATMOSPHERES[a.preset], b: ATMOSPHERES[b.preset], t, glow: THREE.MathUtils.lerp(a.glow, b.glow, t) };
}

const ca = new THREE.Color();
const cb = new THREE.Color();
const mixColor = (out: THREE.Color, x: string, y: string, t: number) => out.copy(ca.set(x)).lerp(cb.set(y), t);

/** Sky, sun, ambient light and fog, blended continuously along the scroll. */
function DynamicAtmosphere({ progress, glow }: { progress: RefObject<number>; glow: RefObject<number> }) {
  const { scene } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sky = useMemo(() => makeSkyMaterial(ATMOSPHERES.golden, sunDirection(285, 13)), []);
  const fog = useMemo(() => new THREE.FogExp2("#e2c7a6", 0.0004), []);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
      sky.dispose();
    };
  }, [scene, fog, sky]);

  useEffect(() => {
    const light = sun.current;
    if (!light) return;
    light.target = target;
    const cam = light.shadow.camera;
    cam.left = cam.bottom = -280;
    cam.right = cam.top = 280;
    cam.near = 1;
    cam.far = 1600;
    cam.updateProjectionMatrix();
    light.shadow.bias = -0.0006;
    light.shadow.normalBias = 2;
  }, [target]);

  useFrame(() => {
    const { a, b, t, glow: g } = lightAt(progress.current ?? 0);
    glow.current = g;
    const u = sky.uniforms;
    mixColor(u.zenith!.value, a.sky.zenith, b.sky.zenith, t);
    mixColor(u.horizon!.value, a.sky.horizon, b.sky.horizon, t);
    mixColor(u.belt!.value, a.sky.belt, b.sky.belt, t);
    mixColor(u.ground!.value, a.fog.color, b.fog.color, t);
    mixColor(u.sunColor!.value, a.sun.color, b.sun.color, t);
    u.beltStrength!.value = THREE.MathUtils.lerp(a.sky.beltStrength, b.sky.beltStrength, t);
    u.glow!.value = THREE.MathUtils.lerp(a.sky.glow, b.sky.glow, t);
    const az = THREE.MathUtils.lerp(a.sun.azimuth, b.sun.azimuth, t);
    const el = THREE.MathUtils.lerp(a.sun.elevation, b.sun.elevation, t);
    const dir = sunDirection(az, el);
    (u.sunDir!.value as THREE.Vector3).set(...dir);
    if (sun.current) {
      sun.current.position.set(dir[0] * 700, dir[1] * 700 + 60, dir[2] * 700);
      mixColor(sun.current.color, a.sun.color, b.sun.color, t);
      sun.current.intensity = THREE.MathUtils.lerp(a.sun.intensity, b.sun.intensity, t);
    }
    if (hemi.current) {
      mixColor(hemi.current.color, a.hemi.sky, b.hemi.sky, t);
      mixColor(hemi.current.groundColor, a.hemi.ground, b.hemi.ground, t);
      hemi.current.intensity = THREE.MathUtils.lerp(a.hemi.intensity, b.hemi.intensity, t);
    }
    mixColor(fog.color, a.fog.color, b.fog.color, t);
    fog.density = THREE.MathUtils.lerp(a.fog.density, b.fog.density, t) * 0.8;
    scene.environmentIntensity = THREE.MathUtils.lerp(a.envIntensity, b.envIntensity, t) * (1 - 0.55 * THREE.MathUtils.smoothstep(progress.current ?? 0, 0.75, 1));
  });

  return (
    <>
      <mesh material={sky} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[5000, 48, 24]} />
      </mesh>
      <primitive object={target} />
      <directionalLight ref={sun} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <hemisphereLight ref={hemi} />
      <Suspense fallback={null}>
        <Environment files="/hdri/venice_sunset_1k.hdr" background={false} />
      </Suspense>
    </>
  );
}

type Shared = {
  progress: RefObject<number>;
  pointer: RefObject<{ x: number; y: number }>;
  focusId: string | null;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  onDistrict: (d: District) => void;
};

function Rig({ progress, pointer, focusId, district }: Pick<Shared, "progress" | "pointer" | "focusId"> & { district: District | null }) {
  const look = useRef(new THREE.Vector3(...PATH.targets[0]!));
  const goal = useRef(new THREE.Vector3());
  const goalT = useRef(new THREE.Vector3());
  const sp = useRef({ x: 0, y: 0 });
  useFrame((state, delta) => {
    const p = THREE.MathUtils.clamp(progress.current ?? 0, 0, 1);
    const focus = focusId && district ? district.towers.find((t) => t.id === focusId) : null;
    if (focus) {
      const [x, z] = focus.position;
      const h = focus.size[1] * 2;
      goalT.current.set(x, h * 0.62, z);
      goal.current.set(x - focus.size[0] * 3.2 - 40, h * 0.7, z + focus.size[2] * 3.2 + 70);
    } else {
      posCurve.getPointAt(p, goal.current);
      tgtCurve.getPointAt(p, goalT.current);
    }
    const k = 1 - Math.exp(-delta * 2.5);
    const pt = pointer.current ?? { x: 0, y: 0 };
    sp.current.x += (pt.x - sp.current.x) * k;
    sp.current.y += (pt.y - sp.current.y) * k;
    // The whole view leans toward the cursor: a few metres, enough to feel depth.
    goal.current.x += sp.current.x * 18;
    goal.current.y -= sp.current.y * 10;
    const damp = 1 - Math.exp(-delta * (focus ? 1.8 : 4));
    state.camera.position.lerp(goal.current, damp);
    look.current.lerp(goalT.current, damp);
    state.camera.lookAt(look.current);
  });
  return null;
}

/** Per-frame window glow that also honours hover highlights. */
function GlowDriver({ district, glow, hoverId, focusId }: { district: District | null; glow: RefObject<number>; hoverId: string | null; focusId: string | null }) {
  useFrame(() => {
    if (!district) return;
    const g = glow.current ?? 1;
    district.towers.forEach((t) => {
      const boost = t.id === hoverId || t.id === focusId ? 1.7 : 1;
      t.tower.glass.forEach((m) => (m.emissiveIntensity = g * boost));
      if (t.tower.lantern) t.tower.lantern.emissiveIntensity = 1.6 * g * boost;
    });
  });
  return null;
}

type Props = Shared & { rise: RefObject<number>; active: boolean; quality: "high" | "lite" };

export default function SkylineCanvas({ progress, pointer, rise, focusId, hoverId, onHover, onSelect, onDistrict, active, quality }: Props) {
  const glow = useRef(0.4);
  const [district, setDistrict] = useState<District | null>(null);
  const handleBuilt = useCallback(
    (d: District) => {
      setDistrict(d);
      onDistrict(d);
    },
    [onDistrict],
  );
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, quality === "high" ? 1.5 : 1.2]}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 40, position: PATH.positions[0], near: 1, far: 14000 }}
      onPointerMissed={() => onSelect(null)}
    >
      <DynamicAtmosphere progress={progress} glow={glow} />
      <DistrictScene glow={glow} rise={rise} animate onBuilt={handleBuilt} />
      {district && <TowerTargets district={district} hoverId={hoverId} focusId={focusId} onHover={onHover} onSelect={onSelect} />}
      <GlowDriver district={district} glow={glow} hoverId={hoverId} focusId={focusId} />
      <Rig progress={progress} pointer={pointer} focusId={focusId} district={district} />
      <Finish quality={quality} />
    </Canvas>
  );
}

/** Invisible volumes around each tower: hover shows its name, click focuses the camera on it. */
function TowerTargets(props: { district: District } & Pick<Shared, "hoverId" | "focusId" | "onHover" | "onSelect">) {
  const { district, hoverId, focusId, onHover, onSelect } = props;
  useEffect(() => {
    document.body.style.cursor = hoverId ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hoverId]);
  return (
    <>
      {district.towers.map((t) => {
        const h = t.size[1] * 2;
        const show = t.id === hoverId && t.id !== focusId;
        return (
          <group key={t.id} position={[t.position[0], 0, t.position[1]]}>
            <mesh
              position={[0, h / 2, 0]}
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                onHover(t.id);
              }}
              onPointerOut={() => onHover(null)}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                if (e.delta < 6) onSelect(t.id === focusId ? null : t.id);
              }}
            >
              <boxGeometry args={[t.size[0] * 2 + 4, h, t.size[2] * 2 + 4]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
            </mesh>
            {show && (
              <Html position={[0, h + 12, 0]} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
                <div className="whitespace-nowrap rounded-full border border-ivory/30 bg-ink/80 px-4 py-2 text-ivory backdrop-blur-md">
                  <span className="font-display text-[1.05rem]">{t.name}</span>
                  <span className="label ml-3 text-bronze-light">{t.type}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}
