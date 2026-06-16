import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "https://educonnect-backend-production-d207.up.railway.app",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;