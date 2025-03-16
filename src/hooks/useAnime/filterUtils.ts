import { Anime, SortOption } from '@/types/anime';
import { FilterOptions } from './types';

/**
 * Sort anime list based on sort option
 */
export const sortAnimeList = (option: SortOption | string, animeList: Anime[]): Anime[] => {
  // Create a copy to avoid mutating the original
  const sortedList = [...animeList];
  
  // For debugging sorting issues
  console.log(`🔢 Sorting anime list with option: ${option}`);
  
  // Handle standard sort options
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
      
    case SortOption.COMBINED_PREFERENCE:
      // Sort by combined preference score (descending)
      console.log("🔄 Sorting by COMBINED_PREFERENCE");
      
      // Verify the first few anime have proper scores for debugging
      if (sortedList.length > 0) {
        console.log("🧐 Sample anime combined scores:");
        sortedList.slice(0, 3).forEach(anime => {
          const title = anime.title?.english || anime.title?.romaji || anime.id;
          const score = anime.preferenceScores?.combined?.score;
          console.log(`  - ${title}: ${score} (${typeof score})`);
        });
      }
      
      return sortedList.sort((a, b) => {
        const scoreA = a.preferenceScores?.combined?.score !== undefined ? Number(a.preferenceScores.combined.score) : -Infinity;
        const scoreB = b.preferenceScores?.combined?.score !== undefined ? Number(b.preferenceScores.combined.score) : -Infinity;
        
        // Debug log for sorting issues
        if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
          console.log(`Comparing: ${a.title?.english || a.title?.romaji} (${scoreA}) vs ${b.title?.english || b.title?.romaji} (${scoreB})`);
        }
        
        return scoreB - scoreA;
      });
      
    default:
      // Check if this is a user-specific preference sort
      if (typeof option === 'string' && option.startsWith(SortOption.USER_PREFERENCE_PREFIX)) {
        // Extract the username from the sort option
        const username = option.substring(SortOption.USER_PREFERENCE_PREFIX.length);
        console.log(`🔄 Sorting by user preference for: "${username}"`);
        
        // Log the first few anime user scores for debugging
        if (sortedList.length > 0) {
          console.log("🧐 Sample anime user scores:");
          const sampleAnime = sortedList.slice(0, 3);
          
          sampleAnime.forEach(anime => {
            const title = anime.title?.english || anime.title?.romaji || anime.id;
            
            // Check if preferenceScores and users exist
            if (!anime.preferenceScores?.users) {
              console.log(`  - ${title}: No preference scores or users array`);
              return;
            }
            
            // Log all users for this anime to check what's available
            const users = anime.preferenceScores.users.map(u => `${u.username}:${u.score}`).join(', ');
            console.log(`  - ${title}: Users = [${users}]`);
            
            // Try to find the specific user score
            const userScore = anime.preferenceScores.users.find(u => 
              u.username && username && 
              u.username.toLowerCase() === username.toLowerCase()
            );
            
            console.log(`    Looking for "${username}" - Found: ${userScore ? `${userScore.username}:${userScore.score}` : 'Not found'}`);
          });
        }
        
        // Sort by this specific user's preference score
        return sortedList.sort((a, b) => {
          // Find the user's score for each anime
          const getUserScore = (anime: Anime): number => {
            if (!anime.preferenceScores?.users || !anime.preferenceScores.users.length) {
              return -Infinity;
            }
            
            // Find user by username - case insensitive comparison
            const userScore = anime.preferenceScores.users.find(u => 
              u.username && username && 
              u.username.toLowerCase() === username.toLowerCase()
            );
            
            // Convert to number or use -Infinity if not found
            return userScore?.score !== undefined ? Number(userScore.score) : -Infinity;
          };
          
          const scoreA = getUserScore(a);
          const scoreB = getUserScore(b);
          
          // Debug log for sorting issues
          if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
            console.log(`Comparing for ${username}: ${a.title?.english || a.title?.romaji} (${scoreA}) vs ${b.title?.english || b.title?.romaji} (${scoreB})`);
          }
          
          return scoreB - scoreA;
        });
      }
      
      // Fallback to default sort (by popularity)
      console.log(`⚠️ Unrecognized sort option: ${option}, falling back to popularity sort`);
      return sortedList.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
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
  sortOption: SortOption | string
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