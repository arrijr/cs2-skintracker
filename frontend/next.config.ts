/** @type {import('next').NextConfig} */

// {/* Proxy API to backend via rewrites */}
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

const nextConfig = {
  // {/* Keep builds unblocked (you already had this) */}
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // {/* API proxy: all /api/* calls go to backend */}
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/api/:path*`,
      },
    ];
  },

  // {/* Allow remote images from Steam CDNs (if you use next/image) */}
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "media.steampowered.com" },
      { protocol: "https", hostname: "community.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "steamcdn-a.akamaihd.net" },
      { protocol: "https", hostname: "steamuserimages-a.akamaihd.net" },
      { protocol: "https", hostname: "steamcommunity-a.akamaihd.net" },
      { protocol: "https", hostname: "economy.cloudflare.steamstatic.com" },
    ],
  },
};

module.exports = nextConfig;
