"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { materialTokens } from "../materials/MaterialSystem";
import type { QualityProfile } from "./QualityManager";

type LightingSystemProps = {
  readonly profile: QualityProfile;
};

export function LightingSystem({ profile }: LightingSystemProps) {
  const mobile = profile.id === "mobile";

  return (
    <>
      <ambientLight color={materialTokens.warmWhite} intensity={0.42} />
      <directionalLight
        castShadow={profile.shadows}
        color={materialTokens.warmWhite}
        intensity={3.1}
        position={[5.5, 8.5, 7.5]}
        shadow-bias={-0.0004}
        shadow-mapSize-height={profile.shadowMapSize}
        shadow-mapSize-width={profile.shadowMapSize}
      />
      <pointLight
        color={materialTokens.coldBlue}
        decay={2}
        intensity={mobile ? 15 : 24}
        position={[-4.8, 4.6, 4.2]}
      />
      <pointLight
        color={materialTokens.cyan}
        decay={2}
        intensity={mobile ? 9 : 15}
        position={[4.6, 5.2, -3.8]}
      />
      <spotLight
        angle={0.46}
        color={materialTokens.warmWhite}
        decay={2}
        intensity={mobile ? 17 : 28}
        penumbra={0.86}
        position={[1.5, 7.8, -4.2]}
        target-position={[0, 2.3, 0]}
      />
      <Environment resolution={mobile ? 32 : 64}>
        <Lightformer
          color={materialTokens.warmWhite}
          intensity={2.5}
          position={[0, 8, 0]}
          rotation-x={Math.PI / 2}
          scale={[9, 9, 1]}
        />
        <Lightformer
          color={materialTokens.coldBlue}
          intensity={2.8}
          position={[-6, 3.5, 2]}
          rotation-y={Math.PI / 2}
          scale={[5, 2, 1]}
        />
        <Lightformer
          color={materialTokens.brushedAluminum}
          intensity={1.8}
          position={[6, 4, -2]}
          rotation-y={-Math.PI / 2}
          scale={[4, 2, 1]}
        />
      </Environment>
      <ContactShadows
        blur={mobile ? 2.5 : 3.4}
        far={12}
        frames={1}
        opacity={0.58}
        position={[0, 0.04, 0]}
        resolution={mobile ? 256 : 512}
        scale={13}
      />
    </>
  );
}
