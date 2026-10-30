"use client";

import { useProgress } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getShot } from "@/lib/three/shots";
import { Atmosphere } from "./Atmosphere";
import { Finish } from "./Finish";
import { SceneById } from "./SceneById";

function Rig({ shotId }: { shotId: string }) {
  const shot = getShot(shotId);
  const frames = useRef(0);
  const loading = useProgress((s) => s.active);
  useFrame((state) => {
    if (!shot) return;
    state.invalidate();
    if (loading) return; // wait for the HDRI before counting frames
    if (frames.current === 0) {
      const cam = state.camera as THREE.PerspectiveCamera;
      const { width, height } = state.size;
      cam.fov = shot.fov;
      cam.near = 0.5;
      cam.far = 12000;
      cam.position.set(...shot.position);
      cam.lookAt(...shot.target);
      if (shot.shiftX) cam.setViewOffset(width, height, -shot.shiftX * width, 0, width, height);
      else cam.clearViewOffset();
      cam.updateProjectionMatrix();
    }
    frames.current += 1;
    if (frames.current === 24) {
      document.body.dataset.ready = "1";
      state.setFrameloop("never");
    }
  });
  return null;
}

/** Development tool: renders one concept-image camera set-up full screen. */
export function StudioCanvas({ shotId }: { shotId: string }) {
  const shot = getShot(shotId);
  if (!shot) return <p>Unknown shot.</p>;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000" }}>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={1}
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        camera={{ fov: shot.fov, position: shot.position, near: 0.5, far: 12000 }}
      >
        <Atmosphere preset={shot.preset} shadow={shot.shadow} />
        <SceneById id={shot.scene} preset={shot.preset} />
        <Finish bloomThreshold={shot.preset === "daylight" ? 2.2 : 0.92} />
        <Rig shotId={shotId} />
      </Canvas>
    </div>
  );
}
