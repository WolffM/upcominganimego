import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';
import { request, gql } from 'graphql-request';

// AniList API endpoint
const ANILIST_API_URL = 'https://graphql.anilist.co';

// Define interfaces for user preferences
interface UserPreference {
  id: number;
  score: number;
  studio?: string;
  director?: string;
  genres?: string[];
  isAdult?: boolean;
}

interface UserPreferences {
  studios: Map<string, number>;
  directors: Map<string, number>;
  genres: Map<string, number>;
  tags: Map<string, number>; // Add tags for more granular preferences
  topPick?: number; // ID of the top-rated anime
}

// Store AniList user IDs
const ANILIST_USER_IDS = {
  'Hadokuuu': 'Hadokuuu', // Replace with actual AniList user ID if different
  '1littlemiss': '1littlemiss' // Replace with actual AniList user ID if different
};

// Path to store calculated preferences
const PREFERENCES_PATH = path.join(process.cwd(), 'data');
const getPreferencesFilePath = (username: string) => path.join(PREFERENCES_PATH, `${username}_preferences.json`);

// Cache for user preferences to avoid repeated fetches
const preferencesCache: Record<string, UserPreferences> = {};

/**
 * Get score modifier based on user rating
 * @param score User rating (1-10)
 * @returns Score modifier
 */
function getScoreModifier(score: number): number {
  // Convert 1-10 scale to our 1-5 scale
  const scaledScore = Math.round(score / 2);
  
  switch (scaledScore) {
    case 5: return 10;
    case 4: return 3;
    case 3: return 1;
    case 2: return -1;
    case 1: return -5;
    default: return 0;
  }
}

/**
 * GraphQL query to fetch user's anime list with ratings
 */
const USER_ANIME_LIST_QUERY = gql`
  query GetUserAnimeList($username: String, $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
      mediaList(userName: $username, type: ANIME, status_in: [COMPLETED, CURRENT, PAUSED]) {
        score
        media {
          id
          title {
            romaji
            english
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
          genres
          tags {
            id
            name
            rank
          }
          popularity
          averageScore
        }
      }
    }
  }
`;

/**
 * Fetch user's anime list from AniList
 * @param username AniList username
 * @returns List of rated anime
 */
