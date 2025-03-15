import { request, gql } from 'graphql-request';
import { AnimeResponse } from '@/types/anime';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Enum for anime seasons
export enum AnimeSeason {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL'
}

// GraphQL query to fetch upcoming anime with trailers
const UPCOMING_ANIME_QUERY = gql`
  query UpcomingAnime($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $sort: [MediaSort], $format_in: [MediaFormat], $genre_in: [String]) {
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
        format_in: $format_in
        genre_in: $genre_in
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
          extraLarge
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

/**
 * Get current anime season based on date
 * @returns Object containing current season and year
 */
export function getCurrentSeason(): { season: AnimeSeason; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const year = now.getFullYear();

  // Determine season based on month
  let season: AnimeSeason;
  if (month >= 3 && month <= 5) {
    season = AnimeSeason.SPRING;
  } else if (month >= 6 && month <= 8) {
    season = AnimeSeason.SUMMER;
  } else if (month >= 9 && month <= 11) {
    season = AnimeSeason.FALL;
  } else {
    season = AnimeSeason.WINTER;
  }

  return { season, year };
}

/**
 * Get next anime season after the current one
 * @returns Object containing next season and year
 */
export function getNextSeason(): { season: AnimeSeason; year: number } {
  const { season, year } = getCurrentSeason();
  
  let nextSeason: AnimeSeason;
  let nextYear = year;
  
  switch (season) {
    case AnimeSeason.WINTER:
      nextSeason = AnimeSeason.SPRING;
      break;
    case AnimeSeason.SPRING:
      nextSeason = AnimeSeason.SUMMER;
      break;
    case AnimeSeason.SUMMER:
      nextSeason = AnimeSeason.FALL;
      break;
    case AnimeSeason.FALL:
      nextSeason = AnimeSeason.WINTER;
      nextYear = year + 1;
      break;
    default:
      nextSeason = AnimeSeason.SPRING;
  }
  
  return { season: nextSeason, year: nextYear };
}

// Interface for the raw API response
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

/**
 * Fetches upcoming anime from AniList API
 * @param page Page number to fetch
 * @param perPage Number of items per page
 * @param targetSeason Optional specific season to fetch
 * @param targetYear Optional specific year to fetch
 * @param format Optional specific format to fetch (TV, MOVIE, OVA, etc)
 * @param genre Optional specific genre to fetch
 * @returns Promise with anime response data
 */
export const fetchUpcomingAnime = async (
  page = 1, 
  perPage = 20,
  targetSeason?: AnimeSeason,
  targetYear?: number,
  format?: string | null,
  genre?: string | null
): Promise<AnimeResponse> => {
  try {
    // Use provided season/year or get the next season
    const { season, year } = targetSeason && targetYear 
      ? { season: targetSeason, year: targetYear }
      : getNextSeason();
    
    // Prepare variables for the GraphQL query
    const variables: any = {
      page,
      perPage,
      season,
      seasonYear: year,
      sort: ['POPULARITY_DESC', 'START_DATE']
    };
    
    // Add format filter if provided
    if (format && format !== 'all') {
      // Pass as an array with a single value
      variables.format_in = [format];
      console.log('🔍 Adding format filter:', format);
    } else {
      // If no specific format is requested, include all common formats
      variables.format_in = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'];
      console.log('🔍 Using default formats');
    }
    
    // Add genre filter if provided
    if (genre && genre !== 'all') {
      variables.genre_in = [genre]; // Pass as an array
      console.log('🔍 Adding genre filter:', genre);
    }
    
    console.log('📊 Fetching anime with variables:', JSON.stringify(variables, null, 2));
    
    // Get the direct response from the API
    const directResponse = await request<AnilistApiResponse>(ANILIST_API_URL, UPCOMING_ANIME_QUERY, variables);
    
    // Log the raw response for debugging
    console.log('📊 Raw API response:', JSON.stringify({
      pageInfo: directResponse.Page.pageInfo,
      mediaCount: directResponse.Page.media.length
    }, null, 2));
    
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
    
    return response;
  } catch (error) {
    console.error("Error fetching anime data:", error);
    
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

/**
 * Get a proper embed URL for a video trailer
 * @param trailer Trailer object with ID and site
 * @param autoplay Whether to autoplay the video
 * @returns Properly formatted embed URL
 */
export const getTrailerEmbedUrl = (
  trailer: { id: string | null; site: string | null }, 
  autoplay: boolean = false
): string => {
  if (!trailer || !trailer.id || !trailer.site) {
    return '';
  }
  
  const { id, site } = trailer;
  const autoplayParam = autoplay ? '?autoplay=1&mute=0' : '';
  
  const siteLower = site.toLowerCase();
  
  if (siteLower === 'youtube') {
    return `https://www.youtube.com/embed/${id}${autoplayParam}`;
  } else if (siteLower === 'dailymotion') {
    return `https://www.dailymotion.com/embed/video/${id}${autoplayParam}`;
  } else if (siteLower === 'vimeo') {
    return `https://player.vimeo.com/video/${id}${autoplayParam ? autoplayParam : '?'}`;
  } else if (siteLower === 'bilibili') {
    return `https://player.bilibili.com/player.html?aid=${id}${autoplay ? '&autoplay=1' : ''}`;
  }
  
  return '';
}; 
