import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUpcomingAnime, AnimeSeason, getNextSeason, getCurrentSeason } from '@/services/anilistService';
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

// Define filter options
export interface FilterOptions {
  genre: string | null;
  format: string | null;
  searchQuery: string;
  year: number;
  season: AnimeSeason;
}

// Reasonable limit for pagination display
const MAX_REASONABLE_PAGES = 10;

// Default formats available in AniList
export const ANIME_FORMATS = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'];

export const useAnime = (initialPage = 1, perPage = 20) => {
  // Core state
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.POPULARITY);
  const [filteredList, setFilteredList] = useState<boolean>(false);
  
  // New filter state
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
  
  // Function to sort anime list based on sort option
  const sortAnimeList = useCallback((option: SortOption, animeList?: Anime[]): Anime[] => {
    // Create a copy to avoid mutating the original
    const sortedList = [...(animeList || originalAnimeRef.current)];
    
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
  
  // Function to apply client-side filters (search query)
  const applyClientSideFilters = useCallback((animeList: Anime[]): Anime[] => {
    // First apply sorting
    let result = sortAnimeList(sortOption, animeList);
    
    // Then apply search query filter if it exists
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      result = result.filter(anime => {
        // Search in title
        const titleMatch = 
          (anime.title.english && anime.title.english.toLowerCase().includes(query)) ||
          (anime.title.romaji && anime.title.romaji.toLowerCase().includes(query)) ||
          (anime.title.native && anime.title.native.toLowerCase().includes(query));
        
        // Search in description
        const descriptionMatch = 
          anime.description && anime.description.toLowerCase().includes(query);
        
        return titleMatch || descriptionMatch;
      });
    }
    
    return result;
  }, [filters.searchQuery, sortOption, sortAnimeList]);
  
  // Function to fetch anime data
  const fetchAnimeData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('🔄 Fetching anime data for page:', page, 'with perPage:', perPage);
      console.log('🔍 Using filters:', JSON.stringify(filters, null, 2));
      
      // Set loading state before fetching
      setLoading(true);
      setFilteredList(false);
      setError(null);
      
      // Fetch data from API
      console.log('📊 Calling fetchUpcomingAnime with season:', filters.season, 'year:', filters.year);
      const response = await fetchUpcomingAnime(
        page, 
        perPage, 
        filters.season,
        filters.year,
        filters.format,
        filters.genre
      );
      
      if (!isMountedRef.current) return;
      
      // Validate response structure
      if (!response?.data?.Page?.media) {
        throw new Error('Invalid API response structure');
      }
      
      // Store the original anime list
      originalAnimeRef.current = response.data.Page.media;
      console.log('📊 Received anime count:', response.data.Page.media.length);
      
      // Extract all unique genres from the fetched anime
      const genres = new Set<string>();
      response.data.Page.media.forEach(anime => {
        if (anime.genres && Array.isArray(anime.genres)) {
          anime.genres.forEach(genre => {
            if (genre) genres.add(genre);
          });
        }
      });
      setAvailableGenres(Array.from(genres).sort());
      
      // Apply sorting and filtering
      const filteredAnime = applyClientSideFilters(response.data.Page.media);
      setAnime(filteredAnime);
      
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
      if (filteredAnime.length > 0) {
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
      
      // Mark the list as filtered and set loading to false
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
      setLoading(false); // Ensure loading is set to false on error
    }
  }, [page, perPage, filters, calculateTotalPages, applyClientSideFilters]);

  // Effect to handle sort option changes
  useEffect(() => {
    if (originalAnimeRef.current.length > 0) {
      console.log('🔄 Re-sorting anime list with option:', sortOption);
      // Re-sort and filter the anime list
      const filteredAnime = applyClientSideFilters(originalAnimeRef.current);
      setAnime(filteredAnime);
      
      // Mark the list as filtered after sorting
      setFilteredList(true);
    }
  }, [sortOption, applyClientSideFilters]);

  // Effect to handle search query changes
  useEffect(() => {
    if (originalAnimeRef.current.length > 0) {
      console.log('🔍 Filtering anime list with search query:', filters.searchQuery);
      // Apply client-side filters
      const filteredAnime = applyClientSideFilters(originalAnimeRef.current);
      setAnime(filteredAnime);
      
      // Mark the list as filtered after filtering
      setFilteredList(true);
    }
  }, [filters.searchQuery, applyClientSideFilters]);

  // Effect to fetch data when page, perPage, or server-side filters change
  useEffect(() => {
    fetchAnimeData();
  }, [page, perPage, filters.season, filters.year, filters.genre, filters.format, fetchAnimeData]);
  
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

  // Filter update functions
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    console.log('🔄 Updating filters:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setPage(1);
  }, []);

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
