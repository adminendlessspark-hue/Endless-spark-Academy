import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      const errorString = this.state.error ? this.state.error.toString() : '';
      const isQuota = errorString.includes('Quota limit exceeded') || errorString.includes('Quota exceeded');
      
      if (isQuota) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-6">
            <div className="bg-white border border-gray-100 rounded-3xl shadow-xl max-w-xl w-full p-8 text-center">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                ⚠️
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Database Quota limit reached</h1>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Google Cloud's free-tier daily database limits have been reached for today. 
                Don't worry, the system keeps working using local cache file stores!
              </p>
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left">
                <p className="font-mono text-xs text-gray-500 overflow-auto max-h-24 leading-normal">
                  {errorString}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-2xl text-sm transition-all shadow-md active:scale-[0.98]"
                  onClick={() => {
                    localStorage.setItem('sandbox_local_mode', 'true');
                    window.location.reload();
                  }}
                >
                  Continue in Sandbox Mode
                </button>
                <button
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-2xl text-sm transition-all"
                  onClick={() => window.location.reload()}
                >
                  Retry Loading
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
            <div className="bg-red-50 p-4 rounded-lg overflow-auto mb-4">
              <p className="font-mono text-sm text-red-800 whitespace-pre-wrap">
                {this.state.error && this.state.error.toString()}
              </p>
            </div>
            <details className="whitespace-pre-wrap font-mono text-xs text-gray-600 bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
              <summary className="cursor-pointer font-bold mb-2">Component Stack</summary>
              {this.state.errorInfo?.componentStack}
            </details>
            <button
              className="mt-6 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
