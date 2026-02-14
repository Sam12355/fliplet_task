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

// Default session TTL: 30 minutes of inactivity
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;

// Maximum number of concurrent sessions to prevent memory exhaustion
const DEFAULT_MAX_SESSIONS = 100;

class SessionManager {
  /**
   * Create a new SessionManager.
   *
   * @param {Function} engineFactory - Factory function that creates a new ChatEngine.
   *   Called with no arguments, must return a ChatEngine-like object with
   *   chat(), reset(), and getHistory() methods.
   * @param {object} [options={}] - Configuration options
   * @param {number} [options.sessionTtlMs=1800000] - Session TTL in milliseconds (default: 30 min)
   * @param {number} [options.maxSessions=100] - Maximum concurrent sessions
   * @throws {Error} If engineFactory is not provided
   */
  constructor(engineFactory, options = {}) {
    if (!engineFactory) {
      throw new Error('SessionManager requires a factory function to create chat engines');
    }

    this._factory = engineFactory;
    this._sessionTtlMs = options.sessionTtlMs || DEFAULT_SESSION_TTL_MS;
    this._maxSessions = options.maxSessions || DEFAULT_MAX_SESSIONS;

    // Map of sessionId → { engine, lastAccessed }
    this._sessions = new Map();

    // Run cleanup every 5 minutes
    this._cleanupInterval = setInterval(() => this._evictExpired(), 5 * 60 * 1000);
    // Allow the Node process to exit even if the interval is still active
    if (this._cleanupInterval.unref) this._cleanupInterval.unref();
  }

  /**
   * Get an existing session's engine or create a new one.
   *
   * @param {string} sessionId - The session identifier
   * @returns {object} The ChatEngine instance for this session
   */
  getOrCreate(sessionId) {
    // Touch timestamp on access
    if (this._sessions.has(sessionId)) {
      const session = this._sessions.get(sessionId);
      session.lastAccessed = Date.now();
      return session.engine;
    }

    // Evict oldest session if at capacity
    if (this._sessions.size >= this._maxSessions) {
      this._evictOldest();
    }

    // Create a fresh ChatEngine for this session
    const engine = this._factory();
    this._sessions.set(sessionId, { engine, lastAccessed: Date.now() });

    return engine;
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

  /**
   * Evict sessions that have exceeded the TTL (not accessed recently).
   * Called automatically on a periodic interval.
   */
  _evictExpired() {
    const now = Date.now();
    for (const [id, session] of this._sessions) {
      if (now - session.lastAccessed > this._sessionTtlMs) {
        this._sessions.delete(id);
      }
    }
  }

  /**
   * Evict the oldest (least recently accessed) session to make room.
   */
  _evictOldest() {
    let oldestId = null;
    let oldestTime = Infinity;

    for (const [id, session] of this._sessions) {
      if (session.lastAccessed < oldestTime) {
        oldestTime = session.lastAccessed;
        oldestId = id;
      }
    }

    if (oldestId) {
      this._sessions.delete(oldestId);
    }
  }

  /**
   * Stop the periodic cleanup interval.
   * Call this during graceful shutdown.
   */
  stopCleanup() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }
}

module.exports = { SessionManager };
