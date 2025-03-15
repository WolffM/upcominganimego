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
  return typeof window !== 'undefined';
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
      const serialized = JSON.stringify(entry);
      localStorage.setItem(key, serialized);
      
      if (isUserRatingsKey(params)) {
        console.log('💾 Cached user ratings data for user ID:', params.userId);
      } else {
        console.log('💾 Cached anime data for season:', params.season, params.year);
      }
    } catch (storageError) {
      console.error('❌ Cache: Error saving to localStorage:', storageError);
      
      // If it's a quota error, try to clear some space
      if (storageError instanceof DOMException && 
          (storageError.name === 'QuotaExceededError' || 
           storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.log('⚠️ Cache: Storage quota exceeded, clearing old entries');
        try {
          clearOldestCacheEntries();
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
      entry = JSON.parse(cachedData);
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
  try {
    // Only clear cache if we're in a browser environment
    if (!isBrowser()) return;
    
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Filter keys that start with 'anilist_'
    const anilistKeys = keys.filter(key => key.startsWith('anilist_'));
    
    // Remove all anilist cache entries
    anilistKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`🧹 Cleared ${anilistKeys.length} cache entries`);
  } catch (error) {
    console.error('Error clearing cache:', error);
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
const clearOldestCacheEntries = (): void => {
  try {
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Filter keys that start with 'anilist_'
    const anilistKeys = keys.filter(key => key.startsWith('anilist_'));
    
    if (anilistKeys.length === 0) return;
    
    // Get entries with timestamps
    const entries: { key: string; timestamp: number }[] = [];
    
    anilistKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed && parsed.timestamp) {
            entries.push({ key, timestamp: parsed.timestamp });
          }
        }
      } catch (error) {
        // If we can't parse an entry, consider it for removal
        entries.push({ key, timestamp: 0 });
      }
    });
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove the oldest 20% of entries
    const removeCount = Math.max(1, Math.ceil(entries.length * 0.2));
    console.log(`⚠️ Cache: Removing ${removeCount} oldest entries to free up space`);
    
    for (let i = 0; i < removeCount; i++) {
      if (i < entries.length) {
        localStorage.removeItem(entries[i].key);
      }
    }
  } catch (error) {
    console.error('❌ Cache: Error clearing oldest cache entries:', error);
  }
}; 