import type { NextConfig } from "next";

const API_BACKEND = process.env.API_INTERNAL_URL
  || process.env.NEXT_PUBLIC_CONDO_PY_API_URL
  || "http://localhost:7501";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BACKEND}/:path*`,
      },
      {
        source: "/api-proxy/:path*",
        destination: `${API_BACKEND}/:path*`,
      },
    ];
  },
};

export default nextConfig;
