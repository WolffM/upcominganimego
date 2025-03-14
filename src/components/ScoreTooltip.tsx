import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Anime } from '@/types/anime';
import { FaTimes, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { logger } from '@/utils/logger';

interface ScoreTooltipProps {
  anime: Anime;
  isVisible: boolean;
  onClose?: () => void;
}

export const ScoreTooltip: React.FC<ScoreTooltipProps> = ({ 
  anime, 
  isVisible,
  onClose 
}) => {
  useEffect(() => {
    if (isVisible) {
      logger.info(`ScoreTooltip mounted for anime ${anime.id}`, 'ScoreTooltip');
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      if (isVisible) {
        logger.info(`ScoreTooltip unmounted for anime ${anime.id}`, 'ScoreTooltip');
        // Restore body scrolling when modal is closed
        document.body.style.overflow = '';
      }
    };
  }, [isVisible, anime.id]);

  if (!isVisible || !anime.rankingFactors) return null;

  // Format score with one decimal place
  const formatScore = (score?: number) => {
    if (score === undefined || score === null) return 'N/A';
    return score.toFixed(1);
  };

  // Format percentage with + or - sign
  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return '0%';
    const percentage = (value * 100).toFixed(1);
    return value > 0 ? `+${percentage}%` : `${percentage}%`;
  };

  // Get base popularity score
  const baseScore = anime.rankingFactors?.popularity || 0;

  // Get individual user scores from the anime object
  const hadokuFactors = {
    studioScore: anime.hadokuFactors?.studioScore || 0,
    directorScore: anime.hadokuFactors?.directorScore || 0,
    genreScore: anime.hadokuFactors?.genreScore || 0,
    tagScore: anime.hadokuFactors?.tagScore || 0
  };

  const littlemissFactors = {
    studioScore: anime.littlemissFactors?.studioScore || 0,
    directorScore: anime.littlemissFactors?.directorScore || 0,
    genreScore: anime.littlemissFactors?.genreScore || 0,
    tagScore: anime.littlemissFactors?.tagScore || 0
  };

  // If individual factors aren't available, use the averaged ones
  if (!anime.hadokuFactors || !anime.littlemissFactors) {
    // Use the averaged factors for both users
    hadokuFactors.studioScore = anime.rankingFactors?.studioScore || 0;
    hadokuFactors.directorScore = anime.rankingFactors?.directorScore || 0;
    hadokuFactors.genreScore = anime.rankingFactors?.genreScore || 0;
    hadokuFactors.tagScore = anime.rankingFactors?.tagScore || 0;

    littlemissFactors.studioScore = anime.rankingFactors?.studioScore || 0;
    littlemissFactors.directorScore = anime.rankingFactors?.directorScore || 0;
    littlemissFactors.genreScore = anime.rankingFactors?.genreScore || 0;
    littlemissFactors.tagScore = anime.rankingFactors?.tagScore || 0;
  }

  // Handle background click to close the modal
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (onClose && e.target === e.currentTarget) {
      logger.info(`ScoreTooltip background clicked for anime ${anime.id}`, 'ScoreTooltip');
      onClose();
    }
  };

  // Create the modal content
  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={handleBackgroundClick}
    >
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Score Breakdown</h3>
          {onClose && (
            <button 
              onClick={() => {
                logger.info(`ScoreTooltip close button clicked for anime ${anime.id}`, 'ScoreTooltip');
                onClose();
              }}
              className="text-gray-400 hover:text-white"
              aria-label="Close score breakdown"
            >
              <FaTimes size={20} />
            </button>
          )}
        </div>
        
        <h4 className="font-semibold mb-2 text-blue-400">
          {anime.title?.english || anime.title?.romaji || 'Anime'}
        </h4>
        
        {/* Base popularity score - displayed at the top */}
        <div className="bg-gray-800 p-3 rounded-lg mb-4 mt-3">
          <div className="text-center mb-2 font-medium">Base Popularity Score</div>
          <div className="text-center text-2xl font-bold text-white">{formatScore(baseScore)}</div>
          <div className="text-center text-xs text-gray-400 mt-1">
            (Based on {anime.popularity?.toLocaleString() || 'N/A'} popularity)
          </div>
          <div className="text-center text-xs text-gray-400 mt-1">
            Popularity is calculated on a logarithmic scale:
          </div>
          <div className="flex justify-center gap-3 text-xs text-gray-400 mt-1">
            <span>1K → 6.0</span>
            <span>10K → 8.0</span>
            <span>100K → 10.0</span>
            <span>200K → 10.6</span>
          </div>
        </div>
        
        {/* Header row for modifiers */}
        <div className="text-center mb-3 font-medium text-gray-300">Personal Preference Modifiers</div>
        
        <div className="flex mb-2 border-b border-gray-700 pb-1">
          <div className="w-1/3 font-semibold">Factor</div>
          <div className="w-1/3 font-semibold text-center text-purple-400">Hadoku</div>
          <div className="w-1/3 font-semibold text-center text-pink-400">LittleMiss</div>
        </div>
        
        {/* Studio modifier */}
        <div className="flex py-2 border-b border-gray-800">
          <div className="w-1/3 font-medium">Studio <span className="text-xs text-gray-400">(±20%)</span></div>
          <div className="w-1/3 text-center flex justify-center items-center">
            {hadokuFactors.studioScore !== 0 && (
              hadokuFactors.studioScore > 0 ? 
                <FaArrowUp className="text-green-500 mr-1" size={12} /> : 
                <FaArrowDown className="text-red-500 mr-1" size={12} />
            )}
            <span className={hadokuFactors.studioScore > 0 ? "text-green-500" : hadokuFactors.studioScore < 0 ? "text-red-500" : ""}>
              {formatPercentage(hadokuFactors.studioScore / baseScore)}
            </span>
          </div>
          <div className="w-1/3 text-center flex justify-center items-center">
            {littlemissFactors.studioScore !== 0 && (
              littlemissFactors.studioScore > 0 ? 
                <FaArrowUp className="text-green-500 mr-1" size={12} /> : 
                <FaArrowDown className="text-red-500 mr-1" size={12} />
            )}
            <span className={littlemissFactors.studioScore > 0 ? "text-green-500" : littlemissFactors.studioScore < 0 ? "text-red-500" : ""}>
              {formatPercentage(littlemissFactors.studioScore / baseScore)}
            </span>
          </div>
        </div>
        
        {/* Director modifier */}
        <div className="flex py-2 border-b border-gray-800">
          <div className="w-1/3 font-medium">Director <span className="text-xs text-gray-400">(±20%)</span></div>
          <div className="w-1/3 text-center flex justify-center items-center">
            {hadokuFactors.directorScore !== 0 && (
              hadokuFactors.directorScore > 0 ? 
                <FaArrowUp className="text-green-500 mr-1" size={12} /> : 
                <FaArrowDown className="text-red-500 mr-1" size={12} />
            )}
            <span className={hadokuFactors.directorScore > 0 ? "text-green-500" : hadokuFactors.directorScore < 0 ? "text-red-500" : ""}>
              {formatPercentage(hadokuFactors.directorScore / baseScore)}
            </span>
          </div>
          <div className="w-1/3 text-center flex justify-center items-center">
            {littlemissFactors.directorScore !== 0 && (
              littlemissFactors.directorScore > 0 ? 
                <FaArrowUp className="text-green-500 mr-1" size={12} /> : 
                <FaArrowDown className="text-red-500 mr-1" size={12} />
            )}
            <span className={littlemissFactors.directorScore > 0 ? "text-green-500" : littlemissFactors.directorScore < 0 ? "text-red-500" : ""}>
              {formatPercentage(littlemissFactors.directorScore / baseScore)}
            </span>
          </div>
        </div>
        
        {/* Genre modifier */}
        <div className="flex py-2 border-b border-gray-800">
          <div className="w-1/3 font-medium">Genre <span className="text-xs text-gray-400">(±10%)</span></div>
          <div className="w-1/3 text-center flex justify-center items-center">
            {hadokuFactors.genreScore !== 0 && (
              hadokuFactors.genreScore > 0 ? 
                <FaArrowUp className="text-green-500 mr-1" size={12} /> : 
                <FaArrowDown className="text-red-500 mr-1" size={12} />
            )}
            <span className={hadokuFactors.genreScore > 0 ? "text-green-500" : hadokuFactors.genreScore < 0 ? "text-red-500" : ""}>
              {formatPercentage(hadokuFactors.genreScore / baseScore)}
            </span>
          </div>
          <div className="w-1/3 text-center flex justify-center items-center">
            {littlemissFactors.genreScore !== 0 && (
              littlemissFactors.genreScore > 0 ? 
                <FaArrowUp className="text-green-500 mr-1" size={12} /> : 
                <FaArrowDown className="text-red-500 mr-1" size={12} />
            )}
            <span className={littlemissFactors.genreScore > 0 ? "text-green-500" : littlemissFactors.genreScore < 0 ? "text-red-500" : ""}>
              {formatPercentage(littlemissFactors.genreScore / baseScore)}
            </span>
          </div>
        </div>
        
        {/* Tags modifier */}
        <div className="flex py-2 border-b border-gray-800">
          <div className="w-1/3 font-medium">Tags <span className="text-xs text-gray-400">(±15%)</span></div>
          <div className="w-1/3 text-center flex justify-center items-center">
            {hadokuFactors.tagScore !== 0 && (
              hadokuFactors.tagScore > 0 ? 
                <FaArrowUp className="text-green-500 mr-1" size={12} /> : 
                <FaArrowDown className="text-red-500 mr-1" size={12} />
            )}
            <span className={hadokuFactors.tagScore > 0 ? "text-green-500" : hadokuFactors.tagScore < 0 ? "text-red-500" : ""}>
              {formatPercentage(hadokuFactors.tagScore / baseScore)}
            </span>
          </div>
          <div className="w-1/3 text-center flex justify-center items-center">
            {littlemissFactors.tagScore !== 0 && (
              littlemissFactors.tagScore > 0 ? 
                <FaArrowUp className="text-green-500 mr-1" size={12} /> : 
                <FaArrowDown className="text-red-500 mr-1" size={12} />
            )}
            <span className={littlemissFactors.tagScore > 0 ? "text-green-500" : littlemissFactors.tagScore < 0 ? "text-red-500" : ""}>
              {formatPercentage(littlemissFactors.tagScore / baseScore)}
            </span>
          </div>
        </div>
        
        {/* Display anime tags */}
        {anime.tags && anime.tags.length > 0 && (
          <div className="mt-3 mb-3">
            <div className="text-sm font-medium text-gray-300 mb-2">Anime Tags:</div>
            <div className="flex flex-wrap gap-1">
              {anime.tags
                .sort((a, b) => b.rank - a.rank) // Sort by rank (highest first)
                .slice(0, 10) // Show only top 10 tags
                .map(tag => (
                  <div 
                    key={tag.id} 
                    className="px-2 py-1 bg-gray-800 rounded text-xs flex items-center"
                    title={tag.description || tag.name}
                  >
                    <span className="mr-1">{tag.name}</span>
                    <span className="text-gray-400">{tag.rank}%</span>
                  </div>
                ))
              }
            </div>
            {anime.tags.length > 10 && (
              <div className="text-xs text-gray-400 mt-1">
                +{anime.tags.length - 10} more tags
              </div>
            )}
          </div>
        )}
        
        {/* Calculation breakdown */}
        <div className="mt-4 bg-gray-800 p-3 rounded-lg">
          <div className="text-center mb-2 font-medium">Score Calculation</div>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex justify-between">
              <div className="font-medium">Base Score:</div>
              <div className="text-right">
                <span className="text-purple-400 mr-4">{formatScore(baseScore)}</span>
                <span className="text-pink-400">{formatScore(baseScore)}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div>+ Studio:</div>
              <div className="text-right">
                <span className={`text-purple-400 mr-4 ${hadokuFactors.studioScore > 0 ? "text-green-500" : hadokuFactors.studioScore < 0 ? "text-red-500" : ""}`}>
                  {formatScore(hadokuFactors.studioScore)}
                </span>
                <span className={`text-pink-400 ${littlemissFactors.studioScore > 0 ? "text-green-500" : littlemissFactors.studioScore < 0 ? "text-red-500" : ""}`}>
                  {formatScore(littlemissFactors.studioScore)}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div>+ Director:</div>
              <div className="text-right">
                <span className={`text-purple-400 mr-4 ${hadokuFactors.directorScore > 0 ? "text-green-500" : hadokuFactors.directorScore < 0 ? "text-red-500" : ""}`}>
                  {formatScore(hadokuFactors.directorScore)}
                </span>
                <span className={`text-pink-400 ${littlemissFactors.directorScore > 0 ? "text-green-500" : littlemissFactors.directorScore < 0 ? "text-red-500" : ""}`}>
                  {formatScore(littlemissFactors.directorScore)}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div>+ Genre:</div>
              <div className="text-right">
                <span className={`text-purple-400 mr-4 ${hadokuFactors.genreScore > 0 ? "text-green-500" : hadokuFactors.genreScore < 0 ? "text-red-500" : ""}`}>
                  {formatScore(hadokuFactors.genreScore)}
                </span>
                <span className={`text-pink-400 ${littlemissFactors.genreScore > 0 ? "text-green-500" : littlemissFactors.genreScore < 0 ? "text-red-500" : ""}`}>
                  {formatScore(littlemissFactors.genreScore)}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div>+ Tags:</div>
              <div className="text-right">
                <span className={`text-purple-400 mr-4 ${hadokuFactors.tagScore > 0 ? "text-green-500" : hadokuFactors.tagScore < 0 ? "text-red-500" : ""}`}>
                  {formatScore(hadokuFactors.tagScore)}
                </span>
                <span className={`text-pink-400 ${littlemissFactors.tagScore > 0 ? "text-green-500" : littlemissFactors.tagScore < 0 ? "text-red-500" : ""}`}>
                  {formatScore(littlemissFactors.tagScore)}
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-600 mt-1 pt-1 flex justify-between font-bold">
              <div>= Final Score:</div>
              <div className="text-right">
                <span className="text-purple-400 mr-4">{formatScore(anime.hadokuScore)}</span>
                <span className="text-pink-400">{formatScore(anime.littlemissScore)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Combined score and rank */}
        <div className="flex mt-4">
          <div className="w-1/2 text-center">
            <div className="font-medium mb-1">Combined Score</div>
            <div className="font-bold text-blue-400 text-xl">{formatScore(anime.combinedScore)}</div>
          </div>
          
          <div className="w-1/2 text-center">
            <div className="font-medium mb-1">Rank</div>
            <div className="font-bold text-yellow-400 text-xl">
              {anime.combinedRank ? `#${anime.combinedRank}` : 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Close button at bottom */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              logger.info(`ScoreTooltip bottom close button clicked for anime ${anime.id}`, 'ScoreTooltip');
              if (onClose) onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Use createPortal to render the modal at the document root
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
} 