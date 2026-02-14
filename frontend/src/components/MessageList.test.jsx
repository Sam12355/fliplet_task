/**
 * MessageList Component — Unit Tests
 *
 * Tests message rendering, empty state, typing indicator,
 * and auto-scroll behaviour.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageList from './MessageList';

// scrollIntoView is mocked globally in test/setup.js

describe('MessageList', () => {
  it('should show empty state when there are no messages', () => {
    render(<MessageList messages={[]} isLoading={false} />);

    expect(screen.getByText('Ask me anything')).toBeInTheDocument();
    expect(screen.getByText(/data sources and files/i)).toBeInTheDocument();
  });

  it('should not show empty state when loading', () => {
    render(<MessageList messages={[]} isLoading={true} />);

    expect(screen.queryByText('Ask me anything')).not.toBeInTheDocument();
  });

  it('should render user and assistant messages', () => {
    const messages = [
      { id: '1', role: 'user', content: 'Hello' },
      { id: '2', role: 'assistant', content: 'Hi there!' },
    ];

    render(<MessageList messages={messages} isLoading={false} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should show typing indicator when loading', () => {
    render(<MessageList messages={[]} isLoading={true} />);

    expect(screen.getByRole('status', { name: /thinking/i })).toBeInTheDocument();
  });

  it('should not show typing indicator when not loading', () => {
    render(<MessageList messages={[]} isLoading={false} />);

    expect(screen.queryByRole('status', { name: /thinking/i })).not.toBeInTheDocument();
  });

  it('should have the correct accessible role', () => {
    render(<MessageList messages={[]} isLoading={false} />);

    expect(screen.getByRole('list', { name: /chat messages/i })).toBeInTheDocument();
  });

  it('should call scrollIntoView when messages change', () => {
    const spy = vi.spyOn(Element.prototype, 'scrollIntoView');

    const { rerender } = render(
      <MessageList messages={[]} isLoading={false} />
    );

    const messages = [{ id: '1', role: 'user', content: 'Hello' }];
    rerender(<MessageList messages={messages} isLoading={false} />);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
