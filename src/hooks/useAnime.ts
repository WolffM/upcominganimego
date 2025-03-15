import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUpcomingAnime } from '@/services/anilistService';
import { Anime } from '@/types/anime';

// Define a type for season information
interface SeasonInfo {
  season: string;
  year: number;
}

// Define sort options
export enum SortOption {
  POPULARITY = 'popularity',
  RELEASE_DATE = 'releaseDate',
}

// Reasonable limit for pagination display
const MAX_REASONABLE_PAGES = 10;

export const useAnime = (initialPage = 1, perPage = 20) => {
  // Core state
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.POPULARITY);
  const [filteredList, setFilteredList] = useState<boolean>(false);
  
  // Pagination state
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  // Refs for internal state that shouldn't trigger re-renders
  const isMountedRef = useRef(true);
  const originalAnimeRef = useRef<Anime[]>([]);
  const lastPageInfoRef = useRef<{lastPage: number, total: number} | null>(null);
  const estimatedTotalAnimeRef = useRef<number>(0);
  
  // Function to calculate a reasonable number of total pages
  const calculateTotalPages = useCallback((currentPage: number, hasNextPage: boolean): number => {
    // We know we have at least the current page
    let calculatedPages = currentPage;
    
    // If there's a next page, add one more
    if (hasNextPage) {
      calculatedPages += 1;
    }
    
    console.log('🧮 Calculated total pages:', calculatedPages);
    return calculatedPages;
  }, []);
  
  // Function to fetch anime data
  const fetchAnimeData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('🔄 Fetching anime data for page:', page, 'with perPage:', perPage);
      setLoading(true);
      setFilteredList(false);
      setError(null);
      
      const response = await fetchUpcomingAnime(page, perPage);
      
      if (!isMountedRef.current) return;
      
      // Validate response structure
      if (!response?.data?.Page?.media) {
        throw new Error('Invalid API response structure');
      }
      
      // Store the original anime list
      originalAnimeRef.current = response.data.Page.media;
      console.log('📊 Received anime count:', response.data.Page.media.length);
      
      // Apply sorting based on the current sort option
      const sortedAnime = sortAnimeList(sortOption);
      setAnime(sortedAnime);
      
      // Extract pagination info from API response
      const pageInfo = response.data.Page.pageInfo;
      console.log('📄 API pagination info:', {
        hasNextPage: pageInfo.hasNextPage,
        currentPage: page,
        lastPage: pageInfo.lastPage,
        total: pageInfo.total
      });
      
      // Set pagination state
      const apiHasNextPage = pageInfo.hasNextPage || false;
      setHasNextPage(apiHasNextPage);
      setHasPreviousPage(page > 1);
      
      // Calculate total pages
      if (sortedAnime.length > 0) {
        const calculatedPages = calculateTotalPages(page, apiHasNextPage);
        setTotalPages(calculatedPages);
      } else {
        console.log('❌ No anime data, setting totalPages to 0');
        setTotalPages(0);
      }
      
      // Extract season information from the first anime if available
      if (response.data.Page.media.length > 0) {
        const firstAnime = response.data.Page.media[0];
        if (firstAnime.season && firstAnime.seasonYear) {
          setSeasonInfo({
            season: firstAnime.season,
            year: firstAnime.seasonYear
          });
        }
      }
      
      // Mark the list as filtered after a short delay to ensure all state updates have been processed
      setTimeout(() => {
        if (isMountedRef.current) {
          console.log('✅ Anime list filtered and ready');
          setFilteredList(true);
        }
      }, 100);
    } catch (err) {
      console.error('❌ Error fetching anime data:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      setAnime([]);
      setHasNextPage(false);
      setHasPreviousPage(false);
      setTotalPages(0);
      setFilteredList(false);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, perPage, sortOption, calculateTotalPages]);

  // Function to sort anime list based on sort option
  const sortAnimeList = useCallback((option: SortOption): Anime[] => {
    // Create a copy to avoid mutating the original
    const sortedList = [...originalAnimeRef.current];
    
    switch (option) {
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
        return sortedList;
    }
  }, []);

  // Effect to handle sort option changes
  useEffect(() => {
    if (originalAnimeRef.current.length > 0) {
      console.log('🔄 Re-sorting anime list with option:', sortOption);
      // Re-sort the anime list when the sort option changes
      const sortedAnime = sortAnimeList(sortOption);
      setAnime(sortedAnime);
      
      // Mark the list as filtered after sorting
      setFilteredList(true);
    }
  }, [sortOption, sortAnimeList]);

  // Effect to fetch data when page or perPage changes
  useEffect(() => {
    fetchAnimeData();
  }, [page, perPage, fetchAnimeData]);
  
  // Effect to handle component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Simple navigation functions
  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      console.log('⏭️ Going to next page:', page + 1);
      setPage(prev => prev + 1);
    }
  }, [hasNextPage, page]);

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      console.log('⏮️ Going to previous page:', page - 1);
      setPage(prev => prev - 1);
    }
  }, [hasPreviousPage, page]);

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      console.log('🔢 Going to specific page:', pageNum);
      setPage(pageNum);
    }
  }, [totalPages]);

  // Retry function
  const retry = useCallback(() => {
    console.log('🔄 Retrying data fetch');
    fetchAnimeData();
  }, [fetchAnimeData]);

  // Simple computed value to determine if pagination should be shown
  const showPagination = !loading && filteredList && anime.length > 0 && totalPages > 1;
  
  // Log current state for debugging
  useEffect(() => {
    console.log('📊 Current state:', {
      loading,
      filteredList,
      animeCount: anime.length,
      page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      showPagination
    });
  }, [loading, filteredList, anime.length, page, totalPages, hasNextPage, hasPreviousPage, showPagination]);

  return {
    // Data
    anime,
    loading,
    error,
    page,
    totalPages,
    seasonInfo,
    sortOption,
    filteredList,
    
    // Actions
    setSortOption,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    retry,
    
    // Computed
    hasNextPage,
    hasPreviousPage,
    showPagination
  };
};
