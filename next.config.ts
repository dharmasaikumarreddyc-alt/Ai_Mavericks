import type { NextConfig } from "next";

const configuredBackendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    // Multimodal uploads are compressed in-browser and revalidated at the
    // route boundary. Text-only agent routes retain a stricter proxy limit.
    proxyClientMaxBodySize: '768kb',
  },
  async rewrites() {
    // Keep browser traffic same-origin. This makes customer/merchant auth and
    // dashboard calls resilient to Cloud Run URL/CORS changes while the server
    // still talks to the configured FastAPI service over HTTPS.
    return [{
      source: '/backend/:path*',
      destination: `${configuredBackendUrl}/:path*`,
    }];
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), geolocation=(self), microphone=(self)' },
      ],
    }];
  },
};

export default nextConfig;
