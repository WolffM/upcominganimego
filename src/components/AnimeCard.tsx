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
import { FaStar, FaInfoCircle, FaPlay, FaCalendarAlt } from 'react-icons/fa';
import { COMMON_STYLES, CARD_STYLES } from '@/utils/uiStyles';

export interface AnimeCardProps {
  anime: Anime;
  index: number;
}

export const AnimeCard = memo(function AnimeCard({ 
  anime,
  index
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
    } catch (error) {
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
    } catch (error) {
      console.error('Error preloading video:', error);
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
        (window as any).requestIdleCallback(preloadVideo);
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
    if (anime.format === 'TV') {
      return CARD_STYLES.TV_BADGE;
    } else if (anime.format === 'MOVIE') {
      return CARD_STYLES.MOVIE_BADGE;
    }
    return CARD_STYLES.FORMAT_BADGE;
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