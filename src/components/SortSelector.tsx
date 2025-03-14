import { memo, useCallback } from 'react';
import { SortOption } from '@/hooks/useAnime';
import { logger } from '@/utils/logger';

interface SortSelectorProps {
  currentSort: SortOption;
  onSortChange: (option: SortOption) => void;
}

export const SortSelector = memo(({ currentSort, onSortChange }: SortSelectorProps) => {
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as SortOption;
    logger.debug(`Sort changed to ${newSort}`, 'SortSelector');
    onSortChange(newSort);
  }, [onSortChange]);

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={handleSortChange}
        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
      >
        <option value={SortOption.RANK}>Our Ranking</option>
        <option value={SortOption.HADOKU_RANK}>Hadoku's Picks</option>
        <option value={SortOption.LITTLEMISS_RANK}>LittleMiss's Picks</option>
        <option value={SortOption.COMBINED_RANK}>Combined Picks</option>
        <option value={SortOption.POPULARITY}>Popularity</option>
        <option value={SortOption.RELEASE_DATE}>Release Date</option>
      </select>
    </div>
  );
}); 