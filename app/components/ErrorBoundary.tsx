'use client';
import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center py-20 px-6">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              This section encountered an error. The rest of the page is still functional.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-white/10 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}