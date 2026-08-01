import type { Metadata } from "next";
import { BuilderWorkspace } from "@/features/builder/workspace/BuilderWorkspace";

export const metadata: Metadata = {
  title: "PC Builder · PC LAB 3D",
  description: "选择硬件并实时查看配置、性能、功耗与兼容状态。",
};

export default function BuilderPage() {
  return <BuilderWorkspace />;
}
