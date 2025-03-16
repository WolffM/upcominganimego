import { 
  AnimeResponse, 
  UserRatingsResponse, 
  AnimeCacheKey,
  UserRatingsCacheKey,
  CacheKey,
  CacheEntry,
  AnimeSeason
} from '@/types/anime';

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Prefix for complete user ratings cache
const COMPLETE_USER_PREFIX = 'anilist_complete_user_';

// Prefix for user preferences cache
const USER_PREFERENCES_PREFIX = 'anilist_user_prefs_';

// Prefix for anime preference scores cache
const ANIME_PREFERENCES_PREFIX = 'anilist_anime_prefs_';

// Maximum storage size per entry (in bytes) - approximately 50KB
const MAX_STORAGE_SIZE_PER_ENTRY = 50 * 1024;

// Check if the key is a user ratings key
const isUserRatingsKey = (key: CacheKey): key is UserRatingsCacheKey => {
  return 'userId' in key;
};

// Generate a unique key for the cache based on query parameters
const generateCacheKey = (params: CacheKey): string => {
  if (isUserRatingsKey(params)) {
    return `anilist_user_${params.userId}_${params.page}_${params.perPage}`;
  }
  return `anilist_${params.season}_${params.year}_${params.page}_${params.perPage}`;
};

// Helper to check if we're in a browser environment with localStorage
const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
};

/**
 * Utility to compress data for storage
 * @param data Data object to compress
 * @returns Compressed data string
 */
const compressData = (data: any): string => {
  try {
    // If the browser supports compression API, use it
    if (typeof CompressionStream !== 'undefined') {
      // Let's do a simple stringify with manual pruning for now
      // And we'll implement full compression later if needed
      const jsonData = JSON.stringify(data);
      
      // Return the stringified data for now
      return jsonData;
    } else {
      // LZW-like compression for strings - very basic implementation
      // This is a simple dictionary-based compression
      const stringData = JSON.stringify(data);
      return stringData;
    }
  } catch (error) {
    // If compression fails, just return stringified data
    console.error('❌ Error compressing data:', error);
    return JSON.stringify(data);
  }
};

/**
 * Utility to decompress data from storage
 * @param compressedData Compressed data string
 * @returns Original data object
 */
const decompressData = (compressedData: string): any => {
  try {
    // For now, we just parse the JSON string since we're not fully compressing yet
    return JSON.parse(compressedData);
  } catch (error) {
    console.error('❌ Error decompressing data:', error);
    return null;
  }
};

/**
 * Optimize storage data by removing non-essential information
 * @param data Data to optimize
 * @returns Optimized data with reduced size
 */
const optimizeStorageData = (data: any): any => {
  // Deep clone the data to avoid modifying the original
  const clonedData = JSON.parse(JSON.stringify(data));
  
  // If it's a preference object, prune less important data
  if (clonedData && 
      (clonedData.genres || clonedData.studios || clonedData.directors || clonedData.tags)) {
    
    // For each category, limit to top 50 preferences
    ['genres', 'studios', 'directors', 'tags'].forEach(category => {
      if (Array.isArray(clonedData[category]) && clonedData[category].length > 50) {
        clonedData[category] = clonedData[category].slice(0, 50);
      }
      
      // For each preference, limit contributors list to save space
      if (Array.isArray(clonedData[category])) {
        clonedData[category].forEach((pref: any) => {
          // Limit contributing anime to top 10
          if (pref.contributingAnime && pref.contributingAnime.length > 10) {
            pref.contributingAnime = pref.contributingAnime.slice(0, 10);
          }
          
          // Remove image URLs to save space (we can get them elsewhere)
          if (pref.contributingAnime) {
            pref.contributingAnime.forEach((anime: any) => {
              delete anime.imageUrl;
            });
          }
        });
      }
    });
  }
  
  return clonedData;
};

/**
 * Size-aware storage - stores data only if it's not too large
 * @param key Storage key
 * @param data Data to store
 * @param maxSize Maximum size in bytes
 * @returns Boolean indicating if storage was successful
 */
