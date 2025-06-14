interface ErrorContext {
  userId?: string;
  sessionId: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private sessionId: string;
  private isDevelopment: boolean;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        sessionId: this.sessionId,
        component: 'global',
        action: 'unhandledPromiseRejection'
      });
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        sessionId: this.sessionId,
        component: 'global',
        action: 'uncaughtError',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  handleError(error: Error | any, context: ErrorContext) {
    const errorData = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console in development
    if (this.isDevelopment) {
      console.error('Error captured:', errorData);
    }

    // Store locally for crash reports
    this.storeErrorLocally(errorData);

    // In production, you would send to Sentry or similar service
    // this.sendToErrorService(errorData);

    // Show user-friendly error toast
    this.showErrorToast(error, context);
  }

  private storeErrorLocally(errorData: any) {
    try {
      const errors = JSON.parse(localStorage.getItem('vibemind-errors') || '[]');
      errors.push(errorData);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('vibemind-errors', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  }

  private showErrorToast(error: Error | any, context: ErrorContext) {
    // Import toast dynamically to avoid circular dependencies
    import('sonner').then(({ toast }) => {
      if (this.isDevelopment) {
        toast.error(`Error in ${context.component}: ${error?.message}`, {
          description: 'Check console for details',
          action: {
            label: 'View Logs',
            onClick: () => console.log('Error context:', context)
          }
        });
      } else {
        toast.error('Something went wrong', {
          description: 'The error has been logged and will be fixed in a future update.'
        });
      }
    });
  }

  getStoredErrors() {
    try {
      return JSON.parse(localStorage.getItem('vibemind-errors') || '[]');
    } catch {
      return [];
    }
  }

  clearStoredErrors() {
    localStorage.removeItem('vibemind-errors');
  }
}

// React Error Boundary component
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  ErrorBoundaryState
> {
  private errorHandler: ErrorHandler;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.errorHandler.handleError(error, {
      sessionId: this.errorHandler['sessionId'],
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      metadata: errorInfo
    });
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
    <div className="text-red-500 text-6xl mb-4">⚠️</div>
    <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
    <p className="text-gray-600 mb-4">
      The application encountered an unexpected error.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Reload Application
    </button>
    {process.env.NODE_ENV === 'development' && error && (
      <details className="mt-4 text-xs text-left">
        <summary>Error Details</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
          {error.stack}
        </pre>
      </details>
    )}
  </div>
);

export const errorHandler = ErrorHandler.getInstance();
