/**
 * Chat API Service
 *
 * Thin abstraction over the backend REST API.
 * Centralises all HTTP calls so components stay clean.
 *
 * All functions return plain data or throw on failure,
 * keeping error handling consistent across the app.
 */

const API_BASE = '/api'; // Vite proxy forwards to http://localhost:3000

/**
 * Send a user message and receive the AI response.
 *
 * @param {string} message  - The user's message text
 * @param {string|null} sessionId - Existing session ID (null for new session)
 * @returns {Promise<{ response: string, sessionId: string }>}
 * @throws {Error} On network failure or non-OK HTTP status
 */
export async function sendMessage(message, sessionId = null) {
  const body = { message };
  if (sessionId) body.sessionId = sessionId;

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Reset conversation history for the current session.
 *
 * @param {string} sessionId - The session to reset
 * @returns {Promise<{ success: boolean }>}
 * @throws {Error} On network failure
 */
export async function resetSession(sessionId) {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to reset session');
  }

  return res.json();
}

/**
 * Check if the backend server is reachable.
 *
 * @returns {Promise<boolean>} true if healthy
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