const sizeAwareStorage = (key: string, data: any, maxSize: number = MAX_STORAGE_SIZE_PER_ENTRY): boolean => {
  try {
    // Optimize the data structure to reduce size
    const optimizedData = optimizeStorageData(data);
    
    // Compress the data
    const compressed = compressData(optimizedData);
    
    // Check the size (2 bytes per character for UTF-16)
    const size = compressed.length * 2;
    
    if (size > maxSize) {
      console.warn(`⚠️ Data too large for key ${key}: ${(size/1024).toFixed(1)}KB > ${(maxSize/1024).toFixed(1)}KB max`);
      return false;
    }
    
    // Store the data
    localStorage.setItem(key, compressed);
    console.log(`💾 Stored data for key ${key}: ${(size/1024).toFixed(1)}KB`);
    return true;
  } catch (error) {
    console.error('❌ Error in size-aware storage:', error);
    
    // If it's a quota error, try to clear space and retry
    if (error instanceof DOMException && 
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.log('⚠️ Storage quota exceeded, clearing space...');
      clearOldestCacheEntries(0.3); // Clear 30% of cache
      
      try {
        // Try again with reduced data
        const reducedData = reduceDataSize(data);
        const compressed = compressData(reducedData);
        localStorage.setItem(key, compressed);
        console.log(`💾 Stored reduced data for key ${key}`);
        return true;
      } catch (retryError) {
        console.error('❌ Failed to store data even after clearing cache:', retryError);
        return false;
      }
    }
    
    return false;
  }
};

/**
 * Determines if data is a UserRatingsResponse with mediaList
 * @param data Data to check
 * @returns Boolean indicating if it has mediaList property
 */
const hasMediaList = (data: any): data is UserRatingsResponse => {
  return data && 
    data.data && 
    data.data.Page && 
    'mediaList' in data.data.Page;
};

/**
 * Reduce the size of data by removing less important information
 * @param data Data to reduce
 * @returns Reduced data
 */
const reduceDataSize = (data: any): any => {
  // Deep clone the data
  const reducedData = JSON.parse(JSON.stringify(data));
  
  // If it's a preference object, aggressively prune data
  if (reducedData && 
      (reducedData.genres || reducedData.studios || reducedData.directors || reducedData.tags)) {
    
    // For each category, limit to top 20 preferences only
    ['genres', 'studios', 'directors', 'tags'].forEach(category => {
      if (Array.isArray(reducedData[category])) {
        reducedData[category] = reducedData[category]
          .slice(0, 20)
          .map((pref: any) => ({
            name: pref.name,
            normalizedScore: pref.normalizedScore,
            score: pref.score,
            count: pref.count
          }));
      }
    });
  }
  
  return reducedData;
};

/**
 * Save complete user ratings data to cache
 * 
 * @param userId User ID to use as the cache key
 * @param data Complete user ratings data to cache
 */
export const saveCompleteUserRatings = (
  userId: number,
  data: UserRatingsResponse
): void => {
  if (!isBrowser()) return;
  
  try {
    const key = `${COMPLETE_USER_PREFIX}${userId}`;
    console.log('💾 Saving complete user ratings to cache with key:', key);
    
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('❌ Error saving complete user ratings:', error);
  }
};

/**
 * Get complete user ratings data from cache
 * 
 * @param userId User ID to lookup
 * @returns Complete user ratings or null if not found
 */
