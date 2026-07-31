import { Group } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

type CacheStatus = "ready";

type CacheInspection = {
  readonly references: number;
  readonly status: CacheStatus;
};

type CacheEntry = {
  readonly template: Group;
  readonly dispose: () => void;
  references: number;
};

export class ModelCacheBusyError extends Error {
  readonly assetId: string;

  constructor(assetId: string) {
    super(`Cannot replace cached asset "${assetId}" while instances are active.`);
    this.name = "ModelCacheBusyError";
    this.assetId = assetId;
  }
}

export class ModelCacheCloneError extends Error {
  readonly assetId: string;

  constructor(assetId: string) {
    super(`Cached asset "${assetId}" did not clone to a Group.`);
    this.name = "ModelCacheCloneError";
    this.assetId = assetId;
  }
}

export class ModelCache {
  private readonly entries = new Map<string, CacheEntry>();

  store(assetId: string, template: Group, dispose: () => void): void {
    const current = this.entries.get(assetId);
    if (current !== undefined) {
      if (current.references > 0) {
        throw new ModelCacheBusyError(assetId);
      }
      current.dispose();
    }

    this.entries.set(assetId, {
      template,
      dispose,
      references: 0,
    });
  }

  has(assetId: string): boolean {
    return this.entries.has(assetId);
  }

  acquire(assetId: string): Group | undefined {
    const entry = this.entries.get(assetId);
    if (entry === undefined) {
      return undefined;
    }

    const instance = clone(entry.template);
    if (!(instance instanceof Group)) {
      throw new ModelCacheCloneError(assetId);
    }

    entry.references += 1;
    return instance;
  }

  release(assetId: string): boolean {
    const entry = this.entries.get(assetId);
    if (entry === undefined || entry.references === 0) {
      return false;
    }

    entry.references -= 1;
    return true;
  }

  inspect(assetId: string): CacheInspection | undefined {
    const entry = this.entries.get(assetId);
    if (entry === undefined) {
      return undefined;
    }

    return {
      references: entry.references,
      status: "ready",
    };
  }

  evict(assetId: string): boolean {
    const entry = this.entries.get(assetId);
    if (entry === undefined || entry.references > 0) {
      return false;
    }

    entry.dispose();
    this.entries.delete(assetId);
    return true;
  }

  clearUnused(): number {
    let evicted = 0;
    for (const assetId of this.entries.keys()) {
      if (this.evict(assetId)) {
        evicted += 1;
      }
    }
    return evicted;
  }
}
