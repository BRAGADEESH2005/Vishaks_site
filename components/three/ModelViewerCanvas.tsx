"use client";

import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";
import type { AtmosphereId } from "@/lib/three/atmosphere";
import type { ModelView } from "@/lib/three/modelViews";
import { Atmosphere } from "./Atmosphere";
import { Finish } from "./Finish";
import { SceneById } from "./SceneById";

/** An orbitable concept model for a project page: turn, zoom, and change the light. */
export default function ModelViewerCanvas({ view, preset, spin, active, onInteract }: { view: ModelView; preset: AtmosphereId; spin: boolean; active: boolean; onInteract: () => void }) {
  const [dpr, setDpr] = useState(1.5);
  const [quality, setQuality] = useState<"high" | "lite">("lite");
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: view.position, fov: 38, near: 1, far: 12000 }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onIncline={() => setQuality("high")}
        onDecline={() => {
          setDpr(1);
          setQuality("lite");
        }}
        flipflops={2}
      />
      <Atmosphere key={preset} preset={preset} shadow={{ ...view.shadow, mapSize: 2048 }} />
      <SceneById id={view.scene} preset={preset} />
      <Finish quality={quality} bloomThreshold={preset === "daylight" ? 2.2 : 0.92} />
      <OrbitControls
        target={view.target}
        enablePan={false}
        minDistance={view.minDistance}
        maxDistance={view.maxDistance}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.47}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        autoRotate={spin}
        autoRotateSpeed={0.45}
        onStart={onInteract}
      />
    </Canvas>
  );
}
