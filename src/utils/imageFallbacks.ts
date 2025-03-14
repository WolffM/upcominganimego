import { logger } from './logger';

// Map of known anime series with fallback images for sequels
const KNOWN_SERIES_FALLBACKS: Record<string, string> = {
  // Format: 'normalized title': 'fallback image URL'
  'dandadan': 'https://animecorner.me/wp-content/uploads/2023/10/dan-da-dan-announces-season-2-for-july-2025-1.jpg',
  'dan da dan': 'https://animecorner.me/wp-content/uploads/2023/10/dan-da-dan-announces-season-2-for-july-2025-1.jpg',
  'attack on titan': 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
  'my hero academia': 'https://cdn.myanimelist.net/images/anime/10/78745.jpg',
  'demon slayer': 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
  'kimetsu no yaiba': 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
  'one punch man': 'https://cdn.myanimelist.net/images/anime/12/76049.jpg',
  'jujutsu kaisen': 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
  'spy x family': 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg',
  'chainsaw man': 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
  'mob psycho': 'https://cdn.myanimelist.net/images/anime/5/80308.jpg',
  're zero': 'https://cdn.myanimelist.net/images/anime/1522/128039.jpg',
};

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
 * Normalizes a title for comparison (lowercase, remove special chars)
 * @param title The title to normalize
 * @returns Normalized title
 */
function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

/**
 * Finds a fallback image URL for a sequel anime
 * @param title The anime title
 * @param animeId The anime ID for logging
 * @returns A fallback image URL or null if none found
 */
export async function findFallbackImage(title: string, animeId: number): Promise<string | null> {
  try {
    // Check if it's a sequel
    if (!isSequel(title)) {
      return null;
    }
    
    // Get the base title
    const baseTitle = getBaseTitle(title);
    const normalizedTitle = normalizeTitle(baseTitle);
    
    logger.info(`Looking for fallback image for sequel: ${baseTitle}`, 'imageFallbacks', { animeId });
    
    // Check our known fallbacks
    for (const [key, url] of Object.entries(KNOWN_SERIES_FALLBACKS)) {
      if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
        logger.info(`Found fallback image for ${baseTitle}`, 'imageFallbacks', { animeId });
        return url;
      }
    }
    
    // If we don't have a specific fallback, return null
    logger.info(`No fallback image found for ${baseTitle}`, 'imageFallbacks', { animeId });
    return null;
  } catch (error) {
    logger.error('Error finding fallback image', 'imageFallbacks', {
      animeId,
      title,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Gets a fallback image URL, with a default if none is found
 * @param title The anime title
 * @param animeId The anime ID for logging
 * @returns A fallback image URL, using the default if none is found
 */
export async function getFallbackImageUrl(title: string, animeId: number): Promise<string> {
  const fallback = await findFallbackImage(title, animeId);
  return fallback || '/images/no-image.jpg';
} 