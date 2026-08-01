import gsap from "gsap";
import { type Group, Mesh, type MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import type { Vector3Tuple } from "../models/modelManifest";
import { getComponentSlot, type PCSlotId } from "../pc/slots";

export const installationPhases = [
  "waiting",
  "floating",
  "moving",
  "rotating",
  "inserting",
  "locked",
  "glowing",
] as const;

export type InstallationPhase = (typeof installationPhases)[number];

export type InstallationOptions = {
  readonly assembledPosition: Vector3Tuple;
  readonly assembledRotation: Vector3Tuple;
  readonly entryOffset: Vector3Tuple;
  readonly durationMs: number;
};

export type InstallationPlan = {
  readonly start: {
    readonly position: Vector3Tuple;
    readonly rotation: Vector3Tuple;
  };
  readonly end: {
    readonly position: Vector3Tuple;
    readonly rotation: Vector3Tuple;
  };
  readonly durationMs: number;
  readonly ease: "power3.out";
};

type InstallationListener = (phase: InstallationPhase) => void;

const installationDurations = {
  pc_case: 1200,
  motherboard: 1300,
  cpu_socket: 980,
  gpu_slot: 1200,
  ram_slots: 960,
  storage_slots: 900,
  cooling_mount: 1150,
  fan_mount: 900,
  psu_area: 1050,
} as const satisfies Readonly<Record<PCSlotId, number>>;

export const createInstallationOptions = (slotId: PCSlotId): InstallationOptions => {
  const slot = getComponentSlot(slotId);
  return {
    assembledPosition: slot.position,
    assembledRotation: slot.rotation,
    entryOffset: slot.installEntry,
    durationMs: installationDurations[slotId],
  };
};

export const createInstallationPlan = (options: InstallationOptions): InstallationPlan => ({
  start: {
    position: [
      options.assembledPosition[0] + options.entryOffset[0],
      options.assembledPosition[1] + options.entryOffset[1],
      options.assembledPosition[2] + options.entryOffset[2],
    ],
    rotation: [
      options.assembledRotation[0] + 0.18,
      options.assembledRotation[1] - 0.28,
      options.assembledRotation[2] + 0.12,
    ],
  },
  end: {
    position: options.assembledPosition,
    rotation: options.assembledRotation,
  },
  durationMs: options.durationMs,
  ease: "power3.out",
});

const getEmissiveMaterials = (
  root: Group,
): readonly (MeshStandardMaterial | MeshPhysicalMaterial)[] => {
  const materials: (MeshStandardMaterial | MeshPhysicalMaterial)[] = [];
  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of meshMaterials) {
      if (material instanceof MeshStandardMaterial) {
        materials.push(material);
      }
    }
  });
  return materials;
};

export const playInstallationAnimation = (
  object: Group,
  options: InstallationOptions,
  reducedMotion: boolean,
  listener?: InstallationListener,
): Promise<void> => {
  const plan = createInstallationPlan(options);
  listener?.("waiting");

  if (reducedMotion) {
    object.position.set(...plan.end.position);
    object.rotation.set(...plan.end.rotation);
    listener?.("locked");
    listener?.("glowing");
    return Promise.resolve();
  }

  object.position.set(...plan.start.position);
  object.rotation.set(...plan.start.rotation);
  const totalSeconds = plan.durationMs / 1000;
  const materials = getEmissiveMaterials(object);

  return new Promise((resolve) => {
    const timeline = gsap.timeline({
      defaults: { ease: plan.ease },
      onComplete: resolve,
    });

    timeline
      .call(() => listener?.("floating"))
      .to(object.position, {
        y: plan.start.position[1] + 0.18,
        duration: totalSeconds * 0.12,
      })
      .call(() => listener?.("moving"))
      .to(object.position, {
        x: plan.end.position[0] + options.entryOffset[0] * 0.24,
        y: plan.end.position[1] + 0.12,
        z: plan.end.position[2] + options.entryOffset[2] * 0.24,
        duration: totalSeconds * 0.3,
      })
      .call(() => listener?.("rotating"))
      .to(
        object.rotation,
        {
          x: plan.end.rotation[0],
          y: plan.end.rotation[1],
          z: plan.end.rotation[2],
          duration: totalSeconds * 0.2,
        },
        "<",
      )
      .call(() => listener?.("inserting"))
      .to(object.position, {
        x: plan.end.position[0],
        y: plan.end.position[1],
        z: plan.end.position[2],
        duration: totalSeconds * 0.28,
      })
      .call(() => listener?.("locked"))
      .to(object.scale, {
        x: 1.025,
        y: 1.025,
        z: 1.025,
        duration: totalSeconds * 0.05,
        yoyo: true,
        repeat: 1,
      })
      .call(() => {
        listener?.("glowing");
        for (const material of materials) {
          gsap.fromTo(
            material,
            { emissiveIntensity: material.emissiveIntensity + 0.9 },
            {
              emissiveIntensity: material.emissiveIntensity,
              duration: totalSeconds * 0.18,
              ease: "power2.out",
            },
          );
        }
      });
  });
};

export const playRemovalAnimation = (
  object: Group,
  options: InstallationOptions,
  reducedMotion: boolean,
): Promise<void> => {
  const endPosition: Vector3Tuple = [
    options.assembledPosition[0] + options.entryOffset[0] * 0.72,
    options.assembledPosition[1] + options.entryOffset[1] * 0.72 + 0.12,
    options.assembledPosition[2] + options.entryOffset[2] * 0.72,
  ];
  const endRotation: Vector3Tuple = [
    options.assembledRotation[0] + 0.1,
    options.assembledRotation[1] - 0.2,
    options.assembledRotation[2] + 0.08,
  ];

  gsap.killTweensOf(object.position);
  gsap.killTweensOf(object.rotation);

  if (reducedMotion) {
    object.position.set(...endPosition);
    object.rotation.set(...endRotation);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: resolve,
    });
    timeline
      .to(object.scale, {
        x: 1.018,
        y: 1.018,
        z: 1.018,
        duration: 0.08,
      })
      .to(
        object.position,
        {
          x: endPosition[0],
          y: endPosition[1],
          z: endPosition[2],
          duration: 0.46,
        },
        "<",
      )
      .to(
        object.rotation,
        {
          x: endRotation[0],
          y: endRotation[1],
          z: endRotation[2],
          duration: 0.46,
        },
        "<",
      );
  });
};
