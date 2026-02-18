import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Use project root so Next.js doesn't infer wrong root from parent lockfiles
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;
