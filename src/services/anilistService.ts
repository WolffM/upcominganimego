/**
 * AniList Service - Central module for AniList API interaction
 * 
 * This file re-exports functionality from specialized modules to maintain
 * backward compatibility while keeping the codebase modular and maintainable.
 */

// Re-export constants
export {
  ANILIST_API_URL
} from './anilistConstants';

export {
  AnimeSeason,
  MAX_PAGE_SIZE,
  MAX_PAGES_TO_FETCH
} from '@/types/anime';

// Re-export helper functions
export {
  getCurrentSeason,
  getNextSeason,
  normalizeUsername,
  getTrailerEmbedUrl
} from './anilistHelpers';

// Re-export anime-related functionality
export {
  fetchUpcomingAnime
} from './anilistAnimeService';

// Re-export user-related functionality
export {
  fetchUserIdByName,
  fetchUserRatedAnime,
  fetchUserRatedAnimeByName
} from './anilistUserService';
