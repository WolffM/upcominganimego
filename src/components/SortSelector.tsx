import { memo, useCallback } from 'react';
import { SortOption } from '@/types/anime';
import { SELECTOR_STYLES } from '@/utils/uiStyles';

interface SortSelectorProps {
  currentSort: SortOption | string;
  onSortChange: (option: SortOption | string) => void;
  hasUserPreferences?: boolean;
  usernames?: string[];
}

const SortSelectorComponent = ({ 
  currentSort, 
  onSortChange,
  hasUserPreferences = false,
  usernames = []
}: SortSelectorProps) => {
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
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
        
        {hasUserPreferences && (
          <>
            <option value={SortOption.COMBINED_PREFERENCE}>Combined Preference</option>
            
            {/* Individual user preference options */}
            {usernames.length > 0 && (
              <>
                {/* Add a separator between combined and individual options */}
                <option disabled>───────────────</option>
                
                {usernames.map(username => (
                  <option 
                    key={username} 
                    value={`${SortOption.USER_PREFERENCE_PREFIX}${username}`}
                  >
                    {username}&apos;s Preference
                  </option>
                ))}
              </>
            )}
          </>
        )}
      </select>
    </div>
  );
};

export const SortSelector = memo(SortSelectorComponent); 