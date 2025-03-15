import { request } from 'graphql-request';
import { AnimeResponse, AnilistApiResponse, AnimeSeason } from '@/types/anime';
import { getFromCache, saveToCache } from './cacheService';
import { 
  ANILIST_API_URL, 
  UPCOMING_ANIME_QUERY
} from './anilistConstants';
import { getNextSeason } from './anilistHelpers';

/**
 * Fetches upcoming anime from AniList API
 * @param page Page number to fetch
 * @param perPage Number of items per page
 * @param targetSeason Optional specific season to fetch
 * @param targetYear Optional specific year to fetch
 * @returns Promise with anime response data
 */
export const fetchUpcomingAnime = async (
  page = 1, 
  perPage = 20,
  targetSeason?: AnimeSeason,
  targetYear?: number
): Promise<AnimeResponse> => {
  // Use provided season/year or get the next season
  const { season, year } = targetSeason && targetYear 
    ? { season: targetSeason, year: targetYear }
    : getNextSeason();
  
  console.log('📡 AnilistService: Fetching anime for', { season, year, page, perPage });
  
  try {
    // Prepare variables for the GraphQL query
    const variables: any = {
      page,
      perPage,
      season,
      seasonYear: year,
      sort: ['POPULARITY_DESC', 'START_DATE'],
      // Include all common formats by default
      format_in: ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL']
    };
    
    // Check if we have cached data for this query
    const cacheParams = {
      season,
      year,
      page,
      perPage
    };
    
    const cachedData = getFromCache(cacheParams);
    
    // If we have valid cached data, return it
    if (cachedData && 'media' in cachedData.data.Page) {
      console.log('🔄 Using cached data with', cachedData.data.Page.media.length, 'anime items');
      return cachedData as AnimeResponse;
    }
    
    // No cached data, make the API request
    console.log('🔄 Fetching anime data from API');
    
    // Get the direct response from the API
    const directResponse = await request<AnilistApiResponse>(ANILIST_API_URL, UPCOMING_ANIME_QUERY, variables);
    
    // Validate response structure
    if (!directResponse || typeof directResponse !== 'object') {
      throw new Error(`Invalid response format: ${JSON.stringify(directResponse)}`);
    }
    
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
    
    // Save the response to cache
    saveToCache(cacheParams, response);
    
    console.log('✅ Successfully fetched', directResponse.Page.media.length, 'anime items');
    return response;
  } catch (error) {
    console.error("❌ Error fetching anime data:", error);
    
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
    
    return fallbackResponse;
  }
}; 