/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static exports for GitHub Pages
  basePath: process.env.NODE_ENV === 'production' ? '/upcominganimego' : '', // Set the base path for GitHub Pages
  images: {
    unoptimized: true, // Required for static export
    domains: [
      // AniList CDN domains
      's4.anilist.co',
      'img.anili.st',
      
      // MyAnimeList CDNs
      'cdn.myanimelist.net',
      'api-cdn.myanimelist.net',
      'img.cdn.myanimelist.net',
      
      // Kitsu CDNs
      'media.kitsu.io',
      'kitsu.io',
      'static.kitsu.io',
      
      // Crunchyroll and Funimation CDNs
      'img1.ak.crunchyroll.com',
      'www.crunchyroll.com',
      'static.funimation.com',
      
      // TVDB and TMDB
      'artworks.thetvdb.com',
      'image.tmdb.org',
      'www.themoviedb.org',
      
      // General anime sites
      'animecorner.me',
      'anime-planet.com',
      'images.anime-planet.com',
      'otakumode.com',
      'cdn.otakumode.com',
      
      // WordPress and blog CDNs (commonly used by anime sites)
      'i0.wp.com',
      'i1.wp.com',
      'i2.wp.com',
      'i3.wp.com',
      'i4.wp.com',
      
      // Wiki and fandom sites
      'static.wikia.nocookie.net',
      'vignette.wikia.nocookie.net',
      'www.animenewsnetwork.com',
      
      // Additional common CDNs
      'images-na.ssl-images-amazon.com',
      'images-fe.ssl-images-amazon.com',
      'm.media-amazon.com',
      'assets.change.org',
      'res.cloudinary.com',
      'animecons.com',
      'cdn.animenewsnetwork.com',
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
      {
        protocol: 'https',
        hostname: '**.amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: '**.myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.wikia.nocookie.net',
      },
      {
        protocol: 'https',
        hostname: '**.anime-planet.com',
      },
    ],
  },
  experimental: {
    // Enable server actions if needed
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

module.exports = nextConfig; 