async function fetchUserAnimeList(username: string): Promise<any[]> {
  try {
    logger.info(`Fetching anime list for user ${username}`, 'userPreferencesService');
    
    const animeList: any[] = [];
    let hasNextPage = true;
    let currentPage = 1;
    
    while (hasNextPage) {
      const variables = {
        username,
        page: currentPage
      };
      
      // Define the response type
      interface AnimeListResponse {
        Page: {
          pageInfo: {
            total: number;
            currentPage: number;
            lastPage: number;
            hasNextPage: boolean;
          };
          mediaList: any[];
        };
      }
      
      const response = await request<AnimeListResponse>(ANILIST_API_URL, USER_ANIME_LIST_QUERY, variables);
      
      if (response.Page.mediaList) {
        animeList.push(...response.Page.mediaList);
      }
      
      hasNextPage = response.Page.pageInfo.hasNextPage;
      currentPage++;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info(`Successfully fetched ${animeList.length} anime for user ${username}`, 'userPreferencesService');
    return animeList;
  } catch (error) {
    logger.error(`Error fetching anime list for user ${username}`, 'userPreferencesService', {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}

/**
 * Calculate user preferences based on their anime ratings
 * @param animeList User's rated anime list
 * @returns Calculated user preferences
 */
function calculateUserPreferencesFromRatings(animeList: any[]): UserPreferences {
  const preferences: UserPreferences = {
    studios: new Map(),
    directors: new Map(),
    genres: new Map(),
    tags: new Map()
  };
  
  // Track counts for weighted averaging
  const studioCounts: Map<string, number> = new Map();
  const directorCounts: Map<string, number> = new Map();
  const genreCounts: Map<string, number> = new Map();
  const tagCounts: Map<string, number> = new Map();
  
  // Find top-rated anime
  let topRatedAnime = null;
  let topRatedScore = 0;
  
  for (const item of animeList) {
    const anime = item.media;
    const userScore = item.score;
    
    // Skip unrated anime
    if (!userScore || userScore === 0) continue;
    
    // Track top-rated anime
    if (userScore > topRatedScore) {
      topRatedScore = userScore;
      topRatedAnime = anime;
    }
    
    // Calculate score modifier
    const scoreModifier = getScoreModifier(userScore);
    
    // Process studios
    if (anime.studios && anime.studios.nodes) {
      for (const studio of anime.studios.nodes) {
        const studioName = studio.name;
        const currentScore = preferences.studios.get(studioName) || 0;
        const currentCount = studioCounts.get(studioName) || 0;
        
        // Update running average
        preferences.studios.set(studioName, currentScore + scoreModifier);
        studioCounts.set(studioName, currentCount + 1);
      }
    }
    
    // Process directors
    if (anime.staff && anime.staff.edges) {
      for (const edge of anime.staff.edges) {
        if (edge.role.toLowerCase().includes('director')) {
          const directorName = edge.node.name.full;
          const currentScore = preferences.directors.get(directorName) || 0;
          const currentCount = directorCounts.get(directorName) || 0;
          
          // Update running average
          preferences.directors.set(directorName, currentScore + scoreModifier);
          directorCounts.set(directorName, currentCount + 1);
        }
      }
    }
    
    // Process genres
    if (anime.genres) {
      for (const genre of anime.genres) {
        const currentScore = preferences.genres.get(genre) || 0;
        const currentCount = genreCounts.get(genre) || 0;
        
        // Update running average
        preferences.genres.set(genre, currentScore + scoreModifier);
        genreCounts.set(genre, currentCount + 1);
      }
    }
    
    // Process tags
    if (anime.tags) {
      for (const tag of anime.tags) {
        const tagName = tag.name;
        const currentScore = preferences.tags.get(tagName) || 0;
        const currentCount = tagCounts.get(tagName) || 0;
        
        // Weight by tag rank
        const weightedModifier = scoreModifier * (tag.rank / 100);
        
        // Update running average
        preferences.tags.set(tagName, currentScore + weightedModifier);
        tagCounts.set(tagName, currentCount + 1);
      }
    }
  }
  
  // Calculate final averages for studios
  for (const [studioName, totalScore] of preferences.studios.entries()) {
    const count = studioCounts.get(studioName) || 1;
    const averageScore = totalScore / count;
    preferences.studios.set(studioName, averageScore);
  }
  
  // Calculate final averages for directors
  for (const [directorName, totalScore] of preferences.directors.entries()) {
    const count = directorCounts.get(directorName) || 1;
    const averageScore = totalScore / count;
    preferences.directors.set(directorName, averageScore);
  }
  
  // Calculate final averages for genres
  for (const [genre, totalScore] of preferences.genres.entries()) {
    const count = genreCounts.get(genre) || 1;
    const averageScore = totalScore / count;
    preferences.genres.set(genre, averageScore);
  }
  
  // Calculate final averages for tags
  for (const [tagName, totalScore] of preferences.tags.entries()) {
    const count = tagCounts.get(tagName) || 1;
    const averageScore = totalScore / count;
    preferences.tags.set(tagName, averageScore);
  }
  
  // Set top pick
  if (topRatedAnime) {
    preferences.topPick = topRatedAnime.id;
  }
  
  return preferences;
}

/**
 * Save preferences to a JSON file
 * @param username AniList username
 * @param preferences User preferences
 */
async function savePreferencesToFile(username: string, preferences: UserPreferences): Promise<void> {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(PREFERENCES_PATH)) {
      fs.mkdirSync(PREFERENCES_PATH, { recursive: true });
    }
    
    // Convert Maps to objects for JSON serialization
    const serializedPreferences = {
      studios: Object.fromEntries(preferences.studios),
      directors: Object.fromEntries(preferences.directors),
      genres: Object.fromEntries(preferences.genres),
      tags: Object.fromEntries(preferences.tags),
      topPick: preferences.topPick
    };
    
    // Write to file
    fs.writeFileSync(
      getPreferencesFilePath(username),
      JSON.stringify(serializedPreferences, null, 2)
    );
    
    logger.info(`Saved preferences for user ${username} to file`, 'userPreferencesService');
  } catch (error) {
    logger.error(`Error saving preferences for user ${username}`, 'userPreferencesService', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Load preferences from a JSON file
 * @param username AniList username
 * @returns User preferences
 */
function loadPreferencesFromFile(username: string): UserPreferences | null {
  try {
    const filePath = getPreferencesFilePath(username);
    
    if (!fs.existsSync(filePath)) {
      logger.warn(`No saved preferences found for user ${username}`, 'userPreferencesService');
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const serializedPreferences = JSON.parse(fileContent);
    
    // Convert objects back to Maps
    const preferences: UserPreferences = {
      studios: new Map(Object.entries(serializedPreferences.studios)),
      directors: new Map(Object.entries(serializedPreferences.directors)),
      genres: new Map(Object.entries(serializedPreferences.genres)),
      tags: new Map(Object.entries(serializedPreferences.tags)),
      topPick: serializedPreferences.topPick
    };
    
    logger.info(`Loaded preferences for user ${username} from file`, 'userPreferencesService');
    return preferences;
  } catch (error) {
    logger.error(`Error loading preferences for user ${username}`, 'userPreferencesService', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Generate and save user preferences from AniList ratings
 * @param username AniList username
 * @returns Generated user preferences
 */
export async function generateUserPreferences(username: string): Promise<UserPreferences | null> {
  try {
    logger.info(`Generating preferences for user ${username}`, 'userPreferencesService');
    
    // Fetch user's anime list
    const animeList = await fetchUserAnimeList(username);
    
    if (animeList.length === 0) {
      logger.warn(`No anime found for user ${username}`, 'userPreferencesService');
      return null;
    }
    
    // Calculate preferences
    const preferences = calculateUserPreferencesFromRatings(animeList);
    
    // Save preferences to file
    await savePreferencesToFile(username, preferences);
    
    // Update cache
    preferencesCache[username] = preferences;
    
    logger.info(`Successfully generated preferences for user ${username}`, 'userPreferencesService');
    return preferences;
  } catch (error) {
    logger.error(`Error generating preferences for user ${username}`, 'userPreferencesService', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Fetch user preferences from AniList
 * @param username AniList username
 * @returns User preferences
 */
export async function fetchUserPreferences(username: string): Promise<UserPreferences | null> {
  try {
    // Check cache first
    if (preferencesCache[username]) {
      logger.debug(`Using cached preferences for ${username}`, 'userPreferencesService');
      return preferencesCache[username];
    }

    logger.info(`Fetching preferences for user ${username}`, 'userPreferencesService');
    
    // Try to load from file first
    const savedPreferences = loadPreferencesFromFile(username);
    
    if (savedPreferences) {
      // Update cache
      preferencesCache[username] = savedPreferences;
      return savedPreferences;
    }
    
    // If no saved preferences, generate from AniList
    // For development, fall back to mock preferences if we can't access AniList
    try {
      const generatedPreferences = await generateUserPreferences(username);
      if (generatedPreferences) {
        return generatedPreferences;
      }
    } catch (error) {
      logger.warn(`Failed to generate preferences from AniList, falling back to mock data`, 'userPreferencesService');
    }
    
    // Fall back to mock preferences
    const mockPreferences = await getMockUserPreferences(username);
    
    // Cache the preferences
    preferencesCache[username] = mockPreferences;
    
    return mockPreferences;
  } catch (error) {
    logger.error(`Error fetching preferences for user ${username}`, 'userPreferencesService', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Get mock user preferences for development
 * @param username AniList username
 * @returns Mock user preferences
 */
async function getMockUserPreferences(username: string): Promise<UserPreferences> {
  // Initialize preferences
  const preferences: UserPreferences = {
    studios: new Map(),
    directors: new Map(),
    genres: new Map(),
    tags: new Map()
  };
  
  if (username === 'Hadokuuu') {
    // Mock preferences for Hadoku
    // Studios
    preferences.studios.set('MAPPA', 10); // 5 star
    preferences.studios.set('ufotable', 10); // 5 star - fixed capitalization
    preferences.studios.set('Wit Studio', 3); // 4 star
    preferences.studios.set('Kyoto Animation', 3); // 4 star
    preferences.studios.set('Madhouse', 1); // 3 star
    preferences.studios.set('A-1 Pictures', -1); // 2 star
    preferences.studios.set('Toei Animation', -5); // 1 star
    preferences.studios.set('Science SARU', 3); // 4 star for Dandadan
    
    // Directors
    preferences.directors.set('Masaaki Yuasa', 10); // 5 star
    preferences.directors.set('Shinichiro Watanabe', 10); // 5 star
    preferences.directors.set('Makoto Shinkai', 3); // 4 star
    preferences.directors.set('Hayao Miyazaki', 3); // 4 star
    preferences.directors.set('Mamoru Hosoda', 1); // 3 star
    preferences.directors.set('Fuuga Yamashiro', 3); // 4 star for Dandadan
    
    // Genres
    preferences.genres.set('Action', 10); // 5 star
    preferences.genres.set('Thriller', 10); // 5 star
    preferences.genres.set('Mystery', 3); // 4 star
    preferences.genres.set('Sci-Fi', 3); // 4 star
    preferences.genres.set('Fantasy', 1); // 3 star
    preferences.genres.set('Romance', -1); // 2 star
    preferences.genres.set('Slice of Life', -5); // 1 star
    
    // Tags - based on AniList tags
    preferences.tags.set('Urban Fantasy', 3); // 4 star
    preferences.tags.set('Ghost', 1); // 3 star
    preferences.tags.set('Aliens', 3); // 4 star
    preferences.tags.set('Youkai', 1); // 3 star
    preferences.tags.set('Surreal Comedy', 3); // 4 star
    preferences.tags.set('Shounen', 10); // 5 star
    preferences.tags.set('Henshin', 3); // 4 star
    preferences.tags.set('School', -1); // 2 star
    
    preferences.topPick = 21; // Attack on Titan
  } else if (username === '1littlemiss') {
    // Mock preferences for LittleMiss
    // Studios
    preferences.studios.set('Kyoto Animation', 10); // 5 star
    preferences.studios.set('P.A. Works', 10); // 5 star
    preferences.studios.set('ufotable', 10); // 5 star - added for Demon Slayer
    preferences.studios.set('Bones', 3); // 4 star
    preferences.studios.set('Studio Ghibli', 3); // 4 star
    preferences.studios.set('Shaft', 1); // 3 star
    preferences.studios.set('Trigger', -1); // 2 star
    preferences.studios.set('Science SARU', 10); // 5 star for Dandadan
    
    // Directors
    preferences.directors.set('Naoko Yamada', 10); // 5 star
    preferences.directors.set('Mamoru Hosoda', 10); // 5 star
    preferences.directors.set('Hayao Miyazaki', 3); // 4 star
    preferences.directors.set('Makoto Shinkai', 3); // 4 star
    preferences.directors.set('Fuuga Yamashiro', 10); // 5 star for Dandadan
    
    // Genres
    preferences.genres.set('Romance', 10); // 5 star
    preferences.genres.set('Slice of Life', 10); // 5 star
    preferences.genres.set('Drama', 3); // 4 star
    preferences.genres.set('Fantasy', 3); // 4 star
    preferences.genres.set('Comedy', 1); // 3 star
    preferences.genres.set('Horror', -5); // 1 star
    preferences.genres.set('Thriller', -1); // 2 star
    
    // Tags - based on AniList tags
    preferences.tags.set('Urban Fantasy', 3); // 4 star
    preferences.tags.set('Ghost', 3); // 4 star
    preferences.tags.set('Aliens', 1); // 3 star
    preferences.tags.set('Youkai', 3); // 4 star
    preferences.tags.set('Surreal Comedy', 10); // 5 star
    preferences.tags.set('Shounen', 3); // 4 star
    preferences.tags.set('Female Protagonist', 10); // 5 star
    preferences.tags.set('School', 3); // 4 star
    
    preferences.topPick = 129874; // Fruits Basket
  }
  
  return preferences;
}

/**
 * Calculate preference score for an anime based on user preferences
 * @param anime Anime to score
 * @param userPreferences User preferences
 * @returns Score based on user preferences
 */
export function calculatePreferenceScore(
  anime: any, 
  userPreferences: UserPreferences
): { score: number; factors: Record<string, number> } {
  const factors: Record<string, number> = {
    studioScore: 0,
    directorScore: 0,
    genreScore: 0,
    tagScore: 0,
    popularityBonus: 0
  };
  
  // Base score from popularity (using logarithmic scale)
  let baseScore = 0;
  if (anime.popularity) {
    // Use logarithmic scale to better represent popularity differences
    // log10(popularity) * 2 gives a reasonable scale:
    // 1,000 popularity -> 6.0
    // 10,000 popularity -> 8.0
    // 100,000 popularity -> 10.0
    // 200,000 popularity -> 10.6
    baseScore = Math.log10(anime.popularity) * 2;
    
    // Store the raw popularity score
    factors.popularityBonus = baseScore;
    
    // Log the popularity calculation for debugging
    logger.debug(`Calculated popularity score for anime ${anime.id}: ${baseScore} from raw popularity ${anime.popularity}`, 'userPreferencesService');
  }
  
  // Calculate studio score - can affect up to 20% of the base score
  if (anime.studios && anime.studios.nodes) {
    // Log all studios for this anime for debugging
    const studioNames = anime.studios.nodes.map((s: any) => s.name).join(', ');
    logger.debug(`Anime ${anime.id} (${anime.title?.english || anime.title?.romaji}) has studios: ${studioNames}`, 'userPreferencesService');
    
    for (const studio of anime.studios.nodes) {
      const studioName = studio.name;
      if (userPreferences.studios.has(studioName)) {
        const studioPreference = userPreferences.studios.get(studioName) || 0;
        // Calculate studio impact as a percentage of base score (up to ±20%)
        const studioImpact = (studioPreference / 10) * 2 * baseScore;
        factors.studioScore += studioImpact;
        
        logger.debug(`Studio match found for ${studioName} with preference ${studioPreference}, adding impact: ${studioImpact}`, 'userPreferencesService');
      } else {
        // Try case-insensitive match
        const studioKey = Array.from(userPreferences.studios.keys())
          .find(key => key.toLowerCase() === studioName.toLowerCase());
        
        if (studioKey) {
          const studioPreference = userPreferences.studios.get(studioKey) || 0;
          // Calculate studio impact as a percentage of base score (up to ±20%)
          const studioImpact = (studioPreference / 10) * 2 * baseScore;
          factors.studioScore += studioImpact;
          
          logger.debug(`Case-insensitive studio match found for ${studioName} (as ${studioKey}) with preference ${studioPreference}, adding impact: ${studioImpact}`, 'userPreferencesService');
        } else {
          logger.debug(`No studio preference found for ${studioName}`, 'userPreferencesService');
        }
      }
    }
    
    // Cap the studio score to ±20% of base score
    const originalStudioScore = factors.studioScore;
    factors.studioScore = Math.max(Math.min(factors.studioScore, baseScore * 0.2), -baseScore * 0.2);
    
    if (originalStudioScore !== factors.studioScore) {
      logger.debug(`Studio score capped from ${originalStudioScore} to ${factors.studioScore}`, 'userPreferencesService');
    }
  } else {
    logger.debug(`No studios found for anime ${anime.id}`, 'userPreferencesService');
  }
  
  // Calculate director score - can affect up to 20% of the base score
  if (anime.staff && anime.staff.edges) {
    // Find directors in the staff list
    const directors = anime.staff.edges
      .filter((edge: any) => edge.role.toLowerCase().includes('director'))
      .map((edge: any) => edge.node.name.full);
    
    if (directors.length > 0) {
      logger.debug(`Anime ${anime.id} (${anime.title?.english || anime.title?.romaji}) has directors: ${directors.join(', ')}`, 'userPreferencesService');
    } else {
      logger.debug(`No directors found for anime ${anime.id}`, 'userPreferencesService');
    }
    
    for (const edge of anime.staff.edges) {
      if (edge.role.toLowerCase().includes('director')) {
        const directorName = edge.node.name.full;
        if (userPreferences.directors.has(directorName)) {
          const directorPreference = userPreferences.directors.get(directorName) || 0;
          // Calculate director impact as a percentage of base score (up to ±20%)
          const directorImpact = (directorPreference / 10) * 2 * baseScore;
          factors.directorScore += directorImpact;
          
          logger.debug(`Director match found for ${directorName} with preference ${directorPreference}, adding impact: ${directorImpact}`, 'userPreferencesService');
        } else {
          // Try case-insensitive match
          const directorKey = Array.from(userPreferences.directors.keys())
            .find(key => key.toLowerCase() === directorName.toLowerCase());
          
          if (directorKey) {
            const directorPreference = userPreferences.directors.get(directorKey) || 0;
            // Calculate director impact as a percentage of base score (up to ±20%)
            const directorImpact = (directorPreference / 10) * 2 * baseScore;
            factors.directorScore += directorImpact;
            
            logger.debug(`Case-insensitive director match found for ${directorName} (as ${directorKey}) with preference ${directorPreference}, adding impact: ${directorImpact}`, 'userPreferencesService');
          } else {
            logger.debug(`No director preference found for ${directorName}`, 'userPreferencesService');
          }
        }
      }
    }
    
    // Cap the director score to ±20% of base score
    const originalDirectorScore = factors.directorScore;
    factors.directorScore = Math.max(Math.min(factors.directorScore, baseScore * 0.2), -baseScore * 0.2);
    
    if (originalDirectorScore !== factors.directorScore) {
      logger.debug(`Director score capped from ${originalDirectorScore} to ${factors.directorScore}`, 'userPreferencesService');
    }
  }
  
  // Calculate genre score - can affect up to 10% of the base score
  if (anime.genres) {
    let totalGenreScore = 0;
    let matchedGenres = 0;
    
    for (const genre of anime.genres) {
      if (userPreferences.genres.has(genre)) {
        totalGenreScore += userPreferences.genres.get(genre) || 0;
        matchedGenres++;
      }
    }
    
    if (matchedGenres > 0) {
      // Calculate average score per matched genre
      const avgScore = totalGenreScore / matchedGenres;
      
      // Apply diminishing returns formula: score = avg * sqrt(count)
      const rawGenreScore = avgScore * Math.sqrt(matchedGenres);
      
      // Calculate genre impact as a percentage of base score (up to ±10%)
      factors.genreScore = (rawGenreScore / 10) * baseScore * 0.1;
      
      // Cap the genre score to ±10% of base score
      factors.genreScore = Math.max(Math.min(factors.genreScore, baseScore * 0.1), -baseScore * 0.1);
    }
  }
  
  // Calculate tag score - can affect up to 15% of the base score
  if (anime.tags) {
    let totalTagScore = 0;
    let matchedTags = 0;
    
    for (const tag of anime.tags) {
      if (userPreferences.tags.has(tag.name)) {
        // Weight the tag by its rank percentage
        const tagPreference = userPreferences.tags.get(tag.name) || 0;
        const weightedScore = tagPreference * (tag.rank / 100);
        totalTagScore += weightedScore;
        matchedTags++;
      }
    }
    
    if (matchedTags > 0) {
      // Calculate average score per matched tag
      const avgScore = totalTagScore / matchedTags;
      
      // Apply diminishing returns formula: score = avg * sqrt(count)
      const rawTagScore = avgScore * Math.sqrt(matchedTags);
      
      // Calculate tag impact as a percentage of base score (up to ±15%)
      factors.tagScore = (rawTagScore / 10) * baseScore * 0.15;
      
      // Cap the tag score to ±15% of base score
      factors.tagScore = Math.max(Math.min(factors.tagScore, baseScore * 0.15), -baseScore * 0.15);
    }
  }
  
  // Calculate total score: base score + all modifiers
  const totalScore = baseScore + 
    factors.studioScore + 
    factors.directorScore + 
    factors.genreScore + 
    factors.tagScore;
  
  return { score: totalScore, factors };
}

/**
 * Get top picks for each user and combined ranking
 * @param animeList List of anime to rank
 * @returns Ranked anime list with user-specific rankings
 */
export async function rankAnimeByUserPreferences(animeList: any[]): Promise<any[]> {
  try {
    logger.info(`Ranking ${animeList.length} anime by user preferences`, 'userPreferencesService');
    
    // Fetch user preferences
    const hadokuPreferences = await fetchUserPreferences('Hadokuuu');
    const littlemissPreferences = await fetchUserPreferences('1littlemiss');
    
    if (!hadokuPreferences || !littlemissPreferences) {
      logger.error('Failed to fetch user preferences', 'userPreferencesService');
      return animeList;
    }
    
    // Create a copy of the anime list to avoid mutating the original
    const rankedList = [...animeList];
    
    // Calculate scores for each anime
    for (const anime of rankedList) {
      // Calculate Hadoku's score
      const hadokuResult = calculatePreferenceScore(anime, hadokuPreferences);
      anime.hadokuScore = hadokuResult.score;
      
      // Calculate LittleMiss's score
      const littlemissResult = calculatePreferenceScore(anime, littlemissPreferences);
      anime.littlemissScore = littlemissResult.score;
      
      // Calculate combined score
      anime.combinedScore = (anime.hadokuScore + anime.littlemissScore) / 2;
      
      // Store individual factors for each user
      anime.hadokuFactors = { ...hadokuResult.factors };
      anime.littlemissFactors = { ...littlemissResult.factors };
      
      // Store averaged ranking factors for backward compatibility
      anime.rankingFactors = {
        ...anime.rankingFactors || {},
        popularity: hadokuResult.factors.popularityBonus, // Both users have the same popularity score
        studioScore: (hadokuResult.factors.studioScore + littlemissResult.factors.studioScore) / 2,
        directorScore: (hadokuResult.factors.directorScore + littlemissResult.factors.directorScore) / 2,
        genreScore: (hadokuResult.factors.genreScore + littlemissResult.factors.genreScore) / 2,
        tagScore: (hadokuResult.factors.tagScore + littlemissResult.factors.tagScore) / 2
      };
    }
    
    // Sort by Hadoku's score and assign ranks
    rankedList.sort((a, b) => (b.hadokuScore || 0) - (a.hadokuScore || 0));
    rankedList.forEach((anime, index) => {
      anime.hadokuRank = index + 1;
    });
    
    // Find Hadoku's top pick
    const hadokuTopPick = hadokuPreferences.topPick 
      ? rankedList.find(anime => anime.id === hadokuPreferences.topPick)
      : rankedList[0];
    
    if (hadokuTopPick) {
      hadokuTopPick.isHadokuTopPick = true;
    }
    
    // Sort by LittleMiss's score and assign ranks
    rankedList.sort((a, b) => (b.littlemissScore || 0) - (a.littlemissScore || 0));
    rankedList.forEach((anime, index) => {
      anime.littlemissRank = index + 1;
    });
    
    // Find LittleMiss's top pick
    const littlemissTopPick = littlemissPreferences.topPick 
      ? rankedList.find(anime => anime.id === littlemissPreferences.topPick)
      : rankedList[0];
    
    if (littlemissTopPick) {
      littlemissTopPick.isLittlemissTopPick = true;
    }
    
    // Sort by combined score and assign ranks
    rankedList.sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0));
    rankedList.forEach((anime, index) => {
      anime.combinedRank = index + 1;
    });
    
    // For the default ranking, use the combined score but put top picks first
    rankedList.sort((a, b) => {
      // Top picks come first (in random order)
      if (a.isHadokuTopPick && !b.isHadokuTopPick) return -1;
      if (!a.isHadokuTopPick && b.isHadokuTopPick) return 1;
      if (a.isLittlemissTopPick && !b.isLittlemissTopPick) return -1;
      if (!a.isLittlemissTopPick && b.isLittlemissTopPick) return 1;
      
      // Then sort by combined score
      return (b.combinedScore || 0) - (a.combinedScore || 0);
    });
    
    // Assign final ranks
    rankedList.forEach((anime, index) => {
      anime.rank = index + 1;
      anime.rankingScore = anime.combinedScore;
    });
    
    logger.info(`Successfully ranked ${rankedList.length} anime by user preferences`, 'userPreferencesService');
    
    return rankedList;
  } catch (error) {
    logger.error('Error ranking anime by user preferences', 'userPreferencesService', {
      error: error instanceof Error ? error.message : String(error)
    });
    return animeList;
  }
} 