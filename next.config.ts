import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Google Maps API key is exposed via NEXT_PUBLIC_ prefix convention.
  // No extra config needed — Next.js auto-inlines NEXT_PUBLIC_* env vars.
};

export default nextConfig;
