/**
 * Express Server
 *
 * Backend proxy that exposes the AI chatbot as a REST API.
 * Keeps API keys server-side — the frontend only sends messages.
 *
 * Endpoints:
 *   POST /api/chat    — Send a message, get AI response
 *   POST /api/reset   — Clear conversation history for a session
 *   GET  /api/health  — Health check
 *
 * Best practices applied:
 * - Separation: createServer() returns an Express app (no listen) for testability
 * - Input Validation: all inputs sanitized before processing
 * - Error Handling: centralized error middleware
 * - CORS: enabled for frontend cross-origin requests
 * - Session Management: per-session ChatEngine instances via SessionManager
 */

const express = require('express');
const cors = require('cors');

/**
 * Create and configure the Express application.
 *
 * Accepts dependencies via options for testability (dependency injection).
 * Does NOT call app.listen() — the caller decides when to start listening.
 *
 * @param {object} options - Server dependencies
 * @param {object} options.sessionManager - SessionManager instance
 * @returns {express.Application} Configured Express app (not yet listening)
 */
function createServer({ sessionManager }) {
  const app = express();

  // ---------------------------------------------------------------
  // Middleware
  // ---------------------------------------------------------------

  // Parse JSON request bodies (limit size to prevent memory exhaustion)
  app.use(express.json({ limit: '100kb' }));

  // Enable CORS — restrict to localhost origins in development
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ],
  }));

  // ---------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------

  /**
   * GET /api/health
   * Simple health check — useful for monitoring and load balancers.
   */
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  /**
   * POST /api/chat
   * Send a user message and get the AI's response.
   *
   * Request body:
   *   { message: string, sessionId?: string }
   *
   * Response:
   *   { response: string, sessionId: string }
   */
  app.post('/api/chat', async (req, res, next) => {
    try {
      const { message, sessionId: requestedSessionId } = req.body;

      // Validate message input
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          error: 'A non-empty "message" string is required in the request body.',
        });
      }

      // Cap message length to prevent excessive token usage
      const MAX_MESSAGE_LENGTH = 4000;
      if (message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
          error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters.`,
        });
      }

      // Use provided session ID or generate a new one
      const sessionId = requestedSessionId || sessionManager.generateId();

      // Get (or create) the ChatEngine for this session
      const engine = sessionManager.getOrCreate(sessionId);

      // Send the message to the AI and await the response
      const response = await engine.chat(message.trim());

      res.json({ response, sessionId });
    } catch (err) {
      next(err); // Forward to error handling middleware
    }
  });

  /**
   * POST /api/reset
   * Clear conversation history for a specific session.
   *
   * Request body:
   *   { sessionId: string }
   *
   * Response:
   *   { success: true }
   */
  app.post('/api/reset', (req, res) => {
    const { sessionId } = req.body;

    // Validate sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'A "sessionId" string is required in the request body.',
      });
    }

    // Get the engine and reset its history
    if (sessionManager.has(sessionId)) {
      const engine = sessionManager.getOrCreate(sessionId);
      engine.reset();
    }

    res.json({ success: true });
  });

  // ---------------------------------------------------------------
  // 404 handler — must be after all route definitions
  // ---------------------------------------------------------------

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // ---------------------------------------------------------------
  // Centralized error handler
  // ---------------------------------------------------------------

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // Log full error details server-side for debugging
    console.error('Server error:', err.message, err.stack);

    // Return a generic message to the client — never leak internal details
    res.status(500).json({
      error: 'An internal error occurred. Please try again.',
    });
  });

  return app;
}

module.exports = { createServer };
