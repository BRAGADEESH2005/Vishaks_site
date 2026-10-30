"use client";

import { Html, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { AtmosphereId } from "@/lib/three/atmosphere";
import { getHeroFeature, HERO_FEATURES } from "@/lib/three/heroFeatures";
import { SHOTS } from "@/lib/three/shots";
import { Atmosphere } from "./Atmosphere";
import { Finish } from "./Finish";
import { CbdScene } from "./scenes/CbdScene";

const HERO = SHOTS["cbd-hero"];

// Camera path. The first key matches the poster image exactly, so the switch
// from image to live scene is invisible. The intro drifts in toward the
// crossing; scrolling then lifts the camera into an aerial over the district.
const KEYS = {
  posterPos: new THREE.Vector3(...HERO.position),
  posterTarget: new THREE.Vector3(...HERO.target),
  settlePos: new THREE.Vector3(-246, 12, 236),
  risePos: new THREE.Vector3(-150, 230, 250),
  riseTarget: new THREE.Vector3(10, 60, -20),
};

const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
const UP = new THREE.Vector3(0, 1, 0);

type Shared = {
  progress: RefObject<number>;
  pointer: RefObject<{ x: number; y: number }>;
  /** Horizontal orbit set by dragging, in radians, clamped by the stage. */
  orbit: RefObject<number>;
};

type RigProps = Shared & { reduced: boolean; focusId: string | null; onReady: () => void };

function CameraRig({ progress, pointer, orbit, reduced, focusId, onReady }: RigProps) {
  const framedFor = useRef("");
  const started = useRef<number | null>(null);
  const frames = useRef(0);
  const ready = useRef(false);
  const lookAt = useRef(KEYS.posterTarget.clone());
  const goalPos = useRef(new THREE.Vector3());
  const goalTarget = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());
  const smooth = useRef({ x: 0, y: 0, orbit: 0 });
  const invalidate = useThree((s) => s.invalidate);

  // The canvas renders on demand, so wake it whenever the visitor does
  // something the camera responds to: choosing a feature, scrolling, moving or dragging.
  useEffect(() => invalidate(), [focusId, invalidate]);
  useEffect(() => {
    const wake = () => invalidate();
    window.addEventListener("pointermove", wake, { passive: true });
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    return () => {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
    };
  }, [invalidate]);

  useFrame((state, delta) => {
    // Frame the tower right of centre on wide screens and centred on tall ones.
    const { width, height } = state.size;
    if (framedFor.current !== `${width}x${height}`) {
      framedFor.current = `${width}x${height}`;
      const cam = state.camera as THREE.PerspectiveCamera;
      const aspect = width / height;
      cam.fov = aspect < 1 ? 58 : aspect < 1.4 ? 46 : HERO.fov;
      const shift = aspect > 1.2 ? (HERO.shiftX ?? 0) : 0;
      // On tall phone screens, lift the towers into the top of the frame so the headline has clear space below.
      const lift = aspect < 1 ? 0.2 : 0;
      if (shift || lift) cam.setViewOffset(width, height, -shift * width, lift * height, width, height);
      else cam.clearViewOffset();
      cam.near = 1;
      cam.far = 12000;
      cam.updateProjectionMatrix();
    }
    const camera = state.camera;
    if (started.current === null) started.current = state.clock.elapsedTime;
    const intro = reduced ? 1 : ease((state.clock.elapsedTime - started.current - 0.4) / 3.6);
    const feature = getHeroFeature(focusId);

    if (feature) {
      goalPos.current.set(...feature.camera.position);
      goalTarget.current.set(...feature.camera.target);
    } else {
      const p = ease(progress.current ?? 0);
      goalPos.current.copy(KEYS.posterPos).lerp(KEYS.settlePos, intro).lerp(KEYS.risePos, p);
      goalTarget.current.copy(KEYS.posterTarget).lerp(KEYS.riseTarget, p);
    }

    // Drag to walk around the building a little; pointer parallax on top.
    const k = 1 - Math.exp(-delta * 2.5);
    const pt = pointer.current ?? { x: 0, y: 0 };
    const s = smooth.current;
    s.x += (pt.x - s.x) * k;
    s.y += (pt.y - s.y) * k;
    s.orbit += ((orbit.current ?? 0) - s.orbit) * (1 - Math.exp(-delta * 4));
    offset.current.copy(goalPos.current).sub(goalTarget.current).applyAxisAngle(UP, s.orbit);
    goalPos.current.copy(goalTarget.current).add(offset.current);
    const sway = feature ? 0.4 : 1;
    goalPos.current.x += s.x * 4 * sway;
    goalPos.current.y += -s.y * 2 * sway;

    // Flights to a feature are slower and more deliberate than scroll moves.
    const damp = 1 - Math.exp(-delta * (feature ? 1.8 : 3.2));
    camera.position.lerp(goalPos.current, damp);
    lookAt.current.lerp(goalTarget.current, damp);
    camera.lookAt(lookAt.current);

    frames.current += 1;
    if (!ready.current && frames.current >= 3) {
      ready.current = true;
      onReady();
    }
    const moving =
      camera.position.distanceToSquared(goalPos.current) > 0.0004 ||
      Math.abs((orbit.current ?? 0) - s.orbit) > 0.0005 ||
      intro < 1;
    if (moving || !ready.current) state.invalidate();
  });
  return null;
}

