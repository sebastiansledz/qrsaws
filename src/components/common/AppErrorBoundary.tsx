import React from 'react';

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode }, 
  { error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: undefined };
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(err: any, info: any) {
    console.error('AppErrorBoundary', err, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Ups, coś poszło nie tak
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              Spróbuj odświeżyć stronę lub wrócić do pulpitu.
            </p>
            <div className="space-y-3">
              <button 
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                onClick={() => location.reload()}
              >
                Odśwież stronę
              </button>
              <button 
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => window.history.back()}
              >
                Wróć
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}