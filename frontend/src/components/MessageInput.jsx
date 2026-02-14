/**
 * MessageInput Component
 *
 * Text input with send button at the bottom of the chat.
 * Supports both Enter key and button click to send.
 * Disabled while the AI is processing to prevent double-sends.
 *
 * Uses controlled input pattern with local state for the draft message.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * @param {object} props
 * @param {(message: string) => void} props.onSend - Callback when user sends a message
 * @param {boolean} props.disabled - Whether input should be disabled (AI is thinking)
 */
export default function MessageInput({ onSend, disabled }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the input when it becomes enabled again
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  // Auto-resize textarea to fit content (up to 5 rows)
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  /** Handle form submission */
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setDraft('');
    // Reset textarea height after sending
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  /** Handle input changes and auto-resize */
  const handleChange = (e) => {
    setDraft(e.target.value);
    autoResize();
  };

  /** Handle Enter key (Shift+Enter for newline) */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-4"
    >
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Text input */}
        <textarea
          ref={inputRef}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Waiting for response...' : 'Type your message...'}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3
                     text-sm placeholder-gray-400 focus:outline-none focus:ring-2
                     focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100
                     disabled:cursor-not-allowed transition-colors"
          aria-label="Message input"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white
                     flex items-center justify-center hover:bg-primary-700
                     disabled:bg-gray-300 disabled:cursor-not-allowed
                     transition-colors focus:outline-none focus:ring-2
                     focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Send message"
        >
          {/* Send icon (arrow) */}
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19V5m0 0l-7 7m7-7l7 7"
            />
          </svg>
        </button>
      </div>

      {/* Hint text */}
      <p className="text-xs text-gray-400 text-center mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </form>
  );
}
