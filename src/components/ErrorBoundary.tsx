import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Button } from 'antd';

// For route errors
export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  let errorMessage = 'An unexpected error occurred';
  
  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}: ${error.data}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Oops! Something went wrong
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {errorMessage}
          </p>
          <div className="mt-5 flex justify-center">
            <Button type="primary" onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// For component errors
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ComponentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 border border-red-300 rounded-md bg-red-50 text-red-700">
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p className="mb-3">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <Button 
            type="primary" 
            danger
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default export for React Router
export default RouteErrorBoundary;
