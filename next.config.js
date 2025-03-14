/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // AniList CDN domains
      's4.anilist.co',
      'img.anili.st',
      'media.kitsu.io',
      'cdn.myanimelist.net',
      'animecorner.me',
      'i0.wp.com',
      'i1.wp.com',
      'i2.wp.com',
      'static.wikia.nocookie.net',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.anilist.co',
      },
      {
        protocol: 'https',
        hostname: '**.animecorner.me',
      },
      {
        protocol: 'https',
        hostname: '**.wp.com',
      },
    ],
  },
  experimental: {
    // Enable server actions if needed
    serverActions: true,
  },
};

module.exports = nextConfig; 