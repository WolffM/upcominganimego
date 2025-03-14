import { request, gql } from 'graphql-request';
import { AnimeResponse } from '@/types/anime';
import { logger } from '@/utils/logger';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// GraphQL query to fetch upcoming anime with trailers
// Updated based on AniList API documentation
const UPCOMING_ANIME_QUERY = gql`
  query UpcomingAnime($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $sort: [MediaSort]) {
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
        endDate {
          year
          month
          day
        }
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
        studios {
          nodes {
            id
            name
          }
        }
        staff {
          edges {
            role
            node {
              id
              name {
                full
              }
            }
          }
        }
        isAdult
      }
    }
  }
`;

// Updated interface to match the actual API response structure
interface AnilistApiResponse {
  Page: {
    pageInfo: {
      total: number;
      currentPage: number;
      lastPage: number;
      hasNextPage: boolean;
      perPage: number;
    };
    media: any[];
  };
}

export const fetchUpcomingAnime = async (page = 1, perPage = 20): Promise<AnimeResponse> => {
  try {
    logger.info(`Fetching upcoming anime for page ${page} with ${perPage} items per page`, 'AnilistService');
    
    // Get current date information
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Determine current season
    const month = today.getMonth() + 1; // JavaScript months are 0-indexed
    let currentSeason;
    if (month >= 3 && month <= 5) currentSeason = 'SPRING';
    else if (month >= 6 && month <= 8) currentSeason = 'SUMMER';
    else if (month >= 9 && month <= 11) currentSeason = 'FALL';
    else currentSeason = 'WINTER';
    
    // Calculate next season and year
    let nextSeason;
    let nextSeasonYear = currentYear;
    
    switch (currentSeason) {
      case 'WINTER':
        nextSeason = 'SPRING';
        break;
      case 'SPRING':
        nextSeason = 'SUMMER';
        break;
      case 'SUMMER':
        nextSeason = 'FALL';
        break;
      case 'FALL':
        nextSeason = 'WINTER';
        nextSeasonYear = currentYear + 1;
        break;
    }
    
    logger.debug(`Current season: ${currentSeason} ${currentYear}, Next season: ${nextSeason} ${nextSeasonYear}`, 'AnilistService');
    
    const variables = {
      page,
      perPage,
      season: nextSeason,
      seasonYear: nextSeasonYear,
      sort: ['POPULARITY_DESC', 'START_DATE']
    };
    
    // Log the full request for debugging
    logger.debug(`Sending GraphQL request to ${ANILIST_API_URL}`, 'AnilistService', {
      query: UPCOMING_ANIME_QUERY.toString(),
      variables
    });
    
    // Get the direct response from the API
    const directResponse = await request<AnilistApiResponse>(ANILIST_API_URL, UPCOMING_ANIME_QUERY, variables);
    
    // Validate response structure
    if (!directResponse || typeof directResponse !== 'object') {
      throw new Error(`Invalid response format: ${JSON.stringify(directResponse)}`);
    }
    
    // Log the raw response for debugging
    logger.debug('Raw API response received', 'AnilistService', directResponse);
    
    // Check if the response has the expected structure
    if (!directResponse.Page) {
      throw new Error(`Response missing Page property: ${JSON.stringify(directResponse)}`);
    }
    
    if (!Array.isArray(directResponse.Page.media)) {
      throw new Error(`Response media is not an array: ${JSON.stringify(directResponse.Page)}`);
    }
    
    // Convert the direct response to our expected AnimeResponse format
    const response: AnimeResponse = {
      data: {
        Page: directResponse.Page
      }
    };
    
    logger.info(`Successfully fetched ${response.data.Page.media.length} anime for page ${page}`, 'AnilistService');
    logger.debug(`Page info: ${JSON.stringify(response.data.Page.pageInfo)}`, 'AnilistService');
    
    // Log how many anime have trailers
    const animeWithTrailers = response.data.Page.media.filter(anime => 
      anime.trailer && anime.trailer.id && anime.trailer.site
    ).length;
    
    logger.info(`Found ${animeWithTrailers} anime with trailers out of ${response.data.Page.media.length}`, 'AnilistService');
    
    return response;
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Error fetching upcoming anime: ${errorMessage}`, 'AnilistService', {
      error,
      stack: errorStack,
      page,
      perPage
    });
    
    // Create a fallback response with empty data to prevent null reference errors
    const fallbackResponse: AnimeResponse = {
      data: {
        Page: {
          media: [],
          pageInfo: {
            total: 0,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false,
            perPage: perPage
          }
        }
      }
    };
    
    // In development, throw the error for debugging
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    
    // In production, return the fallback response
    logger.info('Returning fallback empty response', 'AnilistService');
    return fallbackResponse;
  }
};

// Function to get YouTube embed URL from trailer data
export const getTrailerEmbedUrl = (trailer: { id: string | null; site: string | null }, autoplay: boolean = false): string => {
  if (!trailer || !trailer.id || !trailer.site) {
    logger.warn('Missing trailer data', 'AnilistService');
    return '';
  }
  
  const { id, site } = trailer;
  logger.debug(`Getting trailer embed URL for ID: ${id}, site: ${site}, autoplay: ${autoplay}`, 'AnilistService');
  
  const autoplayParam = autoplay ? '?autoplay=1&mute=0' : '';
  
  if (site.toLowerCase() === 'youtube') {
    return `https://www.youtube.com/embed/${id}${autoplayParam}`;
  } else if (site.toLowerCase() === 'dailymotion') {
    return `https://www.dailymotion.com/embed/video/${id}${autoplayParam}`;
  }
  
  logger.warn(`Unsupported trailer site: ${site}`, 'AnilistService');
  return '';
}; 