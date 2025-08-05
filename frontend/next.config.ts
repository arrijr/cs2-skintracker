/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "community.akamai.steamstatic.com",
      // Hier kannst du weitere erlaubte Domains eintragen
    ],
  },
};

module.exports = nextConfig;