'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ERROR_BOUNDARY_STYLES } from '@/utils/uiStyles';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className={ERROR_BOUNDARY_STYLES.CONTAINER}>
          <h2 className={ERROR_BOUNDARY_STYLES.TITLE}>
            Something went wrong
          </h2>
          <p className={ERROR_BOUNDARY_STYLES.MESSAGE}>
            We&apos;re sorry, but there was an error loading this content.
          </p>
          <details className={ERROR_BOUNDARY_STYLES.DETAILS}>
            <summary className={ERROR_BOUNDARY_STYLES.SUMMARY}>
              Error details
            </summary>
            <pre className={ERROR_BOUNDARY_STYLES.PRE}>
              {this.state.error?.toString() || 'Unknown error'}
            </pre>
          </details>
          <button
            className={ERROR_BOUNDARY_STYLES.BUTTON}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 