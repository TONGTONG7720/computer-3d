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
      <ambientLight intensity={0.7} color={materialTokens.brushedAluminum} />
      <directionalLight
        castShadow={profile.shadows}
        color={materialTokens.brushedAluminum}
        intensity={3.4}
        position={[5, 9, 7]}
        shadow-bias={-0.0004}
        shadow-mapSize-height={profile.shadowMapSize}
        shadow-mapSize-width={profile.shadowMapSize}
      />
      <pointLight
        color={materialTokens.cyan}
        decay={2}
        intensity={mobile ? 18 : 28}
        position={[-4.5, 4.8, 4]}
      />
      <pointLight
        color={materialTokens.violet}
        decay={2}
        intensity={mobile ? 12 : 22}
        position={[4.8, 5.5, -4]}
      />
      <spotLight
        angle={0.5}
        color={materialTokens.magenta}
        decay={2}
        intensity={mobile ? 20 : 34}
        penumbra={0.8}
        position={[1.5, 7.5, -4]}
        target-position={[0, 2.3, 0]}
      />
      <Environment resolution={mobile ? 32 : 64}>
        <Lightformer
          color={materialTokens.brushedAluminum}
          intensity={2.8}
          position={[0, 8, 0]}
          rotation-x={Math.PI / 2}
          scale={[9, 9, 1]}
        />
        <Lightformer
          color={materialTokens.cyan}
          intensity={3.2}
          position={[-6, 3.5, 2]}
          rotation-y={Math.PI / 2}
          scale={[5, 2, 1]}
        />
        <Lightformer
          color={materialTokens.violet}
          intensity={2.4}
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
