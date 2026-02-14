/**
 * MessageInput Component — Unit Tests
 *
 * Tests the input field behaviour: typing, sending via Enter,
 * disabled state, and clearing after send.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from './MessageInput';

describe('MessageInput', () => {
  it('should render the textarea and send button', () => {
    render(<MessageInput onSend={vi.fn()} disabled={false} />);

    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('should call onSend with trimmed text on form submit', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<MessageInput onSend={onSend} disabled={false} />);

    const input = screen.getByLabelText('Message input');
    await user.type(input, '  Hello world  ');
    await user.click(screen.getByLabelText('Send message'));

    expect(onSend).toHaveBeenCalledWith('Hello world');
  });

  it('should clear the input after sending', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} disabled={false} />);

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'Hello');
    await user.click(screen.getByLabelText('Send message'));

    expect(input).toHaveValue('');
  });

  it('should not send empty or whitespace-only messages', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<MessageInput onSend={onSend} disabled={false} />);

    const input = screen.getByLabelText('Message input');
    await user.type(input, '   ');
    await user.click(screen.getByLabelText('Send message'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should disable input and button when disabled prop is true', () => {
    render(<MessageInput onSend={vi.fn()} disabled={true} />);

    expect(screen.getByLabelText('Message input')).toBeDisabled();
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('should send on Enter key press', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();

    render(<MessageInput onSend={onSend} disabled={false} />);

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'Hello{Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('should show placeholder text based on disabled state', () => {
    const { rerender } = render(<MessageInput onSend={vi.fn()} disabled={false} />);

    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();

    rerender(<MessageInput onSend={vi.fn()} disabled={true} />);

    expect(screen.getByPlaceholderText('Waiting for response...')).toBeInTheDocument();
  });
});
