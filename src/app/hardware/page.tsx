import type { Metadata } from "next";
import { Suspense } from "react";
import { HardwareExplorer } from "@/features/hardware/explorer/HardwareExplorer";

export const metadata: Metadata = {
  title: "Hardware Explorer · PC LAB 3D",
  description: "浏览 PC LAB 硬件规格、性能、功耗、兼容与 3D 模型数据。",
};

export default function HardwarePage() {
  return (
    <Suspense fallback={null}>
      <HardwareExplorer />
    </Suspense>
  );
}
