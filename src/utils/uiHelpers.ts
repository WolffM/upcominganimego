import { Anime } from '@/types/anime';
import { AnimeSeason } from '@/services/anilistService';

/**
 * Interface for loading state elements
 */
export interface LoadingState {
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

/**
 * Helper function to check if anime list is empty
 * @param animeList List of anime
 * @returns True if the list is empty
 */
export const isAnimeListEmpty = (animeList: Anime[]): boolean => {
  return animeList.length === 0;
};

/**
 * Helper function to count anime with trailers
 * @param animeList List of anime
 * @returns Number of anime with trailers
 */
export const countAnimeWithTrailers = (animeList: Anime[]): number => {
  return animeList.filter(anime => 
    anime.trailer && 
    anime.trailer.id && 
    anime.trailer.site === 'youtube'
  ).length;
};

/**
 * Format season title for display
 * @param season Season name or AnimeSeason enum
 * @param year Year number
 * @returns Formatted season title
 */
export const formatSeasonTitle = (season: string | AnimeSeason | null | undefined, year: number | null | undefined): string => {
  if (!season || !year) return 'Upcoming Anime';
  
  const capitalizedSeason = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
  return `${capitalizedSeason} ${year} Anime`;
}; 