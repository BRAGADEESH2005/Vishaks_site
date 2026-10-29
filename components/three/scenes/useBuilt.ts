"use client";

import { useEffect, useState } from "react";
import type * as THREE from "three";
import { createKit, disposeKit, disposeObject, type Kit } from "@/lib/three/kit";

/**
 * Build a procedural scene once and free its GPU memory on unmount.
 * Disposed resources are re-uploaded automatically if React remounts
 * the component (as Strict Mode does in development).
 */
export function useBuilt<T extends { roots: THREE.Object3D[]; setGlow: (g: number) => void }>(build: (kit: Kit) => T): T & { kit: Kit } {
  // Built once per mount: these scenes are static.
  const [built] = useState(() => {
    const kit = createKit();
    return { ...build(kit), kit };
  });
  useEffect(
    () => () => {
      built.roots.forEach(disposeObject);
      disposeKit(built.kit);
    },
    [built],
  );
  return built;
}
