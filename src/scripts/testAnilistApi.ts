import { request, gql } from 'graphql-request';

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Define types for API responses
interface AnimeTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

interface AnimeTrailer {
  id: string;
  site: string;
  thumbnail: string | null;
}

interface AnimeMedia {
  id: number;
  title: AnimeTitle;
  trailer: AnimeTrailer | null;
}

interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage: number;
}

// Updated to match actual API response structure
interface UpcomingAnimeResponse {
  Page: {
    pageInfo: PageInfo;
    media: AnimeMedia[];
  };
}

interface SearchAnimeResponse {
  Page: {
    media: AnimeMedia[];
  };
}

interface AnimeByIdResponse {
  Media: AnimeMedia;
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
        trailer {
          id
          site
          thumbnail
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
      trailer {
        id
        site
        thumbnail
      }
    }
  }
`;

// Self-executing async function
(async () => {
  console.log('Starting AniList API tests...');
  
  try {
    // Test 1: Upcoming Anime
    console.log('\nTest 1: Upcoming Anime');
    
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
    
    console.log(`Current season: ${currentSeason} ${currentYear}, Next season: ${nextSeason} ${nextSeasonYear}`);
    
    const upcomingVariables = {
      page: 1,
      perPage: 10,
      season: nextSeason,
      seasonYear: nextSeasonYear,
      sort: ['POPULARITY_DESC', 'START_DATE']
    };
    
    console.log('Sending request with variables:', JSON.stringify(upcomingVariables, null, 2));
    
    const upcomingResponse = await request<UpcomingAnimeResponse>(ANILIST_API_URL, TEST_UPCOMING_ANIME_QUERY, upcomingVariables);
    
    console.log(`✅ Success! Found ${upcomingResponse.Page.media.length} upcoming anime`);
    console.log(`Page info: ${JSON.stringify(upcomingResponse.Page.pageInfo, null, 2)}`);
    
    // Check for trailers
    const animeWithTrailers = upcomingResponse.Page.media.filter(anime => 
      anime.trailer && anime.trailer.id && anime.trailer.site
    ).length;
    
    console.log(`Found ${animeWithTrailers} anime with trailers out of ${upcomingResponse.Page.media.length}`);
    
    // Test 2: Search Anime
    console.log('\nTest 2: Search Anime');
    const searchTerm = 'Attack on Titan';
    console.log(`Searching for: "${searchTerm}"`);
    
    const searchResponse = await request<SearchAnimeResponse>(ANILIST_API_URL, TEST_SEARCH_ANIME_QUERY, { search: searchTerm });
    
    console.log(`✅ Success! Found ${searchResponse.Page.media.length} anime matching "${searchTerm}"`);
    
    // Test 3: Anime by ID
    console.log('\nTest 3: Anime by ID');
    const animeId = 1; // Cowboy Bebop
    console.log(`Looking up anime with ID: ${animeId}`);
    
    const animeByIdResponse = await request<AnimeByIdResponse>(ANILIST_API_URL, TEST_ANIME_BY_ID_QUERY, { id: animeId });
    
    console.log(`✅ Success! Found anime: ${animeByIdResponse.Media.title.english || animeByIdResponse.Media.title.romaji}`);
    
    // Summary
    console.log('\n=== AniList API Test Results ===');
    console.log('Upcoming Anime: ✅ PASS');
    console.log('Search Anime: ✅ PASS');
    console.log('Anime by ID: ✅ PASS');
    console.log('===============================\n');
    
    console.log('All tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
})(); 