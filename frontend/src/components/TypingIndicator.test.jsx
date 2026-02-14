/**
 * TypingIndicator Component — Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TypingIndicator from './TypingIndicator';

describe('TypingIndicator', () => {
  it('should render with accessible status role', () => {
    render(<TypingIndicator />);

    expect(screen.getByRole('status', { name: /thinking/i })).toBeInTheDocument();
  });

  it('should render three animated dots', () => {
    const { container } = render(<TypingIndicator />);

    const dots = container.querySelectorAll('.typing-dot');
    expect(dots).toHaveLength(3);
  });

  it('should show AI avatar', () => {
    render(<TypingIndicator />);

    expect(screen.getByText('AI')).toBeInTheDocument();
  });
});
