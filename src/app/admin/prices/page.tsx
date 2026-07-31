import type { Metadata } from "next";
import { AdminPriceDashboard } from "@/features/price/admin/AdminPriceDashboard";

export const metadata: Metadata = {
  title: "价格情报控制台 | PC LAB 3D",
  description: "人工维护 PC LAB 3D 商品、平台报价与匹配关系。",
};

export default function AdminPricesPage() {
  return <AdminPriceDashboard />;
}
