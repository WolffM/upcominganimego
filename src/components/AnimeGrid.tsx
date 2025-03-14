import { memo, useEffect } from 'react';
import { Anime } from '@/types/anime';
import { AnimeCard } from './AnimeCard';
import { logger } from '@/utils/logger';

export interface AnimeGridProps {
  anime: Anime[];
  loading: boolean;
  showRank?: boolean;
}

// Use memo to prevent unnecessary re-renders
export const AnimeGrid = memo(function AnimeGrid({ 
  anime, 
  loading,
  showRank = false
}: AnimeGridProps) {
  useEffect(() => {
    logger.component('AnimeGrid', 'rendered', { animeCount: anime.length });
  }, [anime]);

  // Count anime with trailers
  const animeWithTrailers = anime.filter(item => 
    item.trailer && (item.trailer.site === 'youtube' || item.trailer.site === 'dailymotion')
  ).length;

  // If loading, show skeleton UI
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // If no anime found, show empty state
  if (anime.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <svg 
          className="w-24 h-24 text-gray-400 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          No upcoming anime found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          We couldn't find any upcoming anime for the next season. This could be due to:
        </p>
        <ul className="text-left text-gray-600 dark:text-gray-400 max-w-md mb-6">
          <li className="mb-2">• The season data hasn't been announced yet</li>
          <li className="mb-2">• There was an issue connecting to the anime database</li>
          <li>• The API might be temporarily unavailable</li>
        </ul>
        <p className="text-gray-600 dark:text-gray-400">
          Please check back later or try refreshing the page.
        </p>
      </div>
    );
  }

  // If we have anime but none with trailers, show a message
  if (animeWithTrailers === 0) {
    return (
      <div>
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            No trailers available yet
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            We found {anime.length} upcoming anime, but none of them have trailers available yet. 
            We're still displaying the anime below, but check back later for trailers!
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {anime.map(item => (
            <AnimeCard key={item.id} anime={item} showRank={showRank} />
          ))}
        </div>
      </div>
    );
  }

  // Render the grid of anime cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {anime.map(item => (
        <AnimeCard key={item.id} anime={item} showRank={showRank} />
      ))}
    </div>
  );
}); 