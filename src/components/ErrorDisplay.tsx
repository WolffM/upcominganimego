import React from 'react';

interface ErrorDisplayProps {
  message: string;
  error: Error | null;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  error,
  onRetry
}) => {
  return (
    <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-5 rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h3 className="font-bold text-lg mb-2">{message}</h3>
          <p className="text-sm">{error?.message || 'An unknown error occurred'}</p>
        </div>
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}; 