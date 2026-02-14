/**
 * App Component — Root of the Chat UI
 *
 * Manages all application state:
 *   - messages[]   — conversation history rendered in the UI
 *   - sessionId    — ties this browser tab to a server-side ChatEngine
 *   - isLoading    — disables input while AI is thinking
 *   - error        — displayed in an error banner
 *
 * Follows React best practices:
 *   - State lifted to the top, passed down as props
 *   - Side effects isolated in handler functions
 *   - Unique message IDs via crypto.randomUUID()
 */

import { useState, useCallback, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import ErrorBoundary from './components/ErrorBoundary';
import { sendMessage, resetSession } from './services/api';

/** Generate a unique ID for each message (for React keys) */
const uid = () => crypto.randomUUID();

/** Session storage key for persisting session ID across page refreshes */
const SESSION_KEY = 'fliplet-chat-session-id';

export default function App() {
  // ---------------------------------------------------------------
  // State — sessionId restored from sessionStorage when available
  // ---------------------------------------------------------------
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem(SESSION_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist sessionId to sessionStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem(SESSION_KEY, sessionId);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [sessionId]);

  // ---------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------

  /**
   * Send a message to the backend and append both the user message
   * and AI response to the conversation.
   */
  const handleSend = useCallback(
    async (text) => {
      // Clear any previous error
      setError(null);

      // 1. Append user message immediately (optimistic UI)
      const userMsg = { id: uid(), role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // 2. Call backend
        const data = await sendMessage(text, sessionId);

        // 3. Store session ID (first message creates it)
        if (!sessionId) {
          setSessionId(data.sessionId);
        }

        // 4. Append AI response
        const aiMsg = { id: uid(), role: 'assistant', content: data.response };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  /**
   * Reset the conversation — clears local messages and tells
   * the server to discard the session's history.
   */
  const handleReset = useCallback(async () => {
    // Confirm before discarding conversation
    if (messages.length > 0 && !window.confirm('Start a new conversation? Current chat will be lost.')) {
      return;
    }
    if (sessionId) {
      try {
        await resetSession(sessionId);
      } catch {
        // Non-critical — local reset still happens
      }
    }
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, [sessionId, messages.length]);

  /** Dismiss the error banner */
  const handleDismissError = useCallback(() => setError(null), []);

  /** Retry sending the last failed user message */
  const handleRetry = useCallback(() => {
    // Find the last user message (the one that failed)
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove it from messages and re-send
      setMessages((prev) => prev.filter((m) => m.id !== lastUserMsg.id));
      setError(null);
      handleSend(lastUserMsg.content);
    }
  }, [messages, handleSend]);

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------

  return (
    <main className="h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-2xl h-[90vh]">
        <ErrorBoundary>
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
            onReset={handleReset}
            error={error}
            onDismissError={handleDismissError}
            onRetry={handleRetry}
          />
        </ErrorBoundary>
      </div>
    </main>
  );
}
