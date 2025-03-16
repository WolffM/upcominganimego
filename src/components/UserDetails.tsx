import { useState, useEffect } from 'react';
import { UserRatingsResponse } from '@/types/anime';
import { calculateUserPreferences, getTopPreferences, PreferenceScore } from '@/utils/userRatingsUtils';

interface UserDetailsProps {
  username: string;
  ratingsData: UserRatingsResponse;
}

export const UserDetails = ({ username, ratingsData }: UserDetailsProps) => {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<{
    genres: { liked: PreferenceScore[], disliked: PreferenceScore[] },
    studios: { liked: PreferenceScore[], disliked: PreferenceScore[] },
    directors: { liked: PreferenceScore[], disliked: PreferenceScore[] },
    tags: { liked: PreferenceScore[], disliked: PreferenceScore[] }
  } | null>(null);
  
  // Track which items are expanded
  const [expandedItems, setExpandedItems] = useState<{
    category: string;
    name: string;
    type: 'liked' | 'disliked';
  }[]>([]);
  
  // Show all contributing anime (including those with fewer than 2 entries)
  const [showAllPreferences, setShowAllPreferences] = useState(false);

  useEffect(() => {
    const calculatePreferences = async () => {
      setLoading(true);
      try {
        const userPreferences = calculateUserPreferences(ratingsData);
        
        // Get top liked and disliked for each category
        // Apply filtering based on showAllPreferences state
        const minEntries = showAllPreferences ? 0 : 2; // Require at least 2 entries unless showing all
        
        const result = {
          genres: getTopPreferences(userPreferences.genres, 10, minEntries),
          studios: getTopPreferences(userPreferences.studios, 10, minEntries),
          directors: getTopPreferences(userPreferences.directors, 10, minEntries),
          tags: getTopPreferences(userPreferences.tags, 10, minEntries)
        };
        
        setPreferences(result);
      } catch (error) {
        console.error('Error calculating preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    calculatePreferences();
  }, [ratingsData, showAllPreferences]);

  // Helper function to toggle item expansion
  const toggleExpand = (category: string, name: string, type: 'liked' | 'disliked') => {
    const key = `${category}-${name}-${type}`;
    const isExpanded = expandedItems.some(
      item => item.category === category && item.name === name && item.type === type
    );
    
    if (isExpanded) {
      setExpandedItems(expandedItems.filter(
        item => !(item.category === category && item.name === name && item.type === type)
      ));
    } else {
      setExpandedItems([...expandedItems, { category, name, type }]);
    }
  };
  
  // Check if an item is expanded
  const isItemExpanded = (category: string, name: string, type: 'liked' | 'disliked') => {
    return expandedItems.some(
      item => item.category === category && item.name === name && item.type === type
    );
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <p className="text-blue-300">Calculating preferences for {username}...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="py-4 text-center">
        <p className="text-red-400">Could not calculate preferences. Try again later.</p>
      </div>
    );
  }

  // Function to render the anime that contributed to a preference score
  const renderContributingAnime = (item: PreferenceScore) => {
    if (!item.contributingAnime || item.contributingAnime.length === 0) {
      return <p className="text-xs text-gray-500 italic">No contributing anime found</p>;
    }
    
    // Sort by score (highest first)
    const sortedAnime = [...item.contributingAnime].sort((a, b) => b.score - a.score);
    
    // Check if any anime has role information
    const hasRoles = sortedAnime.some(anime => anime.role);
    
    return (
      <div className="max-h-96 overflow-y-auto mt-3 pt-2 border-t border-gray-700">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 text-left">
              <th className="pb-2 pl-1 font-medium">Anime</th>
              <th className="pb-2 text-center font-medium w-16">Rating</th>
              <th className="pb-2 text-right font-medium w-16">Points</th>
              {item.contributingAnime[0].modifiedValue !== undefined && (
                <th className="pb-2 text-right font-medium w-20">Modified</th>
              )}
              {hasRoles && (
                <th className="pb-2 text-left pl-3 font-medium w-24">Role</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedAnime.map((anime, index) => (
              <tr key={index} className="border-t border-gray-800 hover:bg-gray-900/40">
                <td className="py-2 pl-1">
                  <div className="flex items-center">
                    {anime.imageUrl && (
                      <img 
                        src={anime.imageUrl} 
                        alt={anime.title} 
                        className="w-8 h-10 object-cover mr-2 rounded"
                      />
                    )}
                    <span className="text-gray-300 truncate" title={anime.title}>
                      {anime.title}
                    </span>
                  </div>
                </td>
                <td className="py-2 text-center text-yellow-400">
                  {anime.score}★
                </td>
                <td className="py-2 text-right">
                  <span className={anime.pointValue >= 0 ? "text-green-400" : "text-red-400"}>
                    {anime.pointValue >= 0 ? `+${anime.pointValue}` : anime.pointValue}
                  </span>
                </td>
                {anime.modifiedValue !== undefined && (
                  <td className="py-2 text-right">
                    <span className={anime.modifiedValue >= 0 ? "text-green-400" : "text-red-400"}>
                      {anime.modifiedValue >= 0 ? `+${anime.modifiedValue.toFixed(1)}` : anime.modifiedValue.toFixed(1)}
                    </span>
                  </td>
                )}
                {hasRoles && (
                  <td className="py-2 pl-3 text-gray-400">
                    {anime.role || ''}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Function to render a preference table
  const renderPreferenceTable = (title: string, data: { liked: PreferenceScore[], disliked: PreferenceScore[] }, category: string) => {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-3">{title}</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Liked column */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-400 mb-3">Most Liked</h4>
            {data.liked.length > 0 ? (
              <ul className="space-y-3">
                {data.liked.map((item, index) => (
                  <li key={index} className="mb-3 last:mb-0 pb-2 border-b border-gray-700 last:border-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 font-medium truncate mr-4 flex-grow">{item.name}</span>
                      <div className="flex-shrink-0">
                        <span className="text-green-400 whitespace-nowrap">
                          +{item.score}
                          {item.popularityAdjustedScore !== undefined && (
                            <span className="text-xs ml-1 text-indigo-400">
                              → {item.popularityAdjustedScore >= 0 ? '+' : ''}{item.popularityAdjustedScore.toFixed(1)}
                            </span>
                          )}
                          {item.normalizedScore !== undefined && (
                            <span className="text-xs ml-1 text-gray-400">
                              ({item.normalizedScore >= 0 ? '+' : ''}{item.normalizedScore.toFixed(1)})
                            </span>
                          )}
                        </span>
                        <button 
                          className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                          onClick={() => toggleExpand(category, item.name, 'liked')}
                        >
                          {isItemExpanded(category, item.name, 'liked') ? 'Hide' : `Show ${item.count}`}
                        </button>
                      </div>
                    </div>
                    {isItemExpanded(category, item.name, 'liked') && renderContributingAnime(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">No positively rated {title.toLowerCase()} found</p>
            )}
          </div>
          
          {/* Disliked column */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-red-400 mb-3">Least Liked</h4>
            {data.disliked.length > 0 ? (
              <ul className="space-y-3">
                {data.disliked.map((item, index) => (
                  <li key={index} className="mb-3 last:mb-0 pb-2 border-b border-gray-700 last:border-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 font-medium truncate mr-4 flex-grow">{item.name}</span>
                      <div className="flex-shrink-0">
                        <span className="text-red-400 whitespace-nowrap">
                          {item.score}
                          {item.popularityAdjustedScore !== undefined && (
                            <span className="text-xs ml-1 text-indigo-400">
                              → {item.popularityAdjustedScore >= 0 ? '+' : ''}{item.popularityAdjustedScore.toFixed(1)}
                            </span>
                          )}
                          {item.normalizedScore !== undefined && (
                            <span className="text-xs ml-1 text-gray-400">
                              ({item.normalizedScore >= 0 ? '+' : ''}{item.normalizedScore.toFixed(1)})
                            </span>
                          )}
                        </span>
                        <button 
                          className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                          onClick={() => toggleExpand(category, item.name, 'disliked')}
                        >
                          {isItemExpanded(category, item.name, 'disliked') ? 'Hide' : `Show ${item.count}`}
                        </button>
                      </div>
                    </div>
                    {isItemExpanded(category, item.name, 'disliked') && renderContributingAnime(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">No negatively rated {title.toLowerCase()} found</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg w-full">
      <h2 className="text-xl font-semibold text-white mb-4">Preferences for {username}</h2>
      
      {/* Explanation */}
      <p className="text-xs text-gray-400 mb-4">
        Based on {ratingsData.data.Page.mediaList.length} rated anime. 
        Scores are calculated as averages of your ratings: 5★=+10pts, 4★=+3pts, 3★=+1pt, 2★=-1pt, 1★=-5pts.
        Higher positive scores indicate preference, negative scores indicate dislike.
        <span className="block mt-1">
          The <span className="text-indigo-400">middle score</span> includes a 0-20% popularity boost based on how many anime contributed to that category.
          Categories with more anime get a higher boost to reduce the impact of outliers from categories with few entries.
        </span>
        <span className="block mt-1">
          Values in <span className="text-gray-400">(parentheses)</span> show normalized scores (for genres: -10 to +10, for studios/directors: -20 to +20, for tags: -10 to +10),
          which rank items using a logarithmic scale. This ensures that your top preferences are more evenly distributed rather than having just the #1 item dominate the scale.
        </span>
        <span className="block mt-1 text-yellow-400">
          Note: Anime with no ratings (0★) and duplicate franchise entries are excluded from calculations to prevent skewing results.
        </span>
      </p>

      {/* Option to show all preferences (including those with fewer than 2 entries) */}
      <div className="mb-4">
        <label className="flex items-center text-sm text-gray-300">
          <input 
            type="checkbox" 
            checked={showAllPreferences} 
            onChange={(e) => setShowAllPreferences(e.target.checked)}
            className="mr-2"
          />
          Show all preferences (including those with only one anime)
        </label>
      </div>
      
      {/* Show message if no preferences were calculated */}
      {!preferences.genres.liked.length && !preferences.genres.disliked.length &&
       !preferences.studios.liked.length && !preferences.studios.disliked.length &&
       !preferences.directors.liked.length && !preferences.directors.disliked.length &&
       !preferences.tags.liked.length && !preferences.tags.disliked.length && (
        <div className="p-4 bg-gray-800 rounded-lg text-center mb-4">
          <p className="text-yellow-400 text-sm">No preference data could be calculated.</p>
          <p className="text-gray-400 text-xs mt-2">
            This could be because the AniList API didn't return detailed information about your rated anime.
            Try refreshing by removing and re-adding your username.
          </p>
        </div>
      )}
      
      {/* Categories */}
      {renderPreferenceTable('Genres', preferences.genres, 'genres')}
      {renderPreferenceTable('Studios', preferences.studios, 'studios')}
      {renderPreferenceTable('Directors', preferences.directors, 'directors')}
      {renderPreferenceTable('Tags', preferences.tags, 'tags')}
    </div>
  );
}; 