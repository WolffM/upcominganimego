import { generateUserPreferences } from '../services/userPreferencesService';
import { logger } from '../utils/logger';

/**
 * Script to generate preferences for both users from their AniList ratings
 */
async function main() {
  logger.info('Starting preference generation script', 'generatePreferences');
  
  const users = ['Hadokuuu', '1littlemiss'];
  
  for (const username of users) {
    logger.info(`Generating preferences for ${username}...`, 'generatePreferences');
    
    try {
      const preferences = await generateUserPreferences(username);
      
      if (preferences) {
        logger.info(`Successfully generated preferences for ${username}`, 'generatePreferences');
        
        // Log some stats
        logger.info(`Studios: ${preferences.studios.size}`, 'generatePreferences');
        logger.info(`Directors: ${preferences.directors.size}`, 'generatePreferences');
        logger.info(`Genres: ${preferences.genres.size}`, 'generatePreferences');
        logger.info(`Tags: ${preferences.tags.size}`, 'generatePreferences');
        
        // Log top preferences
        const topStudios = Array.from(preferences.studios.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        logger.info(`Top studios: ${topStudios.map(([studio, score]) => `${studio} (${score.toFixed(1)})`).join(', ')}`, 'generatePreferences');
        
        const topGenres = Array.from(preferences.genres.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        logger.info(`Top genres: ${topGenres.map(([genre, score]) => `${genre} (${score.toFixed(1)})`).join(', ')}`, 'generatePreferences');
      } else {
        logger.error(`Failed to generate preferences for ${username}`, 'generatePreferences');
      }
    } catch (error) {
      logger.error(`Error generating preferences for ${username}`, 'generatePreferences', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  logger.info('Preference generation script completed', 'generatePreferences');
}

// Run the script
main().catch(error => {
  logger.error('Unhandled error in preference generation script', 'generatePreferences', {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
}); 