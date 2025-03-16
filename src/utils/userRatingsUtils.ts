import { UserRatingsResponse, RatingStats, Anime } from '@/types/anime';
import { getUserPreferences, saveUserPreferences } from '@/services/cacheService';

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

/**
 * Converts a user score (1-5) to preference points
 * @param score The user's rating (1-5 stars)
 * @returns Preference points according to the scoring system (used in averages)
 */
export function scoreToPoints(score: number): number {
  switch (score) {
    case 5: return 10;  // 5 stars = +10 points
    case 4: return 3;   // 4 stars = +3 points
    case 3: return 1;   // 3 stars = +1 point
    case 2: return -1;  // 2 stars = -1 point
    case 1: return -5;  // 1 star = -5 points
    default: return 0;  // Invalid or unrated
  }
}

/**
 * Interface for preference score results
 */
export interface PreferenceScore {
  name: string;
  score: number;
  count: number;
  popularityAdjustedScore?: number; // New field for the middle score with popularity boost
  normalizedScore?: number;
  // Add a list of anime that contributed to this score
  contributingAnime?: {
    title: string;
    score: number;
    pointValue: number;
    modifiedValue?: number; // For tags with rank weighting
    imageUrl?: string;
    role?: string; // Store staff role (for directors)
  }[];
}

/**
 * Type for all user preferences
 */
export interface UserPreferences {
  genres: PreferenceScore[];
  studios: PreferenceScore[];
  directors: PreferenceScore[];
  tags: PreferenceScore[];
}

/**
 * Applies a popularity multiplier to scores based on the number of entries
 * @param scores Array of preference scores to adjust
 * @param maxBoost Maximum boost percentage to apply (e.g., 20 for 20%)
 * @returns The same array with popularity-adjusted scores added
 */
export function applyPopularityMultiplier(
  scores: PreferenceScore[],
  maxBoost: number = 20
): PreferenceScore[] {
  if (!scores.length) return scores;
  
  // Find the maximum count across all items
  const maxCount = Math.max(...scores.map(item => item.count));
  
  // Apply popularity multiplier (0% to maxBoost%)
  return scores.map(item => {
    // Calculate percentage of the max (0 to 1)
    const percentOfMax = item.count / maxCount;
    
    // Apply the boost (between 0% and maxBoost%)
    const boost = 1 + ((percentOfMax * maxBoost) / 100);
    
    // Apply the boost to the original score
    const adjustedScore = Math.round(item.score * boost * 10) / 10; // Round to 1 decimal
    
    return {
      ...item,
      popularityAdjustedScore: adjustedScore
    };
  });
}

/**
 * Normalizes a list of preference scores to a specified range
 * @param scores Array of preference scores to normalize
 * @param minTarget Minimum value of normalized range (e.g., -10)
 * @param maxTarget Maximum value of normalized range (e.g., +10)
 * @returns The same array with normalized scores added
 */
