"use client";

import type { AtmosphereId } from "@/lib/three/atmosphere";
import type { SceneId } from "@/lib/three/shots";
import { KadalScene } from "./scenes/KadalScene";
import { AmbalamScene, MaruthamScene, SandhaiScene } from "./scenes/OtherScenes";

export function SceneById({ id, preset }: { id: SceneId; preset: AtmosphereId }) {
  switch (id) {
    case "kadal":
      return <KadalScene preset={preset} />;
    case "ambalam":
      return <AmbalamScene preset={preset} />;
    case "marutham":
      return <MaruthamScene preset={preset} />;
    case "sandhai":
      return <SandhaiScene preset={preset} />;
  }
}
