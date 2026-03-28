import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 max-w-md">
            <AlertTriangle size={40} className="mx-auto mb-3 text-red-400" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              დაფიქსირდა შეცდომა
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              მოულოდნელი შეცდომა დაფიქსირდა. სცადეთ გვერდის განახლება.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <RefreshCw size={14} />
                თავიდან ცდა
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                გვერდის განახლება
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
