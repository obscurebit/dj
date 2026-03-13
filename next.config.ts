import type { NextConfig } from "next";
import { execSync } from "child_process";

let gitHash = "dev";
let gitHashFull = "";
try {
  gitHash = execSync("git rev-parse --short HEAD").toString().trim();
  gitHashFull = execSync("git rev-parse HEAD").toString().trim();
} catch { /* not in a git repo */ }

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://127.0.0.1:*", "http://localhost:*"],
  turbopack: {},
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GIT_HASH: gitHash,
    NEXT_PUBLIC_GIT_HASH_FULL: gitHashFull,
  },
};

export default nextConfig;
