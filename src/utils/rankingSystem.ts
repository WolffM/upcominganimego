import { Anime } from '@/types/anime';
import { logger } from '@/utils/logger';

/**
 * Ranking factors that can be used to sort anime
 */
export enum RankingFactor {
  POPULARITY = 'popularity',
  SCORE = 'score',
  RELEASE_DATE = 'releaseDate',
  TRAILER_VIEWS = 'trailerViews',
  GENRE_RELEVANCE = 'genreRelevance',
  USER_PREFERENCE = 'userPreference',
  TRENDING = 'trending'
}

/**
 * Configuration for the ranking algorithm
 */
export interface RankingConfig {
  factors: {
    [key in RankingFactor]?: {
      weight: number;
      enabled: boolean;
    };
  };
  preferredGenres?: string[];
  excludedGenres?: string[];
}

/**
 * Default ranking configuration
 */
export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  factors: {
    [RankingFactor.POPULARITY]: { weight: 0.3, enabled: true },
    [RankingFactor.SCORE]: { weight: 0.2, enabled: true },
    [RankingFactor.RELEASE_DATE]: { weight: 0.2, enabled: true },
    [RankingFactor.TRAILER_VIEWS]: { weight: 0.1, enabled: false }, // Not implemented yet
    [RankingFactor.GENRE_RELEVANCE]: { weight: 0.1, enabled: false }, // Not implemented yet
    [RankingFactor.USER_PREFERENCE]: { weight: 0.1, enabled: false }, // Not implemented yet
    [RankingFactor.TRENDING]: { weight: 0.0, enabled: false } // Not implemented yet
  },
  preferredGenres: [],
  excludedGenres: []
};

/**
 * Calculate a score for an anime based on the ranking configuration
 * @param anime The anime to score
 * @param config The ranking configuration
 * @returns A score between 0 and 1
 */
export const calculateAnimeScore = (anime: Anime, config: RankingConfig = DEFAULT_RANKING_CONFIG): number => {
  let totalScore = 0;
  let totalWeight = 0;

  // Calculate score for each enabled factor
  Object.entries(config.factors).forEach(([factor, settings]) => {
    if (settings && settings.enabled) {
      const factorScore = calculateFactorScore(anime, factor as RankingFactor, config);
      totalScore += factorScore * settings.weight;
      totalWeight += settings.weight;
    }
  });

  // Normalize score
  return totalWeight > 0 ? totalScore / totalWeight : 0;
};

/**
 * Calculate a score for a specific ranking factor
 * @param anime The anime to score
 * @param factor The ranking factor
 * @param config The ranking configuration
 * @returns A score between 0 and 1
 */
const calculateFactorScore = (anime: Anime, factor: RankingFactor, config: RankingConfig): number => {
  switch (factor) {
    case RankingFactor.POPULARITY:
      return calculatePopularityScore(anime);
    case RankingFactor.SCORE:
      return calculateRatingScore(anime);
    case RankingFactor.RELEASE_DATE:
      return calculateReleaseDateScore(anime);
    case RankingFactor.GENRE_RELEVANCE:
      return calculateGenreRelevanceScore(anime, config.preferredGenres || []);
    // Placeholder for future implementation
    case RankingFactor.TRAILER_VIEWS:
    case RankingFactor.USER_PREFERENCE:
    case RankingFactor.TRENDING:
    default:
      return 0;
  }
};

/**
 * Calculate a score based on anime popularity
 * @param anime The anime to score
 * @returns A score between 0 and 1
 */
const calculatePopularityScore = (anime: Anime): number => {
  // Placeholder implementation
  // Assuming popularity is a number where higher is better
  // Normalize to a value between 0 and 1
  const popularity = anime.popularity || 0;
  
  // Arbitrary threshold for normalization - can be adjusted
  const maxPopularity = 50000;
  
  return Math.min(popularity / maxPopularity, 1);
};

/**
 * Calculate a score based on anime rating
 * @param anime The anime to score
 * @returns A score between 0 and 1
 */
const calculateRatingScore = (anime: Anime): number => {
  // Placeholder implementation
  // Assuming averageScore is a percentage (0-100)
  const score = anime.averageScore || 0;
  
  // Normalize to a value between 0 and 1
  return score / 100;
};

/**
 * Calculate a score based on release date
 * @param anime The anime to score
 * @returns A score between 0 and 1
 */
const calculateReleaseDateScore = (anime: Anime): number => {
  // Placeholder implementation
  // Newer anime get higher scores
  if (!anime.startDate || !anime.startDate.year) {
    return 0.5; // Default score for unknown dates
  }
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const animeYear = anime.startDate.year;
  const animeMonth = anime.startDate.month || 1;
  
  // Calculate months difference
  const monthsDiff = (currentYear - animeYear) * 12 + (currentMonth - animeMonth);
  
  // Anime releasing in the next 12 months get higher scores
  if (monthsDiff < 0 && monthsDiff > -12) {
    // Upcoming anime within a year get highest scores
    return 1 - Math.abs(monthsDiff) / 12;
  }
  
  // Anime that released in the last 6 months get medium-high scores
  if (monthsDiff >= 0 && monthsDiff <= 6) {
    return 0.7 - (monthsDiff / 6) * 0.2;
  }
  
  // Older anime get lower scores
  return Math.max(0.5 - (monthsDiff / 24) * 0.5, 0);
};

/**
 * Calculate a score based on genre relevance to preferred genres
 * @param anime The anime to score
 * @param preferredGenres List of preferred genres
 * @returns A score between 0 and 1
 */
const calculateGenreRelevanceScore = (anime: Anime, preferredGenres: string[]): number => {
  // Placeholder implementation
  if (!anime.genres || anime.genres.length === 0 || preferredGenres.length === 0) {
    return 0.5; // Default score
  }
  
  // Count how many preferred genres match
  const matchingGenres = anime.genres.filter(genre => 
    preferredGenres.includes(genre)
  ).length;
  
  // Calculate score based on percentage of matching genres
  return matchingGenres / Math.min(anime.genres.length, preferredGenres.length);
};

/**
 * Sort anime based on the ranking configuration
 * @param animeList List of anime to sort
 * @param config The ranking configuration
 * @returns Sorted list of anime
 */
export const rankAnimeList = (animeList: Anime[], config: RankingConfig = DEFAULT_RANKING_CONFIG): Anime[] => {
  logger.info('Ranking anime list', 'RankingSystem', { 
    animeCount: animeList.length,
    enabledFactors: Object.entries(config.factors)
      .filter(([_, settings]) => settings.enabled)
      .map(([factor]) => factor)
  });
  
  // Calculate scores for each anime
  const scoredAnime = animeList.map(anime => ({
    anime,
    score: calculateAnimeScore(anime, config)
  }));
  
  // Sort by score (descending)
  scoredAnime.sort((a, b) => b.score - a.score);
  
  // Return sorted anime list
  return scoredAnime.map(item => item.anime);
};

/**
 * Filter anime based on the ranking configuration
 * @param animeList List of anime to filter
 * @param config The ranking configuration
 * @returns Filtered list of anime
 */
export const filterAnimeList = (animeList: Anime[], config: RankingConfig = DEFAULT_RANKING_CONFIG): Anime[] => {
  // Filter out anime with excluded genres
  if (config.excludedGenres && config.excludedGenres.length > 0) {
    return animeList.filter(anime => {
      if (!anime.genres || anime.genres.length === 0) {
        return true;
      }
      
      // Check if any of the anime's genres are in the excluded list
      return !anime.genres.some(genre => 
        config.excludedGenres!.includes(genre)
      );
    });
  }
  
  return animeList;
}; 