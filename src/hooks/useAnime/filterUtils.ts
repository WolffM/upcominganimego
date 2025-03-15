import { Anime, SortOption } from '@/types/anime';
import { FilterOptions } from './types';

/**
 * Sort anime list based on sort option
 */
export const sortAnimeList = (option: SortOption, animeList: Anime[]): Anime[] => {
  // Create a copy to avoid mutating the original
  const sortedList = [...animeList];
  
  switch (option) {
    case SortOption.POPULARITY:
      // Sort by popularity (descending)
      return sortedList.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      
    case SortOption.RELEASE_DATE:
      // Sort by release date (ascending)
      return sortedList.sort((a, b) => {
        // Handle null dates by treating them as far in the future
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        
        // Handle null values in the date parts
        const yearA = a.startDate.year || 9999;
        const monthA = a.startDate.month || 1;
        const dayA = a.startDate.day || 1;
        
        const yearB = b.startDate.year || 9999;
        const monthB = b.startDate.month || 1;
        const dayB = b.startDate.day || 1;
        
        // Create date objects with the non-null values
        const dateA = new Date(yearA, monthA - 1, dayA).getTime();
        const dateB = new Date(yearB, monthB - 1, dayB).getTime();
        
        return dateA - dateB;
      });
      
    default:
      return sortedList;
  }
};

/**
 * Apply genre filter to anime list
 */
export const applyGenreFilter = (animeList: Anime[], genre: string | null): Anime[] => {
  if (!genre) return animeList;
  
  console.log('🔍 Applying client-side genre filter:', genre);
  return animeList.filter(anime => 
    anime.genres && anime.genres.includes(genre)
  );
};

/**
 * Apply format filter to anime list
 */
export const applyFormatFilter = (animeList: Anime[], format: string | null): Anime[] => {
  if (!format) return animeList;
  
  console.log('🔍 Applying client-side format filter:', format);
  return animeList.filter(anime => anime.format === format);
};

/**
 * Apply search query filter to anime list
 */
export const applySearchFilter = (animeList: Anime[], searchQuery: string): Anime[] => {
  if (!searchQuery.trim()) return animeList;
  
  const query = searchQuery.toLowerCase().trim();
  return animeList.filter(anime => {
    // Search in title
    const titleMatch = 
      (anime.title.english && anime.title.english.toLowerCase().includes(query)) ||
      (anime.title.romaji && anime.title.romaji.toLowerCase().includes(query)) ||
      (anime.title.native && anime.title.native.toLowerCase().includes(query));
    
    // Search in description
    const descriptionMatch = 
      anime.description && anime.description.toLowerCase().includes(query);
    
    return titleMatch || descriptionMatch;
  });
};

/**
 * Apply all client-side filters to anime list
 */
export const applyAllFilters = (
  animeList: Anime[], 
  filters: FilterOptions, 
  sortOption: SortOption
): Anime[] => {
  // First sort the list
  let result = sortAnimeList(sortOption, animeList);
  
  // Apply genre filter
  result = applyGenreFilter(result, filters.genre);
  
  // Apply format filter
  result = applyFormatFilter(result, filters.format);
  
  // Apply search filter
  result = applySearchFilter(result, filters.searchQuery);
  
  return result;
}; 