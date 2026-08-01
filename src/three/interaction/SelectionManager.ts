import type { PCSlotId } from "../pc/slots";

type SelectionListener = (selection: PCSlotId | null) => void;

export class SelectionManager {
  private selection: PCSlotId | null = null;
  private readonly listener: SelectionListener | undefined;

  constructor(listener?: SelectionListener) {
    this.listener = listener;
  }

  current(): PCSlotId | null {
    return this.selection;
  }

  select(slotId: PCSlotId): void {
    if (this.selection === slotId) {
      return;
    }
    this.selection = slotId;
    this.listener?.(slotId);
  }

  clear(): void {
    if (this.selection === null) {
      return;
    }
    this.selection = null;
    this.listener?.(null);
  }
}
