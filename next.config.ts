import type { NextConfig } from "next";

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseAuthHelperOrigin = firebaseProjectId
  ? `https://${firebaseProjectId}.firebaseapp.com`
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
  async rewrites() {
    if (!firebaseAuthHelperOrigin) {
      return [];
    }

    return [
      {
        source: '/__/auth/:path*',
        destination: `${firebaseAuthHelperOrigin}/__/auth/:path*`,
      },
      {
        source: '/__/firebase/init.json',
        destination: '/api/firebase/init',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
