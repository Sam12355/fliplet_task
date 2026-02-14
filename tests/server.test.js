/**
 * Backend Proxy Server — Unit Tests (TDD)
 *
 * Tests the Express server routes and middleware using supertest.
 * All AI and Fliplet dependencies are mocked — no real API calls.
 *
 * Endpoints:
 *   POST /api/chat    — Send a message, get AI response
 *   POST /api/reset   — Clear conversation history for a session
 *   GET  /api/health  — Health check
 */

const request = require('supertest');
const { createServer } = require('../src/server');

// ---------------------------------------------------------------
// Mock ChatEngine factory
// ---------------------------------------------------------------

function createMockChatEngine() {
  return {
    chat: jest.fn(),
    reset: jest.fn(),
    getHistory: jest.fn().mockReturnValue([]),
  };
}

/**
 * Creates a mock session manager that returns the same engine
 * for every session (simplifies testing).
 */
function createMockSessionManager(mockEngine) {
  return {
    getOrCreate: jest.fn().mockReturnValue(mockEngine),
    destroy: jest.fn(),
    has: jest.fn().mockReturnValue(true),
    generateId: jest.fn().mockReturnValue('auto-generated-id'),
  };
}

// ---------------------------------------------------------------
// Tests
// ---------------------------------------------------------------

describe('Backend Proxy Server', () => {
  let app;
  let mockEngine;
  let mockSessionManager;

  beforeEach(() => {
    mockEngine = createMockChatEngine();
    mockSessionManager = createMockSessionManager(mockEngine);
    app = createServer({ sessionManager: mockSessionManager });
  });

  // ---------------------------------------------------------------
  // GET /api/health
  // ---------------------------------------------------------------

  describe('GET /api/health', () => {
    test('should return 200 with status ok', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  // ---------------------------------------------------------------
  // POST /api/chat
  // ---------------------------------------------------------------

  describe('POST /api/chat', () => {
    test('should return AI response for a valid message', async () => {
      mockEngine.chat.mockResolvedValue('There are 3 data sources.');

      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'How many data sources?', sessionId: 'sess-1' });

      expect(res.status).toBe(200);
      expect(res.body.response).toBe('There are 3 data sources.');
      expect(res.body.sessionId).toBe('sess-1');
    });

    test('should create a new session if sessionId is not provided', async () => {
      mockEngine.chat.mockResolvedValue('Hello!');

      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Hi' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('sessionId');
      expect(typeof res.body.sessionId).toBe('string');
      expect(res.body.sessionId.length).toBeGreaterThan(0);
    });

    test('should return 400 if message is missing', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('message');
    });

    test('should return 400 if message is an empty string', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('message');
    });

    test('should return 400 if message is not a string', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 123 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('message');
    });

    test('should call chatEngine.chat() with the user message', async () => {
      mockEngine.chat.mockResolvedValue('Response');

      await request(app)
        .post('/api/chat')
        .send({ message: 'Tell me about users', sessionId: 'sess-1' });

      expect(mockEngine.chat).toHaveBeenCalledWith('Tell me about users');
    });

    test('should return 500 if chatEngine throws an error', async () => {
      mockEngine.chat.mockRejectedValue(new Error('OpenAI rate limit'));

      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello', sessionId: 'sess-1' });

      expect(res.status).toBe(500);
      // Error handler should return a generic message (never leak internals)
      expect(res.body.error).toBe('An internal error occurred. Please try again.');
    });
  });

  // ---------------------------------------------------------------
  // POST /api/reset
  // ---------------------------------------------------------------

  describe('POST /api/reset', () => {
    test('should reset the chat engine for the given session', async () => {
      const res = await request(app)
        .post('/api/reset')
        .send({ sessionId: 'sess-1' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockEngine.reset).toHaveBeenCalled();
    });

    test('should return 400 if sessionId is missing', async () => {
      const res = await request(app)
        .post('/api/reset')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('sessionId');
    });
  });

  // ---------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------

  describe('CORS', () => {
    test('should include CORS headers for allowed origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      // CORS headers set for allowed origins
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });

  // ---------------------------------------------------------------
  // 404 for unknown routes
  // ---------------------------------------------------------------

  describe('Unknown routes', () => {
    test('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Not found');
    });
  });
});
