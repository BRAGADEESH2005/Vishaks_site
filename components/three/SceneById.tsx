"use client";

import type { AtmosphereId } from "@/lib/three/atmosphere";
import type { SceneId } from "@/lib/three/shots";
import { CbdScene } from "./scenes/CbdScene";
import { DistrictScene } from "./scenes/DistrictScene";
import { ResidentialScene } from "./scenes/ResidentialScene";
import { OfficeScene, CoworkingScene, RetailScene } from "./scenes/OtherScenes";

export function SceneById({ id, preset }: { id: SceneId; preset: AtmosphereId }) {
  switch (id) {
    case "residential":
      return <ResidentialScene preset={preset} />;
    case "office":
      return <OfficeScene preset={preset} />;
    case "coworking":
      return <CoworkingScene preset={preset} />;
    case "district":
      return <DistrictScene preset={preset} />;
    case "retail":
      return <RetailScene preset={preset} />;
    case "cbd":
      return <CbdScene preset={preset} animate={false} />;
  }
}
