import { request, gql } from 'graphql-request';
import { logger } from './logger';
import { Anime } from '@/types/anime';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Define types for API responses
interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage: number;
}

interface UpcomingAnimeResponse {
  Page: {
    pageInfo: PageInfo;
    media: Anime[];
  };
}

interface SearchAnimeResponse {
  Page: {
    media: Anime[];
  };
}

interface AnimeByIdResponse {
  Media: Anime;
}

// Test query based on AniList documentation for upcoming anime
const TEST_UPCOMING_ANIME_QUERY = gql`
  query UpcomingAnimeTest($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(
        type: ANIME
        format_in: [TV, MOVIE, OVA]
        season: $season
        seasonYear: $seasonYear
        sort: $sort
      ) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          large
          medium
          color
        }
        bannerImage
        trailer {
          id
          site
          thumbnail
        }
        season
        seasonYear
        format
        status
        episodes
        duration
        genres
        tags {
          id
          name
          description
          category
          rank
          isGeneralSpoiler
          isMediaSpoiler
          isAdult
        }
        averageScore
        popularity
        startDate {
          year
          month
          day
        }
      }
    }
  }
`;

// Test query for searching anime by title
const TEST_SEARCH_ANIME_QUERY = gql`
  query SearchAnime($search: String!) {
    Page(page: 1, perPage: 10) {
      media(search: $search, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        trailer {
          id
          site
          thumbnail
        }
      }
    }
  }
`;

// Test query for getting anime by ID
const TEST_ANIME_BY_ID_QUERY = gql`
  query AnimeById($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description
      trailer {
        id
        site
        thumbnail
      }
    }
  }
`;

export const testUpcomingAnimeQuery = async () => {
  try {
    logger.info('Testing upcoming anime query', 'ApiTester');
    
    // Get current season and year
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Determine current season
    const month = today.getMonth() + 1;
    let currentSeason;
    if (month >= 3 && month <= 5) currentSeason = 'SPRING';
    else if (month >= 6 && month <= 8) currentSeason = 'SUMMER';
    else if (month >= 9 && month <= 11) currentSeason = 'FALL';
    else currentSeason = 'WINTER';
    
    const variables = {
      page: 1,
      perPage: 10,
      season: currentSeason,
      seasonYear: currentYear,
      sort: ['POPULARITY_DESC', 'START_DATE']
    };
    
    logger.debug('Test query variables', 'ApiTester', variables);
    
    const response = await request<UpcomingAnimeResponse>(ANILIST_API_URL, TEST_UPCOMING_ANIME_QUERY, variables);
    
    logger.info(`Test successful! Found ${response.Page.media.length} anime`, 'ApiTester');
    logger.debug('Page info', 'ApiTester', response.Page.pageInfo);
    
    // Check for trailers
    const animeWithTrailers = response.Page.media.filter(anime => 
      anime.trailer && anime.trailer.id && anime.trailer.site
    ).length;
    
    logger.info(`Found ${animeWithTrailers} anime with trailers out of ${response.Page.media.length}`, 'ApiTester');
    
    return {
      success: true,
      data: response,
      message: 'Upcoming anime query test successful'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Test failed: ${errorMessage}`, 'ApiTester', error);
    
    return {
      success: false,
      error,
      message: `Test failed: ${errorMessage}`
    };
  }
};

export const testSearchAnimeQuery = async (searchTerm: string) => {
  try {
    logger.info(`Testing search anime query with term: "${searchTerm}"`, 'ApiTester');
    
    const variables = {
      search: searchTerm
    };
    
    const response = await request<SearchAnimeResponse>(ANILIST_API_URL, TEST_SEARCH_ANIME_QUERY, variables);
    
    logger.info(`Test successful! Found ${response.Page.media.length} anime matching "${searchTerm}"`, 'ApiTester');
    
    return {
      success: true,
      data: response,
      message: 'Search anime query test successful'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Test failed: ${errorMessage}`, 'ApiTester', error);
    
    return {
      success: false,
      error,
      message: `Test failed: ${errorMessage}`
    };
  }
};

export const testAnimeByIdQuery = async (animeId: number) => {
  try {
    logger.info(`Testing anime by ID query with ID: ${animeId}`, 'ApiTester');
    
    const variables = {
      id: animeId
    };
    
    const response = await request<AnimeByIdResponse>(ANILIST_API_URL, TEST_ANIME_BY_ID_QUERY, variables);
    
    logger.info(`Test successful! Found anime: ${response.Media.title.english || response.Media.title.romaji}`, 'ApiTester');
    
    return {
      success: true,
      data: response,
      message: 'Anime by ID query test successful'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Test failed: ${errorMessage}`, 'ApiTester', error);
    
    return {
      success: false,
      error,
      message: `Test failed: ${errorMessage}`
    };
  }
};

// Export a function to run all tests
export const runAllTests = async () => {
  const results = {
    upcomingAnime: await testUpcomingAnimeQuery(),
    searchAnime: await testSearchAnimeQuery('Attack on Titan'),
    animeById: await testAnimeByIdQuery(1) // Cowboy Bebop
  };
  
  logger.info('All tests completed', 'ApiTester', {
    upcomingAnimeSuccess: results.upcomingAnime.success,
    searchAnimeSuccess: results.searchAnime.success,
    animeByIdSuccess: results.animeById.success
  });
  
  return results;
}; 