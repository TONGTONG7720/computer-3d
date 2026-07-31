import type { Metadata } from "next";
import { AiAdminWorkspace } from "@/features/ai/admin/AiAdminWorkspace";

export const metadata: Metadata = {
  title: "AI 控制平面 | PC LAB 3D",
  description: "管理 PC LAB 3D 的提示词、硬件知识、推荐规则与隐私化日志。",
};

export default function AdminAiPage() {
  return <AiAdminWorkspace />;
}
