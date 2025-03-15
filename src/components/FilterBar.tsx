import { useState, useEffect, useCallback } from 'react';
import { FilterOptions, ANIME_FORMATS } from '@/hooks/useAnime';
import { AnimeSeason, getCurrentSeason, getNextSeason } from '@/services/anilistService';
import { COMMON_STYLES } from '@/utils/uiStyles';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
  availableGenres: string[];
  isLoading: boolean;
}

export const FilterBar = ({
  filters,
  onFilterChange,
  availableGenres,
  isLoading
}: FilterBarProps) => {
  const [searchValue, setSearchValue] = useState(filters.searchQuery);
  const [years, setYears] = useState<number[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  
  // Generate a list of years (current year - 1 to current year + 3)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearList = [];
    for (let i = currentYear - 1; i <= currentYear + 3; i++) {
      yearList.push(i);
    }
    setYears(yearList);
  }, []);
  
  // Track loading state changes
  useEffect(() => {
    if (isLoading) {
      setLocalLoading(true);
    } else {
      // Add a small delay before removing loading state to prevent flickering
      const timer = setTimeout(() => {
        setLocalLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.searchQuery) {
        onFilterChange({ searchQuery: searchValue });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchValue, filters.searchQuery, onFilterChange]);
  
  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);
  
  // Handle genre selection
  const handleGenreChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalLoading(true); // Set local loading state immediately
    const value = e.target.value === 'all' ? null : e.target.value;
    onFilterChange({ genre: value });
  }, [onFilterChange]);
  
  // Handle format selection
  const handleFormatChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalLoading(true); // Set local loading state immediately
    const value = e.target.value === 'all' ? null : e.target.value;
    onFilterChange({ format: value });
  }, [onFilterChange]);
  
  // Handle year selection
  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalLoading(true); // Set local loading state immediately
    const value = parseInt(e.target.value, 10);
    onFilterChange({ year: value });
  }, [onFilterChange]);
  
  // Handle season selection
  const handleSeasonChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalLoading(true); // Set local loading state immediately
    const value = e.target.value as AnimeSeason;
    onFilterChange({ season: value });
  }, [onFilterChange]);
  
  // Determine if controls should be disabled
  const isDisabled = localLoading || isLoading;
  
  return (
    <div className="w-full bg-gray-800 p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search Bar */}
        <div className="col-span-1 lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search by title or description..."
            value={searchValue}
            onChange={handleSearchChange}
            disabled={isDisabled}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Genre Dropdown */}
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-1">
            Genre
          </label>
          <select
            id="genre"
            value={filters.genre || 'all'}
            onChange={handleGenreChange}
            disabled={isDisabled}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Any</option>
            {availableGenres.map(genre => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
        
        {/* Format Dropdown */}
        <div>
          <label htmlFor="format" className="block text-sm font-medium text-gray-300 mb-1">
            Format
          </label>
          <select
            id="format"
            value={filters.format || 'all'}
            onChange={handleFormatChange}
            disabled={isDisabled}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Any</option>
            {ANIME_FORMATS.map(format => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>
        
        {/* Year and Season Dropdowns */}
        <div className="grid grid-cols-2 gap-2">
          {/* Year Dropdown */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">
              Year
            </label>
            <select
              id="year"
              value={filters.year}
              onChange={handleYearChange}
              disabled={isDisabled}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          {/* Season Dropdown */}
          <div>
            <label htmlFor="season" className="block text-sm font-medium text-gray-300 mb-1">
              Season
            </label>
            <select
              id="season"
              value={filters.season}
              onChange={handleSeasonChange}
              disabled={isDisabled}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={AnimeSeason.WINTER}>Winter</option>
              <option value={AnimeSeason.SPRING}>Spring</option>
              <option value={AnimeSeason.SUMMER}>Summer</option>
              <option value={AnimeSeason.FALL}>Fall</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {isDisabled && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Loading results...
        </div>
      )}
    </div>
  );
}; 