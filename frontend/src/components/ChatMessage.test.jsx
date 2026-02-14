/**
 * ChatMessage Component — Unit Tests
 *
 * Verifies rendering for both user and AI message bubbles,
 * including Markdown rendering for AI responses.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatMessage from './ChatMessage';

describe('ChatMessage', () => {
  it('should render user message as plain text', () => {
    render(<ChatMessage role="user" content="Hello there" />);

    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('should render assistant message with AI avatar', () => {
    render(<ChatMessage role="assistant" content="I found 3 data sources." />);

    expect(screen.getByText('I found 3 data sources.')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('should render Markdown in assistant messages', () => {
    render(<ChatMessage role="assistant" content="Here is a **bold** word" />);

    const bold = screen.getByText('bold');
    expect(bold.tagName).toBe('STRONG');
  });

  it('should render list items in assistant Markdown', () => {
    const markdown = '- Item A\n- Item B\n- Item C';
    render(<ChatMessage role="assistant" content={markdown} />);

    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    expect(screen.getByText('Item C')).toBeInTheDocument();
  });

  it('should have role="listitem" for accessibility', () => {
    const { container } = render(<ChatMessage role="user" content="Test" />);

    expect(container.firstChild).toHaveAttribute('role', 'listitem');
  });
});