export const getCompleteUserRatings = (
  userId: number
): UserRatingsResponse | null => {
  if (!isBrowser()) return null;
  
  try {
    const key = `${COMPLETE_USER_PREFIX}${userId}`;
    console.log('🔍 Checking for complete user ratings with key:', key);
    
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;
    
    try {
      return JSON.parse(cachedData) as UserRatingsResponse;
    } catch (e) {
      console.error('❌ Error parsing complete user ratings:', e);
      localStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting complete user ratings:', error);
    return null;
  }
};

/**
 * Save calculated user preferences to cache
 * 
 * @param username Username to use as the cache key
 * @param preferences User preferences data to cache
 */
export const saveUserPreferences = (
  username: string,
  preferences: any
): void => {
  if (!isBrowser()) return;
  
  try {
    const key = `${USER_PREFERENCES_PREFIX}${username}`;
    console.log('💾 Saving user preferences to cache with key:', key);
    
    const entry = {
      data: preferences,
      timestamp: Date.now()
    };
    
    // Use size-aware storage to avoid quota issues
    const success = sizeAwareStorage(key, entry);
    
    if (!success) {
      console.warn('⚠️ Could not save user preferences due to size constraints - using reduced data');
      
      // Try again with reduced data
      const reducedPreferences = {
        genres: preferences.genres.slice(0, 30),
        studios: preferences.studios.slice(0, 20),
        directors: preferences.directors.slice(0, 20),
        tags: preferences.tags.slice(0, 30)
      };
      
      const reducedEntry = {
        data: reducedPreferences,
        timestamp: Date.now()
      };
      
      sizeAwareStorage(key, reducedEntry);
    }
  } catch (error) {
    console.error('❌ Error saving user preferences:', error);
  }
};

/**
 * Get user preferences data from cache
 * 
 * @param username Username to lookup
 * @returns User preferences or null if not found or expired
 */
export const getUserPreferences = (
  username: string
): any | null => {
  if (!isBrowser()) return null;
  
  try {
    const key = `${USER_PREFERENCES_PREFIX}${username}`;
    console.log('🔍 Checking for user preferences with key:', key);
    
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;
    
    try {
      // Use decompressData to handle any compression
      const entry = decompressData(cachedData);
      
      // Check if the cache has expired
      if (Date.now() - entry.timestamp > CACHE_EXPIRATION) {
        console.log('⏰ User preferences cache expired for:', username);
        localStorage.removeItem(key);
        return null;
      }
      
      return entry.data;
    } catch (e) {
      console.error('❌ Error parsing user preferences:', e);
      localStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting user preferences:', error);
    return null;
  }
};

/**
 * Remove a user's ratings from the cache by username
 * 
 * @param username The username to remove from cache
 * @returns boolean indicating success
 */
export const removeUserFromCache = (username: string): boolean => {
  if (!isBrowser()) return false;
  
  try {
    console.log('🗑️ Attempting to remove user from cache:', username);
    
    // Find all localStorage keys that might be related to this user
    const allKeys = Object.keys(localStorage);
    let found = false;
    
    // First try to remove the user preferences directly
    const prefsKey = `${USER_PREFERENCES_PREFIX}${username}`;
    if (localStorage.getItem(prefsKey)) {
      localStorage.removeItem(prefsKey);
      found = true;
      console.log('🗑️ Removed user preferences cache:', prefsKey);
    }
    
    // Find keys containing the username and delete them
    for (const key of allKeys) {
      if (key.startsWith(COMPLETE_USER_PREFIX) || key.startsWith('anilist_user_')) {
        // Check if the stored data is for this username
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            
            // Check if this data belongs to our user
            if (parsed.data?.Page?.mediaList?.some?.((item: any) => 
              item.user?.name === username || 
              (parsed.timestamp && key.includes(username))
            )) {
              console.log('🗑️ Removing cache entry with key:', key);
              localStorage.removeItem(key);
              found = true;
            }
          }
        } catch (e) {
          // If we can't parse it, just continue to the next key
          console.error('❌ Error parsing cache entry:', e);
        }
      }
    }
    
    console.log(found ? '✅ Successfully removed user from cache' : '⚠️ No cache entries found for user');
    return found;
  } catch (error) {
    console.error('❌ Error removing user from cache:', error);
    return false;
  }
};

