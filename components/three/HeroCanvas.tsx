"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { SHOTS } from "@/lib/three/shots";
import { Atmosphere } from "./Atmosphere";
import { KadalScene } from "./scenes/KadalScene";

const HERO = SHOTS["kadal-hero"];

// Camera path. The first key matches the poster image exactly, so the switch
// from image to live scene is invisible. Scrolling lifts the camera up the
// tower toward the crown and the sea beyond.
const KEYS = {
  posterPos: new THREE.Vector3(...HERO.position),
  posterTarget: new THREE.Vector3(...HERO.target),
  settlePos: new THREE.Vector3(-123, 8, 145),
  risePos: new THREE.Vector3(-64, 74, 92),
  riseTarget: new THREE.Vector3(4, 98, -14),
};

const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

type RigProps = {
  progress: RefObject<number>;
  pointer: RefObject<{ x: number; y: number }>;
  reduced: boolean;
  onReady: () => void;
};

function CameraRig({ progress, pointer, reduced, onReady }: RigProps) {
  const framedFor = useRef("");
  const started = useRef<number | null>(null);
  const frames = useRef(0);
  const ready = useRef(false);
  const lookAt = useRef(KEYS.posterTarget.clone());
  const goalPos = useRef(new THREE.Vector3());
  const goalTarget = useRef(new THREE.Vector3());
  const smoothPointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    // Frame the tower right of centre on wide screens and centred on tall ones.
    const { width, height } = state.size;
    if (framedFor.current !== `${width}x${height}`) {
      framedFor.current = `${width}x${height}`;
      const cam = state.camera as THREE.PerspectiveCamera;
      const aspect = width / height;
      cam.fov = aspect < 1 ? 58 : aspect < 1.4 ? 46 : HERO.fov;
      const shift = aspect > 1.2 ? (HERO.shiftX ?? 0) : 0;
      if (shift) cam.setViewOffset(width, height, -shift * width, 0, width, height);
      else cam.clearViewOffset();
      cam.near = 1;
      cam.far = 12000;
      cam.updateProjectionMatrix();
    }
    const camera = state.camera;
    if (started.current === null) started.current = state.clock.elapsedTime;
    const intro = reduced ? 1 : ease((state.clock.elapsedTime - started.current - 0.4) / 3.6);
    const p = ease(progress.current ?? 0);

    goalPos.current.copy(KEYS.posterPos).lerp(KEYS.settlePos, intro).lerp(KEYS.risePos, p);
    goalTarget.current.copy(KEYS.posterTarget).lerp(KEYS.riseTarget, p);

    // Restrained pointer parallax, a few metres at most.
    const pt = pointer.current ?? { x: 0, y: 0 };
    const k = 1 - Math.exp(-delta * 2.5);
    smoothPointer.current.x += (pt.x - smoothPointer.current.x) * k;
    smoothPointer.current.y += (pt.y - smoothPointer.current.y) * k;
    goalPos.current.x += smoothPointer.current.x * 4;
    goalPos.current.y += -smoothPointer.current.y * 2;

    const damp = 1 - Math.exp(-delta * 3.2);
    camera.position.lerp(goalPos.current, damp);
    lookAt.current.lerp(goalTarget.current, damp);
    camera.lookAt(lookAt.current);

    frames.current += 1;
    if (!ready.current && frames.current >= 3) {
      ready.current = true;
      onReady();
    }
    const moving = camera.position.distanceToSquared(goalPos.current) > 0.0004 || intro < 1;
    if (moving || !ready.current) state.invalidate();
  });
  return null;
}

type Props = {
  progress: RefObject<number>;
  pointer: RefObject<{ x: number; y: number }>;
  reduced: boolean;
  onReady: () => void;
  onFail: () => void;
};

/** The live hero: Kadal Residences at dusk, rendered on demand. */
export default function HeroCanvas({ progress, pointer, reduced, onReady, onFail }: Props) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      frameloop="demand"
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
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} flipflops={2} onFallback={() => setDpr(1)} />
      <Atmosphere preset={HERO.preset} shadow={{ ...HERO.shadow, mapSize: 2048 }} />
      <KadalScene preset={HERO.preset} />
      <CameraRig progress={progress} pointer={pointer} reduced={reduced} onReady={onReady} />
    </Canvas>
  );
}
