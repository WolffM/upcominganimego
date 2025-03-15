import { request } from 'graphql-request';
import { 
  UserRatingsResponse, 
  GraphQLUserRatingsResponse, 
  UserQueryResponse,
  MAX_PAGE_SIZE,
  MAX_PAGES_TO_FETCH
} from '@/types/anime';
import { 
  getFromCache, 
  saveToCache, 
  getCompleteUserRatings,
  saveCompleteUserRatings
} from './cacheService';
import { 
  ANILIST_API_URL, 
  USER_BY_NAME_QUERY, 
  USER_RATINGS_QUERY
} from './anilistConstants';
import { normalizeUsername } from './anilistHelpers';

/**
 * Fetches user ID from AniList API using username
 * @param username AniList username
 * @returns Promise with user ID or null if not found
 */
export const fetchUserIdByName = async (username: string): Promise<number | null> => {
  console.log('📡 Fetching user ID for username:', username);
  
  try {
    const variables = {
      name: username
    };
    
    const response = await request<UserQueryResponse>(ANILIST_API_URL, USER_BY_NAME_QUERY, variables);
    
    if (response && response.User && response.User.id) {
      console.log('✅ Found user ID:', response.User.id);
      return response.User.id;
    } else {
      console.log('⚠️ No user found with username:', username);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching user ID by username:', error);
    return null;
  }
};

/**
 * Fetches user rated anime list from AniList API
 * @param userId AniList user ID
 * @param page Page number to fetch
 * @param perPage Number of items per page
 * @returns Promise with user ratings response data
 */
export const fetchUserRatedAnime = async (
  userId: number,
  page = 1,
  perPage = 50
): Promise<UserRatingsResponse> => {
  // AniList API allows up to 50 items per page, so this is optimal
  const adjustedPerPage = Math.min(perPage, MAX_PAGE_SIZE);
  
  console.log('📡 Fetching user ratings for user ID:', userId, 'page:', page);
  
  try {
    // Prepare variables for the GraphQL query
    const variables = {
      userId,
      page,
      perPage: adjustedPerPage
    };
    
    // Check if we have cached data for this query
    const cacheParams = {
      userId,
      page,
      perPage: adjustedPerPage
    };
    
    const cachedData = getFromCache(cacheParams);
    
    // If we have valid cached data, return it
    if (cachedData && 'mediaList' in cachedData.data.Page) {
      console.log('🔄 Using cached user ratings data');
      return cachedData as UserRatingsResponse;
    }
    
    // No cached data, make the API request
    console.log('🔄 Fetching user ratings from API');
    
    // Make the request to the AniList API
    const rawResponse = await request<GraphQLUserRatingsResponse>(ANILIST_API_URL, USER_RATINGS_QUERY, variables);
    
    // Check if the response is valid and has the expected structure
    if (!rawResponse) {
      throw new Error('Null response received from API');
    }
    
    if (!rawResponse.Page || !rawResponse.Page.mediaList) {
      throw new Error('Invalid response format: missing Page or mediaList');
    }
    
    // Convert to our expected format
    const response: UserRatingsResponse = {
      data: {
        Page: rawResponse.Page
      }
    };
    
    // Save the response to cache
    saveToCache(cacheParams, response);
    
    console.log('✅ Fetched user ratings:', rawResponse.Page.mediaList.length, 'items');
    return response;
  } catch (error) {
    console.error("❌ Error fetching user ratings data:", error);
    
    // Create a fallback response with empty data to prevent null reference errors
    const fallbackResponse: UserRatingsResponse = {
      data: {
        Page: {
          mediaList: [],
          pageInfo: {
            total: 0,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false,
            perPage: adjustedPerPage
          }
        }
      }
    };
    
    return fallbackResponse;
  }
};

/**
 * Fetches user rated anime list from AniList API by username
 * @param username AniList username
 * @param page Page number to fetch (used internally for pagination)
 * @param perPage Number of items per page (maximum 50 is recommended)
 * @returns Promise with user ratings response data including all available ratings
 * 
 * This function will fetch all available ratings for a user by making multiple API calls if necessary.
 * It stops fetching in any of these cases:
 * 1. When an empty or partial page is received (fewer items than requested)
 * 2. When the maximum page limit is reached (to prevent excessive API calls)
 * 3. When the API indicates there are no more pages
 */
export const fetchUserRatedAnimeByName = async (
  username: string,
  page = 1,
  perPage = 50
): Promise<UserRatingsResponse> => {
  console.log('📡 Fetching ratings for username:', username);
  
  try {
    // Normalize the username
    const normalizedUsername = normalizeUsername(username);
    
    if (normalizedUsername !== username) {
      console.log('📝 Normalized username to:', normalizedUsername);
    }
    
    // First fetch the user ID
    const userId = await fetchUserIdByName(normalizedUsername);
    
    if (!userId) {
      console.error(`❌ User not found with username: ${normalizedUsername}`);
      
      // Return an empty response with appropriate structure instead of throwing
      return {
        data: {
          Page: {
            mediaList: [],
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
    }
    
    // Check if we already have complete data for this user in the cache
    console.log('🔍 Checking for cached complete user ratings');
    const cachedCompleteData = getCompleteUserRatings(userId);
    
    if (cachedCompleteData && 
        cachedCompleteData.data && 
        cachedCompleteData.data.Page && 
        cachedCompleteData.data.Page.mediaList && 
        cachedCompleteData.data.Page.mediaList.length > 0) {
      console.log(`🔄 Using cached complete ratings (${cachedCompleteData.data.Page.mediaList.length} items)`);
      return cachedCompleteData;
    }
    
    // Fetch first page of ratings to get total count and page info
    const firstPageData = await fetchUserRatedAnime(userId, 1, perPage);
    
    // If there's only one page, return the data directly
    if (!firstPageData.data.Page.pageInfo.hasNextPage) {
      console.log(`📊 All ratings fit in a single page (${firstPageData.data.Page.mediaList.length} items)`);
      return firstPageData;
    }
    
    // We need to fetch multiple pages
    const totalPages = firstPageData.data.Page.pageInfo.lastPage;
    
    // Set a reasonable limit to prevent excessive API calls
    const pagesLimit = Math.min(totalPages, MAX_PAGES_TO_FETCH);
    
    console.log(`📊 Fetching ratings across ${pagesLimit} pages...`);
    
    // Start with the ratings from the first page
    const allRatings = [...firstPageData.data.Page.mediaList];
    
    // Fetch remaining pages but stop if we get an empty page
    for (let currentPage = 2; currentPage <= pagesLimit; currentPage++) {
      console.log(`📊 Fetching page ${currentPage}/${pagesLimit}`);
      const pageData = await fetchUserRatedAnime(userId, currentPage, perPage);
      
      const pageRatings = pageData.data.Page.mediaList;
      
      // If we got an empty page or a page with fewer items than requested, we've reached the end
      if (!pageRatings || pageRatings.length === 0) {
        console.log(`📊 Reached end of data (empty page)`);
        break;
      }
      
      // Add the ratings from this page
      allRatings.push(...pageRatings);
      
      // If this page has fewer items than the page size, we've reached the end
      if (pageRatings.length < perPage) {
        console.log(`📊 Reached end of data (partial page with ${pageRatings.length} items)`);
        break;
      }
    }
    
    console.log(`✅ Successfully fetched all ${allRatings.length} ratings`);
    
    // Create a complete response with all ratings
    const completeResponse: UserRatingsResponse = {
      data: {
        Page: {
          mediaList: allRatings,
          pageInfo: {
            ...firstPageData.data.Page.pageInfo,
            currentPage: 1,
            hasNextPage: false,
            lastPage: 1
          }
        }
      }
    };
    
    // Cache the complete response to avoid fetching it again
    saveCompleteUserRatings(userId, completeResponse);
    
    return completeResponse;
  } catch (error: any) {
    console.error("❌ Error fetching user ratings:", error.message || error);
    
    // Create a fallback response with empty data
    const fallbackResponse: UserRatingsResponse = {
      data: {
        Page: {
          mediaList: [],
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