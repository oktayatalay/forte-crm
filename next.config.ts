import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Remove static export to enable API rewrites
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '',
  assetPrefix: '',
  // API rewrites for PHP backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: isDevelopment 
          ? 'https://corporate.forte.works/api/:path*'
          : '/api/:path*', // Production'da aynı domain üzerinde
      },
    ]
  },
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