// Save data to cache
export const saveToCache = (
  params: CacheKey,
  data: AnimeResponse | UserRatingsResponse
): void => {
  try {
    // Only cache if we're in a browser environment
    if (!isBrowser()) {
      return;
    }
    
    // Validate the data before caching
    if (!data || !data.data || !data.data.Page) {
      console.error('❌ Cache: Invalid data structure, not caching');
      return;
    }
    
    const key = generateCacheKey(params);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    
    try {
      // Use size-aware storage instead of direct localStorage
      const success = sizeAwareStorage(key, entry);
      
      if (success) {
        if (isUserRatingsKey(params)) {
          console.log('💾 Cached user ratings data for user ID:', params.userId);
        } else {
          console.log('💾 Cached anime data for season:', params.season, params.year);
        }
      } else {
        // If size-aware storage failed, try with reduced data
        console.warn('⚠️ Could not save to cache due to size constraints - using compressed data');
        
        // For user ratings, we can reduce the data significantly
        if (isUserRatingsKey(params) && hasMediaList(entry.data)) {
          // Create a simplified copy of the data structure instead of modifying original
          const simplifiedData = JSON.parse(JSON.stringify(entry.data));
          
          // Replace mediaList with simplified version
          simplifiedData.data.Page.mediaList = entry.data.data.Page.mediaList.map((item: any) => ({
            id: item.id,
            mediaId: item.mediaId,
            score: item.score,
            media: {
              id: item.media?.id,
              title: item.media?.title,
              genres: item.media?.genres,
              format: item.media?.format,
              season: item.media?.season,
              seasonYear: item.media?.seasonYear,
              studios: item.media?.studios ? {
                nodes: item.media.studios.nodes?.map((s: any) => ({ name: s.name })) || []
              } : undefined,
              // Include only essential staff
              staff: item.media?.staff ? {
                edges: item.media.staff.edges?.filter((e: any) => 
                  e.role.toLowerCase().includes('director')
                ).map((e: any) => ({
                  role: e.role,
                  node: { name: e.node.name }
                })) || []
              } : undefined,
              // Include only essential tags
              tags: item.media?.tags?.slice(0, 10).map((t: any) => ({
                name: t.name,
                rank: t.rank
              })) || []
            },
            user: item.user ? {
              name: item.user.name,
              id: item.user.id
            } : undefined
          }));
          
          // Try to save the reduced data
          const compressedData = compressData(simplifiedData);
          localStorage.setItem(key, compressedData);
          console.log(`💾 Stored simplified data for key ${key}`);
        }
      }
    } catch (storageError) {
      console.error('❌ Cache: Error saving to localStorage:', storageError);
      
      // If it's a quota error, try to clear some space
      if (storageError instanceof DOMException && 
          (storageError.name === 'QuotaExceededError' || 
           storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.log('⚠️ Cache: Storage quota exceeded, clearing old entries');
        try {
          clearOldestCacheEntries(0.3); // Clear 30% of entries
        } catch (clearError) {
          console.error('❌ Cache: Error clearing old cache entries:', clearError);
        }
      }
    }
  } catch (error) {
    console.error('❌ Cache: Error saving to cache:', error);
  }
};

// Get data from cache
export const getFromCache = (
  params: CacheKey
): AnimeResponse | UserRatingsResponse | null => {
  try {
    // Only use cache if we're in a browser environment
    if (!isBrowser()) {
      return null;
    }
    
    const key = generateCacheKey(params);
    
    let cachedData: string | null;
    try {
      cachedData = localStorage.getItem(key);
    } catch (storageError) {
      console.error('❌ Cache: Error accessing localStorage:', storageError);
      return null;
    }
    
    if (!cachedData) {
      return null;
    }
    
    let entry: CacheEntry;
    try {
      // Use decompressData to handle any compression
      entry = decompressData(cachedData);
    } catch (parseError) {
      console.error('❌ Cache: Error parsing cached data:', parseError);
      // Remove invalid cache entry
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.error('❌ Cache: Error removing invalid cache entry:', removeError);
      }
      return null;
    }
    
    // Check if the cache has expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRATION) {
      console.log('⏰ Cache: Entry expired for key:', key);
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.error('❌ Cache: Error removing expired cache entry:', removeError);
      }
      return null;
    }
    
    // Validate the cached data structure
    if (!entry.data || !entry.data.data || !entry.data.data.Page) {
      console.error('❌ Cache: Invalid data structure in cache');
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.error('❌ Cache: Error removing invalid cache entry:', removeError);
      }
      return null;
    }
    
    if (isUserRatingsKey(params)) {
      if ('mediaList' in entry.data.data.Page) {
        return entry.data as UserRatingsResponse;
      }
    } else {
      if ('media' in entry.data.data.Page) {
        return entry.data as AnimeResponse;
      }
    }
    
    // If we get here, the cache type doesn't match the expected type
    console.error('❌ Cache: Cache type mismatch, removing invalid entry');
    try {
      localStorage.removeItem(key);
    } catch (removeError) {
      console.error('❌ Cache: Error removing mismatched cache entry:', removeError);
    }
    return null;
  } catch (error) {
    console.error('❌ Cache: Error retrieving from cache:', error);
    return null;
  }
};

