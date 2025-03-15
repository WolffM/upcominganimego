import { useState } from 'react';
import { USER_INPUT_STYLES } from '@/utils/uiStyles';
import { fetchUserRatedAnimeByName } from '@/services/anilistService';
import { UserRatingsResponse } from '@/types/anime';
import { calculateRatingStats, type RatingStats } from '@/utils/userRatingsUtils';

interface UserRatingsInputProps {
  onRatingsLoaded: (ratings: UserRatingsResponse) => void;
  onClose?: () => void;
  insideModal?: boolean;
}

export const UserRatingsInput = ({ onRatingsLoaded, onClose, insideModal = false }: UserRatingsInputProps) => {
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  
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
      
      // Calculate stats using our utility function
      const stats = calculateRatingStats(ratingsData);
      setRatingStats(stats);
      
      // Success path - we have ratings
      setSuccess(`Successfully loaded ${ratingCount} rated anime from your AniList profile.`);
      
      // Call the onRatingsLoaded callback with the data
      onRatingsLoaded(ratingsData);
      
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
      
      <form onSubmit={handleSubmit} className={USER_INPUT_STYLES.FORM}>
        <div className={USER_INPUT_STYLES.FIELD_ROW}>
          <div className={USER_INPUT_STYLES.INPUT_GROUP}>
            <label htmlFor="anilist-username" className={USER_INPUT_STYLES.LABEL}>
              AniList Username
            </label>
            <input
              id="anilist-username"
              type="text"
              value={username}
              onChange={handleInputChange}
              placeholder="Enter your AniList username or profile URL"
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
            {isLoading ? 'Loading...' : 'Load Ratings'}
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
          
          {!isLoading && ratingStats && (
            <button
              type="button"
              onClick={onClose}
              className={USER_INPUT_STYLES.BUTTON}
            >
              Continue
            </button>
          )}
        </div>
        
        <p className={USER_INPUT_STYLES.INFO_TEXT}>
          Enter your AniList username or paste your full profile URL.
          <br />
          Examples: <strong>username</strong>, <strong>@username</strong>, or <strong>https://anilist.co/user/username/</strong>
          <br />
          <span className="text-indigo-300">Make sure your anime list is set to public in AniList privacy settings.</span>
        </p>
      </form>
      
      {isLoading && (
        <div className={USER_INPUT_STYLES.LOADING}>
          Looking up your ratings from AniList...
        </div>
      )}
      
      {ratingStats && (
        <div className={USER_INPUT_STYLES.STATS_CONTAINER}>
          <h3 className={USER_INPUT_STYLES.STATS_TITLE}>Rating Statistics</h3>
          <div className={USER_INPUT_STYLES.STATS_GRID}>
            <div>
              <p className={USER_INPUT_STYLES.STATS_VALUE}>
                <span className={USER_INPUT_STYLES.STATS_LABEL}>Total Ratings:</span> {ratingStats.count}
              </p>
              <p className={USER_INPUT_STYLES.STATS_VALUE}>
                <span className={USER_INPUT_STYLES.STATS_LABEL}>Average Score:</span> {ratingStats.averageScore.toFixed(1)}
              </p>
            </div>
            <div>
              <p className={USER_INPUT_STYLES.STATS_LABEL}>Top Genres:</p>
              <div className={USER_INPUT_STYLES.STATS_VALUE}>
                {ratingStats.preferredGenres.map((genre: {genre: string; count: number}, index: number) => (
                  <span key={index} className={USER_INPUT_STYLES.STATS_VALUE}>
                    {genre.genre} ({genre.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className={USER_INPUT_STYLES.STATS_FOOTER}>
            Recommendations will be personalized based on these ratings.
          </p>
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