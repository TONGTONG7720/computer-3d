import "@fontsource-variable/noto-sans-sc";
import "@fontsource-variable/space-grotesk";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PC LAB 3D",
  description: "Immersive real-time PC assembly engine.",
};

type RootLayoutProps = {
  readonly children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
