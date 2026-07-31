import { LOD, type Object3D } from "three";
import type { QualityProfile } from "./QualityManager";

const qualityDistanceScale: Record<QualityProfile["id"], number> = {
  "desktop-high": 1,
  "desktop-balanced": 0.84,
  mobile: 0.68,
};

export const getLodDistanceScale = (profile: QualityProfile): number =>
  qualityDistanceScale[profile.id];

export const configureSceneLod = (root: Object3D, profile: QualityProfile): void => {
  const distanceScale = getLodDistanceScale(profile);

  root.traverse((object) => {
    if (!(object instanceof LOD)) {
      return;
    }

    for (const level of object.levels) {
      const baseDistance = level.object.userData["lodDistance"];
      if (typeof baseDistance === "number") {
        level.distance = baseDistance * distanceScale;
      }
    }
    object.updateMatrixWorld();
  });
};
