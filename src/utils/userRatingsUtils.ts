import { UserRatingsResponse, RatingStats, Anime } from '@/types/anime';

export type { RatingStats };

/**
 * Calculate statistics from user ratings data
 * @param ratingsData The user ratings response from AniList API
 * @returns A RatingStats object with various statistics
 */
export function calculateRatingStats(ratingsData: UserRatingsResponse): RatingStats {
  const mediaList = ratingsData.data.Page.mediaList;
  
  if (!mediaList.length) {
    return {
      count: 0,
      averageScore: 0,
      highestRated: null,
      lowestRated: null,
      preferredGenres: []
    };
  }
  
  // Calculate average score
  const totalScore = mediaList.reduce((sum, item) => sum + item.score, 0);
  const averageScore = totalScore / mediaList.length;
  
  // Find highest and lowest rated anime
  let highestRated = { anime: mediaList[0].media, score: mediaList[0].score };
  let lowestRated = { anime: mediaList[0].media, score: mediaList[0].score };
  
  mediaList.forEach(item => {
    if (item.score > highestRated.score) {
      highestRated = { anime: item.media, score: item.score };
    }
    if (item.score < lowestRated.score) {
      lowestRated = { anime: item.media, score: item.score };
    }
  });
  
  // Count genres
  const genreCount: Record<string, number> = {};
  let totalGenreInstances = 0;
  
  mediaList.forEach(item => {
    if (item.media.genres) {
      item.media.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
        totalGenreInstances++;
      });
    }
  });
  
  // Calculate preferred genres with percentages
  const preferredGenres = Object.entries(genreCount)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: (count / totalGenreInstances) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    count: mediaList.length,
    averageScore,
    highestRated: highestRated.score > 0 ? highestRated : null,
    lowestRated: lowestRated.score > 0 ? lowestRated : null,
    preferredGenres
  };
}

/**
 * Find anime genres that the user prefers based on their ratings
 * @param ratingsData User ratings from AniList API
 * @returns Array of preferred genres sorted by relevance
 */
export function getPreferredGenres(ratingsData: UserRatingsResponse): string[] {
  const stats = calculateRatingStats(ratingsData);
  
  // Return sorted genres (keys only)
  return stats.preferredGenres.map(item => item.genre);
}

/**
 * Format a rating stats object into a human-readable text summary
 * @param stats Rating statistics to format
 * @returns A string with a summary of the stats
 */
export function formatRatingStatsSummary(stats: RatingStats): string {
  if (stats.count === 0) {
    return "No ratings found";
  }
  
  const topGenresText = stats.preferredGenres
    .map(g => `${g.genre} (${g.count})`)
    .join(', ');
    
  const highestRatedText = stats.highestRated 
    ? `Highest rated: ${stats.highestRated.anime.title.english || stats.highestRated.anime.title.romaji} (${stats.highestRated.score})`
    : "";
    
  return `Total ratings: ${stats.count}, Average score: ${stats.averageScore.toFixed(1)}, ${highestRatedText}, Top genres: ${topGenresText}`;
} 