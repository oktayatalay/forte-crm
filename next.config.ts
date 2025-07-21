import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  output: 'export', // cPanel hosting için static export geri getir
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '',
  assetPrefix: '',
  // Development optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'apexcharts', 'react-apexcharts']
  },
  webpack: (config: any) => {
    // Handle SVG imports as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
}

export default nextConfig;
