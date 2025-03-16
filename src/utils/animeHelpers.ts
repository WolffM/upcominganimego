import { Anime } from '@/types/anime';

/**
 * Gets the best available title for an anime
 * @param anime The anime object
 * @returns The best available title
 */
export const getBestTitle = (anime: Anime): string => {
  if (anime.title?.english) return anime.title.english;
  if (anime.title?.romaji) return anime.title.romaji;
  if (anime.title?.native) return anime.title.native;
  return 'Unknown Anime';
};

/**
 * Format date parts for display
 * @param dateParts Object containing year, month, day
 * @returns Formatted date string
 */
export const formatAnimeDate = (dateParts: {
  year: number | null | undefined;
  month: number | null | undefined;
  day: number | null | undefined;
}): string => {
  if (!dateParts.year) return 'TBA';

  // Create compatible date parts
  const year = dateParts.year;
  const month = dateParts.month || 1;
  const day = dateParts.day || 1;

  const date = new Date(year, month - 1, day);

  // Return year only if month is unknown
  if (!dateParts.month) return year.toString();

  // Return year and month if day is unknown
  if (!dateParts.day) {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  }

  // Return full date if all parts are available
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats an anime release date
 * @param anime The anime object
 * @returns Formatted release date string
 */
export const getAnimeReleaseDate = (anime: Anime): string => {
  if (!anime.startDate) return 'TBA';

  return formatAnimeDate({
    year: anime.startDate.year,
    month: anime.startDate.month,
    day: anime.startDate.day
  });
};

/**
 * Extracts a clean description by removing HTML tags
 * @param anime The anime object
 * @returns Clean description text
 */
export const getCleanDescription = (anime: Anime): string => {
  if (!anime.description) return 'No description available.';
  return anime.description.replace(/<[^>]*>/g, '');
};

/**
 * Gets the best available cover image URL
 * @param anime The anime object
 * @param fallbackUrl Optional fallback URL
 * @returns The best available image URL
 */
export const getBestImageUrl = (anime: Anime, fallbackUrl?: string): string => {
  const defaultFallback = '/images/no-image.jpg';

  if (anime.coverImage?.extraLarge) return anime.coverImage.extraLarge;
  if (anime.coverImage?.large) return anime.coverImage.large;
  if (anime.coverImage?.medium) return anime.coverImage.medium;

  return fallbackUrl || defaultFallback;
};

/**
 * Checks if an anime has a valid trailer
 * @param anime The anime object
 * @returns True if the anime has a valid trailer
 */
export const hasValidTrailer = (anime: Anime): boolean => {
  return !!(anime.trailer && anime.trailer.id && anime.trailer.site);
};

/**
 * Gets top genres from an anime (limited to a specified count)
 * @param anime The anime object
 * @param count Maximum number of genres to return
 * @returns Array of genre strings
 */
export const getTopGenres = (anime: Anime, count: number = 3): string[] => {
  if (!anime.genres || anime.genres.length === 0) return [];
  return anime.genres.slice(0, count);
}; 