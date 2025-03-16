import { Anime } from '@/types/anime';
import { UserPreferences } from './userRatingsUtils';

/**
 * Interface for preference scoring results on an anime
 */
export interface AnimePreferenceScore {
  username: string;
  score: number;        // Combined score (preference + popularity)
  breakdown: {
    genre: number;
    studio: number;
    director: number;
    tags: number;
    popularity: number;
  };
}

/**
 * Calculate a popularity score on a logarithmic scale capped at 100
 * @param anime The anime to calculate the score for
 * @returns A score between 0 and 100
 */
export function calculatePopularityScore(anime: Anime): number {
  if (!anime.popularity) return 0;
  
  // Use logarithmic scale to prevent super popular anime from completely dominating
  // ln(x+1) gives a nice curve that grows quickly at first, then more slowly
  // We multiply by a factor to get a reasonable range
  const baseScore = Math.log(anime.popularity + 1) * 8;
  
  // Cap at 100
  return Math.min(Math.round(baseScore), 100);
}

/**
 * Calculate preference score for an anime based on user preferences
 * @param anime The anime to calculate the score for
 * @param userPreferences The user's preference data
 * @param username The username this score is for
 * @param popularityScore Optional normalized popularity score to include in total
 * @returns An AnimePreferenceScore object with the total score and breakdown
 */
export function calculateAnimePreferenceScore(
  anime: Anime,
  userPreferences: UserPreferences,
  username: string,
  popularityScore: number = 0
): AnimePreferenceScore {
  // Initialize score components
  let genreScore = 0;
  let studioScore = 0;
  let directorScore = 0;
  let tagScore = 0;
  
  // For debugging - collect items with their normalized scores
  const usedScores = {
    genres: [] as {name: string, score: number}[],
    studios: [] as {name: string, score: number}[],
    directors: [] as {name: string, score: number}[],
    tags: [] as {name: string, score: number}[]
  };
  
  // Calculate genre score
  if (anime.genres && anime.genres.length > 0) {
    // For each genre, find if user has a preference for it
    anime.genres.forEach(genre => {
      const preference = userPreferences.genres.find(p => p.name === genre);
      if (preference && preference.normalizedScore !== undefined) {
        genreScore += Number(preference.normalizedScore);
        usedScores.genres.push({name: genre, score: Number(preference.normalizedScore)});
      }
    });
    
    // Average the genre score if there are multiple genres
    genreScore = genreScore / anime.genres.length;
  }
  
  // Calculate studio score
  if (anime.studios?.nodes && anime.studios.nodes.length > 0) {
    anime.studios.nodes.forEach(studio => {
      const preference = userPreferences.studios.find(p => p.name === studio.name);
      if (preference && preference.normalizedScore !== undefined) {
        studioScore += Number(preference.normalizedScore);
        usedScores.studios.push({name: studio.name, score: Number(preference.normalizedScore)});
      }
    });
    
    // Average the studio score
    studioScore = studioScore / anime.studios.nodes.length;
  }
  
  // Calculate director score
  if (anime.staff?.edges && anime.staff.edges.length > 0) {
    // Find directors
    const directors = anime.staff.edges.filter(
      edge => edge.role.toLowerCase().includes('director')
    );
    
    if (directors.length > 0) {
      directors.forEach(director => {
        const directorName = director.node.name.full;
        const preference = userPreferences.directors.find(p => p.name === directorName);
        if (preference && preference.normalizedScore !== undefined) {
          directorScore += Number(preference.normalizedScore);
          usedScores.directors.push({name: directorName, score: Number(preference.normalizedScore)});
        }
      });
      
      // Average the director score
      directorScore = directorScore / directors.length;
    }
  }
  
  // Calculate tag score
  if (anime.tags && anime.tags.length > 0) {
    anime.tags.forEach(tag => {
      const preference = userPreferences.tags.find(p => p.name === tag.name);
      if (preference && preference.normalizedScore !== undefined) {
        tagScore += Number(preference.normalizedScore);
        usedScores.tags.push({name: tag.name, score: Number(preference.normalizedScore)});
      }
    });
    
    // Average the tag score
    tagScore = tagScore / anime.tags.length;
  }
  
  // Calculate total score as sum of all components plus popularity
  const totalScore = (genreScore + studioScore + directorScore + tagScore);
  const finalScore = totalScore + Number(popularityScore);

  // Debugging
  console.log(`🧮 Calculated score for ${anime.title?.romaji || anime.id}: 
    Genre: ${genreScore.toFixed(2)}, 
    Studio: ${studioScore.toFixed(2)}, 
    Director: ${directorScore.toFixed(2)}, 
    Tags: ${tagScore.toFixed(2)}, 
    Base Preferences: ${totalScore.toFixed(2)}, 
    Public Popularity Boost: ${popularityScore.toFixed(2)}, 
    TOTAL: ${finalScore.toFixed(2)}`);
  
  // Return the calculated score
  return {
    username,
    score: Number(finalScore.toFixed(1)), // Round to 1 decimal place and ensure it's a number
    breakdown: {
      genre: Number(genreScore.toFixed(1)),
      studio: Number(studioScore.toFixed(1)),
      director: Number(directorScore.toFixed(1)),
      tags: Number(tagScore.toFixed(1)),
      popularity: Number(popularityScore.toFixed(1)) // Add popularity to the breakdown
    }
  };
}

