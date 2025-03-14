'use client';

import { useState, useEffect } from 'react';
import { useAnime, SortOption } from '@/hooks/useAnime';
import { AnimeCard } from '@/components/AnimeCard';
import { Pagination } from '@/components/Pagination';
import { SortSelector } from '@/components/SortSelector';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { FeaturedPicks } from '@/components/FeaturedPicks';
import { logger } from '@/utils/logger';

export default function Home() {
  const [itemsPerPage] = useState(24);
  const [mounted, setMounted] = useState(false);
  
  const { 
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
    topPicks
  } = useAnime(1, itemsPerPage);

  // Use useEffect to handle client-side only code
  useEffect(() => {
    setMounted(true);
    logger.info('Home page mounted', 'Home');
  }, []);

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    logger.info(`Changing sort option to ${option}`, 'Home');
    setSorting(option);
  };

  // Handle retry
  const handleRetry = () => {
    logger.info('Retrying anime fetch', 'Home');
    retry();
  };

  // If not mounted yet, show nothing to avoid hydration issues
  if (!mounted) return null;

  // Handle loading state
  if (loading && !anime.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="Loading upcoming anime..." />
      </div>
    );
  }

  // Handle error state
  if (error && !anime.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay 
          message="Failed to load upcoming anime" 
          error={error} 
          onRetry={handleRetry} 
        />
      </div>
    );
  }

  // Season title formatting
  const seasonTitle = seasonInfo 
    ? `${seasonInfo.season.charAt(0).toUpperCase() + seasonInfo.season.slice(1)} ${seasonInfo.year}` 
    : 'Upcoming Anime';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {seasonTitle} Anime
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Discover upcoming anime releases with trailers
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Featured Top Picks */}
        {(topPicks.hadoku || topPicks.littlemiss) && (
          <FeaturedPicks 
            hadokuPick={topPicks.hadoku} 
            littlemissPick={topPicks.littlemiss} 
            className="mb-8"
          />
        )}
        
        {/* Sorting Controls */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {anime.length > 0 ? `Showing ${anime.length} anime` : 'No anime found'}
          </h2>
          <SortSelector 
            currentSort={sortOption} 
            onSortChange={handleSortChange} 
          />
        </div>
        
        {/* Anime Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {anime.map((animeItem, index) => (
            <AnimeCard 
              key={animeItem.id} 
              anime={animeItem} 
              index={index}
            />
          ))}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            hasNextPage={hasNextPage} 
            onNextPage={nextPage} 
            onPreviousPage={previousPage} 
            onPageSelect={goToPage} 
          />
        )}
      </main>
    </div>
  );
}
