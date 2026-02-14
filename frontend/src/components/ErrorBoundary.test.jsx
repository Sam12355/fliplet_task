/**
 * ErrorBoundary Component — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

// Suppress console.error from React's error boundary output during tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

/** A component that throws on render to trigger the boundary. */
function ThrowingChild({ shouldThrow = true }) {
  if (shouldThrow) throw new Error('Test render error');
  return <div>Safe content</div>;
}

describe('ErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.queryByText('Safe content')).not.toBeInTheDocument();
  });

  it('should recover when Try again is clicked', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    function ConditionalThrow() {
      if (shouldThrow) throw new Error('Render error');
      return <div>Recovered content</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Verify fallback is shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Stop throwing before retry
    shouldThrow = false;

    await user.click(screen.getByText('Try again'));

    // After retry, the boundary re-renders and the child no longer throws
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
