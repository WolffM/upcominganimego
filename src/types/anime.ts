// Main anime data interfaces
export interface Anime {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    medium: string | null;
    color: string | null;
  };
  bannerImage: string | null;
  trailer: {
    id: string | null;
    site: string | null;
    thumbnail: string | null;
  } | null;
  season: string | null;
  seasonYear: number | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  genres: string[] | null;
  tags: {
    id: number;
    name: string;
    description: string;
    category: string;
    rank: number;
    isGeneralSpoiler: boolean;
    isMediaSpoiler: boolean;
    isAdult: boolean;
  }[] | null;
  averageScore: number | null;
  popularity: number | null;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  endDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  nextAiringEpisode: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  // Studio and staff data from the API
  studios?: {
    nodes: {
      id: number;
      name: string;
    }[];
  };
  staff?: {
    edges: {
      role: string;
      node: {
        id: number;
        name: {
          full: string;
        };
      };
    }[];
  };
  // User rating information if available
  userRating?: number;
  // Preference scores based on user ratings
  preferenceScores?: {
    // Individual scores by username
    users: {
      username: string;
      score: number;
      breakdown: {
        genre: number;
        studio: number;
        director: number;
        tags: number;
      };
    }[];
    // Combined score across all users
    combined: {
      score: number;
      breakdown: {
        genre: number;
        studio: number;
        director: number;
        tags: number;
      };
    };
    // Raw popularity score (logarithmic scale capped at 100)
    popularityScore: number;
  };
}

// API response interfaces
export interface AnimeResponse {
  data: {
    Page: {
      media: Anime[];
      pageInfo: PageInfo;
    };
  };
}

export interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage: number;
}

// User ratings interfaces
export interface UserRatingEntry {
  id: number;
  mediaId: number;
  score: number;
  media: Anime;
  user?: {
    name: string;
    id: number;
  };
}

export interface UserRatingsResponse {
  data: {
    Page: {
      mediaList: UserRatingEntry[];
      pageInfo: PageInfo;
    }
  };
}

// API data structure interfaces
export interface AnilistApiResponse {
  Page: {
    pageInfo: PageInfo;
    media: any[];
  };
}

export interface GraphQLUserRatingsResponse {
  Page: {
    mediaList: any[];
    pageInfo: PageInfo;
  };
}

export interface UserQueryResponse {
  User: {
    id: number;
    name: string;
  } | null;
}

// Cache-related interfaces
export interface AnimeCacheKey {
  season: AnimeSeason;
  year: number;
  page: number;
  perPage: number;
}

export interface UserRatingsCacheKey {
  userId: number;
  page: number;
  perPage: number;
}

export type CacheKey = AnimeCacheKey | UserRatingsCacheKey;

export interface CacheEntry {
  data: AnimeResponse | UserRatingsResponse;
  timestamp: number;
}

// Filter and sort interfaces
export interface SeasonInfo {
  season: string;
  year: number;
}

export interface FilterOptions {
  genre: string | null;
  format: string | null;
  searchQuery: string;
  year: number;
  season: AnimeSeason;
}

// Enums
export enum AnimeSeason {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL'
}

export enum SortOption {
  POPULARITY = 'popularity',
  RELEASE_DATE = 'releaseDate',
  COMBINED_PREFERENCE = 'combinedPreference',
  USER_PREFERENCE_PREFIX = 'userPreference:'
}

// User ratings statistics interface
export interface RatingStats {
  count: number;
  averageScore: number;
  highestRated: {
    anime: Anime;
    score: number;
  } | null;
  lowestRated: {
    anime: Anime;
    score: number;
  } | null;
  preferredGenres: Array<{
    genre: string;
    count: number;
    percentage: number;
  }>;
}

// Constants
export const ANIME_FORMATS = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'];
export const MAX_REASONABLE_PAGES = 10;
export const MAX_PAGE_SIZE = 50; // Maximum supported by AniList API
export const MAX_PAGES_TO_FETCH = 10; // Safety limit to prevent excessive API calls 