export function normalizeScores(
  scores: PreferenceScore[],
  minTarget: number,
  maxTarget: number
): PreferenceScore[] {
  if (!scores.length) return scores;
  
  // Now normalize based on the popularity-adjusted scores if available
  
  // Find min and max scores (using popularity-adjusted scores if available)
  const getScoreToUse = (item: PreferenceScore) => 
    item.popularityAdjustedScore !== undefined ? item.popularityAdjustedScore : item.score;
  
  let minScore = getScoreToUse(scores[0]);
  let maxScore = getScoreToUse(scores[0]);
  
  for (const item of scores) {
    const scoreToUse = getScoreToUse(item);
    if (scoreToUse < minScore) minScore = scoreToUse;
    if (scoreToUse > maxScore) maxScore = scoreToUse;
  }
  
  // If all scores are the same, set normalized scores to 0
  if (maxScore === minScore) {
    return scores.map(item => ({
      ...item,
      normalizedScore: 0
    }));
  }
  
  // Separate positive and negative scores for separate processing
  const positiveScores = scores.filter(item => getScoreToUse(item) > 0);
  const negativeScores = scores.filter(item => getScoreToUse(item) < 0);
  const zeroScores = scores.filter(item => getScoreToUse(item) === 0);
  
  // Process positive scores with semi-logarithmic normalization
  const positiveNormalized = positiveScores.map(item => {
    const scoreToUse = getScoreToUse(item);
    
    // Linear percentile (0 to 1)
    const linearPercentile = scoreToUse / maxScore;
    
    // Logarithmic percentile (0 to 1)
    const logScore = Math.log(scoreToUse + 1);
    const maxLogScore = Math.log(maxScore + 1);
    const logPercentile = logScore / maxLogScore;
    
    // Blend linear and logarithmic (50% each) for a more moderate curve
    const blendedPercentile = (linearPercentile * 0.5) + (logPercentile * 0.5);
    
    // Scale to positive target range (0 to maxTarget)
    const normalizedScore = blendedPercentile * maxTarget;
    
    return {
      ...item,
      normalizedScore: Math.round(normalizedScore * 100) / 100 // Round to 2 decimal places
    };
  });
  
  // Process negative scores with semi-logarithmic normalization (mirror of positive approach)
  const negativeNormalized = negativeScores.map(item => {
    const scoreToUse = getScoreToUse(item);
    const absScore = Math.abs(scoreToUse);
    const absMinScore = Math.abs(minScore);
    
    // Linear percentile (0 to 1)
    const linearPercentile = absScore / absMinScore;
    
    // Logarithmic percentile (0 to 1)
    const logScore = Math.log(absScore + 1);
    const maxLogScore = Math.log(absMinScore + 1);
    const logPercentile = logScore / maxLogScore;
    
    // Blend linear and logarithmic (50% each) for a more moderate curve
    const blendedPercentile = (linearPercentile * 0.5) + (logPercentile * 0.5);
    
    // Scale to negative target range (minTarget to 0)
    const normalizedScore = -1 * blendedPercentile * Math.abs(minTarget);
    
    return {
      ...item,
      normalizedScore: Math.round(normalizedScore * 100) / 100 // Round to 2 decimal places
    };
  });
  
  // For zero scores, set normalized score to 0
  const zeroNormalized = zeroScores.map(item => ({
    ...item,
    normalizedScore: 0
  }));
  
  // Combine all scores and sort by the original sort order
  const allNormalized = [...positiveNormalized, ...negativeNormalized, ...zeroNormalized];
  
  // Preserve the original order
  return scores.map(original => 
    allNormalized.find(item => item.name === original.name) || original
  );
}

/**
 * Extracts the base name of an anime by removing season identifiers
 * @param title The full anime title
 * @returns The base name without season identifiers
 */
function extractBaseFranchiseName(title: string): string {
  // Convert to lowercase for case-insensitive matching
  const lowerTitle = title.toLowerCase();
  
  // Remove common season identifiers
  const baseName = lowerTitle
    // Remove season numbers with various formats
    .replace(/\s+season\s+\d+$/i, '')
    .replace(/\s+s\d+$/i, '')
    .replace(/\s+\d+nd\s+season$/i, '')
    .replace(/\s+\d+rd\s+season$/i, '')
    .replace(/\s+\d+th\s+season$/i, '')
    .replace(/\s+\d+st\s+season$/i, '')
    // Remove part identifiers
    .replace(/\s+part\s+\d+$/i, '')
    // Remove sequel identifiers
    .replace(/\s+II$/i, '')
    .replace(/\s+III$/i, '')
    .replace(/\s+IV$/i, '')
    .replace(/\s+V$/i, '')
    .replace(/\s+2$/i, '')
    .replace(/\s+3$/i, '')
    .replace(/\s+\d{4}$/i, '') // Remove years at the end (common for sequels)
    // Remove common Japanese identifiers
    .replace(/\s+第\d+期$/i, '') // Japanese season indicator
    .replace(/：.*$/i, '') // Remove subtitle after colon
    .replace(/\s*[:：]\s*.*$/i, '') // Remove everything after a colon (often used for subtitles)
    .trim();
  
  return baseName;
}

