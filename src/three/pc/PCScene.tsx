"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { resolveRaycastSlot } from "../interaction/Raycaster";
import { SelectionManager } from "../interaction/SelectionManager";
import { materialTokens } from "../materials/materialTokens";
import type { BuilderSceneSelection } from "./BuilderSceneSelection";
import { Cooling } from "./Cooling";
import { CPU } from "./CPU";
import { Fans } from "./Fans";
import { GPU } from "./GPU";
import { Motherboard } from "./Motherboard";
import { PCCase } from "./PCCase";
import { PowerSupply } from "./PowerSupply";
import { RAM } from "./RAM";
import { Storage } from "./Storage";
import type { PCSlotId } from "./slots";

type PCSceneProps = {
  readonly onSelect: (slotId: PCSlotId | null) => void;
  readonly selectedSlot: PCSlotId | null;
  readonly selection: BuilderSceneSelection;
};

export function PCScene({ onSelect, selectedSlot, selection }: PCSceneProps) {
  const manager = useMemo(() => new SelectionManager(onSelect), [onSelect]);

  const handleSelection = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    const slotId = resolveRaycastSlot(event.intersections);
    if (slotId !== undefined) {
      manager.select(slotId);
    }
  };

  return (
    // WebGL selection is mirrored by accessible HTML status and camera controls in the viewport.
    // biome-ignore lint/a11y/noStaticElementInteractions: R3F pointer events require a scene group.
    <group name="PC_CASE" onClick={handleSelection}>
      {selection.pc_case === null ? null : (
        <PCCase part={selection.pc_case} selected={selectedSlot === "pc_case"} />
      )}
      {selection.motherboard === null ? null : (
        <Motherboard part={selection.motherboard} selected={selectedSlot === "motherboard"} />
      )}
      {selection.cpu_socket === null ? null : (
        <CPU
          key={selection.cpu_socket.hardware.id}
          part={selection.cpu_socket}
          selected={selectedSlot === "cpu_socket"}
        />
      )}
      {selection.gpu_slot === null ? null : (
        <GPU
          key={selection.gpu_slot.hardware.id}
          part={selection.gpu_slot}
          selected={selectedSlot === "gpu_slot"}
        />
      )}
      {selection.ram_slots === null ? null : (
        <RAM part={selection.ram_slots} selected={selectedSlot === "ram_slots"} />
      )}
      {selection.storage_slots === null ? null : (
        <Storage part={selection.storage_slots} selected={selectedSlot === "storage_slots"} />
      )}
      {selection.cooling_mount === null ? null : (
        <Cooling part={selection.cooling_mount} selected={selectedSlot === "cooling_mount"} />
      )}
      {selection.psu_area === null ? null : (
        <PowerSupply part={selection.psu_area} selected={selectedSlot === "psu_area"} />
      )}
      <Fans selected={selectedSlot === "fan_mount"} />
      <gridHelper
        args={[16, 32, materialTokens.graphiteMetal, materialTokens.darkMetal]}
        position={[0, 0.02, 0]}
      />
    </group>
  );
}
