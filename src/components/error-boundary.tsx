"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);

    // Log to error tracking service (e.g., Sentry)
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      // Log error here
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <svg className="h-8 w-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-slate-900">Something went wrong</h2>

        <p className="mb-6 text-sm text-slate-600">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>

        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 rounded-lg bg-slate-50 p-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">Error details</summary>
            <pre className="mt-2 overflow-auto text-xs text-slate-600">{error.message}</pre>
            {error.stack && (
              <pre className="mt-2 overflow-auto text-xs text-slate-500">{error.stack}</pre>
            )}
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Async error boundary for server components
 * Usage: Wrap suspense boundaries
 */
export function AsyncErrorBoundary({ children, fallback }: Props) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
