import React from 'react';
import { ERROR_STYLES } from '@/utils/uiStyles';

interface ErrorDisplayProps {
  message: string;
  error?: Error | null;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  error,
  onRetry
}) => {
  return (
    <div className={ERROR_STYLES.CONTAINER}>
      <div className={ERROR_STYLES.CONTENT}>
        <div className={ERROR_STYLES.MESSAGE_CONTAINER}>
          <h3 className={ERROR_STYLES.TITLE}>
            {message}
          </h3>
          {error && (
            <p className={ERROR_STYLES.ERROR_TEXT}>
              {error.message || 'An unknown error occurred'}
            </p>
          )}
        </div>
        
        {onRetry && (
          <button 
            onClick={onRetry}
            className={ERROR_STYLES.RETRY_BUTTON}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}; 