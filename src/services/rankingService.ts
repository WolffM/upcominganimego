import { Anime } from '@/types/anime';
import { rankAnimeByUserPreferences } from '@/services/userPreferencesService';
import { logger } from '@/utils/logger';

/**
 * Ranking service for anime
 * This service integrates user preferences to create personalized rankings
 */

// Weights for different ranking factors (to be adjusted)
const RANKING_WEIGHTS = {
  popularity: 0.35,
  genreRelevance: 0.15,
  studioScore: 0.20,
  directorScore: 0.15,
  genreScore: 0.10,
  ageRatingScore: 0.05,
};

// Popular genres that might get a boost in ranking
const TRENDING_GENRES = [
  'Action',
  'Fantasy',
  'Sci-Fi',
  'Romance',
  'Comedy',
  'Supernatural',
  'Drama',
  'Mystery',
  'Thriller',
];

/**
 * Calculate a ranking score for an anime based on various factors
 * @param anime The anime to rank
 * @returns The same anime with ranking information added
 */
export const calculateRankingScore = (anime: Anime): Anime => {
  try {
    // Create a copy of the anime to avoid mutating the original
    const rankedAnime = { ...anime };
    
    // Initialize ranking factors
    const rankingFactors = {
      popularity: 0,
      genreRelevance: 0,
      studioScore: rankedAnime.rankingFactors?.studioScore || 0,
      directorScore: rankedAnime.rankingFactors?.directorScore || 0,
      genreScore: rankedAnime.rankingFactors?.genreScore || 0,
      ageRatingScore: rankedAnime.rankingFactors?.ageRatingScore || 0,
    };
    
    // Calculate popularity score (0-10)
    if (anime.popularity) {
      // Normalize popularity to a 0-10 scale
      // This is a placeholder - we'll need to adjust the scaling based on actual data
      rankingFactors.popularity = Math.min(10, anime.popularity / 10000 * 10);
    }
    
    // Calculate genre relevance
    if (anime.genres && anime.genres.length > 0) {
      // Count how many trending genres this anime has
      const trendingGenreCount = anime.genres.filter(genre => 
        TRENDING_GENRES.includes(genre)
      ).length;
      
      // Calculate score based on percentage of trending genres
      rankingFactors.genreRelevance = Math.min(10, (trendingGenreCount / anime.genres.length) * 10);
    }
    
    // Calculate overall ranking score (0-10)
    const rankingScore = 
      rankingFactors.popularity * RANKING_WEIGHTS.popularity +
      rankingFactors.genreRelevance * RANKING_WEIGHTS.genreRelevance +
      rankingFactors.studioScore * RANKING_WEIGHTS.studioScore +
      rankingFactors.directorScore * RANKING_WEIGHTS.directorScore +
      rankingFactors.genreScore * RANKING_WEIGHTS.genreScore +
      rankingFactors.ageRatingScore * RANKING_WEIGHTS.ageRatingScore;
    
    // Add ranking information to the anime
    rankedAnime.rankingFactors = rankingFactors;
    rankedAnime.rankingScore = parseFloat(rankingScore.toFixed(2));
    
    return rankedAnime;
  } catch (error) {
    logger.error(`Error calculating ranking for anime ${anime.id}`, 'RankingService', error);
    return anime; // Return the original anime if there's an error
  }
};

/**
 * Rank a list of anime based on their calculated ranking scores
 * @param animeList The list of anime to rank
 * @returns The same list with ranking information added and sorted by rank
 */
export const rankAnimeList = async (animeList: Anime[]): Promise<Anime[]> => {
  try {
    logger.info(`Ranking ${animeList.length} anime`, 'RankingService');
    
    // First, apply user preferences to get user-specific rankings
    const userRankedList = await rankAnimeByUserPreferences(animeList);
    
    // Then, calculate general ranking scores for each anime
    const rankedList = userRankedList.map(calculateRankingScore);
    
    // Sort by ranking score (descending)
    rankedList.sort((a, b) => {
      const scoreA = a.rankingScore || 0;
      const scoreB = b.rankingScore || 0;
      return scoreB - scoreA;
    });
    
    // Assign ranks based on sorted position
    rankedList.forEach((anime, index) => {
      anime.rank = index + 1;
    });
    
    logger.info(`Successfully ranked ${rankedList.length} anime`, 'RankingService');
    
    return rankedList;
  } catch (error) {
    logger.error('Error ranking anime list', 'RankingService', error);
    return animeList; // Return the original list if there's an error
  }
}; 