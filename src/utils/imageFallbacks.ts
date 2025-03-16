import { Anime } from '@/types/anime';

// Generic anime placeholder image URLs that can be used as fallbacks
// These are relatively stable external URLs from various CDNs
const GENERIC_FALLBACKS = [
  // Season-specific placeholders
  'https://cdn.myanimelist.net/images/anime/1085/114792.jpg', // Spring placeholder
  'https://cdn.myanimelist.net/images/anime/1259/110227.jpg', // Summer placeholder
  'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', // Fall placeholder
  'https://cdn.myanimelist.net/images/anime/1375/121599.jpg', // Winter placeholder
  
  // Generic anime placeholders
  'https://res.cloudinary.com/practicaldev/image/fetch/s--SjOwR6_7--/c_imagga_scale,f_auto,fl_progressive,h_900,q_auto,w_1600/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/16asjf9nmq5911jzr7r8.png',
  'https://artworks.thetvdb.com/banners/movies/3489/posters/3489.jpg',
  'https://www.themoviedb.org/t/p/original/8eoLjNAcAYuJK9oO84PqfgbWTNJ.jpg',
];

/**
 * Checks if a title appears to be a sequel based on common patterns
 * @param title The anime title to check
 * @returns True if the title appears to be a sequel
 */
export function isSequel(title: string): boolean {
  // Check for common sequel indicators in the title
  return /season\s+[0-9]+|part\s+[0-9]+|\s+[0-9]+$|\s+[IVXLCDM]+$|2nd|3rd|4th|5th|second|third|fourth|fifth/i.test(title);
}

/**
 * Extracts the base title by removing sequel indicators
 * @param title The full anime title
 * @returns The base title without sequel indicators
 */
export function getBaseTitle(title: string): string {
  // Remove season/part indicators
  return title.replace(/\s+season\s+[0-9]+|\s+part\s+[0-9]+|\s+[0-9]+$|\s+[IVXLCDM]+$|\s+2nd|\s+3rd|\s+4th|\s+5th|\s+second|\s+third|\s+fourth|\s+fifth/i, '');
}

/**
 * Generates a fallback image URL using Jikan API (MyAnimeList)
 * @param searchTitle Title to search for
 * @returns A fallback image URL or null if none found
 */
async function getJikanFallback(searchTitle: string): Promise<string | null> {
  try {
    // Use Jikan API to search for the anime
    const encodedTitle = encodeURIComponent(searchTitle);
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodedTitle}&limit=1`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0 && data.data[0].images?.jpg?.image_url) {
      return data.data[0].images.jpg.image_url;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching from Jikan API:", error);
    return null;
  }
}

/**
 * Gets a season-appropriate generic fallback
 * @param anime The anime object with season information
 * @returns A season-appropriate fallback image URL
 */
function getSeasonalFallback(anime: Anime): string {
  // Default to the first fallback
  let fallbackIndex = 0;
  
  // If there's season information, use a season-specific fallback
  if (anime.season) {
    switch (anime.season.toLowerCase()) {
      case 'spring':
        fallbackIndex = 0;
        break;
      case 'summer':
        fallbackIndex = 1;
        break;
      case 'fall':
        fallbackIndex = 2;
        break;
      case 'winter':
        fallbackIndex = 3;
        break;
    }
  }
  
  return GENERIC_FALLBACKS[fallbackIndex] || GENERIC_FALLBACKS[0];
}

/**
 * Finds a fallback image URL for an anime
 * @param anime The anime object with title and other metadata
 * @returns A fallback image URL
 */
export async function getFallbackImageUrl(anime: Anime): Promise<string> {
  try {
    const title = anime.title?.english || anime.title?.romaji || anime.title?.native || '';
    
    // Try multiple fallback strategies in order
    
    // 1. Try searching via Jikan API
    const jikanFallback = await getJikanFallback(title);
    if (jikanFallback) return jikanFallback;
    
    // 2. If it's a sequel, try to search for the base title
    if (isSequel(title)) {
      const baseTitle = getBaseTitle(title);
      const baseTitleFallback = await getJikanFallback(baseTitle);
      if (baseTitleFallback) return baseTitleFallback;
    }
    
    // 3. Use a season-appropriate generic fallback
    return getSeasonalFallback(anime);
  } catch (error) {
    console.error("Error getting fallback image:", error);
    
    // Last resort fallback
    return '/images/no-image.jpg';
  }
} 
