import type { NextConfig } from "next";

const backendOrigin = (process.env["PC_LAB_BACKEND_ORIGIN"] ?? "http://127.0.0.1:8088").replace(
  /\/+$/,
  "",
);

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: "/assets/models/:path*",
        destination: `${backendOrigin}/assets/models/:path*`,
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
