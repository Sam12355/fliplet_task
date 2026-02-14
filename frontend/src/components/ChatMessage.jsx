/**
 * ChatMessage Component
 *
 * Renders a single chat bubble — either user (right-aligned, blue)
 * or assistant (left-aligned, white with avatar).
 *
 * AI responses are rendered as Markdown so formatted content
 * (lists, code blocks, bold) displays properly.
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Custom component overrides for react-markdown.
// Wraps <table> in a scrollable container so wide tables don't overflow.
const markdownComponents = {
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
};

/**
 * @param {object} props
 * @param {'user'|'assistant'} props.role - Message sender
 * @param {string} props.content - Message text (markdown for assistant)
 */
const ChatMessage = memo(function ChatMessage({ role, content }) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex items-start gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}
      role="listitem"
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-gray-700' : 'bg-primary-600'
        }`}
      >
        <span className="text-white text-xs font-bold">
          {isUser ? 'You' : 'AI'}
        </span>
      </div>

      {/* Bubble */}
      <div
        className={`rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'max-w-[75%] bg-primary-600 text-white rounded-tr-sm'
            : 'max-w-[90%] bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
        }`}
      >
        {isUser ? (
          // User messages rendered as plain text
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : (
          // AI messages rendered as Markdown
          <div className="prose-chat break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.propTypes = {
  /** Message sender — determines alignment and styling */
  role: PropTypes.oneOf(['user', 'assistant']).isRequired,
  /** Message text content (rendered as Markdown for assistant messages) */
  content: PropTypes.string.isRequired,
};

export default ChatMessage;
