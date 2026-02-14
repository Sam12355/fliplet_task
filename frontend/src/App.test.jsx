/**
 * App Component — Integration Tests
 *
 * Tests the full chat flow: sending messages, receiving responses,
 * error handling, and resetting conversations.
 *
 * Mocks the API service layer so no real HTTP requests are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// ---------------------------------------------------------------
// Mock the API service module
// ---------------------------------------------------------------

vi.mock('./services/api', () => ({
  sendMessage: vi.fn(),
  resetSession: vi.fn(),
  checkHealth: vi.fn(),
}));

import { sendMessage, resetSession } from './services/api';

// Mock crypto.randomUUID for deterministic IDs in tests
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

beforeEach(() => {
  vi.clearAllMocks();
  uuidCounter = 0;
  // Clear sessionStorage to ensure clean state for each test
  sessionStorage.clear();
  // Mock window.confirm to always return true (for reset confirmation)
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('App', () => {
  it('should render the chat window with empty state', () => {
    render(<App />);

    expect(screen.getByText('Fliplet AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Ask me anything')).toBeInTheDocument();
  });

  it('should display user message immediately after sending', async () => {
    // Make sendMessage hang (never resolve) so we can test optimistic UI
    sendMessage.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    render(<App />);

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'Hello');
    await user.click(screen.getByLabelText('Send message'));

    // User message should appear immediately (optimistic UI)
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should show typing indicator while waiting for response', async () => {
    sendMessage.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('Message input'), 'Hello');
    await user.click(screen.getByLabelText('Send message'));

    expect(screen.getByRole('status', { name: /thinking/i })).toBeInTheDocument();
  });

  it('should display AI response after backend replies', async () => {
    sendMessage.mockResolvedValue({
      response: 'There are 3 data sources.',
      sessionId: 'sess-abc',
    });
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('Message input'), 'How many data sources?');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('There are 3 data sources.')).toBeInTheDocument();
    });
  });

  it('should show error banner when API call fails', async () => {
    sendMessage.mockRejectedValue(new Error('Server is down'));
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('Message input'), 'Hello');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server is down');
    });
  });

  it('should re-enable input after response arrives', async () => {
    sendMessage.mockResolvedValue({ response: 'OK', sessionId: 's1' });
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('Message input'), 'Hi');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByLabelText('Message input')).not.toBeDisabled();
    });
  });

  it('should reset conversation when New chat is clicked', async () => {
    sendMessage.mockResolvedValue({ response: 'Hello!', sessionId: 's1' });
    resetSession.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<App />);

    // Send a message first
    await user.type(screen.getByLabelText('Message input'), 'Hi');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });

    // Click reset
    await user.click(screen.getByLabelText('Reset conversation'));

    // Messages should be cleared, empty state returned
    expect(screen.queryByText('Hello!')).not.toBeInTheDocument();
    expect(screen.getByText('Ask me anything')).toBeInTheDocument();
  });

  it('should disable New chat button when chat is empty', () => {
    render(<App />);

    expect(screen.getByLabelText('Reset conversation')).toBeDisabled();
  });

  it('should pass sessionId on subsequent messages', async () => {
    sendMessage
      .mockResolvedValueOnce({ response: 'First', sessionId: 'sess-xyz' })
      .mockResolvedValueOnce({ response: 'Second', sessionId: 'sess-xyz' });
    const user = userEvent.setup();

    render(<App />);

    // First message — no sessionId yet
    await user.type(screen.getByLabelText('Message input'), 'Hello');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument();
    });

    expect(sendMessage).toHaveBeenCalledWith('Hello', null);

    // Second message — should include sessionId from first response
    await user.type(screen.getByLabelText('Message input'), 'More');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    expect(sendMessage).toHaveBeenCalledWith('More', 'sess-xyz');
  });
});
