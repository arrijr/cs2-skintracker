/** @type {import('next').NextConfig} */

// {/* Proxy API to backend via rewrites */}
// trim() guards against accidental whitespace/tabs in Vercel env var paste
const API_BASE = (process.env.NEXT_PUBLIC_API_ORIGIN || "https://cs2-skintracker-dev.onrender.com").trim();

const nextConfig = {
  // {/* Keep builds unblocked (you already had this) */}
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // {/* Enable source maps for debugging */}
  productionBrowserSourceMaps: true,
  reactStrictMode: true,

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
      { protocol: "https", hostname: "community.akamai.steamstatic.com" },
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com" },
      { protocol: "https", hostname: "steamcdn-a.akamaihd.net" },
      { protocol: "https", hostname: "steamuserimages-a.akamaihd.net" },
      { protocol: "https", hostname: "steamcommunity-a.akamaihd.net" },
      { protocol: "https", hostname: "economy.cloudflare.steamstatic.com" },
    ],
  },
};

module.exports = nextConfig;