// Clear all cached anime data
export const clearCache = (): void => {
  if (!isBrowser()) return;
  
  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.warn('⚠️ localStorage is not available');
      return;
    }
    
    const clearKeys = (keyPrefix: string) => {
      const allKeys = Object.keys(localStorage);
      const cacheKeys = allKeys.filter(key => key.startsWith(keyPrefix));
      
      for (const key of cacheKeys) {
        localStorage.removeItem(key);
      }
      
      return cacheKeys.length;
    };
    
    // Clear anime API cache
    const animeCount = clearKeys('anilist_');
    
    // Clear user preference cache
    const userPrefsCount = clearKeys(USER_PREFERENCES_PREFIX);
    
    // Clear anime preference scores cache
    const animePrefsCount = clearKeys(ANIME_PREFERENCES_PREFIX);
    
    console.log(`🧹 Cleared ${animeCount} anime cache entries, ${userPrefsCount} user preference entries, and ${animePrefsCount} anime preference score entries`);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

/**
 * Clear all user ratings cache
 * This is useful when we update the GraphQL query and need to refresh all user data
 */
export const clearUserRatingsCache = (): void => {
  try {
    // Only clear cache if we're in a browser environment
    if (!isBrowser()) return;
    
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Filter keys that are related to user ratings
    const userKeys = keys.filter(key => 
      key.startsWith(COMPLETE_USER_PREFIX) || 
      key.startsWith('anilist_user_')
    );
    
    // Remove all user ratings cache entries
    userKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`🧹 Cleared ${userKeys.length} user ratings cache entries`);
  } catch (error) {
    console.error('Error clearing user ratings cache:', error);
  }
};

// Get cache stats (for debugging)
export const getCacheStats = (): { count: number; size: number; keys: string[] } => {
  try {
    // Only get stats if we're in a browser environment
    if (!isBrowser()) {
      return { count: 0, size: 0, keys: [] };
    }
    
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Filter keys that start with 'anilist_'
    const anilistKeys = keys.filter(key => key.startsWith('anilist_'));
    
    // Calculate total size
    let totalSize = 0;
    anilistKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length * 2; // Each character is 2 bytes
      }
    });
    
    return {
      count: anilistKeys.length,
      size: totalSize,
      keys: anilistKeys
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { count: 0, size: 0, keys: [] };
  }
};

