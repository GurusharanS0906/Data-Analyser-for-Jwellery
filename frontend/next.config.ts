import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for a small production Docker image.
  // Harmless for Vercel (which ignores it and uses its own build output).
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
