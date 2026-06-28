import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@impact/shared", "@impact/db", "@impact/engines"],
};

export default nextConfig;
