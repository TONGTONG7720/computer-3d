"use client";

import { Line } from "@react-three/drei";
import { materialTokens } from "../materials/materialTokens";
import { componentSlots } from "./slots";

export function ExplodedConnectors() {
  return (
    <group name="EXPLODED_CONNECTORS">
      {componentSlots
        .filter((slot) => slot.slotId !== "pc_case")
        .map((slot) => (
          <Line
            color={materialTokens.coldBlue}
            dashed
            dashScale={9}
            dashSize={0.12}
            gapSize={0.08}
            key={slot.slotId}
            opacity={0.42}
            points={[
              slot.position,
              [
                slot.position[0] + slot.explodedOffset[0],
                slot.position[1] + slot.explodedOffset[1],
                slot.position[2] + slot.explodedOffset[2],
              ],
            ]}
            transparent
          />
        ))}
    </group>
  );
}
