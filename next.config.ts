import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Increase timeout for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Optimize for production
  output: 'standalone',
  // Pin the tracing root to THIS project dir. Without it, Next detects the
  // parent folder's stray lockfile and nests standalone output under BUILDER/,
  // which breaks the Docker image path. This also silences the lockfile warning.
  outputFileTracingRoot: __dirname,
  // Increase memory limit for large JSON processing
  serverExternalPackages: ['fs', 'path'],
  // Set empty turbopack config to silence Next.js 16 error (we're using webpack via --webpack flag)
  turbopack: {},
  // Webpack config - used when --webpack flag is passed in build script
  webpack: (config, { isServer }) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    // Add alias for excel-upload-tool
    config.resolve.alias['@excel-upload-tool'] = path.resolve(__dirname, './excel-upload-tool');
    return config;
  },
};

export default nextConfig;

