import { memo } from 'react';
import { Anime } from '@/types/anime';
import { AnimeCard } from './AnimeCard';
import { countAnimeWithTrailers, isAnimeListEmpty } from '@/utils/uiHelpers';
import { GRID_STYLES, SKELETON_STYLES, COMMON_STYLES } from '@/utils/uiStyles';

export interface AnimeGridProps {
  anime: Anime[];
  loading: boolean;
}

/**
 * Render empty state when no anime are found
 */
const EmptyState = () => (
  <div className={GRID_STYLES.EMPTY_STATE_CONTAINER}>
    <svg 
      className={GRID_STYLES.EMPTY_STATE_ICON} 
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
    <h3 className={GRID_STYLES.EMPTY_STATE_TITLE}>
      No upcoming anime found
    </h3>
    <p className={GRID_STYLES.EMPTY_STATE_TEXT}>
      We couldn't find any upcoming anime for the next season. This could be due to:
    </p>
    <ul className={`text-left ${GRID_STYLES.EMPTY_STATE_TEXT}`}>
      <li className={GRID_STYLES.LIST_ITEM}>• The season data hasn't been announced yet</li>
      <li className={GRID_STYLES.LIST_ITEM}>• There was an issue connecting to the anime database</li>
      <li>• The API might be temporarily unavailable</li>
    </ul>
    <p className={COMMON_STYLES.TEXT_SECONDARY}>
      Please check back later or try refreshing the page.
    </p>
  </div>
);

/**
 * Render loading skeleton UI
 */
const LoadingSkeleton = () => (
  <div className={GRID_STYLES.ANIME_GRID}>
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className={GRID_STYLES.SKELETON_ITEM}>
        <div className={GRID_STYLES.SKELETON_IMAGE}></div>
        <div className={COMMON_STYLES.PADDING_MD}>
          <div className={`h-4 ${SKELETON_STYLES.BASE} w-3/4`}></div>
          <div className={`h-3 ${SKELETON_STYLES.BASE} w-1/2`}></div>
          <div className={`h-3 ${SKELETON_STYLES.BASE} w-full`}></div>
          <div className={`h-3 ${SKELETON_STYLES.BASE} w-full`}></div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Render trailer notice when anime are found but none have trailers
 */
const NoTrailersNotice = ({ animeCount }: { animeCount: number }) => (
  <div className={GRID_STYLES.NOTICE_CONTAINER}>
    <h3 className={GRID_STYLES.NOTICE_TITLE}>
      No trailers available yet
    </h3>
    <p className={GRID_STYLES.NOTICE_TEXT}>
      We found {animeCount} upcoming anime, but none of them have trailers available yet. 
      We're still displaying the anime below, but check back later for trailers!
    </p>
  </div>
);

// Use memo to prevent unnecessary re-renders
export const AnimeGrid = memo(function AnimeGrid({ 
  anime, 
  loading
}: AnimeGridProps) {
  // Count anime with trailers
  const animeWithTrailers = countAnimeWithTrailers(anime);

  // If loading, show skeleton UI
  if (loading) {
    return <LoadingSkeleton />;
  }

  // If no anime found, show empty state
  if (isAnimeListEmpty(anime)) {
    return <EmptyState />;
  }

  // If we have anime but none with trailers, show a message
  if (animeWithTrailers === 0) {
    return (
      <div>
        <NoTrailersNotice animeCount={anime.length} />
        
        <div className={GRID_STYLES.ANIME_GRID}>
          {anime.map((item, index) => (
            <AnimeCard key={item.id} anime={item} index={index} />
          ))}
        </div>
      </div>
    );
  }

  // Render the grid of anime cards
  return (
    <div className={GRID_STYLES.ANIME_GRID}>
      {anime.map((item, index) => (
        <AnimeCard key={item.id} anime={item} index={index} />
      ))}
    </div>
  );
}); 