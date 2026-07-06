import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: bundles only the files needed to run, for a small Docker image.
  output: "standalone",
};

export default nextConfig;
