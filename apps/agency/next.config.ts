import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@impact/shared", "@impact/db", "@impact/engines"],
  async headers() {
    return [
      {
        source: "/login",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
      {
        source: "/signup",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
