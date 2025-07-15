import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Only use export for production builds
  ...(isDevelopment ? {} : { output: 'export' }),
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '',
  assetPrefix: '',
  // Development optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'apexcharts', 'react-apexcharts']
  }
}

export default nextConfig;
