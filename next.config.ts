import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.mingjyunhung.com',
        pathname: '/**',
      },
    ],
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Configure device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/i,
      type: 'asset/source', 
    })
    return config
  },
};

export default nextConfig;
