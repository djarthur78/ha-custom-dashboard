/**
 * ErrorBoundary Component
 * Catches React errors and displays a fallback UI
 */

import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
          <div className="max-w-md w-full bg-[var(--color-surface)] rounded-lg p-6 shadow-lg border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle
                size={32}
                className="text-[var(--color-error)]"
              />
              <h1 className="text-xl font-semibold text-[var(--color-text)]">
                Something went wrong
              </h1>
            </div>

            <p className="text-[var(--color-text-secondary)] mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>

            {this.state.error && (
              <div className="mb-4 p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <p className="text-sm font-mono text-[var(--color-error)]">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[var(--color-surface-variant)] text-[var(--color-text)] rounded hover:bg-[var(--color-border)] transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