/**
 * Calculate combined preference score from multiple users
 * @param animeScores Array of individual preference scores (already including popularity)
 * @returns A combined preference score
 */
export function calculateCombinedPreferenceScore(animeScores: AnimePreferenceScore[]): AnimePreferenceScore {
  if (!animeScores.length) {
    return {
      username: 'combined',
      score: 0,
      breakdown: { genre: 0, studio: 0, director: 0, tags: 0, popularity: 0 }
    };
  }
  
  // Calculate average scores (these already include popularity, which has been added equally to all user scores)
  const totalScore = animeScores.reduce((sum, score) => sum + Number(score.score), 0) / animeScores.length;
  
  const genreScore = animeScores.reduce((sum, score) => sum + Number(score.breakdown.genre), 0) / animeScores.length;
  const studioScore = animeScores.reduce((sum, score) => sum + Number(score.breakdown.studio), 0) / animeScores.length;
  const directorScore = animeScores.reduce((sum, score) => sum + Number(score.breakdown.director), 0) / animeScores.length;
  const tagScore = animeScores.reduce((sum, score) => sum + Number(score.breakdown.tags), 0) / animeScores.length;
  const popularityScore = animeScores.reduce((sum, score) => sum + Number(score.breakdown.popularity || 0), 0) / animeScores.length;
  
  return {
    username: 'combined',
    score: Number((Math.round(totalScore * 10) / 10).toFixed(1)), // Round to 1 decimal place and ensure it's a number
    breakdown: {
      genre: Number((Math.round(genreScore * 10) / 10).toFixed(1)),
      studio: Number((Math.round(studioScore * 10) / 10).toFixed(1)),
      director: Number((Math.round(directorScore * 10) / 10).toFixed(1)),
      tags: Number((Math.round(tagScore * 10) / 10).toFixed(1)),
      popularity: Number((Math.round(popularityScore * 10) / 10).toFixed(1))
    }
  };
}

/**
 * Get a color class for the preference score badge
 * @param score The preference score
 * @param username The username associated with the score
 * @param index The index of the user in the list (0-based)
 * @returns A Tailwind CSS class for the badge color
 */
export function getPreferenceScoreBadgeClass(score: number, username?: string, index?: number): string {
  // For combined score (username is 'combined')
  if (username === 'combined') {
    return 'bg-blue-500 text-white';
  }
  
  // For individual users, assign colors based on index
  if (index !== undefined) {
    switch (index % 4) {
      case 0: return 'bg-purple-500 text-white'; // Purple
      case 1: return 'bg-amber-500 text-white';  // Gold
      case 2: return 'bg-orange-500 text-white'; // Orange
      case 3: return 'bg-teal-500 text-white';   // Teal
      default: return 'bg-gray-500 text-white';  // Fallback
    }
  }
  
  // Fallback to original score-based colors if no index provided
  // Strong positive
  if (score >= 15) return 'bg-green-600 text-white';
  // Positive
  if (score >= 5) return 'bg-green-500 text-white';
  // Slightly positive
  if (score > 0) return 'bg-green-400 text-white';
  // Neutral
  if (score === 0) return 'bg-gray-500 text-white';
  // Slightly negative
  if (score > -5) return 'bg-red-400 text-white';
  // Negative
  if (score > -15) return 'bg-red-500 text-white';
  // Strong negative
  return 'bg-red-600 text-white';
} 