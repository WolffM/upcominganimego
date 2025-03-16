import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Image from 'next/image';
import { Anime } from '@/types/anime';
import { getTrailerEmbedUrl } from '@/services/anilistService';
import { getFallbackImageUrl } from '@/utils/imageFallbacks';
import {
  getBestTitle,
  getAnimeReleaseDate,
  getCleanDescription,
  getBestImageUrl,
  hasValidTrailer,
  getTopGenres
} from '@/utils/animeHelpers';
import { getPreferenceScoreBadgeClass } from '@/utils/preferenceScoring';
import { FaStar, FaInfoCircle, FaPlay, FaCalendarAlt, FaUser, FaUsers } from 'react-icons/fa';
import { COMMON_STYLES, CARD_STYLES } from '@/utils/uiStyles';

export interface AnimeCardProps {
  anime: Anime;
  index: number;
}

export const AnimeCard = memo(function AnimeCard({
  anime
}: AnimeCardProps) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageRetryCount = useRef(0);

  // Set mounted state on client side
  useEffect(() => {
    setMounted(true);

    return () => {
      // Cleanup function
    };
  }, [anime.id]);

  // Handle image loading error
  const handleImageError = useCallback(async () => {
    // Increment retry count
    imageRetryCount.current += 1;

    try {
      // Only try to find a fallback if we haven't already set one
      if (!fallbackImageUrl) {
        const fallback = await getFallbackImageUrl(anime);
        setFallbackImageUrl(fallback);
      }

      setImageError(true);
    } catch (err) {
      // Set default fallback if all else fails
      setFallbackImageUrl('/images/no-image.jpg');
      setImageError(true);
    }
  }, [anime, fallbackImageUrl]);

  // Helper function to preload video
  const preloadVideo = useCallback(() => {
    try {
      // Create a hidden iframe to preload the video
      const preloadIframe = document.createElement('iframe');
      preloadIframe.style.display = 'none';

      // Ensure trailer object is valid before passing to getTrailerEmbedUrl
      if (hasValidTrailer(anime)) {
        preloadIframe.src = getTrailerEmbedUrl(anime.trailer!);
        preloadIframe.onload = () => {
          document.body.removeChild(preloadIframe);
        };
        preloadIframe.onerror = () => {
          document.body.removeChild(preloadIframe);
        };
        document.body.appendChild(preloadIframe);
      }
    } catch (err) {
      console.error('Error preloading video:', err);
    }
  }, [anime]);

  // Preload video when component mounts
  useEffect(() => {
    if (!mounted || !hasValidTrailer(anime)) return;

    // Clear any existing timeout
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    // Set a timeout to preload the video after a short delay
    preloadTimeoutRef.current = setTimeout(() => {
      // Only preload if the browser is idle
      if ('requestIdleCallback' in window) {
        (window as Window & typeof globalThis & { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(preloadVideo);
      } else {
        preloadVideo();
      }
    }, 2000); // 2 second delay before preloading

    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [mounted, anime, preloadVideo]);

  // Toggle trailer visibility
  const toggleTrailer = useCallback(() => {
    setShowTrailer(prev => !prev);
  }, []);

  // Handle video error
  const handleVideoError = useCallback(() => {
    setVideoError(true);
  }, []);

  // Image URL - use fallback if main image fails
  const imageUrl = imageError && fallbackImageUrl
    ? fallbackImageUrl
    : getBestImageUrl(anime);

  // Format title
  const title = getBestTitle(anime);

  // Get clean description
  const description = getCleanDescription(anime);

  // Get release date
  const releaseDate = getAnimeReleaseDate(anime);

  // Get top genres
  const topGenres = getTopGenres(anime, 3);

  // Determine format badge style based on format
  const getFormatBadgeStyle = () => {
    return CARD_STYLES.FORMAT_BADGE;
  };

  // Render the preference score badges
  const renderPreferenceScores = () => {
    if (!anime.preferenceScores) return null;

    const userScores = anime.preferenceScores.users || [];
    const hasMultipleUsers = userScores.length > 1;

    return (
      <div className="relative flex flex-wrap gap-1 mt-2 mb-3">
        {/* Individual user score badges - limit to 3 to save space */}
        {userScores.slice(0, 3).map((userScore, idx) => (
          <div
            key={`user-score-${userScore.username}-${idx}`}
            className={`flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPreferenceScoreBadgeClass(userScore.score, userScore.username, idx)}`}
            title={`${userScore.username}: ${userScore.score.toFixed(1)}

Based on preferences:
  Genre: ${userScore.breakdown.genre.toFixed(1)}
  Studio: ${userScore.breakdown.studio.toFixed(1)}
  Director: ${userScore.breakdown.director.toFixed(1)}
  Tags: ${userScore.breakdown.tags.toFixed(1)}
              
From public data:
  ${userScore.breakdown.hasOwnProperty('popularity') ? `Popularity Boost: ${(userScore.breakdown as { genre: number; studio: number; director: number; tags: number; popularity: number }).popularity.toFixed(1)}` : ''}`}
          >
            <FaUser className="mr-1 h-2.5 w-2.5" />
            <span className="max-w-[60px] truncate">{userScore.username}</span>
            <span className="ml-1">
              {userScore.score > 0 ? '+' : ''}
              {userScore.score.toFixed(1)}
            </span>
          </div>
        ))}

        {/* Combined score badge - Only show for multiple users and display it last */}
        {hasMultipleUsers && anime.preferenceScores.combined && (
          <div
            className={`flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPreferenceScoreBadgeClass(anime.preferenceScores.combined.score, 'combined')}`}
            title={`Combined score (average of ${userScores.length} users): ${anime.preferenceScores.combined.score.toFixed(1)}

Based on user preferences:
  Genre: ${anime.preferenceScores.combined.breakdown.genre.toFixed(1)}
  Studio: ${anime.preferenceScores.combined.breakdown.studio.toFixed(1)}
  Director: ${anime.preferenceScores.combined.breakdown.director.toFixed(1)}
  Tags: ${anime.preferenceScores.combined.breakdown.tags.toFixed(1)}
  
From public data:
  ${anime.preferenceScores.combined.breakdown.hasOwnProperty('popularity') ? `Popularity Boost: ${(anime.preferenceScores.combined.breakdown as { genre: number; studio: number; director: number; tags: number; popularity: number }).popularity.toFixed(1)}` : ''}
`}
          >
            <FaUsers className="mr-1 h-2.5 w-2.5" />
            <span>
              {anime.preferenceScores.combined.score > 0 ? '+' : ''}
              {anime.preferenceScores.combined.score.toFixed(1)}
            </span>
          </div>
        )}

        {/* Show +X more if there are more than 3 users */}
        {userScores.length > 3 && (
          <div
            className="flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-500 text-white"
            title={`${userScores.length - 3} more users`}
          >
            +{userScores.length - 3} more
          </div>
        )}
      </div>
    );
  };

  // Render the trailer modal when active
  const renderTrailerModal = () => {
    if (!showTrailer || !hasValidTrailer(anime)) return null;

    return (
      <div className={COMMON_STYLES.MODAL_OVERLAY} onClick={toggleTrailer}>
        <div className={CARD_STYLES.MODAL_CONTAINER} onClick={(e) => e.stopPropagation()}>
          <button
            className={CARD_STYLES.CLOSE_BUTTON}
            onClick={toggleTrailer}
          >
            Close
          </button>

          <div className={CARD_STYLES.VIDEO_CONTAINER}>
            {hasValidTrailer(anime) && (
              <iframe
                src={getTrailerEmbedUrl(anime.trailer!, true)}
                className={CARD_STYLES.IFRAME}
                allowFullScreen
                allow="autoplay; encrypted-media"
                ref={videoRef}
                onError={handleVideoError}
                title={`${title} trailer`}
              ></iframe>
            )}

            {videoError && (
              <div className={CARD_STYLES.ERROR_CONTAINER}>
                <FaInfoCircle className={CARD_STYLES.ERROR_ICON} />
                <p>Failed to load trailer</p>
                <button
                  className={CARD_STYLES.YOUTUBE_BUTTON}
                  onClick={() => window.open(
                    `https://www.youtube.com/watch?v=${anime.trailer?.id}`,
                    '_blank'
                  )}
                >
                  Watch on YouTube
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={CARD_STYLES.CONTAINER}>
      {/* Anime Image */}
      <div className={CARD_STYLES.IMAGE_CONTAINER}>
        <Image
          src={imageUrl}
          alt={title}
          fill
          loading="lazy"
          className={CARD_STYLES.IMAGE}
          onError={handleImageError}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {hasValidTrailer(anime) && (
          <button
            aria-label="Play trailer"
            onClick={toggleTrailer}
            className={CARD_STYLES.TRAILER_OVERLAY}
          >
            <div className={CARD_STYLES.TRAILER_BUTTON}>
              <FaPlay className={CARD_STYLES.PLAY_ICON} />
            </div>
          </button>
        )}
      </div>

      {/* Anime Info */}
      <div className={CARD_STYLES.INFO_CONTAINER}>
        <h3 className={CARD_STYLES.TITLE}>
          {title}
        </h3>

        {/* Release Date and Popularity - Evenly Distributed */}
        <div className={CARD_STYLES.METADATA_ROW}>
          <div className={CARD_STYLES.DATE_TEXT}>
            <FaCalendarAlt className="inline mr-1" />
            {releaseDate}
          </div>

          <div className="flex-grow"></div>

          {anime.popularity && (
            <div className={CARD_STYLES.POPULARITY_CONTAINER}>
              <FaStar className={CARD_STYLES.STAR_ICON} />
              <span>{anime.popularity.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Format and Genres - Same Row with Separator */}
        <div className={CARD_STYLES.TAGS_CONTAINER}>
          {/* Format Badge */}
          {anime.format && (
            <span className={getFormatBadgeStyle()}>
              {anime.format}
            </span>
          )}

          {/* Separator */}
          {anime.format && topGenres.length > 0 && (
            <span className="text-gray-400 mx-1">|</span>
          )}

          {/* Genre Tags */}
          {topGenres.map(genre => (
            <span
              key={genre}
              className={CARD_STYLES.GENRE_TAG}
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Preference Score Badges */}
        {renderPreferenceScores()}

        {/* Description */}
        {description && (
          <p className={CARD_STYLES.DESCRIPTION}>
            {description}
          </p>
        )}
      </div>

      {/* Trailer Modal */}
      {renderTrailerModal()}
    </div>
  );
}); 