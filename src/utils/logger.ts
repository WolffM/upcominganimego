// Logger levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Logger configuration
const config = {
  enabled: process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true',
  level: (process.env.NEXT_PUBLIC_LOG_LEVEL || 'INFO') as LogLevel,
  prefix: 'AnimeApp'
};

// Map log levels to priorities
const logLevelPriority: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3
};

// Check if a log level should be displayed based on configured level
const shouldLog = (level: LogLevel): boolean => {
  return config.enabled && logLevelPriority[level] >= logLevelPriority[config.level as LogLevel];
};

// Format log message with timestamp and prefix
const formatMessage = (level: LogLevel, message: string, context?: string): string => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  return `[${timestamp}] [${config.prefix}] [${level}]${contextStr} ${message}`;
};

// Main logger functions
export const logger = {
  debug: (message: string, context?: string, ...args: any[]): void => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.debug(formatMessage(LogLevel.DEBUG, message, context), ...args);
    }
  },
  
  info: (message: string, context?: string, ...args: any[]): void => {
    if (shouldLog(LogLevel.INFO)) {
      console.info(formatMessage(LogLevel.INFO, message, context), ...args);
    }
  },
  
  warn: (message: string, context?: string, ...args: any[]): void => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(formatMessage(LogLevel.WARN, message, context), ...args);
    }
  },
  
  error: (message: string, context?: string, ...args: any[]): void => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(formatMessage(LogLevel.ERROR, message, context), ...args);
    }
  },
  
  // Log API responses
  apiResponse: (endpoint: string, data: any): void => {
    if (shouldLog(LogLevel.DEBUG)) {
      logger.debug(`API Response from ${endpoint}`, 'API', data);
    }
  },
  
  // Log API errors
  apiError: (endpoint: string, error: any): void => {
    logger.error(`API Error from ${endpoint}: ${error.message || error}`, 'API', error);
  },
  
  // Log component lifecycle events
  component: (componentName: string, action: string, data?: any): void => {
    if (shouldLog(LogLevel.DEBUG)) {
      logger.debug(`${componentName} ${action}`, 'Component', data);
    }
  },
  
  // Log hydration issues
  hydration: (componentName: string, message: string, data?: any): void => {
    logger.warn(`Hydration issue in ${componentName}: ${message}`, 'Hydration', data);
  }
}; 