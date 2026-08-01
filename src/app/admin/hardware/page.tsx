import type { Metadata } from "next";
import { HardwareAdminWorkspace } from "@/features/hardware/admin/HardwareAdminWorkspace";

export const metadata: Metadata = {
  title: "Hardware Operations · PC LAB 3D",
  description: "PC LAB 硬件、规格、性能、3D 模型与兼容规则管理。",
};

export default function AdminHardwarePage() {
  return <HardwareAdminWorkspace />;
}
