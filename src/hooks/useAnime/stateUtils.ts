import { FilterOptions } from './types';

/**
 * Process the filter update and determine if server-side filters changed
 */
export const processFilterUpdate = (
  currentFilters: FilterOptions,
  newFilters: Partial<FilterOptions>
): { updatedFilters: FilterOptions; hasServerSideChanges: boolean } => {
  // Check if any server-side filters are being updated (only season and year)
  const hasServerSideChanges = 
    ('season' in newFilters && newFilters.season !== currentFilters.season) ||
    ('year' in newFilters && newFilters.year !== currentFilters.year);
  
  // Process genre filter (ensure it's properly set to null when "Any" is selected)
  if ('genre' in newFilters) {
    console.log('🔍 Genre filter changing from', currentFilters.genre, 'to', newFilters.genre);
    console.log('🔍 Genre filter type:', typeof newFilters.genre, 'value:', newFilters.genre);
    
    // Ensure genre is properly set to null when "Any" is selected
    if (newFilters.genre === 'all') {
      newFilters.genre = null;
      console.log('🔍 Corrected genre filter to null');
    }
  }
  
  // Create updated filters
  const updatedFilters = { ...currentFilters, ...newFilters };
  console.log('🔄 Updated filters:', updatedFilters);
  
  return { updatedFilters, hasServerSideChanges };
}; 