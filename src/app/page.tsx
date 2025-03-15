'use client';

import { useState, useEffect } from 'react';
import { useAnime, SortOption } from '@/hooks/useAnime';
import { AnimeGrid } from '@/components/AnimeGrid';
import { Pagination } from '@/components/Pagination';
import { SortSelector } from '@/components/SortSelector';
import { FilterBar } from '@/components/FilterBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { NoDataView } from '@/components/NoDataView';
import { formatSeasonTitle } from '@/utils/uiHelpers';
import { COMMON_STYLES, PAGE_STYLES } from '@/utils/uiStyles';

export default function Home() {
  const [itemsPerPage] = useState(24);
  const [mounted, setMounted] = useState(false);
  
  // Log when component renders
  console.log('🏠 Home component rendering');
  
  const { 
    anime, 
    loading, 
    error, 
    page, 
    totalPages, 
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    retry,
    seasonInfo,
    sortOption,
    setSortOption,
    showPagination,
    filteredList,
    filters,
    updateFilters,
    availableGenres,
    isLoading
  } = useAnime(1, itemsPerPage);

  // Use useEffect to handle client-side only code
  useEffect(() => {
    console.log('🔄 Home component mounted');
    setMounted(true);
  }, []);

  // Log when pagination state changes
  useEffect(() => {
    console.log('📄 Pagination state in Home:', { 
      page, 
      totalPages, 
      hasNextPage, 
      hasPreviousPage, 
      showPagination,
      filteredList
    });
  }, [page, totalPages, hasNextPage, hasPreviousPage, showPagination, filteredList]);
  
  // Log when pagination is about to render
  useEffect(() => {
    if (showPagination) {
      console.log('📄 Rendering pagination with', totalPages, 'total pages');
    }
  }, [showPagination, totalPages]);

  // Log when filtered list state changes
  useEffect(() => {
    console.log('🔍 Filtered list state:', filteredList);
  }, [filteredList]);

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    console.log('🔄 Sort option changed to:', option);
    setSortOption(option);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: any) => {
    console.log('🔍 Filter options changed:', newFilters);
    updateFilters(newFilters);
  };

  // Handle retry
  const handleRetry = () => {
    console.log('🔄 Retry requested');
    retry();
  };

  // If not mounted yet, show nothing to avoid hydration issues
  if (!mounted) {
    console.log('⏳ Component not mounted yet, returning null');
    return null;
  }

  // Handle loading state - only show spinner on initial load
  if (loading && !anime.length) {
    console.log('⏳ Showing loading spinner (initial load)');
    return (
      <div className={COMMON_STYLES.CONTAINER}>
        <LoadingSpinner message="Loading upcoming anime..." />
      </div>
    );
  }

  // Handle error state
  if (error && !anime.length) {
    console.log('❌ Showing error display');
    return (
      <div className={COMMON_STYLES.CONTAINER}>
        <ErrorDisplay 
          message="Failed to load upcoming anime" 
          error={error} 
          onRetry={handleRetry} 
        />
      </div>
    );
  }

  // Season title formatting
  const seasonTitle = formatSeasonTitle(
    filters.season,
    filters.year
  );

  console.log('🎬 Rendering main content with', anime.length, 'anime', filteredList ? '(filtered)' : '(not filtered yet)');

  return (
    <div className={PAGE_STYLES.CONTAINER}>
      <main className={COMMON_STYLES.CONTAINER}>
        {/* Filter Bar */}
        <FilterBar 
          filters={filters}
          onFilterChange={handleFilterChange}
          availableGenres={availableGenres}
          isLoading={isLoading}
        />
        
        {/* Show content only if we have anime or are still loading */}
        {(anime.length > 0 || loading) ? (
          <>
            {/* Sorting Controls */}
            <div className={PAGE_STYLES.CONTROLS_ROW}>
              <h1 className={PAGE_STYLES.TITLE}>
                {seasonTitle}
              </h1>
              <SortSelector 
                currentSort={sortOption} 
                onSortChange={handleSortChange} 
              />
            </div>
            
            {/* Anime Grid */}
            <div className={PAGE_STYLES.GRID_CONTAINER}>
              <AnimeGrid anime={anime} loading={loading} />
            </div>
            
            {/* Loading indicator for page changes */}
            {loading && anime.length > 0 && (
              <div className={PAGE_STYLES.LOADING_INDICATOR}>
                <LoadingSpinner message="Loading more anime..." />
              </div>
            )}
            
            {/* Filtering indicator */}
            {!loading && anime.length > 0 && !filteredList && (
              <div className={PAGE_STYLES.LOADING_INDICATOR}>
                <LoadingSpinner message="Filtering anime by season..." />
              </div>
            )}
            
            {/* Pagination */}
            {showPagination && (
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
                onNextPage={goToNextPage}
                onPreviousPage={goToPreviousPage}
                onPageSelect={goToPage}
              />
            )}
          </>
        ) : (
          /* No Data View */
          <NoDataView 
            filters={filters}
          />
        )}
      </main>
    </div>
  );
}
