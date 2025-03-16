import { useState, useEffect } from 'react';
import { USER_INPUT_STYLES } from '@/utils/uiStyles';
import { fetchUserRatedAnimeByName } from '@/services/anilistService';
import { UserRatingsResponse } from '@/types/anime';
import { calculateRatingStats, type RatingStats } from '@/utils/userRatingsUtils';
import { UserDetails } from './UserDetails';
import { clearUserRatingsCache } from '@/services/cacheService';

interface UserRatingsInputProps {
  onRatingsLoaded: (ratings: UserRatingsResponse) => void;
  onRemoveUser?: (username: string) => void;
  onClose?: () => void;
  insideModal?: boolean;
  existingUsernames?: string[];
  userRatingsMap?: Map<string, { username: string; ratings: UserRatingsResponse }>;
}

export const UserRatingsInput = ({ 
  onRatingsLoaded, 
  onRemoveUser,
  insideModal = false,
  existingUsernames = [],
  userRatingsMap = new Map()
}: UserRatingsInputProps) => {
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [, setRatingStats] = useState<RatingStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // Clear user ratings cache when component mounts
  useEffect(() => {
    // This ensures we'll fetch fresh data with the updated GraphQL query
    // that includes studios, staff, and tags
    clearUserRatingsCache();
    console.log('🧹 Cleared user ratings cache to ensure fresh data with updated query');
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    // Clear any previous messages when input changes
    setError(null);
    setSuccess(null);
    setRatingStats(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    if (!username) {
      setError('Please enter an AniList username');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setRatingStats(null);
    
    try {
      console.log('🔍 Fetching ratings for username input:', username);
      const ratingsData = await fetchUserRatedAnimeByName(username);
      
      // Check if we have ratings data
      const ratingCount = ratingsData.data.Page.mediaList.length;
      console.log(`✅ Received response with ${ratingCount} ratings for username: ${username}`);
      
      if (ratingCount === 0) {
        setError(`No ratings found for this username. Please check that:
          1. The username is spelled correctly (case-sensitive)
          2. Your anime list is public in AniList settings
          3. You have rated some anime on your list`);
        return;
      }
      
      // Set the username on all ratings entries to ensure we can identify them later
      ratingsData.data.Page.mediaList.forEach(entry => {
        if (!entry.user) {
          entry.user = {
            name: username,
            id: 0 // Default ID if not available
          };
        }
      });
      
      // Calculate stats using our utility function
      const stats = calculateRatingStats(ratingsData);
      setRatingStats(stats);
      
      // Success path - we have ratings
      setSuccess(`Successfully loaded ${ratingCount} rated anime from the AniList profile for ${username}.`);
      
      // Call the onRatingsLoaded callback with the data
      onRatingsLoaded(ratingsData);
      
      // Clear the input field after successful submission
      setUsername('');
      
      // Note: We've removed the automatic dialog closing as requested
    } catch (err: any) {
      console.error('❌ Error in handleSubmit:', err);
      
      // Generic error message as fallback
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      // Specific error messages based on the error type or message
      if (err.message?.includes('User not found') || err.message?.includes('user')) {
        errorMessage = `Username not found. Please check the spelling and try again.`;
      } else if (err.message?.includes('mediaList') || err.message?.includes('access')) {
        errorMessage = `Could not access your anime list. Please make sure your anime list is public in your AniList settings.`;
      } else if (err.message?.includes('Network Error') || err.message?.includes('connect')) {
        errorMessage = `Network error. Please check your internet connection and try again.`;
      } else if (err.response?.errors?.length) {
        // GraphQL specific errors
        errorMessage = `API Error: ${err.response.errors[0].message}`;
      }
      
      console.error('Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClear = () => {
    setUsername('');
    setError(null);
    setSuccess(null);
    setRatingStats(null);
  };
  
  // Handle removing a user
  const handleRemoveUser = (username: string) => {
    if (onRemoveUser) {
      // If we're currently viewing details for this user, close the details
      if (selectedUser === username) {
        setSelectedUser(null);
      }
      
      onRemoveUser(username);
      setSuccess(`Removed user ${username} from loaded ratings.`);
    }
  };
  
  // Toggle user details view
  const toggleUserDetails = (username: string) => {
    if (selectedUser === username) {
      setSelectedUser(null);
    } else {
      setSelectedUser(username);
    }
  };
  
  const content = (
    <>
      {!insideModal && (
        <div className={USER_INPUT_STYLES.HEADER}>
          <h2 className={USER_INPUT_STYLES.TITLE}>Personalize Your Experience</h2>
          <p className={USER_INPUT_STYLES.DESCRIPTION}>
            Enter your AniList username to find upcoming anime that match your taste based on your ratings.
          </p>
        </div>
      )}
      
      {/* Display existing users if we have any */}
      {existingUsernames && existingUsernames.length > 0 && (
        <div className={USER_INPUT_STYLES.USERS_CONTAINER}>
          <h3 className={USER_INPUT_STYLES.SECTION_TITLE}>Loaded Users</h3>
          <div className={USER_INPUT_STYLES.USERS_LIST}>
            {existingUsernames.map((name) => (
              <div key={name}>
                <div className={USER_INPUT_STYLES.USER_ITEM}>
                  <span className={USER_INPUT_STYLES.USERNAME}>{name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">✓ Loaded</span>
                    
                    {/* Info button */}
                    <button
                      type="button"
                      onClick={() => toggleUserDetails(name)}
                      className={`text-blue-400 hover:text-blue-300 text-sm transition-colors ${selectedUser === name ? 'text-blue-300' : ''}`}
                      title="View user preferences"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(name)}
                      className="text-red-400 hover:text-red-300 text-sm ml-2 transition-colors"
                      title="Remove user data"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* User Details Panel - show when this user is selected */}
                {selectedUser === name && userRatingsMap.has(name) && (
                  <div className="mt-6 mb-6 w-full overflow-hidden bg-gray-900 rounded-lg">
                    <UserDetails 
                      username={name} 
                      ratingsData={userRatingsMap.get(name)!.ratings}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className={USER_INPUT_STYLES.INFO_TEXT}>
            Multiple users&apos; ratings are used to provide diverse recommendations.
            Click the info icon (i) to view detailed preferences.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={USER_INPUT_STYLES.FORM}>
        <div className={USER_INPUT_STYLES.FIELD_ROW}>
          <div className={USER_INPUT_STYLES.INPUT_GROUP}>
            <label htmlFor="anilist-username" className={USER_INPUT_STYLES.LABEL}>
              {existingUsernames.length > 0 ? 'Add Another AniList User' : 'AniList Username'}
            </label>
            <input
              id="anilist-username"
              type="text"
              value={username}
              onChange={handleInputChange}
              placeholder="Enter an AniList username or profile URL"
              disabled={isLoading}
              className={USER_INPUT_STYLES.INPUT}
            />
            {error && <div className={USER_INPUT_STYLES.STATUS_ERROR} style={{ whiteSpace: 'pre-line' }}>{error}</div>}
            {success && <p className={USER_INPUT_STYLES.STATUS_SUCCESS}>{success}</p>}
          </div>
        </div>
        
        <div className={USER_INPUT_STYLES.BUTTON_ROW}>
          <button
            type="submit"
            disabled={isLoading || !username}
            className={USER_INPUT_STYLES.BUTTON}
          >
            {isLoading ? 'Loading...' : 'Load User Ratings'}
          </button>
          
          {username && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className={USER_INPUT_STYLES.BUTTON_SECONDARY}
            >
              Clear
            </button>
          )}
        </div>
        
        <p className={USER_INPUT_STYLES.INFO_TEXT}>
          Enter an AniList username or paste a full profile URL.
          <br />
          Examples: <strong>username</strong>, <strong>@username</strong>, or <strong>https://anilist.co/user/username/</strong>
          <br />
          <span className="text-indigo-300">Make sure the anime list is set to public in AniList privacy settings.</span>
        </p>
      </form>
      
      {isLoading && (
        <div className={USER_INPUT_STYLES.LOADING}>
          Looking up ratings from AniList...
        </div>
      )}
    </>
  );
  
  // If inside a modal, just return the content without the outer container
  if (insideModal) {
    return content;
  }
  
  // Otherwise, wrap in the container for standalone use
  return (
    <div className={USER_INPUT_STYLES.CONTAINER}>
      {content}
    </div>
  );
}; 