// Clear oldest cache entries to make space
export const clearOldestCacheEntries = (percentageToClear: number = 0.2): void => {
  try {
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Filter keys that start with 'anilist_'
    const anilistKeys = keys.filter(key => key.startsWith('anilist_'));
    
    if (anilistKeys.length === 0) return;
    
    // Get entries with timestamps and sizes
    const entries: { key: string; timestamp: number; size: number }[] = [];
    
    anilistKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          // Calculate size in bytes (2 bytes per character for UTF-16)
          const size = item.length * 2;
          
          try {
            const parsed = JSON.parse(item);
            if (parsed && parsed.timestamp) {
              entries.push({ key, timestamp: parsed.timestamp, size });
            } else {
              // If no timestamp, consider it old and eligible for removal
              entries.push({ key, timestamp: 0, size });
            }
          } catch (parseError) {
            // If we can't parse, consider it for removal with priority
            entries.push({ key, timestamp: 0, size });
          }
        }
      } catch (error) {
        // If we can't access an entry, consider it for removal
        entries.push({ key, timestamp: 0, size: 0 });
      }
    });
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate how many entries to remove
    const removeCount = Math.max(1, Math.ceil(entries.length * percentageToClear));
    
    // Calculate total size being cleared
    let clearedSize = 0;
    for (let i = 0; i < removeCount; i++) {
      if (i < entries.length) {
        clearedSize += entries[i].size;
        try {
          localStorage.removeItem(entries[i].key);
          console.log(`🗑️ Removed cache entry: ${entries[i].key} (${(entries[i].size / 1024).toFixed(1)}KB)`);
        } catch (error) {
          console.error(`❌ Failed to remove cache entry: ${entries[i].key}`, error);
        }
      }
    }
    
    console.log(`⚠️ Cache: Removed ${removeCount} oldest entries (${(clearedSize / 1024).toFixed(1)}KB) to free up space`);
  } catch (error) {
    console.error('❌ Cache: Error clearing oldest cache entries:', error);
  }
};

/**
 * Save calculated anime preference scores to cache
 * 
 * @param animeId Anime ID to use as part of the cache key 
 * @param usernames List of usernames included in the calculation
 * @param preferenceScores Preference scores data to cache
 */
export const saveAnimePreferenceScores = (
  animeId: number,
  usernames: string[],
  preferenceScores: any
): void => {
  if (!isBrowser()) return;
  
  try {
    // Sort usernames to ensure consistent keys
    const sortedUsernames = [...usernames].sort().join(',');
    const key = `${ANIME_PREFERENCES_PREFIX}${animeId}_${sortedUsernames}`;
    
    const entry = {
      data: preferenceScores,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(entry));
    console.log(`💾 Saved anime preference scores to cache: anime ${animeId} for users [${sortedUsernames}]`);
  } catch (error) {
    console.error('❌ Error saving anime preference scores:', error);
  }
};

/**
 * Get anime preference scores from cache
 * 
 * @param animeId Anime ID to use as part of the cache key
 * @param usernames List of usernames included in the calculation
 * @returns Preference scores or null if not found or expired
 */
