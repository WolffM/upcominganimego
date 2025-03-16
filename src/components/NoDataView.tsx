import { memo } from 'react';
import { FilterOptions } from '@/hooks/useAnime';
import { GRID_STYLES, COMMON_STYLES } from '@/utils/uiStyles';
import { formatSeasonTitle } from '@/utils/uiHelpers';

interface NoDataViewProps {
  filters: FilterOptions;
}

export const NoDataView = memo(function NoDataView({ 
  filters
}: NoDataViewProps) {
  const seasonTitle = formatSeasonTitle(filters.season, filters.year);
  
  return (
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
        We couldn&apos;t find any upcoming anime for <strong>{seasonTitle}</strong> with the current filters.
      </p>
      <ul className={`text-left ${GRID_STYLES.EMPTY_STATE_TEXT}`}>
        <li className={GRID_STYLES.LIST_ITEM}>• The season data hasn&apos;t been announced yet</li>
        <li className={GRID_STYLES.LIST_ITEM}>• Your filter combination is too restrictive</li>
        <li className={GRID_STYLES.LIST_ITEM}>• There was an issue connecting to the anime database</li>
        <li>• The API might be temporarily unavailable</li>
      </ul>
      <p className={`mt-4 ${COMMON_STYLES.TEXT_SECONDARY}`}>
        Try changing your filters or check back later.
      </p>
    </div>
  );
}); 