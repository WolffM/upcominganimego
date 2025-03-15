import React from 'react';
import { SPINNER_STYLES } from '@/utils/uiStyles';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className={SPINNER_STYLES.CONTAINER}>
      <div className={SPINNER_STYLES.SPINNER} />
      <p className={SPINNER_STYLES.MESSAGE}>{message}</p>
    </div>
  );
}; 