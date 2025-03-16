import { useEffect, useState, useCallback, useRef } from 'react';
import { Anime, UserRatingsResponse } from '@/types/anime';
import { calculateUserPreferences } from '@/utils/userRatingsUtils';
import { 
  calculateAnimePreferenceScore, 
  calculateCombinedPreferenceScore,
  AnimePreferenceScore
} from '@/utils/preferenceScoring';
import { 
  getAnimePreferenceScores,
  saveAnimePreferenceScores
} from '@/services/cacheService';

interface UserData {
  username: string;
  ratings: UserRatingsResponse;
}

interface UsePreferenceScoringReturn {
  applyPreferenceScores: (animeList: Anime[]) => Anime[];
  isProcessing: boolean;
}

/**
 * Custom hook for applying preference scores to anime list
 * @param userRatingsMap Map of username to user ratings data
 * @returns Object with function to apply scores and loading state
 */
export function usePreferenceScoring(
  userRatingsMap: Map<string, UserData>
): UsePreferenceScoringReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedIds = useRef<Set<number>>(new Set());
  const lastUserKeys = useRef<string>('');
  
  // In-memory cache for anime preference scores to avoid recalculating during the session
  const animeScoreCache = useRef<Map<string, any>>(new Map());
  
  // Version identifier to invalidate cache when score calculation changes
  const SCORE_VERSION = 'avg-v4-full-popularity';
  
  // Debug flag - set to true to force recalculation of scores
  // This complements the localStorage clearing in the Home component
  // to ensure a fresh start on each page load
  const DEBUG_FORCE_RECALCULATE = true;
  
  // Force refresh of preference scores on initial render or when DEBUG_FORCE_RECALCULATE is true
  useEffect(() => {
    if (DEBUG_FORCE_RECALCULATE) {
      console.log('🧪 DEBUG: Forcing cache clear to recalculate preference scores');
      animeScoreCache.current.clear();
      lastProcessedIds.current.clear();
      lastUserKeys.current = '';
    }
  }, []);
  
  /**
   * Calculate and apply preference scores to a list of anime
   * @param animeList List of anime to score
   * @returns New list with preference scores added
   */
  const applyPreferenceScores = useCallback((animeList: Anime[]): Anime[] => {
    if (!animeList.length || userRatingsMap.size === 0) {
      return animeList;
    }
    
    // Get the current usernames
    const usernames = Array.from(userRatingsMap.keys());
    console.log(`🔢 Applying preference scores for users: ${usernames.join(', ')}`);
    
    // Generate a unique key for the current user ratings
    const currentUserKeys = `${SCORE_VERSION}:${usernames.sort().join(',')}`;
    
    // If user list changed, clear anime score cache
    if (currentUserKeys !== lastUserKeys.current) {
      animeScoreCache.current.clear();
      console.log(`🧹 Cleared anime score cache due to user change (${lastUserKeys.current} -> ${currentUserKeys})`);
    }
    
    // Get the current anime IDs
    const currentAnimeIds = new Set(animeList.map(anime => anime.id));
    
    // Check if we've already processed this exact set of anime with these users
    const alreadyProcessed = 
      !DEBUG_FORCE_RECALCULATE &&
      currentUserKeys === lastUserKeys.current && 
      animeList.every(anime => 
        lastProcessedIds.current.has(anime.id) && 
        anime.preferenceScores !== undefined
      );
    
    // If we've already processed this exact data, don't reprocess
    if (alreadyProcessed) {
      console.log('🔄 Skipping preference scoring - already processed these anime with these users');
      return animeList;
    }
    
    // Count how many anime already have cached scores
    const cachedCount = animeList.reduce((count, anime) => {
      return count + (animeScoreCache.current.has(`${anime.id}`) ? 1 : 0);
    }, 0);
    
    console.log(`🔍 Found ${cachedCount} of ${animeList.length} anime with in-memory cached preference scores`);
    
    setIsProcessing(true);
    
    try {
      // Update tracking refs
      lastUserKeys.current = currentUserKeys;
      lastProcessedIds.current = currentAnimeIds;
      
      // Calculate popularity score (logarithmic scale capped at 100)
      // First, find the maximum popularity in the current anime list for seasonal scaling
      const maxPopularityInSeason = Math.max(...animeList.map(a => a.popularity || 0));
      
      // Process each anime
      const scoredAnime = animeList.map(anime => {
        const animeTitle = anime.title?.english || anime.title?.romaji || `ID:${anime.id}`;
        
        // Calculate popularity score with logarithmic scaling relative to most popular anime in season
        let normalizedPopularityScore = 0;
        if (anime.popularity && maxPopularityInSeason > 0) {
          // Use logarithmic scale to prevent super popular anime from completely dominating
          const logCurrentAnime = Math.log(anime.popularity + 1);
          const logMaxPopularity = Math.log(maxPopularityInSeason + 1);
          
          // Scale to 0-100 where 100 is the most popular anime of the season
          normalizedPopularityScore = Math.round((logCurrentAnime / logMaxPopularity) * 20);
        }
        
        // Enhanced logging for popularity scores
        console.log(`📊 Public Popularity for ${animeTitle}: Raw=${anime.popularity || 0}, Normalized=${normalizedPopularityScore}/100, Full Value Added`);
        
        // Check if we have a cached score for this anime in memory
        const cacheKey = `${anime.id}`;
        if (!DEBUG_FORCE_RECALCULATE && animeScoreCache.current.has(cacheKey)) {
          // Use in-memory cached score
          const cachedPreferenceScores = animeScoreCache.current.get(cacheKey);
          
          // Ensure the scores are always numeric
          if (cachedPreferenceScores) {
            // Convert combined score to number if it exists
            if (cachedPreferenceScores.combined) {
              cachedPreferenceScores.combined.score = Number(cachedPreferenceScores.combined.score);
              
              // Convert breakdown scores to numbers
              if (cachedPreferenceScores.combined.breakdown) {
                Object.keys(cachedPreferenceScores.combined.breakdown).forEach(key => {
                  (cachedPreferenceScores.combined.breakdown as Record<string, number>)[key] = 
                    Number((cachedPreferenceScores.combined.breakdown as Record<string, number>)[key]);
                });
              }
            }
            
            // Convert user scores to numbers
            if (cachedPreferenceScores.users) {
              cachedPreferenceScores.users.forEach((user: AnimePreferenceScore) => {
                user.score = Number(user.score);
                
                // Convert breakdown scores to numbers
                if (user.breakdown) {
                  Object.keys(user.breakdown).forEach(key => {
                    (user.breakdown as Record<string, number>)[key] = 
                      Number((user.breakdown as Record<string, number>)[key]);
                  });
                }
              });
              
              // Debug: Verify user scores are present and properly converted
              if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
                console.log(`🔍 Cache check for ${animeTitle}: Users in cache [${
                  cachedPreferenceScores.users.map((u: AnimePreferenceScore) => 
                    `${u.username}:${u.score}(${typeof u.score})`
                  ).join(', ')
                }]`);
              }
            }
            
            // Convert popularity score to number
            if (cachedPreferenceScores.popularityScore) {
              cachedPreferenceScores.popularityScore = Number(cachedPreferenceScores.popularityScore);
            }
          }
          
          // Log cache hit (sometimes)
          if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
            console.log(`🔍 Using in-memory cached score for anime ${animeTitle}`);
          }
          
          return {
            ...anime,
            preferenceScores: cachedPreferenceScores
          };
        }
        
        // If not in memory, check localStorage (unless we're forcing recalculation)
        const localStorageScores = !DEBUG_FORCE_RECALCULATE ? 
          getAnimePreferenceScores(anime.id, usernames) : null;
          
        if (localStorageScores) {
          // Ensure the scores are always numeric (same conversion as above)
          if (localStorageScores.combined) {
            localStorageScores.combined.score = Number(localStorageScores.combined.score);
            
            if (localStorageScores.combined.breakdown) {
              Object.keys(localStorageScores.combined.breakdown).forEach(key => {
                (localStorageScores.combined.breakdown as Record<string, number>)[key] = 
                  Number((localStorageScores.combined.breakdown as Record<string, number>)[key]);
              });
            }
          }
          
          if (localStorageScores.users) {
            localStorageScores.users.forEach((user: AnimePreferenceScore) => {
              user.score = Number(user.score);
              
              if (user.breakdown) {
                Object.keys(user.breakdown).forEach(key => {
                  (user.breakdown as Record<string, number>)[key] = 
                    Number((user.breakdown as Record<string, number>)[key]);
                });
              }
            });
            
            // Debug: Verify user scores from localStorage
            if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
              console.log(`🔍 Cache check for ${animeTitle}: Users in localStorage [${
                localStorageScores.users.map((u: AnimePreferenceScore) => 
                  `${u.username}:${u.score}(${typeof u.score})`
                ).join(', ')
              }]`);
            }
          }
          
          return {
            ...anime,
            preferenceScores: localStorageScores
          };
        }
        
        return {
          ...anime,
          preferenceScores: {
            combined: {
              score: 0,
              breakdown: {}
            },
            popularityScore: normalizedPopularityScore,
            users: []
          }
        };
      });
      
      // Process user preference scores for each anime
      const animeWithUserScores = scoredAnime.map(anime => {
        const animeTitle = anime.title?.english || anime.title?.romaji || `ID:${anime.id}`;
        
        // Skip if we already have preference scores from cache
        if (anime.preferenceScores?.users?.length > 0) {
          return anime;
        }
        
        // Get normalized popularity score
        const normalizedPopularityScore = anime.preferenceScores?.popularityScore || 0;
        
        // Calculate scores for each user
        const userScores = Array.from(userRatingsMap.entries()).map(([username, userData]) => {
          // Calculate user preferences if not already done
          const userPreferences = calculateUserPreferences(userData.ratings);
          
          // Calculate preference score for this anime
          return calculateAnimePreferenceScore(
            anime, 
            userPreferences, 
            username,
            normalizedPopularityScore
          );
        });
        
        // Calculate combined score (average of all users)
        const combinedScore = userScores.length > 0 
          ? calculateCombinedPreferenceScore(userScores)
          : {
              username: 'combined',
              score: 0,
              breakdown: { genre: 0, studio: 0, director: 0, tags: 0, popularity: 0 }
            };
        
        // Log the results for debugging
        console.log(`🧮 Scored anime ${animeTitle}: Users:[${userScores.map(u => 
          `${u.username}:${u.score.toFixed(1)}`).join(', ')}], Combined:${combinedScore.score.toFixed(1)}`);
        
        // Save scores to cache for future use
        const newScores = {
          users: userScores,
          combined: combinedScore,
          popularityScore: normalizedPopularityScore
        };
        
        // Save to in-memory cache
        animeScoreCache.current.set(`${anime.id}`, newScores);
        
        // Save to localStorage cache
        saveAnimePreferenceScores(anime.id, usernames, newScores);
        
        return {
          ...anime,
          preferenceScores: newScores
        };
      });
      
      return animeWithUserScores;
    } finally {
      setIsProcessing(false);
    }
  }, [userRatingsMap, DEBUG_FORCE_RECALCULATE]);
  
  return {
    applyPreferenceScores,
    isProcessing
  };
}