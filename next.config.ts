import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next.js 16 writes an AGENTS.md file during `next dev` by default; this project does not need it.
  agentRules: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80],
  },
};

export default nextConfig;
