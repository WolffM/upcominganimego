import { memo, useCallback } from 'react';
import { SortOption } from '@/hooks/useAnime';
import { SELECTOR_STYLES } from '@/utils/uiStyles';

interface SortSelectorProps {
  currentSort: SortOption;
  onSortChange: (option: SortOption) => void;
}

export const SortSelector = memo(({ currentSort, onSortChange }: SortSelectorProps) => {
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as SortOption;
    onSortChange(newSort);
  }, [onSortChange]);

  return (
    <div className={SELECTOR_STYLES.CONTAINER}>
      <label htmlFor="sort-select" className={SELECTOR_STYLES.LABEL}>
        Sort by:
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={handleSortChange}
        className={SELECTOR_STYLES.SELECT}
      >
        <option value={SortOption.POPULARITY}>Popularity</option>
        <option value={SortOption.RELEASE_DATE}>Release Date</option>
      </select>
    </div>
  );
}); 