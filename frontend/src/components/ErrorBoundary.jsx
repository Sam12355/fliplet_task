/**
 * ErrorBoundary Component
 *
 * Catches render-time JavaScript errors anywhere in the child component
 * tree and displays a fallback UI instead of crashing the entire app.
 *
 * React Error Boundaries must use class component syntax because
 * getDerivedStateFromError / componentDidCatch are class-only lifecycle methods.
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

import { Component } from 'react';
import PropTypes from 'prop-types';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  /** Update state so the next render shows the fallback UI. */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /** Log error details for debugging. */
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  /** Reset the error state so the user can retry. */
  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
          <svg
            className="w-12 h-12 mb-3 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium mb-1">Something went wrong</p>
          <p className="text-sm mb-4">An unexpected error occurred while rendering.</p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg
                       hover:bg-primary-700 focus:outline-none focus:ring-2
                       focus:ring-primary-500 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  /** Child components to protect from render errors */
  children: PropTypes.node.isRequired,
};
