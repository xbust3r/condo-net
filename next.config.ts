import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_CONDO_PY_API_URL || "http://localhost:7501"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
