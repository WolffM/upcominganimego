import { useState, useCallback, memo } from 'react';
import { RankingConfig as RankingConfigType, RankingFactor, DEFAULT_RANKING_CONFIG } from '@/utils/rankingSystem';
import { logger } from '@/utils/logger';

interface RankingConfigProps {
  config: RankingConfigType;
  onConfigChange: (config: Partial<RankingConfigType>) => void;
  onReset: () => void;
}

export const RankingConfig = memo(({ config, onConfigChange, onReset }: RankingConfigProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
    logger.component('RankingConfig', 'toggleExpanded', { isExpanded: !isExpanded });
  }, [isExpanded]);

  const handleFactorToggle = useCallback((factor: RankingFactor) => {
    const currentSetting = config.factors[factor];
    if (!currentSetting) return;

    logger.component('RankingConfig', 'toggleFactor', { factor, enabled: !currentSetting.enabled });
    
    onConfigChange({
      factors: {
        [factor]: {
          ...currentSetting,
          enabled: !currentSetting.enabled
        }
      }
    });
  }, [config.factors, onConfigChange]);

  const handleWeightChange = useCallback((factor: RankingFactor, weight: number) => {
    const currentSetting = config.factors[factor];
    if (!currentSetting) return;

    logger.component('RankingConfig', 'changeWeight', { factor, weight });
    
    onConfigChange({
      factors: {
        [factor]: {
          ...currentSetting,
          weight
        }
      }
    });
  }, [config.factors, onConfigChange]);

  const handleGenreAdd = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const input = event.currentTarget;
      const genre = input.value.trim();
      
      if (genre && !config.preferredGenres?.includes(genre)) {
        logger.component('RankingConfig', 'addGenre', { genre });
        
        onConfigChange({
          preferredGenres: [...(config.preferredGenres || []), genre]
        });
        
        input.value = '';
      }
    }
  }, [config.preferredGenres, onConfigChange]);

  const handleGenreRemove = useCallback((genre: string) => {
    logger.component('RankingConfig', 'removeGenre', { genre });
    
    onConfigChange({
      preferredGenres: config.preferredGenres?.filter(g => g !== genre)
    });
  }, [config.preferredGenres, onConfigChange]);

  const handleExcludedGenreAdd = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const input = event.currentTarget;
      const genre = input.value.trim();
      
      if (genre && !config.excludedGenres?.includes(genre)) {
        logger.component('RankingConfig', 'addExcludedGenre', { genre });
        
        onConfigChange({
          excludedGenres: [...(config.excludedGenres || []), genre]
        });
        
        input.value = '';
      }
    }
  }, [config.excludedGenres, onConfigChange]);

  const handleExcludedGenreRemove = useCallback((genre: string) => {
    logger.component('RankingConfig', 'removeExcludedGenre', { genre });
    
    onConfigChange({
      excludedGenres: config.excludedGenres?.filter(g => g !== genre)
    });
  }, [config.excludedGenres, onConfigChange]);

  const handleReset = useCallback(() => {
    logger.component('RankingConfig', 'reset');
    onReset();
  }, [onReset]);

  // Get the count of enabled factors
  const enabledFactorCount = Object.values(config.factors).filter(f => f.enabled).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ranking Settings
        </h3>
        <button
          onClick={toggleExpanded}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Hide' : 'Show'} Options
        </button>
      </div>
      
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        <p>
          Currently using {enabledFactorCount} ranking factors
          {config.preferredGenres && config.preferredGenres.length > 0 && 
            ` with ${config.preferredGenres.length} preferred genres`}
        </p>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-6">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Ranking Factors</h4>
            <div className="space-y-3">
              {Object.entries(config.factors).map(([factor, settings]) => (
                <div key={factor} className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex items-center mb-2 sm:mb-0 sm:w-1/2">
                    <input
                      type="checkbox"
                      id={`factor-${factor}`}
                      checked={settings.enabled}
                      onChange={() => handleFactorToggle(factor as RankingFactor)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`factor-${factor}`} className="ml-2 text-gray-700 dark:text-gray-300">
                      {factor.charAt(0).toUpperCase() + factor.slice(1).replace(/([A-Z])/g, ' $1')}
                      
                      {/* Show "not implemented" badge for factors that aren't implemented yet */}
                      {(factor === RankingFactor.TRAILER_VIEWS || 
                        factor === RankingFactor.USER_PREFERENCE || 
                        factor === RankingFactor.TRENDING) && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          Coming Soon
                        </span>
                      )}
                    </label>
                  </div>
                  
                  <div className="sm:w-1/2 flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.weight}
                      onChange={(e) => handleWeightChange(factor as RankingFactor, parseFloat(e.target.value))}
                      disabled={!settings.enabled}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 w-10 text-right">
                      {(settings.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Preferred Genres</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {config.preferredGenres && config.preferredGenres.length > 0 ? (
                  config.preferredGenres.map(genre => (
                    <span 
                      key={genre} 
                      className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex items-center"
                    >
                      {genre}
                      <button
                        onClick={() => handleGenreRemove(genre)}
                        className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100 focus:outline-none"
                        aria-label={`Remove ${genre}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">No preferred genres</span>
                )}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Add genre (press Enter)"
                  onKeyDown={handleGenreAdd}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Examples: Action, Romance, Fantasy, Sci-Fi
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Excluded Genres</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {config.excludedGenres && config.excludedGenres.length > 0 ? (
                  config.excludedGenres.map(genre => (
                    <span 
                      key={genre} 
                      className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center"
                    >
                      {genre}
                      <button
                        onClick={() => handleExcludedGenreRemove(genre)}
                        className="ml-1 text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-100 focus:outline-none"
                        aria-label={`Remove ${genre}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">No excluded genres</span>
                )}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Add genre to exclude (press Enter)"
                  onKeyDown={handleExcludedGenreAdd}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}); 