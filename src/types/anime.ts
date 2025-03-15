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
