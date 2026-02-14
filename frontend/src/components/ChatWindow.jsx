/**
 * ChatWindow Component
 *
 * Main chat container that composes the header, message list, and input.
 * Manages the "Reset" action in the header.
 *
 * Layout: fixed-height flex column so the message list scrolls
 * while header and input stay pinned.
 */

import MessageList from './MessageList';
import MessageInput from './MessageInput';

/**
 * @param {object} props
 * @param {Array} props.messages - Chat message history
 * @param {boolean} props.isLoading - Whether the AI is responding
 * @param {(message: string) => void} props.onSend - Send message handler
 * @param {() => void} props.onReset - Reset conversation handler
 * @param {string|null} props.error - Current error message (if any)
 * @param {() => void} [props.onDismissError] - Dismiss error banner handler
 */
export default function ChatWindow({ messages, isLoading, onSend, onReset, error, onDismissError }) {
  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Logo / Icon */}
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Fliplet AI Assistant</h1>
            <p className="text-xs text-gray-500">Ask about your app's data sources & files</p>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          disabled={isLoading || messages.length === 0}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5
                     rounded-lg hover:bg-gray-100 disabled:opacity-40
                     disabled:cursor-not-allowed transition-colors
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Reset conversation"
        >
          New chat
        </button>
      </header>

      {/* Error banner */}
      {error && (
        <div
          className="mx-4 mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between"
          role="alert"
        >
          <span><strong>Error:</strong> {error}</span>
          {onDismissError && (
            <button
              onClick={onDismissError}
              className="ml-3 text-red-500 hover:text-red-700 focus:outline-none"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          )}
        </div>
      )}

      {/* Message list (scrollable) */}
      <MessageList messages={messages} isLoading={isLoading} onSuggestionClick={onSend} />

      {/* Input bar (pinned to bottom) */}
      <MessageInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
