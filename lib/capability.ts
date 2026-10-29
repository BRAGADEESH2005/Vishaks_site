"use client";

/**
 * Decide whether this device should run the live 3D hero. Visitors who prefer
 * reduced motion, are saving data, or are on low-memory devices get the
 * pre-rendered still instead, which shows the same scene.
 */
let cached: boolean | null = null;

export function canRunHero3D(): boolean {
  if (typeof window === "undefined") return false;
  if (cached === null) cached = detect();
  return cached;
}

function detect(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;
  if (window.innerWidth < 768 && (nav.hardwareConcurrency ?? 8) <= 4) return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