/**
 * Calculate user preferences based on their ratings
 * @param ratingsData User ratings from AniList API
 * @returns Object with scores for genres, studios, directors, and tags
 */
export function calculateUserPreferences(ratingsData: UserRatingsResponse): UserPreferences {
  // Get username from the first rating if available
  const username = ratingsData.data.Page.mediaList[0]?.user?.name;
  
  // If we have a username, check the cache first
  if (username) {
    const cachedPreferences = getUserPreferences(username);
    if (cachedPreferences) {
      console.log(`✅ Using cached preferences for user: ${username}`);
      return cachedPreferences;
    }
    console.log(`🔄 Calculating preferences for user: ${username} (not found in cache)`);
  }
  
  // If no cache hit, calculate preferences
  const mediaList = ratingsData.data.Page.mediaList;
  
  // Apply franchise filtering to avoid counting multiple seasons of the same anime
  const filteredMediaList = filterDuplicateFranchises(mediaList);
  
  console.log(`🎬 Filtered ${mediaList.length} rated anime down to ${filteredMediaList.length} unique franchises`);
  
  // Filter out anime with no rating (score of 0)
  const ratedMediaList = filteredMediaList.filter(item => item.score > 0);
  
  console.log(`⭐ Filtered out ${filteredMediaList.length - ratedMediaList.length} anime with no rating (showing as 0★)`);
  
  // Initialize score trackers with contributing anime
  const genreScores: Record<string, { 
    score: number, 
    count: number,
    anime: {
      title: string,
      score: number,
      pointValue: number,
      imageUrl?: string
    }[]
  }> = {};
  
  const studioScores: Record<string, { 
    score: number, 
    count: number,
    anime: {
      title: string,
      score: number,
      pointValue: number,
      imageUrl?: string
    }[]
  }> = {};
  
  const directorScores: Record<string, { 
    score: number, 
    count: number,
    anime: {
      title: string,
      score: number,
      pointValue: number,
      imageUrl?: string
    }[]
  }> = {};
  
  const tagScores: Record<string, { 
    score: number, 
    count: number,
    anime: {
      title: string,
      score: number,
      pointValue: number,
      modifiedValue: number,
      imageUrl?: string
    }[]
  }> = {};
  
  // Process each rated anime
  ratedMediaList.forEach(item => {
    const media = item.media;
    const pointValue = scoreToPoints(item.score);
    const animeTitle = media.title.english || media.title.romaji;
    const coverImage = media.coverImage?.medium || media.coverImage?.large;
    
    // Process genres
    if (media.genres && media.genres.length > 0) {
      // Track which genres we've already processed for this anime to avoid duplicates
      const processedGenres = new Set<string>();
      
      media.genres.forEach((genre: string) => {
        // Skip if we've already processed this genre for this anime
        // (this shouldn't normally happen but it's good for safety)
        if (processedGenres.has(genre)) {
          return;
        }
        processedGenres.add(genre);
        
        if (!genreScores[genre]) {
          genreScores[genre] = { score: 0, count: 0, anime: [] };
        }
        genreScores[genre].score += pointValue;
        genreScores[genre].count += 1;
        genreScores[genre].anime.push({
          title: animeTitle,
          score: item.score,
          pointValue: pointValue,
          imageUrl: coverImage
        });
      });
    }
    
    // Process studios
    if (media.studios && media.studios.nodes && media.studios.nodes.length > 0) {
      // Track which anime we've already processed for each studio to avoid duplicates
      const processedStudios = new Set<string>();
      
      media.studios.nodes.forEach((studio: { id: number, name: string }) => {
        if (!studio.name) return; // Skip if name is missing
        
        // Skip if we've already processed this anime for this studio
        const studioAnimeKey = `${studio.name}-${media.id}`;
        if (processedStudios.has(studioAnimeKey)) {
          return;
        }
        processedStudios.add(studioAnimeKey);
        
        if (!studioScores[studio.name]) {
          studioScores[studio.name] = { score: 0, count: 0, anime: [] };
        }
        studioScores[studio.name].score += pointValue;
        studioScores[studio.name].count += 1;
        studioScores[studio.name].anime.push({
          title: animeTitle,
          score: item.score,
          pointValue: pointValue,
          imageUrl: coverImage
        });
      });
    }
    
    // Process staff (directors)
    if (media.staff && media.staff.edges && media.staff.edges.length > 0) {
      // Track which anime we've already processed for each director to avoid duplicates
      const processedDirectors = new Set<string>();
      
      media.staff.edges.forEach((edge: { role: string, node: { name: { full: string } } }) => {
        const role = edge.role;
        // Check if this is any type of director role
        const isDirector = role.toLowerCase().includes('director');
        
        if (isDirector) {
          const directorName = edge.node.name.full;
          
          // Skip if we've already processed this anime for this director
          const directorAnimeKey = `${directorName}-${media.id}`;
          if (processedDirectors.has(directorAnimeKey)) {
            return;
          }
          processedDirectors.add(directorAnimeKey);
          
          if (!directorScores[directorName]) {
            directorScores[directorName] = { score: 0, count: 0, anime: [] };
          }
          directorScores[directorName].score += pointValue;
          directorScores[directorName].count += 1;
          
          // Add with type assertion to include role property
          const animeEntry = {
            title: animeTitle,
            score: item.score,
            pointValue: pointValue,
            imageUrl: coverImage,
            role: role 
          };
          directorScores[directorName].anime.push(animeEntry as any);
        }
      });
    }
    
    // Process tags with rank-weighted scoring
    if (media.tags && media.tags.length > 0) {
      // Track which tags we've already processed for this anime to avoid duplicates
      const processedTags = new Set<string>();
      
      media.tags.forEach((tag: { name: string, rank: number }) => {
        // Skip if we've already processed this tag for this anime
        // (this could happen if the API returns duplicate tags)
        if (processedTags.has(tag.name)) {
          return;
        }
        processedTags.add(tag.name);
        
        // Calculate weight based on tag rank (0-100)
        // Higher rank = more relevant tag = more weight
        const rankModifier = 0.5 + (tag.rank / 200); // 0.5 to 1.0 based on rank
        const weightedPointValue = pointValue * rankModifier;
                
        if (!tagScores[tag.name]) {
          tagScores[tag.name] = { score: 0, count: 0, anime: [] };
        }
        tagScores[tag.name].score += weightedPointValue;
        tagScores[tag.name].count += 1;
        tagScores[tag.name].anime.push({
          title: animeTitle,
          score: item.score,
          pointValue: pointValue,
          modifiedValue: weightedPointValue,
          imageUrl: coverImage
        });
      });
    }
  });
  
  // Convert to sorted arrays with average scores
  const calculateAverageScores = <T extends { score: number, count: number, anime: any[] }>(
    scores: Record<string, T>
  ): PreferenceScore[] => {
    return Object.entries(scores)
      .filter(([_, { count }]) => count > 0) // Only include items with at least one rating
      .map(([name, { score, count, anime }]) => {
        // Calculate the average score - ensure count is at least 1 to avoid division by zero
        const averageScore = count > 0 ? Math.round((score / count) * 10) / 10 : 0;
        
        return { 
          name, 
          score: averageScore, 
          count,
          contributingAnime: anime
        };
      })
      .sort((a, b) => b.score - a.score);
  };
  
  // Get sorted scores for each category with averages
  const genres = calculateAverageScores(genreScores);
  const studios = calculateAverageScores(studioScores);
  const directors = calculateAverageScores(directorScores);
  const tags = calculateAverageScores(tagScores);
  
  console.log('🧮 Calculated average preference scores:', {
    genresCount: genres.length,
    studiosCount: studios.length,
    directorsCount: directors.length,
    tagsCount: tags.length,
    topGenres: genres.slice(0, 3).map(g => `${g.name}: ${g.score} (from ${g.count} ratings)`)
  });
  
  // Apply popularity multiplier and normalization
  const preferences = {
    genres: normalizeScores(applyPopularityMultiplier(genres), -10, 10),
    studios: normalizeScores(applyPopularityMultiplier(studios), -20, 20),
    directors: normalizeScores(applyPopularityMultiplier(directors), -20, 20),
    tags: normalizeScores(applyPopularityMultiplier(tags), -10, 10)
  };
  
  // Save to cache if we have a username
  if (username) {
    saveUserPreferences(username, preferences);
    console.log(`💾 Saved preferences to cache for user: ${username}`);
  }
  
  return preferences;
}

