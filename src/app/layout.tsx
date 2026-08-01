import "@fontsource-variable/noto-sans-sc";
import "@fontsource-variable/space-grotesk";
import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import "../styles/tokens.css";
import "../styles/v3-base.css";

export const metadata: Metadata = {
  title: "PC LAB 3D",
  description: "专业级 3D 电脑设计工作台。",
};

type RootLayoutProps = {
  readonly children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const enableDevTools =
    process.env.NODE_ENV === "development" &&
    process.env["NEXT_PUBLIC_DISABLE_REACT_DEVTOOLS"] !== "1";

  return (
    <html lang="zh-CN">
      <head>
        {enableDevTools && (
          <>
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
            />
            <Script
              src="//unpkg.com/react-scan/dist/auto.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
            />
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
