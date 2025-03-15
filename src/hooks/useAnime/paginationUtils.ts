/**
 * Calculate a reasonable number of total pages based on current page and hasNext status
 */
export const calculateTotalPages = (currentPage: number, hasNextPage: boolean): number => {
  // We know we have at least the current page
  let calculatedPages = currentPage;
  
  // If there's a next page, add one more
  if (hasNextPage) {
    calculatedPages += 1;
  }
  
  console.log('🧮 Calculated total pages:', calculatedPages);
  return calculatedPages;
};

/**
 * Check if server-side filters have changed
 */
export const haveServerFiltersChanged = (
  currentSeason: string, 
  currentYear: number,
  lastSeason: string,
  lastYear: number
): boolean => {
  // Only consider season and year as server-side filters
  const changed = currentSeason !== lastSeason || currentYear !== lastYear;
  
  if (changed) {
    console.log('🔄 Server-side filters changed:', {
      from: { season: lastSeason, year: lastYear },
      to: { season: currentSeason, year: currentYear }
    });
  }
  
  return changed;
}; 