import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Image from 'next/image';
import { Anime } from '@/types/anime';
import { getTrailerEmbedUrl } from '@/services/anilistService';
import { formatDate } from '@/utils/dateFormatter';
import { isSequel, getFallbackImageUrl } from '@/utils/imageFallbacks';
import { logger } from '@/utils/logger';
import { FaPlay, FaCalendarAlt, FaStar, FaTrophy, FaHeart, FaInfoCircle } from 'react-icons/fa';
import { ScoreTooltip } from './ScoreTooltip';

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
  const [videoPreloaded, setVideoPreloaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageRetryCount = useRef(0);

  // Set mounted state on client side
  useEffect(() => {
    setMounted(true);
    logger.component('AnimeCard', 'mounted', { animeId: anime.id });
    
    return () => {
      logger.component('AnimeCard', 'unmounted', { animeId: anime.id });
    };
  }, [anime.id]);

  // Get title with fallbacks
  const getTitle = useCallback(() => {
    if (anime.title?.english) return anime.title.english;
    if (anime.title?.romaji) return anime.title.romaji;
    if (anime.title?.native) return anime.title.native;
    return 'Unknown Anime';
  }, [anime.title]);

  // Handle image loading error
  const handleImageError = useCallback(async () => {
    // Increment retry count
    imageRetryCount.current += 1;
    
    logger.error('Failed to load anime cover image', 'AnimeCard', {
      animeId: anime.id,
      imageUrl: anime.coverImage?.large || anime.coverImage?.medium,
      retryCount: imageRetryCount.current
    });
    
    try {
      // Only try to find a fallback if we haven't already set one
      if (!fallbackImageUrl) {
        const title = getTitle();
        const fallback = await getFallbackImageUrl(title, anime.id);
        setFallbackImageUrl(fallback);
        logger.info(`Using fallback image: ${fallback}`, 'AnimeCard', { animeId: anime.id });
      }
      
      setImageError(true);
    } catch (error) {
      logger.error('Error setting fallback image', 'AnimeCard', {
        animeId: anime.id,
        error: error instanceof Error ? error.message : String(error)
      });
      // Set default fallback if all else fails
      setFallbackImageUrl('/images/no-image.jpg');
      setImageError(true);
    }
  }, [anime.id, anime.coverImage, fallbackImageUrl, getTitle]);

  // Preload video when component mounts
  useEffect(() => {
    if (!mounted || !anime.trailer || !anime.trailer.id || !anime.trailer.site) return;
    
    // Clear any existing timeout
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    // Set a timeout to preload the video after a short delay
    preloadTimeoutRef.current = setTimeout(() => {
      const preloadVideo = () => {
        try {
          // Create a hidden iframe to preload the video
          const preloadIframe = document.createElement('iframe');
          preloadIframe.style.display = 'none';
          
          // Ensure trailer object is valid before passing to getTrailerEmbedUrl
          if (anime.trailer && anime.trailer.id && anime.trailer.site) {
            preloadIframe.src = getTrailerEmbedUrl(anime.trailer);
            preloadIframe.onload = () => {
              setVideoPreloaded(true);
              document.body.removeChild(preloadIframe);
              logger.debug('Video preloaded successfully', 'AnimeCard', { 
                animeId: anime.id, 
                trailerId: anime.trailer?.id 
              });
            };
            preloadIframe.onerror = () => {
              document.body.removeChild(preloadIframe);
              logger.error('Failed to preload video', 'AnimeCard', { 
                animeId: anime.id, 
                trailerId: anime.trailer?.id 
              });
            };
            document.body.appendChild(preloadIframe);
          }
        } catch (error) {
          logger.error('Error during video preload', 'AnimeCard', { 
            animeId: anime.id, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      };

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
  }, [mounted, anime.id, anime.trailer]);

  // Toggle trailer visibility
  const toggleTrailer = useCallback(() => {
    setShowTrailer(prev => !prev);
    logger.component('AnimeCard', 'toggleTrailer', { 
      animeId: anime.id, 
      showTrailer: !showTrailer,
      videoPreloaded
    });
  }, [anime.id, showTrailer, videoPreloaded]);

  // Get trailer URL based on site
  const getTrailerUrl = useCallback(() => {
    if (!anime.trailer || !anime.trailer.id || !anime.trailer.site) return '';
    
    return getTrailerEmbedUrl(anime.trailer, true);
  }, [anime.trailer]);

  // Handle video error
  const handleVideoError = useCallback(() => {
    setVideoError(true);
    logger.error('Failed to load video trailer', 'AnimeCard', {
      animeId: anime.id,
      trailerId: anime.trailer?.id,
      site: anime.trailer?.site
    });
  }, [anime.id, anime.trailer]);

  // Function to format the release date
  const formatReleaseDate = () => {
    if (!anime.startDate) return 'TBA';
    
    // Handle null values in the date
    const year = anime.startDate.year;
    const month = anime.startDate.month;
    const day = anime.startDate.day;
    
    if (!year) return 'TBA';
    
    // Create a date object with fallbacks for null month/day
    const dateObj = {
      year: year,
      month: month || 1,
      day: day || 1
    };
    
    return formatDate(dateObj);
  };

  // Get cover image with fallback
  const coverImage = imageError 
    ? (fallbackImageUrl || '/images/no-image.jpg')
    : anime.coverImage?.large || anime.coverImage?.medium || '/images/no-image.jpg';

  // Get description with fallback
  const description = anime.description 
    ? anime.description.replace(/<[^>]*>/g, '') 
    : 'No description available.';

  // Check if this is a sequel
  const animeIsSequel = isSequel(getTitle());

  // Function to render ranking badge
  const renderRankingBadge = () => {
    if (anime.combinedRank === 1) {
      return (
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md z-10 flex items-center">
          <FaStar className="mr-1" /> Combined Top 1
        </div>
      );
    } else if (anime.isHadokuTopPick) {
      return (
        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-md z-10 flex items-center">
          <FaTrophy className="mr-1" /> Hadoku's Pick
        </div>
      );
    } else if (anime.isLittlemissTopPick) {
      return (
        <div className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-1 rounded-md z-10 flex items-center">
          <FaHeart className="mr-1" /> LittleMiss' Pick
        </div>
      );
    } else if (anime.combinedRank && anime.combinedRank <= 10) {
      return (
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md z-10 flex items-center opacity-80">
          <FaStar className="mr-1" /> Combined Top {anime.combinedRank}
        </div>
      );
    }
    return null;
  };

  // Toggle score tooltip visibility
  const toggleScoreTooltip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !showScoreTooltip;
    logger.info(`Toggling score tooltip for anime ${anime.id} to ${newState ? 'visible' : 'hidden'}`, 'AnimeCard');
    setShowScoreTooltip(newState);
  }, [anime.id, showScoreTooltip]);

  return (
    <div 
      className={`relative bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 h-full flex flex-col ${
        showTrailer ? 'scale-105 z-10' : 'hover:scale-102'
      }`}
    >
      {/* Ranking Badge */}
      {renderRankingBadge()}

      {/* Trailer or Cover Image */}
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {showTrailer && anime.trailer && anime.trailer.id ? (
          <div className="w-full h-full">
            {videoError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white p-4 text-center">
                <div>
                  <p className="font-medium">Failed to load trailer</p>
                  <button 
                    onClick={toggleTrailer}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Show Cover Image
                  </button>
                </div>
              </div>
            ) : (
              <iframe
                ref={videoRef}
                className="w-full h-full"
                src={getTrailerUrl()}
                title={`${getTitle()} trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={handleVideoError}
              ></iframe>
            )}
          </div>
        ) : (
          <div 
            className="relative w-full h-full cursor-pointer group"
            onClick={anime.trailer && anime.trailer.id ? toggleTrailer : undefined}
          >
            {/* Use next/image with error handling */}
            <div className="relative w-full h-full">
              <Image
                src={coverImage}
                alt={getTitle()}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
                unoptimized={imageError} // Skip optimization for fallback images
              />
              
              {imageError && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center">
                  {animeIsSequel ? 'Using fallback image' : 'Image unavailable'}
                </div>
              )}
            </div>
            
            {anime.trailer && anime.trailer.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90 rounded-full p-3">
                  <svg 
                    className="w-8 h-8 text-red-600" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {videoPreloaded ? 'Preloaded' : 'Watch Trailer'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Anime Details */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
          {getTitle()}
        </h3>
        
        {/* Ranking Scores with Info Icon */}
        {(anime.hadokuScore || anime.littlemissScore || anime.combinedScore) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {anime.popularity && (
              <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded flex items-center">
                Popularity: {anime.popularity.toLocaleString()}
              </span>
            )}
            {anime.combinedScore && (
              <span className="bg-blue-900 text-white text-xs px-2 py-1 rounded flex items-center">
                Combined: {anime.combinedScore.toFixed(1)}
                <button 
                  className="ml-1 text-white/70 hover:text-white"
                  aria-label="Show score breakdown"
                  onClick={toggleScoreTooltip}
                >
                  <FaInfoCircle size={12} />
                </button>
              </span>
            )}
            {anime.hadokuScore && (
              <span className="bg-purple-900 text-white text-xs px-2 py-1 rounded">
                Hadoku: {anime.hadokuScore.toFixed(1)}
              </span>
            )}
            {anime.littlemissScore && (
              <span className="bg-pink-900 text-white text-xs px-2 py-1 rounded">
                LittleMiss: {anime.littlemissScore.toFixed(1)}
              </span>
            )}
          </div>
        )}
        
        <div className="flex flex-wrap gap-1 mb-2">
          {anime.genres && anime.genres.slice(0, 3).map((genre, index) => (
            <span 
              key={index} 
              className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded"
            >
              {genre}
            </span>
          ))}
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Release: <span className="font-medium">{formatReleaseDate()}</span>
        </p>
        
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
          {description}
        </p>

        {/* Trailer button for mobile (always visible) */}
        {anime.trailer && anime.trailer.id && (
          <button
            onClick={toggleTrailer}
            className="w-full mt-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium flex items-center justify-center sm:hidden"
          >
            {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
            {videoPreloaded && !showTrailer && (
              <span className="ml-1 text-xs bg-white bg-opacity-20 px-1 rounded">Ready</span>
            )}
          </button>
        )}
      </div>

      {/* Score Tooltip - Rendered at the document root level using a portal */}
      {showScoreTooltip && (
        <ScoreTooltip 
          anime={anime} 
          isVisible={showScoreTooltip} 
          onClose={() => {
            logger.info(`Closing score tooltip for anime ${anime.id}`, 'AnimeCard');
            setShowScoreTooltip(false);
          }} 
        />
      )}
    </div>
  );
}); 