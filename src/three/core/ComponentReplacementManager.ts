import type { Group } from "three";

export type ReplacementSlot = "cpu" | "gpu";

export type ReplacementRequest = {
  readonly slot: ReplacementSlot;
  readonly assetId: string;
  readonly modelUrl: string;
};

export type ReplacementPhase =
  | "idle"
  | "preparing"
  | "loading"
  | "removing"
  | "installing"
  | "locked"
  | "failed";

export type ReplacementState = {
  readonly phase: ReplacementPhase;
  readonly slot?: ReplacementSlot;
  readonly assetId?: string;
  readonly message?: string;
};

export type ReplacementResult =
  | {
      readonly kind: "success";
      readonly slot: ReplacementSlot;
      readonly assetId: string;
      readonly model: Group;
    }
  | {
      readonly kind: "failure";
      readonly slot: ReplacementSlot;
      readonly assetId: string;
      readonly message: string;
    };

export interface ReplacementDependencies {
  readonly acquireCached: (assetId: string) => Group | undefined;
  readonly load: (assetId: string, modelUrl: string) => Promise<Group>;
  readonly removeCurrent: (slot: ReplacementSlot) => Promise<void>;
  readonly install: (slot: ReplacementSlot, model: Group) => Promise<void>;
  readonly commit: (request: ReplacementRequest, model: Group) => Promise<void>;
  readonly releaseCurrent: (slot: ReplacementSlot) => void;
}

type StateListener = (state: ReplacementState) => void;

export class ComponentReplacementManager {
  private active = false;
  private readonly dependencies: ReplacementDependencies;
  private readonly listener: StateListener | undefined;

  constructor(dependencies: ReplacementDependencies, listener?: StateListener) {
    this.dependencies = dependencies;
    this.listener = listener;
  }

  async replace(request: ReplacementRequest): Promise<ReplacementResult> {
    if (this.active) {
      return {
        kind: "failure",
        slot: request.slot,
        assetId: request.assetId,
        message: "Another component replacement is already running.",
      };
    }

    this.active = true;
    this.emit({
      phase: "preparing",
      slot: request.slot,
      assetId: request.assetId,
    });

    try {
      let nextModel = this.dependencies.acquireCached(request.assetId);
      if (nextModel === undefined) {
        this.emit({
          phase: "loading",
          slot: request.slot,
          assetId: request.assetId,
        });
        nextModel = await this.dependencies.load(request.assetId, request.modelUrl);
      }

      this.emit({
        phase: "removing",
        slot: request.slot,
        assetId: request.assetId,
      });
      await this.dependencies.removeCurrent(request.slot);

      this.emit({
        phase: "installing",
        slot: request.slot,
        assetId: request.assetId,
      });
      await this.dependencies.install(request.slot, nextModel);
      await this.dependencies.commit(request, nextModel);
      this.dependencies.releaseCurrent(request.slot);

      this.emit({
        phase: "locked",
        slot: request.slot,
        assetId: request.assetId,
      });

      return {
        kind: "success",
        slot: request.slot,
        assetId: request.assetId,
        model: nextModel,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Component replacement failed.";
      this.emit({
        phase: "failed",
        slot: request.slot,
        assetId: request.assetId,
        message,
      });
      return {
        kind: "failure",
        slot: request.slot,
        assetId: request.assetId,
        message,
      };
    } finally {
      this.active = false;
      this.emit({ phase: "idle" });
    }
  }

  private emit(state: ReplacementState): void {
    this.listener?.(state);
  }
}
