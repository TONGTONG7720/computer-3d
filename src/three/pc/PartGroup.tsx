"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Group } from "three";
import { playExplodedAnimation } from "../animation/ExplodedAnimation";
import {
  createInstallationOptions,
  playInstallationAnimation,
  playRemovalAnimation,
} from "../animation/InstallationAnimation";
import { materialTokens } from "../materials/materialTokens";
import { disposeModelResources } from "../models/ModelLoader";
import { usePCPresentation } from "./PCPresentationContext";
import { getComponentSlot, type PCSlotId } from "./slots";

export const normalizeProceduralPart = (part: Group): Group => {
  part.position.set(0, 0, 0);
  part.rotation.set(0, 0, 0);
  part.scale.set(1, 1, 1);
  return part;
};

export const shouldTransitionPart = (
  currentAssetId: string,
  nextAssetId: string,
  animated: boolean,
): boolean => animated && currentAssetId !== nextAssetId;

type DisplayedPart = {
  readonly assetId: string;
  readonly object: Group;
};

export type PartGroupProps = {
  readonly animateReplacement?: boolean;
  readonly assetId: string;
  readonly object: Group;
  readonly selected: boolean;
  readonly slotId: PCSlotId;
};

const stopGroupAnimation = (group: Group): void => {
  gsap.killTweensOf(group.position);
  gsap.killTweensOf(group.rotation);
  gsap.killTweensOf(group.scale);
};

export function PartGroup({
  animateReplacement = false,
  assetId,
  object,
  selected,
  slotId,
}: PartGroupProps) {
  const { mode, onInstallationChange, reducedMotion } = usePCPresentation();
  const slot = getComponentSlot(slotId);
  const groupRef = useRef<Group>(null);
  const currentAssetRef = useRef(assetId);
  const transitionActiveRef = useRef(false);
  const [displayed, setDisplayed] = useState<DisplayedPart>({ assetId, object });
  const [pendingInstallation, setPendingInstallation] = useState<string | null>(null);
  displayed.object.userData["assetId"] = displayed.assetId;
  displayed.object.userData["slotId"] = slotId;

  const emitInstallation = useCallback(
    (active: boolean): void => {
      if (transitionActiveRef.current === active) {
        return;
      }
      transitionActiveRef.current = active;
      onInstallationChange?.(slotId, active);
    },
    [onInstallationChange, slotId],
  );

  useEffect(() => {
    if (currentAssetRef.current === assetId) {
      return;
    }
    const group = groupRef.current;
    if (group === null || !animateReplacement) {
      currentAssetRef.current = assetId;
      setDisplayed({ assetId, object });
      return;
    }

    let current = true;
    emitInstallation(true);
    void playRemovalAnimation(group, createInstallationOptions(slotId), reducedMotion).then(() => {
      if (!current) {
        return;
      }
      currentAssetRef.current = assetId;
      setDisplayed({ assetId, object });
      setPendingInstallation(assetId);
    });
    return () => {
      current = false;
      stopGroupAnimation(group);
      emitInstallation(false);
    };
  }, [animateReplacement, assetId, emitInstallation, object, reducedMotion, slotId]);

  useEffect(() => {
    const group = groupRef.current;
    if (group === null || pendingInstallation !== displayed.assetId) {
      return;
    }
    let current = true;
    void playInstallationAnimation(group, createInstallationOptions(slotId), reducedMotion).then(
      () => {
        if (!current) {
          return;
        }
        setPendingInstallation(null);
        emitInstallation(false);
      },
    );
    return () => {
      current = false;
      stopGroupAnimation(group);
    };
  }, [displayed.assetId, emitInstallation, pendingInstallation, reducedMotion, slotId]);

  useEffect(
    () => () => {
      disposeModelResources(displayed.object);
    },
    [displayed.object],
  );

  useEffect(() => {
    const group = groupRef.current;
    if (group === null || transitionActiveRef.current) {
      return;
    }
    playExplodedAnimation(group, slotId, mode === "exploded", reducedMotion);
  }, [mode, reducedMotion, slotId]);

  return (
    <group
      name={`SLOT_${slotId.toUpperCase()}`}
      position={slot.position}
      ref={groupRef}
      rotation={slot.rotation}
      scale={slot.scale}
      userData={{ assetId: displayed.assetId, slotId }}
    >
      <primitive dispose={null} object={displayed.object} />
      {selected ? <boxHelper args={[displayed.object, materialTokens.selected]} /> : null}
    </group>
  );
}
