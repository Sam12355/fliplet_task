/**
 * Session Manager
 *
 * Maintains per-session ChatEngine instances so multiple users
 * can chat concurrently without sharing conversation history.
 *
 * Best practices applied:
 * - Factory Pattern: engine creation is delegated to an injectable factory
 * - Encapsulation: sessions stored in a private Map
 * - Crypto-safe IDs: uses Node's crypto.randomUUID() for session IDs
 */

const crypto = require('crypto');

class SessionManager {
  /**
   * Create a new SessionManager.
   *
   * @param {Function} engineFactory - Factory function that creates a new ChatEngine.
   *   Called with no arguments, must return a ChatEngine-like object with
   *   chat(), reset(), and getHistory() methods.
   * @throws {Error} If engineFactory is not provided
   */
  constructor(engineFactory) {
    if (!engineFactory) {
      throw new Error('SessionManager requires a factory function to create chat engines');
    }

    this._factory = engineFactory;

    // Map of sessionId → ChatEngine instance
    this._sessions = new Map();
  }

  /**
   * Get an existing session's engine or create a new one.
   *
   * @param {string} sessionId - The session identifier
   * @returns {object} The ChatEngine instance for this session
   */
  getOrCreate(sessionId) {
    if (!this._sessions.has(sessionId)) {
      // Create a fresh ChatEngine for this session
      this._sessions.set(sessionId, this._factory());
    }

    return this._sessions.get(sessionId);
  }

  /**
   * Check if a session exists.
   *
   * @param {string} sessionId - The session identifier
   * @returns {boolean} True if session exists
   */
  has(sessionId) {
    return this._sessions.has(sessionId);
  }

  /**
   * Destroy a session and free its resources.
   * Safe to call on non-existent sessions (no-op).
   *
   * @param {string} sessionId - The session identifier
   */
  destroy(sessionId) {
    this._sessions.delete(sessionId);
  }

  /**
   * Generate a unique session ID using cryptographic randomness.
   *
   * @returns {string} A UUID v4 string
   */
  generateId() {
    return crypto.randomUUID();
  }
}

module.exports = { SessionManager };
