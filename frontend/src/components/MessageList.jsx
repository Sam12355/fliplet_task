/**
 * MessageList Component
 *
 * Scrollable container that renders all chat messages and the
 * typing indicator. Auto-scrolls to the bottom when new messages
 * arrive or when the AI starts thinking.
 *
 * Uses useRef + useEffect for scroll behaviour — a common
 * React pattern for imperative DOM control.
 */

import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

/**
 * @param {object} props
 * @param {Array<{id: string, role: string, content: string}>} props.messages
 * @param {boolean} props.isLoading - Whether the AI is currently responding
 */
export default function MessageList({ messages, isLoading }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 chat-scrollbar"
      role="list"
      aria-label="Chat messages"
    >
      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <svg
            className="w-16 h-16 mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-lg font-medium">Ask me anything</p>
          <p className="text-sm mt-1">
            I can help you explore data sources and files in your Fliplet app.
          </p>
        </div>
      )}

      {/* Message bubbles */}
      {messages.map((msg) => (
        <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
      ))}

      {/* Typing indicator while AI is responding */}
      {isLoading && <TypingIndicator />}

      {/* Invisible anchor for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
