import { fetchUpcomingAnime } from '@/services/anilistService';
import { getCacheStats } from '@/services/cacheService';
import { FilterOptions } from './types';
import { Anime } from '@/types/anime';

/**
 * Extract unique genres from anime data
 */
export const extractGenres = (animeData: Anime[]): string[] => {
  const genres = new Set<string>();
  
  animeData.forEach(anime => {
    if (anime.genres && Array.isArray(anime.genres)) {
      anime.genres.forEach(genre => {
        if (genre) genres.add(genre);
      });
    }
  });
  
  return Array.from(genres).sort();
};

/**
 * Extract season information from anime data
 */
export const extractSeasonInfo = (animeData: Anime[]): { season: string; year: number } | null => {
  if (animeData.length === 0) return null;
  
  const firstAnime = animeData[0];
  if (firstAnime.season && firstAnime.seasonYear) {
    return {
      season: firstAnime.season,
      year: firstAnime.seasonYear
    };
  }
  
  return null;
};

/**
 * Fetch anime data from the API
 */
export const fetchAnimeData = async (
  page: number,
  perPage: number,
  filters: FilterOptions
) => {
  console.log('🔄 Fetching anime data for page:', page, 'with perPage:', perPage);
  console.log('🔍 Using filters:', JSON.stringify(filters, null, 2));
  
  // Log cache stats before fetching
  const cacheStats = getCacheStats();
  console.log('📊 Cache stats before fetch:', cacheStats);
  
  // Fetch data from API - only pass season and year
  console.log('📊 Calling fetchUpcomingAnime with season:', filters.season, 'year:', filters.year);
  const response = await fetchUpcomingAnime(
    page, 
    perPage, 
    filters.season,
    filters.year
  );
  
  return response;
}; 