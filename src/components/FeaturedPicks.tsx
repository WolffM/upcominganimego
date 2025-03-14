import React from 'react';
import Image from 'next/image';
import { Anime } from '@/types/anime';
import { getTrailerEmbedUrl } from '@/services/anilistService';
import { FaPlay, FaTrophy, FaHeart, FaStar } from 'react-icons/fa';

interface FeaturedPicksProps {
  hadokuPick: Anime | null;
  littlemissPick: Anime | null;
  className?: string;
}

export const FeaturedPicks: React.FC<FeaturedPicksProps> = ({
  hadokuPick,
  littlemissPick,
  className = ''
}) => {
  const [activeTrailer, setActiveTrailer] = React.useState<string | null>(null);

  // Function to get the best available image
  const getBestImage = (anime: Anime): string => {
    if (anime.bannerImage) return anime.bannerImage;
    if (anime.coverImage.extraLarge) return anime.coverImage.extraLarge;
    if (anime.coverImage.large) return anime.coverImage.large;
    if (anime.coverImage.medium) return anime.coverImage.medium;
    // Fallback to a placeholder image
    return '/images/no-image.jpg';
  };

  // Function to handle trailer click
  const handleTrailerClick = (anime: Anime) => {
    if (anime.trailer && anime.trailer.site && anime.trailer.id) {
      const embedUrl = getTrailerEmbedUrl(anime.trailer, true);
      if (embedUrl) {
        setActiveTrailer(embedUrl);
      }
    }
  };

  // Function to close trailer
  const closeTrailer = () => {
    setActiveTrailer(null);
  };

  // If no picks, don't render anything
  if (!hadokuPick && !littlemissPick) return null;

  // Function to render badge based on anime type
  const renderBadge = (anime: Anime, type: 'hadoku' | 'littlemiss' | 'combined') => {
    if (type === 'hadoku') {
      return (
        <div className="flex items-center">
          <FaTrophy className="text-purple-500 mr-2" />
          <span className="text-white font-bold">Hadoku's Top Pick</span>
        </div>
      );
    } else if (type === 'littlemiss') {
      return (
        <div className="flex items-center">
          <FaHeart className="text-pink-500 mr-2" />
          <span className="text-white font-bold">LittleMiss's Top Pick</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          <FaStar className="text-blue-500 mr-2" />
          <span className="text-white font-bold">
            Combined Top {anime.combinedRank}
          </span>
        </div>
      );
    }
  };

  return (
    <div className={`${className}`}>
      <h2 className="text-2xl font-bold mb-4">Featured Picks</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hadokuPick && (
          <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-800">
            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
              {renderBadge(hadokuPick, 'hadoku')}
            </div>
            
            <div className="relative aspect-video">
              <Image
                src={getBestImage(hadokuPick)}
                alt={hadokuPick.title.english || hadokuPick.title.romaji}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {hadokuPick.trailer && (
                <button 
                  onClick={() => handleTrailerClick(hadokuPick)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
                >
                  <div className="bg-purple-600 rounded-full p-4">
                    <FaPlay className="text-white text-xl" />
                  </div>
                </button>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="text-xl font-bold text-white mb-2">
                {hadokuPick.title.english || hadokuPick.title.romaji}
              </h3>
              <div className="flex items-center mb-2">
                <span className="bg-purple-900 text-white text-xs px-2 py-1 rounded">
                  Score: {hadokuPick.hadokuScore?.toFixed(1)}
                </span>
                {hadokuPick.combinedScore && (
                  <span className="bg-blue-900 text-white text-xs px-2 py-1 rounded ml-2">
                    Combined: {hadokuPick.combinedScore.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-gray-300 line-clamp-2">
                {hadokuPick.description?.replace(/<[^>]*>/g, '') || 'No description available.'}
              </p>
            </div>
          </div>
        )}
        
        {littlemissPick && (
          <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-800">
            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
              {renderBadge(littlemissPick, 'littlemiss')}
            </div>
            
            <div className="relative aspect-video">
              <Image
                src={getBestImage(littlemissPick)}
                alt={littlemissPick.title.english || littlemissPick.title.romaji}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {littlemissPick.trailer && (
                <button 
                  onClick={() => handleTrailerClick(littlemissPick)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
                >
                  <div className="bg-pink-600 rounded-full p-4">
                    <FaPlay className="text-white text-xl" />
                  </div>
                </button>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="text-xl font-bold text-white mb-2">
                {littlemissPick.title.english || littlemissPick.title.romaji}
              </h3>
              <div className="flex items-center mb-2">
                <span className="bg-pink-900 text-white text-xs px-2 py-1 rounded">
                  Score: {littlemissPick.littlemissScore?.toFixed(1)}
                </span>
                {littlemissPick.combinedScore && (
                  <span className="bg-blue-900 text-white text-xs px-2 py-1 rounded ml-2">
                    Combined: {littlemissPick.combinedScore.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-gray-300 line-clamp-2">
                {littlemissPick.description?.replace(/<[^>]*>/g, '') || 'No description available.'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Trailer Modal */}
      {activeTrailer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl">
            <button 
              onClick={closeTrailer}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              Close
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={activeTrailer}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 