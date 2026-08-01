import { z } from "zod";
import type { HardwareId } from "@/features/builder/domain/hardware";

const HANDOFF_KEY = "pc-lab-builder-hardware-handoff";
const handoffSchema = z.object({ hardwareId: z.string().min(1), createdAt: z.number().int() });

type SessionStorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export const queueBuilderHardware = (
  hardwareId: HardwareId,
  storage: SessionStorageLike = window.sessionStorage,
): void => {
  storage.setItem(HANDOFF_KEY, JSON.stringify({ hardwareId, createdAt: Date.now() }));
};

export const consumeBuilderHardware = (
  storage: SessionStorageLike = window.sessionStorage,
): string | null => {
  const raw = storage.getItem(HANDOFF_KEY);
  storage.removeItem(HANDOFF_KEY);
  if (raw === null) {
    return null;
  }
  try {
    return handoffSchema.parse(JSON.parse(raw)).hardwareId;
  } catch {
    return null;
  }
};
