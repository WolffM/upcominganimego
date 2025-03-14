import { logger } from './logger';

interface DateParts {
  year?: number;
  month?: number;
  day?: number;
}

/**
 * Formats a date object from AniList API into a readable string
 * @param dateParts Object containing year, month, and day
 * @returns Formatted date string or 'TBA' if date is incomplete
 */
export function formatDate(dateParts: DateParts): string {
  try {
    // If any part is missing, return TBA
    if (!dateParts.year || !dateParts.month) {
      return 'TBA';
    }

    // Create date object - note that months in JS are 0-indexed
    const date = new Date(dateParts.year, dateParts.month - 1, dateParts.day || 1);
    
    // Format options
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
    };
    
    // Add day if available
    if (dateParts.day) {
      options.day = 'numeric';
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    logger.error('Error formatting date', 'dateFormatter', {
      dateParts,
      error: error instanceof Error ? error.message : String(error)
    });
    return 'TBA';
  }
}

/**
 * Calculates how many days until a given date
 * @param dateParts Object containing year, month, and day
 * @returns Number of days until the date or null if date is invalid
 */
export function getDaysUntil(dateParts: DateParts): number | null {
  try {
    // If any part is missing, return null
    if (!dateParts.year || !dateParts.month || !dateParts.day) {
      return null;
    }

    // Create date object - note that months in JS are 0-indexed
    const targetDate = new Date(dateParts.year, dateParts.month - 1, dateParts.day);
    const today = new Date();
    
    // Reset time portion for accurate day calculation
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in milliseconds and convert to days
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    logger.error('Error calculating days until date', 'dateFormatter', {
      dateParts,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Returns a human-readable string for days until release
 * @param dateParts Object containing year, month, and day
 * @returns Human-readable string like "2 days", "1 month", etc.
 */
export function getTimeUntilRelease(dateParts: DateParts): string {
  const daysUntil = getDaysUntil(dateParts);
  
  if (daysUntil === null) {
    return 'Release date TBA';
  }
  
  if (daysUntil < 0) {
    return 'Released';
  }
  
  if (daysUntil === 0) {
    return 'Releasing today!';
  }
  
  if (daysUntil === 1) {
    return 'Releasing tomorrow';
  }
  
  if (daysUntil < 7) {
    return `${daysUntil} days until release`;
  }
  
  if (daysUntil < 14) {
    return '1 week until release';
  }
  
  if (daysUntil < 30) {
    return `${Math.floor(daysUntil / 7)} weeks until release`;
  }
  
  if (daysUntil < 60) {
    return '1 month until release';
  }
  
  return `${Math.floor(daysUntil / 30)} months until release`;
} 