import type { NextConfig } from 'next';

// The backend API. Server components call it directly; the browser reaches it
// through the rewrites below so the session cookie stays first-party.
const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Uploaded images are served by the API through the /uploads rewrite.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    localPatterns: [{ pathname: '/uploads/**' }],
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_URL}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
