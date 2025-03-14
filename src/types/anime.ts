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
  // Custom fields for our application
  rank?: number; // Calculated rank based on our algorithm
  rankingScore?: number; // Numerical score used for ranking
  
  // User-specific ranking fields
  hadokuRank?: number; // Rank based on Hadoku's preferences
  hadokuScore?: number; // Score based on Hadoku's preferences
  littlemissRank?: number; // Rank based on LittleMiss's preferences
  littlemissScore?: number; // Score based on LittleMiss's preferences
  combinedRank?: number; // Combined rank from both users
  combinedScore?: number; // Combined score from both users
  
  // Individual user ranking factors
  hadokuFactors?: {
    studioScore: number;
    directorScore: number;
    genreScore: number;
    tagScore: number;
    popularityBonus: number;
  };
  
  littlemissFactors?: {
    studioScore: number;
    directorScore: number;
    genreScore: number;
    tagScore: number;
    popularityBonus: number;
  };
  
  // Top pick indicators
  isHadokuTopPick?: boolean;
  isLittlemissTopPick?: boolean;
  
  // Studio, director, and other metadata for ranking
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
  
  rankingFactors?: {
    trailerQuality?: number;
    popularity: number;
    anticipation?: number;
    genreRelevance: number;
    staffRating?: number;
    studioScore?: number;
    directorScore?: number;
    genreScore?: number;
    tagScore?: number;
  };
}

export interface AnimeResponse {
  data: {
    Page: {
      media: Anime[];
      pageInfo: {
        total: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
        perPage: number;
      };
    };
  };
} 