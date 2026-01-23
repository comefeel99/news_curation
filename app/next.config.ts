import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // @ts-expect-error - instrumentationHook is not in ExperimentalConfig type but supported by Next.js
    // Trigger restart
    instrumentationHook: true,
  },
};

export default nextConfig;
