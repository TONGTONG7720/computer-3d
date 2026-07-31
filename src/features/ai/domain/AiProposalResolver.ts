import {
  emptySelectedComponents,
  type Hardware,
  hardwareCategories,
  replaceSelectedHardware,
  type SelectedComponents,
} from "@/features/builder/domain/hardware";
import type { AiComponentIds } from "./aiBuild";

export class AiProposalResolutionError extends Error {
  constructor(readonly hardwareId: string) {
    super(`AI proposal references unavailable hardware: ${hardwareId}`);
    this.name = "AiProposalResolutionError";
  }
}

export const resolveAiProposal = (
  componentIds: AiComponentIds,
  catalogue: readonly Hardware[],
): SelectedComponents => {
  let selection = emptySelectedComponents();
  for (const category of hardwareCategories) {
    const hardwareId = componentIds[category];
    const hardware = catalogue.find((candidate) => candidate.id === hardwareId);
    if (hardware === undefined || hardware.category !== category) {
      throw new AiProposalResolutionError(hardwareId);
    }
    selection = replaceSelectedHardware(selection, hardware);
  }
  return selection;
};
