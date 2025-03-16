import { useState, useEffect, useCallback, useRef } from 'react';
import { Anime, SortOption, ANIME_FORMATS } from '@/types/anime';
import { getNextSeason } from '@/services/anilistService';
import { applyAllFilters } from './filterUtils';
import { calculateTotalPages, haveServerFiltersChanged } from './paginationUtils';
import { fetchAnimeData, extractGenres, extractSeasonInfo } from './dataFetching';
import { processFilterUpdate } from './stateUtils';
import { FilterOptions, SeasonInfo } from './types';

// Export type definitions and constants
export { ANIME_FORMATS };
export type { SortOption, FilterOptions, SeasonInfo };

/**
 * Custom hook for fetching and managing anime data
 */
export const useAnime = (initialPage = 1, perPage = 20) => {
  // Core state
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [sortOption, setSortOption] = useState<SortOption | string>(SortOption.POPULARITY);
  const [filteredList, setFilteredList] = useState<boolean>(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const nextSeason = getNextSeason();
    return {
      genre: null,
      format: null,
      searchQuery: '',
      year: nextSeason.year,
      season: nextSeason.season,
    };
  });
  
  // Available genres from fetched anime
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  
  // Pagination state
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  // Refs for internal state that shouldn't trigger re-renders
  const isMountedRef = useRef(true);
  const originalAnimeRef = useRef<Anime[]>([]);
  const lastServerFiltersRef = useRef<{
    season: string;
    year: number;
  }>({
    season: filters.season,
    year: filters.year
  });
  
  // Apply client-side filters and update state
  const applyClientFiltersAndUpdateState = useCallback(() => {
    if (originalAnimeRef.current.length === 0) return;
    
    try {
      // Apply client-side filters
      const filteredAnime = applyAllFilters(
        originalAnimeRef.current,
        filters,
        sortOption
      );
      
      // Update state
      setAnime(filteredAnime);
      setFilteredList(true);
    } catch (error) {
      console.error('❌ Error applying client-side filters:', error);
    } finally {
      setLoading(false);
      console.log('💯 Client-side filtering complete, loading set to false');
    }
  }, [filters, sortOption]);
  
  // Check if server filters have changed from last fetch
  const checkServerFiltersChanged = useCallback(() => {
    return haveServerFiltersChanged(
      filters.season,
      filters.year,
      lastServerFiltersRef.current.season,
      lastServerFiltersRef.current.year
    );
  }, [filters.season, filters.year]);
  
  // Handle data fetching
  const handleFetchAnimeData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      // Update loading state
      setLoading(true);
      setFilteredList(false);
      setError(null);
      
      // Fetch data
      const response = await fetchAnimeData(page, perPage, filters);
      
      // Check if component is still mounted
      if (!isMountedRef.current) return;
      
      // Validate response structure
      if (!response?.data?.Page?.media) {
        console.error('❌ Invalid API response structure:', response);
        throw new Error('Invalid API response structure');
      }
      
      // Store the original anime list
      const animeData = response.data.Page.media;
      originalAnimeRef.current = animeData;
      console.log('📊 Received anime count:', animeData.length);
      
      // Extract genres and season info
      setAvailableGenres(extractGenres(animeData));
      setSeasonInfo(extractSeasonInfo(animeData));
      
      // Apply client-side filters
      const filteredAnime = applyAllFilters(animeData, filters, sortOption);
      setAnime(filteredAnime);
      
      // Process pagination info
      const pageInfo = response.data.Page.pageInfo;
      console.log('📄 API pagination info:', {
        hasNextPage: pageInfo.hasNextPage,
        currentPage: page,
        lastPage: pageInfo.lastPage,
        total: pageInfo.total
      });
      
      // Update state
      setHasNextPage(pageInfo.hasNextPage || false);
      setHasPreviousPage(page > 1);
      setTotalPages(filteredAnime.length > 0 ? calculateTotalPages(page, pageInfo.hasNextPage) : 0);
      
      // Update last server filters
      lastServerFiltersRef.current = {
        season: filters.season,
        year: filters.year
      };
      
      // Update UI state
      setFilteredList(true);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching anime data:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      setAnime([]);
      setHasNextPage(false);
      setHasPreviousPage(false);
      setTotalPages(0);
      setFilteredList(true); // Set to true so we show the "no data" view instead of loading
      setLoading(false);
    }
  }, [page, perPage, filters, sortOption]);
  
  // Effect to handle sort option changes
  useEffect(() => {
    if (originalAnimeRef.current.length > 0) {
      console.log('🔄 Re-sorting anime list with option:', sortOption);
      setLoading(true);
      
      // Force the original data to be used for sorting to ensure we get all the anime
      // properly sorted when the sort option changes
      const animeToSort = [...originalAnimeRef.current];
      
      // Apply client-side filters and update state
      try {
        // Apply client-side filters
        const filteredAnime = applyAllFilters(
          animeToSort,
          filters,
          sortOption
        );
        
        // Update state
        setAnime(filteredAnime);
        setFilteredList(true);
        
        // Log number of anime after sorting
        console.log(`🔢 After sorting with ${sortOption}, have ${filteredAnime.length} anime`);
        
        // If sorting by preference score, check that scores exist
        if (sortOption === 'combinedPreference') {
          const withScores = filteredAnime.filter(a => a.preferenceScores?.combined?.score !== undefined).length;
          console.log(`🔢 Anime with combined preference scores: ${withScores}/${filteredAnime.length}`);
        } else if (typeof sortOption === 'string' && sortOption.startsWith('userPreference:')) {
          const username = sortOption.substring('userPreference:'.length);
          const withScores = filteredAnime.filter(a => {
            if (!a.preferenceScores?.users) return false;
            return a.preferenceScores.users.some(u => 
              u.username.toLowerCase() === username.toLowerCase() &&
              u.score !== undefined
            );
          }).length;
          console.log(`🔢 Anime with scores for user ${username}: ${withScores}/${filteredAnime.length}`);
        }
      } catch (error) {
        console.error('❌ Error applying client-side filters:', error);
      } finally {
        setLoading(false);
        console.log('💯 Client-side filtering complete, loading set to false');
      }
    }
  }, [sortOption, filters, applyAllFilters]);
  
  // Effect to handle client-side filter changes (genre, format, search)
  useEffect(() => {
    if (originalAnimeRef.current.length > 0) {
      console.log('🔍 Applying client-side filters:', {
        genre: filters.genre,
        format: filters.format,
        searchQuery: filters.searchQuery
      });
      
      setLoading(true);
      applyClientFiltersAndUpdateState();
    }
  }, [filters.genre, filters.format, filters.searchQuery, applyClientFiltersAndUpdateState]);
  
  // Effect to fetch data when page or server-side filters change
  useEffect(() => {
    console.log('🔎 EFFECT TRIGGERED: Checking if we need to fetch data');
    
    const needServerFetch = 
      checkServerFiltersChanged() || 
      page !== 1 || 
      originalAnimeRef.current.length === 0;
    
    if (needServerFetch) {
      console.log('🔄 Server-side filters or page changed, fetching new data');
      handleFetchAnimeData();
    } else {
      console.log('🔍 Using existing data with client-side filters');
      setLoading(true);
      applyClientFiltersAndUpdateState();
    }
  }, [
    page, 
    filters.season, 
    filters.year, 
    handleFetchAnimeData, 
    applyClientFiltersAndUpdateState, 
    checkServerFiltersChanged
  ]);
  
  // Effect to handle component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Navigation functions
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
  
  // Filter update function
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    console.log('🔄 Updating filters:', newFilters);
    
    // Set loading state to true when filters are changing
    setLoading(true);
    
    // Process the filter update
    const { updatedFilters, hasServerSideChanges } = processFilterUpdate(filters, newFilters);
    
    // Update filters
    setFilters(updatedFilters);
    
    // Reset to page 1 when server-side filters change
    if (hasServerSideChanges) {
      console.log('🔄 Server-side filters changed, resetting to page 1');
      setPage(1);
    }
  }, [filters]);
  
  // Retry function
  const retry = useCallback(() => {
    console.log('🔄 Retrying data fetch');
    handleFetchAnimeData();
  }, [handleFetchAnimeData]);
  
  // Computed value to determine if pagination should be shown
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
      showPagination,
      filters
    });
  }, [loading, filteredList, anime.length, page, totalPages, hasNextPage, hasPreviousPage, showPagination, filters]);
  
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
    filters,
    availableGenres,
    
    // Actions
    setSortOption,
    updateFilters,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    retry,
    
    // Computed
    hasNextPage,
    hasPreviousPage,
    showPagination,
    isLoading: loading
  };
}; 