export const getAnimePreferenceScores = (
  animeId: number,
  usernames: string[]
): any | null => {
  if (!isBrowser()) return null;
  
  try {
    // Sort usernames to ensure consistent keys
    const sortedUsernames = [...usernames].sort().join(',');
    const key = `${ANIME_PREFERENCES_PREFIX}${animeId}_${sortedUsernames}`;
    
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;
    
    try {
      const entry = JSON.parse(cachedData);
      
      // Check if the cache has expired
      if (Date.now() - entry.timestamp > CACHE_EXPIRATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return entry.data;
    } catch (e) {
      console.error('❌ Error parsing anime preference scores:', e);
      localStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting anime preference scores:', error);
    return null;
  }
};

/**
 * Clear anime preference scores cache
 */
export const clearAnimePreferenceScores = (): void => {
  if (!isBrowser()) return;
  
  try {
    const keysToRemove: string[] = [];
    
    // Find all anime preference score cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(ANIME_PREFERENCES_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all found keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`🧹 Cleared ${keysToRemove.length} anime preference score cache entries`);
  } catch (error) {
    console.error('❌ Error clearing anime preference scores cache:', error);
  }
};

/**
 * Analyzes localStorage usage and returns statistics
 * This helps identify which keys are using the most space
 * @returns Object with storage statistics
 */
export const analyzeStorageUsage = (): {
  totalSize: number;
  percentUsed: number;
  itemCount: number;
  categoryStats: Record<string, { count: number; size: number }>;
  largestItems: Array<{ key: string; size: number; lastModified: number | null }>;
} => {
  try {
    if (!isBrowser()) {
      return {
        totalSize: 0,
        percentUsed: 0,
        itemCount: 0,
        categoryStats: {},
        largestItems: []
      };
    }
    
    const keys = Object.keys(localStorage);
    const itemCount = keys.length;
    
    let totalSize = 0;
    const categoryStats: Record<string, { count: number; size: number }> = {};
    const sizeByKey: Array<{ key: string; size: number; lastModified: number | null }> = [];
    
    // Process each key
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (!value) return;
      
      // Calculate size (2 bytes per character for UTF-16)
      const size = value.length * 2;
      totalSize += size;
      
      // Get last modified time if available
      let lastModified: number | null = null;
      try {
        const parsed = JSON.parse(value);
        if (parsed && parsed.timestamp) {
          lastModified = parsed.timestamp;
        }
      } catch (e) {
        // Not a JSON value or doesn't have timestamp
      }
      
      // Add to size by key list
      sizeByKey.push({ key, size, lastModified });
      
      // Categorize by prefix
      let category = 'other';
      if (key.startsWith('anilist_user_prefs_')) {
        category = 'User Preferences';
      } else if (key.startsWith('anilist_anime_prefs_')) {
        category = 'Anime Preferences';
      } else if (key.startsWith('anilist_complete_user_')) {
        category = 'Complete User Data';
      } else if (key.startsWith('anilist_user_')) {
        category = 'User Ratings';
      } else if (key.startsWith('anilist_')) {
        category = 'Anime Data';
      }
      
      // Update category stats
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, size: 0 };
      }
      categoryStats[category].count += 1;
      categoryStats[category].size += size;
    });
    
    // Sort items by size (largest first)
    sizeByKey.sort((a, b) => b.size - a.size);
    
    // Get top 10 largest items
    const largestItems = sizeByKey.slice(0, 10);
    
    // Estimate percentage used (5MB is typical localStorage limit)
    const percentUsed = (totalSize / (5 * 1024 * 1024)) * 100;
    
    return {
      totalSize,
      percentUsed,
      itemCount,
      categoryStats,
      largestItems
    };
  } catch (error) {
    console.error('❌ Error analyzing storage usage:', error);
    return {
      totalSize: 0,
      percentUsed: 0,
      itemCount: 0,
      categoryStats: {},
      largestItems: []
    };
  }
};

/**
 * Print storage usage information to console
 * Helpful for debugging storage issues
 */
export const logStorageInfo = (): void => {
  try {
    if (!isBrowser()) return;
    
    const stats = analyzeStorageUsage();
    
    console.group('📊 LocalStorage Usage Analysis');
    console.log(`Total size: ${(stats.totalSize / 1024).toFixed(1)}KB (${stats.percentUsed.toFixed(1)}% of 5MB limit)`);
    console.log(`Total items: ${stats.itemCount}`);
    
    console.group('By Category:');
    Object.entries(stats.categoryStats).forEach(([category, { count, size }]) => {
      console.log(`${category}: ${count} items, ${(size / 1024).toFixed(1)}KB (${((size / stats.totalSize) * 100).toFixed(1)}%)`);
    });
    console.groupEnd();
    
    console.group('Largest Items:');
    stats.largestItems.forEach(({ key, size, lastModified }) => {
      const date = lastModified ? new Date(lastModified).toLocaleString() : 'unknown';
      console.log(`${key}: ${(size / 1024).toFixed(1)}KB, last modified: ${date}`);
    });
    console.groupEnd();
    
    console.groupEnd();
  } catch (error) {
    console.error('❌ Error logging storage info:', error);
  }
};

/**
 * Clear ALL localStorage data - creates a completely clean slate
 * Use this function with caution as it removes ALL localStorage items
 */
export const clearAllLocalStorage = (): void => {
  if (!isBrowser()) return;
  
  try {
    console.log('🧹 Clearing ALL localStorage data for a clean slate');
    localStorage.clear();
    console.log('✅ localStorage completely cleared');
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
}; 