/**
 * Markers pinned to the building. They duplicate the feature buttons in the
 * hero's control rail, which are the accessible version, so these are hidden
 * from assistive technology and skipped by the Tab key.
 */
function Hotspots({ progress, focusId, onSelect, visible }: { progress: RefObject<number>; focusId: string | null; onSelect: (id: string) => void; visible: boolean }) {
  const wrap = useRef<Array<HTMLDivElement | null>>([]);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [visible, focusId, invalidate]);
  const ndc = useRef(new THREE.Vector3());
  useFrame(({ camera, size }) => {
    // On phones the headline fills the frame, so the feature buttons below it are the only way in.
    const fade = size.width < 640 ? 0 : Math.max(0, 1 - (progress.current ?? 0) * 4);
    wrap.current.forEach((el, i) => {
      const f = HERO_FEATURES[i];
      if (!el || !f) return;
      // Keep markers out of the control rail along the bottom of the frame.
      ndc.current.set(...f.anchor).project(camera);
      const clear = ndc.current.z < 1 && ndc.current.y > -0.62 && ndc.current.y < 0.85;
      el.style.opacity = String(visible && clear ? fade : 0);
      el.style.pointerEvents = visible && clear && fade > 0.2 ? "auto" : "none";
    });
  });
  return (
    <>
      {HERO_FEATURES.map((f, i) => {
        const active = f.id === focusId;
        return (
          <Html key={f.id} position={f.anchor} center zIndexRange={[30, 10]}>
            <div
              ref={(el) => {
                wrap.current[i] = el;
              }}
              className="transition-opacity duration-700"
              style={{ opacity: 0 }}
            >
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => onSelect(f.id)}
                className="group relative flex h-9 w-9 items-center justify-center"
              >
                <span
                  className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                    active ? "scale-110 border-bronze-light bg-bronze-light/25" : "border-ivory/60 bg-ink/30 group-hover:scale-110 group-hover:border-ivory"
                  }`}
                />
                <span className={`relative h-2 w-2 rounded-full ${active ? "bg-bronze-light" : "bg-ivory"}`} />
                {!active && <span className="absolute inset-0 animate-ping rounded-full border border-ivory/40 [animation-duration:2.6s]" />}
                <span className="label pointer-events-none absolute left-11 whitespace-nowrap rounded-full bg-ink/75 px-3 py-1.5 text-ivory opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {f.label}
                </span>
              </button>
            </div>
          </Html>
        );
      })}
    </>
  );
}

type Props = Shared & {
  active: boolean;
  reduced: boolean;
  preset: AtmosphereId;
  focusId: string | null;
  hotspots: boolean;
  onSelect: (id: string) => void;
  onReady: () => void;
  onFail: () => void;
  /** The sky lighting (HDRI) has downloaded and been processed. */
  onEnvReady?: () => void;
};

/** The live hero: the Vishaks Central district, always animating while on screen. */
export default function HeroCanvas({ onEnvReady, active, progress, pointer, orbit, reduced, preset, focusId, hotspots, onSelect, onReady, onFail }: Props) {
  const [dpr, setDpr] = useState(1.5);
  const [quality, setQuality] = useState<"high" | "lite">("high");
  return (
    <Canvas
      frameloop={active ? "demand" : "never"}
      dpr={dpr}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: HERO.fov, position: HERO.position, near: 1, far: 12000 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setQuality("lite");
        }}
        onIncline={() => setDpr(1.5)}
        flipflops={2}
        onFallback={() => {
          setDpr(1);
          setQuality("lite");
        }}
      />
      <Atmosphere key={preset} preset={preset} shadow={{ ...HERO.shadow, mapSize: 2048 }} onEnvReady={onEnvReady} />
      <CbdScene preset={preset} />
      <Hotspots progress={progress} focusId={focusId} onSelect={onSelect} visible={hotspots} />
      <Finish quality={quality} bloomThreshold={preset === "daylight" ? 2.2 : 0.92} />
      <CameraRig progress={progress} pointer={pointer} orbit={orbit} reduced={reduced} focusId={focusId} onReady={onReady} />
    </Canvas>
  );
}
