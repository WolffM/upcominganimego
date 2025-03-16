'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAnime, SortOption } from '@/hooks/useAnime';
import { usePreferenceScoring } from '@/hooks/usePreferenceScoring';
import { AnimeGrid } from '@/components/AnimeGrid';
import { Pagination } from '@/components/Pagination';
import { SortSelector } from '@/components/SortSelector';
import { FilterBar } from '@/components/FilterBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { NoDataView } from '@/components/NoDataView';
import { UserRatingsInput } from '@/components/UserRatingsInput';
import { Modal } from '@/components/Modal';
import { formatSeasonTitle } from '@/utils/uiHelpers';
import { COMMON_STYLES, PAGE_STYLES, BUTTON_STYLES } from '@/utils/uiStyles';
import { getCacheStats, clearCache, removeUserFromCache, logStorageInfo, clearOldestCacheEntries } from '@/services/cacheService';
import { UserRatingsResponse, Anime } from '@/types/anime';

// Interface defining user data with username and ratings
interface UserData {
  username: string;
  ratings: UserRatingsResponse;
}

export default function Home() {
  const [itemsPerPage] = useState(24);
  const [mounted, setMounted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [cacheStats, setCacheStats] = useState({ count: 0, size: 0, keys: [] as string[] });
  
  // Store multiple users' ratings in a map
  const [userRatingsMap, setUserRatingsMap] = useState<Map<string, UserData>>(new Map());
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  
  // Store scored anime list
  const [scoredAnime, setScoredAnime] = useState<Anime[]>([]);
  
  // Get preference scoring hook
  const { applyPreferenceScores, isProcessing } = usePreferenceScoring(userRatingsMap);
  
  // Log when component renders
  console.log('🏠 Home component rendering');
  
  const { 
    anime, 
    loading, 
    error, 
    page, 
    totalPages, 
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    retry,
    seasonInfo,
    sortOption,
    setSortOption,
    showPagination,
    filteredList,
    filters,
    updateFilters,
    availableGenres,
    isLoading
  } = useAnime(1, itemsPerPage);

  const [showStorageWarning, setShowStorageWarning] = useState(false);
  
  // Use useEffect to handle client-side only code
  useEffect(() => {
    console.log('🔄 Home component mounted');
    setMounted(true);
    
    // Add keyboard shortcut for debug panel (Ctrl+Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
        updateCacheStats();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Log storage info on component mount
  useEffect(() => {
    try {
      // Log storage info to console for debugging
      logStorageInfo();
    } catch (error) {
      console.error('Error analyzing storage:', error);
    }
  }, []);
  
  // Handle storage errors
  useEffect(() => {
    const handleStorageError = (event: ErrorEvent) => {
      // Check if this is a QuotaExceededError
      if (event.error instanceof DOMException && 
          (event.error.name === 'QuotaExceededError' || 
           event.error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn('Storage quota exceeded - showing warning');
        setShowStorageWarning(true);
      }
    };
    
    window.addEventListener('error', handleStorageError);
    return () => window.removeEventListener('error', handleStorageError);
  }, []);
  
  // Handle storage cleanup
  const handleStorageCleanup = useCallback(() => {
    try {
      // Clear 40% of old entries
      clearOldestCacheEntries(0.4);
      setShowStorageWarning(false);
      
      // Log updated storage info
      logStorageInfo();
      
      // Show success message
      alert('Storage cleaned up successfully!');
    } catch (error) {
      console.error('Error cleaning up storage:', error);
      alert('Error cleaning up storage. Please try refreshing the page.');
    }
  }, []);
  
  // Function to update cache stats
  const updateCacheStats = () => {
    const stats = getCacheStats();
    setCacheStats(stats);
  };
  
  // Function to clear cache
  const handleClearCache = () => {
    clearCache();
    updateCacheStats();
  };

  // Log when pagination state changes
  useEffect(() => {
    console.log('📄 Pagination state in Home:', { 
      page, 
      totalPages, 
      hasNextPage, 
      hasPreviousPage, 
      showPagination,
      filteredList
    });
  }, [page, totalPages, hasNextPage, hasPreviousPage, showPagination, filteredList]);
  
  // Log when pagination is about to render
  useEffect(() => {
    if (showPagination) {
      console.log('📄 Rendering pagination with', totalPages, 'total pages');
    }
  }, [showPagination, totalPages]);

  // Log when filtered list state changes
  useEffect(() => {
    console.log('🔍 Filtered list state:', filteredList);
  }, [filteredList]);

  // Handle sort change
  const handleSortChange = (option: SortOption | string) => {
    console.log('🔄 Sort option changed to:', option);
    
    // Add detailed debug info about the current preference scores when sorting changes
    if (scoredAnime.length > 0) {
      // Log info about the first few anime to help with debugging
      const sampleAnime = scoredAnime.slice(0, 3);
      console.log('🔍 Current preference scores sample:');
      
      sampleAnime.forEach(anime => {
        const title = anime.title?.english || anime.title?.romaji || 'Unknown';
        
        if (anime.preferenceScores) {
          console.log(`  - ${title}:`);
          
          if (anime.preferenceScores.combined) {
            console.log(`    Combined: ${anime.preferenceScores.combined.score} (${typeof anime.preferenceScores.combined.score})`);
          }
          
          if (anime.preferenceScores.users) {
            anime.preferenceScores.users.forEach(user => {
              console.log(`    ${user.username}: ${user.score} (${typeof user.score})`);
            });
          }
          
          if (anime.preferenceScores.popularityScore) {
            console.log(`    Popularity: ${anime.preferenceScores.popularityScore}`);
          }
        } else {
          console.log(`  - ${title}: No preference scores`);
        }
      });
    }
    
    // Set the sort option in the useAnime hook (for non-preference sorts)
    setSortOption(option);
    
    // We'll also handle sorting locally for preference-based sorts
    if (option === 'combinedPreference' || (typeof option === 'string' && option.startsWith('userPreference:'))) {
      console.log('🔄 Sorting locally by preference score:', option);
      
      // Create a sorted copy of the scored anime array
      const sorted = [...scoredAnime].sort((a, b) => {
        if (option === 'combinedPreference') {
          const scoreA = a.preferenceScores?.combined?.score ?? -Infinity;
          const scoreB = b.preferenceScores?.combined?.score ?? -Infinity;
          return scoreB - scoreA; // Higher scores first
        } else if (typeof option === 'string' && option.startsWith('userPreference:')) {
          const username = option.substring('userPreference:'.length);
          
          // Find the user's score for each anime
          const getUserScore = (anime: Anime): number => {
            if (!anime.preferenceScores?.users) return -Infinity;
            const userScore = anime.preferenceScores.users.find(
              u => u.username.toLowerCase() === username.toLowerCase()
            );
            return userScore?.score ?? -Infinity;
          };
          
          const scoreA = getUserScore(a);
          const scoreB = getUserScore(b);
          
          console.log(`Comparing for ${username}: ${a.title?.english || a.title?.romaji} (${scoreA}) vs ${b.title?.english || b.title?.romaji} (${scoreB})`);
          
          return scoreB - scoreA; // Higher scores first
        }
        return 0;
      });
      
      console.log(`🔢 Finished local sorting with ${option}, list has ${sorted.length} anime`);
      setScoredAnime(sorted);
    }
  };

  // Add effect to log information about scored anime after scores are applied
  useEffect(() => {
    if (scoredAnime.length > 0 && userRatingsMap.size > 0) {
      // Count anime with preference scores
      const withScores = scoredAnime.filter(a => a.preferenceScores).length;
      console.log(`📊 Anime with preference scores: ${withScores}/${scoredAnime.length}`);
      
      // Log distribution of preference scores
      if (withScores > 0) {
        const scoreValues = scoredAnime
          .filter(a => a.preferenceScores?.combined?.score !== undefined)
          .map(a => Number(a.preferenceScores?.combined?.score));
        
        if (scoreValues.length > 0) {
          const min = Math.min(...scoreValues);
          const max = Math.max(...scoreValues);
          const sum = scoreValues.reduce((acc, val) => acc + val, 0);
          const avg = sum / scoreValues.length;
          
          console.log(`📈 Preference score stats - Min: ${min.toFixed(1)}, Max: ${max.toFixed(1)}, Avg: ${avg.toFixed(1)}`);
        }
      }
    }
  }, [scoredAnime, userRatingsMap.size]);

  // Handle filter change
  const handleFilterChange = (newFilters: any) => {
    console.log('🔍 Filter options changed:', newFilters);
    updateFilters(newFilters);
  };

  // Handle retry
  const handleRetry = () => {
    console.log('🔄 Retry requested');
    retry();
  };
  
  // Apply preference scores whenever anime list or user ratings change
  useEffect(() => {
    // Only run if we have anime data and user ratings
    if (anime.length > 0) {
      console.log('🎯 Applying preference scores to anime list');
      
      // If we have user ratings, apply preference scores
      if (userRatingsMap.size > 0) {
        const scored = applyPreferenceScores(anime);
        
        // Force a new reference even if the function returned the same array
        // This ensures React will re-render when sorting option changes
        const newScoredAnime = [...scored];
        
        // Log the change
        console.log(`📊 Preference scores applied to ${newScoredAnime.length} anime`);
        console.log(`🔀 Current sort option: ${sortOption}`);
        
        // Check if we have scores for sorting
        if (sortOption === 'combinedPreference' && newScoredAnime.length > 0) {
          const withCombinedScores = newScoredAnime.filter(a => 
            a.preferenceScores?.combined?.score !== undefined
          ).length;
          console.log(`🔢 Anime with combined scores: ${withCombinedScores}/${newScoredAnime.length}`);
        } else if (
          typeof sortOption === 'string' && 
          sortOption.startsWith('userPreference:') && 
          newScoredAnime.length > 0
        ) {
          const username = sortOption.substring('userPreference:'.length);
          const withUserScores = newScoredAnime.filter(a => {
            if (!a.preferenceScores?.users) return false;
            return a.preferenceScores.users.some(u => 
              u.username.toLowerCase() === username.toLowerCase() && 
              u.score !== undefined
            );
          }).length;
          console.log(`🔢 Anime with scores for user ${username}: ${withUserScores}/${newScoredAnime.length}`);
        }
        
        // Apply local sorting immediately if using a preference-based sort
        if (sortOption === 'combinedPreference' || (typeof sortOption === 'string' && sortOption.startsWith('userPreference:'))) {
          console.log('🔄 Applying preference-based sort immediately after scoring');
          // Sort the new anime list by the current preference sort option
          const sorted = [...newScoredAnime].sort((a, b) => {
            if (sortOption === 'combinedPreference') {
              const scoreA = a.preferenceScores?.combined?.score ?? -Infinity;
              const scoreB = b.preferenceScores?.combined?.score ?? -Infinity;
              return scoreB - scoreA; // Higher scores first
            } else if (typeof sortOption === 'string' && sortOption.startsWith('userPreference:')) {
              const username = sortOption.substring('userPreference:'.length);
              
              // Find the user's score for each anime
              const getUserScore = (anime: Anime): number => {
                if (!anime.preferenceScores?.users) return -Infinity;
                const userScore = anime.preferenceScores.users.find(
                  u => u.username.toLowerCase() === username.toLowerCase()
                );
                return userScore?.score ?? -Infinity;
              };
              
              const scoreA = getUserScore(a);
              const scoreB = getUserScore(b);
              return scoreB - scoreA; // Higher scores first
            }
            return 0;
          });
          
          console.log(`🔢 After immediate sorting with ${sortOption}, list has ${sorted.length} anime`);
          setScoredAnime(sorted);
        } else {
          // For non-preference sorts, just use the newly scored anime
          setScoredAnime(newScoredAnime);
        }
      } else {
        // If we don't have user ratings, just use the original list
        setScoredAnime([...anime]);
      }
    }
  }, [anime, userRatingsMap.size, applyPreferenceScores, sortOption]);
  
  // Handle user ratings loaded
  const handleUserRatingsLoaded = (ratings: UserRatingsResponse) => {
    // Extract username from the response (should be present in the response)
    const firstRating = ratings.data.Page.mediaList[0];
    const username = firstRating?.user?.name || 'User' + Math.floor(Math.random() * 10000);
    console.log('👤 User ratings loaded for', username, ':', ratings.data.Page.mediaList.length, 'entries');
    
    // Add to the map of users
    setUserRatingsMap(prevMap => {
      const newMap = new Map(prevMap);
      newMap.set(username, {
        username,
        ratings
      });
      return newMap;
    });
    
    // Scores will be applied in the useEffect hook that watches userRatingsMap
  };
  
  // Remove a user from the ratings map
  const handleRemoveUser = (username: string) => {
    console.log('👤 Removing user:', username);
    
    // Remove from state
    setUserRatingsMap(prevMap => {
      const newMap = new Map(prevMap);
      newMap.delete(username);
      return newMap;
    });
    
    // Also remove from cache
    removeUserFromCache(username);
  };
  
  // Toggle user modal
  const toggleUserModal = () => {
    setShowUserModal(prev => !prev);
  };
  
  // Get all usernames
  const getUsernames = (): string[] => {
    return Array.from(userRatingsMap.keys());
  };

  // If not mounted yet, show nothing to avoid hydration issues
  if (!mounted) {
    console.log('⏳ Component not mounted yet, returning null');
    return null;
  }

  // Handle loading state - only show spinner on initial load
  if (loading && !anime.length) {
    console.log('⏳ Showing loading spinner (initial load)');
    return (
      <div className={COMMON_STYLES.CONTAINER}>
        <LoadingSpinner message="Loading upcoming anime..." />
      </div>
    );
  }

  // Handle error state
  if (error && !anime.length) {
    console.log('❌ Showing error display');
    return (
      <div className={COMMON_STYLES.CONTAINER}>
        <ErrorDisplay 
          message="Failed to load upcoming anime" 
          error={error} 
          onRetry={handleRetry} 
        />
      </div>
    );
  }

  // Season title formatting
  const seasonTitle = formatSeasonTitle(
    filters.season,
    filters.year
  );

  // Update UI text based on user data
  const getUserButtonText = () => {
    const userCount = userRatingsMap.size;
    if (userCount === 0) return 'Load User Data';
    if (userCount === 1) return 'Update User Data';
    return `Manage Users (${userCount})`;
  };

  return (
    <div className={PAGE_STYLES.CONTAINER}>
      <main className={COMMON_STYLES.CONTAINER}>
        {/* Filter Bar */}
        <FilterBar 
          filters={filters}
          onFilterChange={handleFilterChange}
          availableGenres={availableGenres}
          isLoading={isLoading}
        />
        
        {/* Show content only if we have anime or are still loading */}
        {(anime.length > 0 || loading) ? (
          <>
            {/* Sorting Controls */}
            <div className={PAGE_STYLES.CONTROLS_ROW}>
              <h1 className={PAGE_STYLES.TITLE}>
                {seasonTitle}
              </h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleUserModal}
                  className={BUTTON_STYLES.PRIMARY}
                >
                  {getUserButtonText()}
                </button>
                <SortSelector 
                  currentSort={sortOption} 
                  onSortChange={handleSortChange} 
                  hasUserPreferences={userRatingsMap.size > 0}
                  usernames={Array.from(userRatingsMap.keys())}
                />
              </div>
            </div>
            
            {/* Anime Grid */}
            <div className={PAGE_STYLES.GRID_CONTAINER}>
              <AnimeGrid 
                anime={scoredAnime} 
                loading={loading || isProcessing} 
              />
            </div>
            
            {/* Loading indicator for preference scoring */}
            {isProcessing && (
              <div className={PAGE_STYLES.LOADING_INDICATOR}>
                <LoadingSpinner message="Calculating preference scores..." />
              </div>
            )}
            
            {/* Loading indicator for page changes */}
            {loading && anime.length > 0 && (
              <div className={PAGE_STYLES.LOADING_INDICATOR}>
                <LoadingSpinner message="Loading more anime..." />
              </div>
            )}
            
            {/* Filtering indicator */}
            {!loading && anime.length > 0 && !filteredList && (
              <div className={PAGE_STYLES.LOADING_INDICATOR}>
                <LoadingSpinner message="Filtering anime by season..." />
              </div>
            )}
            
            {/* Pagination */}
            {showPagination && !isProcessing && (
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
                onNextPage={goToNextPage}
                onPreviousPage={goToPreviousPage}
                onPageSelect={goToPage}
              />
            )}
          </>
        ) : (
          /* No Data View */
          <NoDataView 
            filters={filters}
          />
        )}
        
        {/* User Ratings Modal */}
        <Modal 
          isOpen={showUserModal} 
          onClose={toggleUserModal}
          title="Personalize Your Experience"
        >
          <UserRatingsInput 
            onRatingsLoaded={handleUserRatingsLoaded} 
            onRemoveUser={handleRemoveUser}
            onClose={toggleUserModal}
            insideModal={true}
            existingUsernames={getUsernames()}
            userRatingsMap={userRatingsMap}
          />
        </Modal>
        
        {/* Storage warning message */}
        {showStorageWarning && (
          <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded shadow">
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-3 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">Storage quota exceeded!</span>
            </div>
            <p className="mt-2">Your browser's storage is full. This may impact the app's ability to save preferences.</p>
            <div className="mt-3">
              <button
                onClick={handleStorageCleanup}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Clean Up Storage
              </button>
              <button
                onClick={() => setShowStorageWarning(false)}
                className="ml-2 px-4 py-2 border border-yellow-600 text-yellow-600 rounded hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
