import { AnimeSeason } from '@/types/anime';

/**
 * Get current anime season based on date
 * @returns Object containing current season and year
 */
export function getCurrentSeason(): { season: AnimeSeason; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const year = now.getFullYear();

  // Determine season based on month
  let season: AnimeSeason;
  if (month >= 3 && month <= 5) {
    season = AnimeSeason.SPRING;
  } else if (month >= 6 && month <= 8) {
    season = AnimeSeason.SUMMER;
  } else if (month >= 9 && month <= 11) {
    season = AnimeSeason.FALL;
  } else {
    season = AnimeSeason.WINTER;
  }

  return { season, year };
}

/**
 * Get the default upcoming season to show.
 *
 * We keep showing the current season until roughly halfway through it,
 * then switch to the following season. This avoids jumping too early,
 * e.g. showing Fall immediately when Summer begins.
 *
 * @returns Object containing default season and year
 */
export function getDefaultSeason(): { season: AnimeSeason; year: number } {
  const shiftedDate = new Date();
  shiftedDate.setMonth(shiftedDate.getMonth() - 2);

  const month = shiftedDate.getMonth() + 1; // JavaScript months are 0-indexed
  const year = shiftedDate.getFullYear();

  let season: AnimeSeason;
  if (month >= 3 && month <= 5) {
    season = AnimeSeason.SPRING;
  } else if (month >= 6 && month <= 8) {
    season = AnimeSeason.SUMMER;
  } else if (month >= 9 && month <= 11) {
    season = AnimeSeason.FALL;
  } else {
    season = AnimeSeason.WINTER;
  }

  let defaultSeason: AnimeSeason;
  let defaultYear = year;

  switch (season) {
    case AnimeSeason.WINTER:
      defaultSeason = AnimeSeason.SPRING;
      break;
    case AnimeSeason.SPRING:
      defaultSeason = AnimeSeason.SUMMER;
      break;
    case AnimeSeason.SUMMER:
      defaultSeason = AnimeSeason.FALL;
      break;
    case AnimeSeason.FALL:
      defaultSeason = AnimeSeason.WINTER;
      defaultYear = year + 1;
      break;
    default:
      defaultSeason = AnimeSeason.SPRING;
  }

  return { season: defaultSeason, year: defaultYear };
}

/**
 * Get next anime season after the current one
 * @returns Object containing next season and year
 */
export function getNextSeason(): { season: AnimeSeason; year: number } {
  return getDefaultSeason();
}

/**
 * Normalizes a username for AniList API requests by:
 * - Trimming whitespace
 * - Removing @ symbol if present
 * - Extracting username from a URL if pasted
 * - Removing trailing slash if present
 * 
 * @param username Raw username input from user
 * @returns Normalized username for API request
 */
export function normalizeUsername(username: string): string {
  let normalized = username.trim();
  
  // Remove @ if present
  if (normalized.startsWith('@')) {
    normalized = normalized.substring(1);
  }
  
  // Extract username if full URL was pasted
  if (normalized.includes('anilist.co/user/')) {
    const match = normalized.match(/anilist\.co\/user\/([^\/]+)/);
    if (match && match[1]) {
      normalized = match[1];
    }
  }
  
  // Remove trailing slash if present
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Get a proper embed URL for a video trailer
 * @param trailer Trailer object with ID and site
 * @param autoplay Whether to autoplay the video
 * @returns Properly formatted embed URL
 */
export const getTrailerEmbedUrl = (
  trailer: { id: string | null; site: string | null }, 
  autoplay: boolean = false
): string => {
  if (!trailer || !trailer.id || !trailer.site) {
    return '';
  }
  
  const { id, site } = trailer;
  const autoplayParam = autoplay ? '?autoplay=1&mute=0' : '';
  
  const siteLower = site.toLowerCase();
  
  if (siteLower === 'youtube') {
    return `https://www.youtube.com/embed/${id}${autoplayParam}`;
  } else if (siteLower === 'dailymotion') {
    return `https://www.dailymotion.com/embed/video/${id}${autoplayParam}`;
  } else if (siteLower === 'vimeo') {
    return `https://player.vimeo.com/video/${id}${autoplayParam ? autoplayParam : '?'}`;
  } else if (siteLower === 'bilibili') {
    return `https://player.bilibili.com/player.html?aid=${id}${autoplay ? '&autoplay=1' : ''}`;
  }
  
  return '';
}; 
