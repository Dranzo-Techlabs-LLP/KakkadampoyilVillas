import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  // Explicitly opt lucide-react into barrel-import optimization. It is in
  // Next's default list, but being explicit removes any ambiguity and
  // lets us add other libs if their barrels start crashing the Turbopack
  // workers in development.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