/**
 * Get top liked and disliked items from a preference list
 * @param preferences List of preference scores
 * @param count Number of items to get from each end
 * @param minEntries Minimum number of entries required (default is 0, meaning no filtering)
 * @returns Object with liked and disliked arrays
 */
export function getTopPreferences(
  preferences: PreferenceScore[], 
  count: number = 5,
  minEntries: number = 0
): {
  liked: PreferenceScore[],
  disliked: PreferenceScore[]
} {
  // Apply minimum entries filter if specified
  const filteredPreferences = minEntries > 0
    ? preferences.filter(p => p.count >= minEntries)
    : preferences;
  
  // Sort by score descending for liked
  const liked = [...filteredPreferences]
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
  
  // Sort by score ascending for disliked (most negative first)
  const disliked = [...filteredPreferences]
    .filter(p => p.score < 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
  
  return { liked, disliked };
}

/**
 * Filter a list of rated anime to keep only the first instance from each franchise
 * @param mediaList List of rated anime from AniList API
 * @returns Filtered list with only one entry per franchise
 */
function filterDuplicateFranchises(mediaList: any[]): any[] {
  // Keep track of encountered franchises
  const franchiseMap = new Map<string, any>();
  const result: any[] = [];
  const duplicates: string[] = [];
  
  // Sort by score (highest first), then by rating date
  const sortedList = [...mediaList].sort((a, b) => {
    // First, prioritize items with ratings over those without
    if (a.score > 0 && b.score === 0) return -1;
    if (a.score === 0 && b.score > 0) return 1;
    
    // Next, sort by score (highest first)
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    
    // If scores are equal, use completion dates
    if (a.completedAt?.year && b.completedAt?.year) {
      if (a.completedAt.year !== b.completedAt.year) {
        return a.completedAt.year - b.completedAt.year;
      }
      if (a.completedAt.month !== b.completedAt.month) {
        return a.completedAt.month - b.completedAt.month;
      }
      if (a.completedAt.day !== b.completedAt.day) {
        return a.completedAt.day - b.completedAt.day;
      }
    }
    
    // If no completion dates, fallback to creation dates (earliest first)
    if (a.createdAt && b.createdAt) {
      return a.createdAt - b.createdAt;
    }
    
    // If no dates available, fallback to ID (lowest first)
    return a.id - b.id;
  });
  
  // Process each media entry
  sortedList.forEach(item => {
    const media = item.media;
    
    // Get the English title, or romaji title as fallback
    const title = media.title.english || media.title.romaji;
    if (!title) return; // Skip if no title
    
    // Extract the base franchise name
    const franchiseName = extractBaseFranchiseName(title);
    
    // If we haven't seen this franchise before, add it to results
    if (!franchiseMap.has(franchiseName)) {
      franchiseMap.set(franchiseName, item);
      result.push(item);
    } else {
      // It's a duplicate franchise, log for debugging
      const existingItem = franchiseMap.get(franchiseName);
      duplicates.push(`${title} (${item.score}★) → identified as part of franchise: ${franchiseName} (kept: ${existingItem.media.title.english || existingItem.media.title.romaji} with ${existingItem.score}★)`);
    }
  });
  
  // Log the duplicates for debugging
  if (duplicates.length > 0) {
    console.log(`🔍 Identified ${duplicates.length} duplicate franchises:`);
    duplicates.forEach(d => console.log(`  - ${d}`));
  }
  
  return result;
} 