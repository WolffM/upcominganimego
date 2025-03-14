import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUpcomingAnime } from '@/services/anilistService';
import { rankAnimeList } from '@/services/rankingService';
import { Anime } from '@/types/anime';
import { logger } from '@/utils/logger';

// Define a type for season information
interface SeasonInfo {
  season: string;
  year: number;
}

// Define sort options
export enum SortOption {
  RANK = 'rank',
  HADOKU_RANK = 'hadokuRank',
  LITTLEMISS_RANK = 'littlemissRank',
  COMBINED_RANK = 'combinedRank',
  POPULARITY = 'popularity',
  RELEASE_DATE = 'releaseDate',
}

export const useAnime = (initialPage = 1, perPage = 20) => {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.RANK);
  const [topPicks, setTopPicks] = useState<{
    hadoku: Anime | null;
    littlemiss: Anime | null;
  }>({ hadoku: null, littlemiss: null });
  
  // Use refs for values that shouldn't trigger re-renders
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const isMountedRef = useRef(true);
  const originalAnimeRef = useRef<Anime[]>([]);

  // Function to fetch anime data
  const fetchAnimeData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      logger.info(`Fetching anime data for page ${page}`, 'useAnime');
      setLoading(true);
      
      const response = await fetchUpcomingAnime(page, perPage);
      
      if (!isMountedRef.current) return;
      
      // Validate response structure
      if (!response || !response.data || !response.data.Page || !Array.isArray(response.data.Page.media)) {
        throw new Error('Invalid API response structure');
      }
      
      logger.info(`Successfully fetched anime data for page ${page}`, 'useAnime');
      logger.debug(`Received ${response.data.Page.media.length} anime items`, 'useAnime');
      
      // Store the original anime list
      originalAnimeRef.current = response.data.Page.media;
      
      // Apply ranking to the anime list
      const rankedAnime = await rankAnimeList(response.data.Page.media);
      
      // Extract top picks
      const hadokuTopPick = rankedAnime.find(anime => anime.isHadokuTopPick) || null;
      const littlemissTopPick = rankedAnime.find(anime => anime.isLittlemissTopPick) || null;
      
      setTopPicks({
        hadoku: hadokuTopPick,
        littlemiss: littlemissTopPick
      });
      
      // Apply sorting based on the current sort option
      const sortedAnime = sortAnimeList(rankedAnime, sortOption);
      
      setAnime(sortedAnime);
      setHasNextPage(response.data.Page.pageInfo.hasNextPage);
      setTotalPages(response.data.Page.pageInfo.lastPage);
      setError(null);
      retryCountRef.current = 0; // Reset retry count on success
      
      // Extract season information from the first anime if available
      if (response.data.Page.media.length > 0) {
        const firstAnime = response.data.Page.media[0];
        if (firstAnime.season && firstAnime.seasonYear) {
          setSeasonInfo({
            season: firstAnime.season,
            year: firstAnime.seasonYear
          });
          logger.debug(`Set season info: ${firstAnime.season} ${firstAnime.seasonYear}`, 'useAnime');
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      logger.error(`Error fetching anime data: ${errorMessage}`, 'useAnime', err);
      
      // Set error state
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // Handle retry logic
      if (retryCountRef.current < MAX_RETRIES) {
        const nextRetryCount = retryCountRef.current + 1;
        retryCountRef.current = nextRetryCount;
        
        const retryDelay = Math.pow(2, nextRetryCount) * 1000; // Exponential backoff
        logger.warn(`Retrying fetch (${nextRetryCount}/${MAX_RETRIES}) in ${retryDelay}ms`, 'useAnime');
        
        // Schedule retry
        setTimeout(() => {
          if (isMountedRef.current) {
            logger.info(`Executing retry attempt ${nextRetryCount}`, 'useAnime');
            fetchAnimeData();
          }
        }, retryDelay);
      } else {
        logger.error(`Max retries (${MAX_RETRIES}) reached, giving up`, 'useAnime');
        // Set empty data to prevent null reference errors
        setAnime([]);
        setHasNextPage(false);
        setTotalPages(0);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, perPage]);

  // Function to sort anime list based on sort option
  const sortAnimeList = useCallback((animeList: Anime[], option: SortOption): Anime[] => {
    logger.debug(`Sorting anime list by ${option}`, 'useAnime');
    
    // Create a copy to avoid mutating the original
    const sortedList = [...animeList];
    
    switch (option) {
      case SortOption.RANK:
        // For the default ranking, implement the specific order:
        // 1. Combined top pick
        // 2 & 3. Hadoku's and Littlemiss's top picks (random order)
        // 4+. Remaining combined top picks
        return sortedList.sort((a, b) => {
          // First, identify the combined top pick (rank 1)
          const aIsCombinedTop1 = a.combinedRank === 1;
          const bIsCombinedTop1 = b.combinedRank === 1;
          
          // Combined top 1 comes first
          if (aIsCombinedTop1 && !bIsCombinedTop1) return -1;
          if (!aIsCombinedTop1 && bIsCombinedTop1) return 1;
          
          // Next, identify Hadoku's and Littlemiss's top picks
          const aIsUserTopPick = a.isHadokuTopPick || a.isLittlemissTopPick;
          const bIsUserTopPick = b.isHadokuTopPick || b.isLittlemissTopPick;
          
          // User top picks come next
          if (aIsUserTopPick && !bIsUserTopPick) return -1;
          if (!aIsUserTopPick && bIsUserTopPick) return 1;
          
          // If both are user top picks, randomize their order
          // Use a deterministic but seemingly random approach based on IDs
          if (aIsUserTopPick && bIsUserTopPick) {
            // If one is Hadoku's and the other is Littlemiss's, randomize
            const aIsHadoku = a.isHadokuTopPick && !a.isLittlemissTopPick;
            const bIsHadoku = b.isHadokuTopPick && !b.isLittlemissTopPick;
            
            if (aIsHadoku !== bIsHadoku) {
              // Use a pseudo-random approach based on anime IDs
              // This ensures consistent sorting within a session but appears random
              return (parseInt(String(a.id)) % 2 === 0) ? -1 : 1;
            }
          }
          
          // Then sort by combined rank for the rest
          return (a.combinedRank || 999) - (b.combinedRank || 999);
        });
        
      case SortOption.HADOKU_RANK:
        // Sort by Hadoku rank (descending)
        return sortedList.sort((a, b) => (b.hadokuScore || 0) - (a.hadokuScore || 0));
        
      case SortOption.LITTLEMISS_RANK:
        // Sort by Little Miss rank (descending)
        return sortedList.sort((a, b) => (b.littlemissScore || 0) - (a.littlemissScore || 0));
        
      case SortOption.COMBINED_RANK:
        // Sort by combined rank (descending)
        return sortedList.sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0));
        
      case SortOption.POPULARITY:
        // Sort by popularity (descending)
        return sortedList.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        
      case SortOption.RELEASE_DATE:
        // Sort by release date (ascending)
        return sortedList.sort((a, b) => {
          // Handle null dates by treating them as far in the future
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          
          // Handle null values in the date parts
          const yearA = a.startDate.year || 9999;
          const monthA = a.startDate.month || 1;
          const dayA = a.startDate.day || 1;
          
          const yearB = b.startDate.year || 9999;
          const monthB = b.startDate.month || 1;
          const dayB = b.startDate.day || 1;
          
          // Create date objects with the non-null values
          const dateA = new Date(yearA, monthA - 1, dayA).getTime();
          const dateB = new Date(yearB, monthB - 1, dayB).getTime();
          
          return dateA - dateB;
        });
        
      default:
        // Use the default sorting from the API
        return sortedList;
    }
  }, []);

  // Effect to handle sort option changes
  useEffect(() => {
    if (originalAnimeRef.current.length > 0) {
      logger.debug(`Sort option changed to ${sortOption}`, 'useAnime');
      
      // Re-sort the anime list when the sort option changes
      // Use the original anime list from the ref to avoid an infinite loop
      const sortedAnime = sortAnimeList(originalAnimeRef.current, sortOption);
      
      setAnime(sortedAnime);
    }
  }, [sortOption, sortAnimeList]);

  // Effect to fetch data when page or perPage changes
  useEffect(() => {
    logger.debug(`useEffect triggered with page: ${page}, perPage: ${perPage}`, 'useAnime');
    retryCountRef.current = 0; // Reset retry count when page or perPage changes
    fetchAnimeData();
    
    // Cleanup function
    return () => {
      logger.debug('Cleaning up useAnime effect', 'useAnime');
    };
  }, [page, perPage, fetchAnimeData]);
  
  // Effect to handle component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      logger.debug(`Moving to next page: ${page + 1}`, 'useAnime');
      setPage(prevPage => prevPage + 1);
    } else {
      logger.debug('Cannot go to next page: already at last page', 'useAnime');
    }
  }, [hasNextPage, page]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      logger.debug(`Moving to previous page: ${page - 1}`, 'useAnime');
      setPage(prevPage => prevPage - 1);
    } else {
      logger.debug('Cannot go to previous page: already at first page', 'useAnime');
    }
  }, [page]);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      logger.debug(`Going to page: ${pageNumber}`, 'useAnime');
      setPage(pageNumber);
    } else {
      logger.warn(`Invalid page number: ${pageNumber}. Valid range: 1-${totalPages}`, 'useAnime');
    }
  }, [totalPages]);

  // Function to retry fetching data manually
  const retry = useCallback(() => {
    logger.info('Manual retry requested', 'useAnime');
    retryCountRef.current = 0;
    setError(null);
    fetchAnimeData();
  }, [fetchAnimeData]);

  // Function to change the sort option
  const setSorting = useCallback((option: SortOption) => {
    logger.info(`Setting sort option to ${option}`, 'useAnime');
    setSortOption(option);
  }, []);

  return {
    anime,
    loading,
    error,
    page,
    hasNextPage,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
    retry,
    seasonInfo,
    sortOption,
    setSorting,
    topPicks,
  };
};