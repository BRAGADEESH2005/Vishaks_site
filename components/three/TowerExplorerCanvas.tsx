"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { buildResidentialTower } from "@/lib/three/builders/tower";
import { createKit, disposeKit, disposeObject } from "@/lib/three/kit";
import { Atmosphere } from "./Atmosphere";
import { Finish } from "./Finish";

const PLINTH = 3;
const SPEC = { floors: 34, width: 26, depth: 19, seed: 101, lit: 0.35, skyGardens: [12, 24] };

function Tower({ selected, onSelect }: { selected: number | null; onSelect: (floor: number) => void }) {
  const built = useMemo(() => {
    const kit = createKit();
    const tower = buildResidentialTower(kit, SPEC);
    tower.group.position.y = PLINTH;
    tower.glass.forEach((m) => (m.emissiveIntensity = 1.6));
    const highlight = new THREE.MeshStandardMaterial({
      color: "#c79c70",
      emissive: "#c79c70",
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 64), kit.paving);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(46, PLINTH, 36), kit.stone);
    plinth.position.y = PLINTH / 2;
    plinth.castShadow = plinth.receiveShadow = true;
    return { kit, tower, highlight, ground, plinth };
  }, []);

  useEffect(
    () => () => {
      [built.tower.group, built.ground, built.plinth].forEach(disposeObject);
      built.highlight.dispose();
      disposeKit(built.kit);
    },
    [built],
  );

  const fh = built.tower.floorHeight;
  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 4) return; // the visitor was dragging to orbit, not choosing a floor
    const y = e.point.y - PLINTH;
    const floor = Math.min(SPEC.floors, Math.max(1, Math.floor(y / fh) + 1));
    onSelect(floor);
  };

  return (
    <group>
      <primitive object={built.ground} />
      <primitive object={built.plinth} />
      <primitive object={built.tower.group} />
      {/* An invisible volume around the tower takes the clicks. */}
      <mesh position={[0, PLINTH + (SPEC.floors * fh) / 2, 0]} onClick={pick}>
        <boxGeometry args={[SPEC.width + 3, SPEC.floors * fh, SPEC.depth + 5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      {selected !== null && (
        <mesh position={[0, PLINTH + (selected - 0.5) * fh, 0]} material={built.highlight}>
          <boxGeometry args={[SPEC.width + 1.4, fh * 0.92, SPEC.depth + 4.8]} />
        </mesh>
      )}
    </group>
  );
}

export default function TowerExplorerCanvas({ selected, onSelect }: { selected: number | null; onSelect: (floor: number) => void }) {
  const height = SPEC.floors * 3.25;
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 1.75]}
      frameloop="demand"
      camera={{ position: [-150, 62, 190], fov: 36, near: 1, far: 9000 }}
      gl={{ antialias: true }}
      aria-hidden="true"
    >
      <Atmosphere preset="dusk" shadow={{ extent: 90, target: [0, 40, 0], distance: 400, mapSize: 2048 }} />
      <Tower selected={selected} onSelect={onSelect} />
      <Finish quality="lite" />
      <OrbitControls
        target={[0, height * 0.5, 0]}
        enablePan={false}
        enableZoom
        minDistance={90}
        maxDistance={320}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.49}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
      />
    </Canvas>
  );
}
