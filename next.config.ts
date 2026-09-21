import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "0.0.0.0",
    "**.cursor.sh",
    "**.cursor.com",
    "**.cursorsandbox.com",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "same-origin" }],
      },
    ];
  },
};

export default nextConfig;
