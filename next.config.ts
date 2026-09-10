import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: '/resources/servicelink-vs-detaildeck-2026',
        destination: '/resources/servicelink-vs-detaildeck',
        permanent: true,
      },
      {
        source: '/resources/servicelink-vs-urable-2026',
        destination: '/resources/servicelink-vs-urable',
        permanent: true,
      },
      {
        source: '/resources/how-much-to-charge-for-mobile-detailing-2026',
        destination: '/resources/how-much-to-charge-for-mobile-detailing',
        permanent: true,
      },
      {
        source: '/resources/how-to-start-a-mobile-detailing-business-2026',
        destination: '/resources/how-to-start-a-mobile-detailing-business',
        permanent: true,
      },
      {
        source: '/resources/servicelink-vs-detail-connect-vs-detailermade-2026',
        destination: '/resources/servicelink-vs-detail-connect-vs-detailermade',
        permanent: true,
      },
      {
        source:
          '/resources/how-mobile-detailers-get-clients-from-instagram-2026',
        destination:
          '/resources/how-mobile-detailers-get-clients-from-instagram',
        permanent: true,
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    qualities: [70, 75, 85, 90, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qailotbnrtwyzhbwufvk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'qailotbnrtwyzhbwufvk.supabase.co',
        port: '',
        pathname: '/storage/v1/render/image/public/**',
      },
    ],
  },
};

export default nextConfig;
