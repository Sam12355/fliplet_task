# Step 8 — Backend Proxy Server

## Goal
Expose the AI chatbot as a REST API via an Express backend proxy. This keeps API keys server-side and lets a frontend (or any HTTP client) interact with the chatbot through simple REST endpoints.

## What Was Built

### New Files
| File | Purpose |
|------|---------|
| `src/server.js` | Express app factory with routes, CORS, validation, error handling |
| `src/session-manager.js` | Per-session ChatEngine instances via Map + factory pattern |
| `src/start-server.js` | Server entry point — wires real dependencies and starts listening |
| `tests/server.test.js` | 12 tests for all routes, CORS, validation, error handling |
| `tests/session-manager.test.js` | 11 tests for session lifecycle and ID generation |

### Modified Files
| File | Change |
|------|--------|
| `src/config.js` | Added `port` setting (default 3000) |
| `.env.example` | Added `PORT` variable |
| `package.json` | Added `start:server` script, express/cors/supertest deps |

## Architecture

```
Frontend (browser)
    │
    ▼
┌─────────────────────────────┐
│  Express Server (server.js) │
│  ┌────────────────────────┐ │
│  │ POST /api/chat         │ │  ← Send message, get AI response
│  │ POST /api/reset        │ │  ← Reset conversation history
│  │ GET  /api/health       │ │  ← Health check
│  └────────────────────────┘ │
│           │                  │
│  ┌────────▼───────────────┐ │
│  │  SessionManager        │ │  ← Maps sessionId → ChatEngine
│  │  (session-manager.js)  │ │
│  └────────┬───────────────┘ │
│           │                  │
│  ┌────────▼───────────────┐ │
│  │  ChatEngine            │ │  ← Existing AI + tool-calling loop
│  └────────────────────────┘ │
└─────────────────────────────┘
```

## API Reference

### `GET /api/health`
Returns `{ "status": "ok" }` — useful for monitoring.

### `POST /api/chat`
**Request:**
```json
{
  "message": "How many data sources does this app have?",
  "sessionId": "optional-session-id"
}
```
**Response:**
```json
{
  "response": "This app has 3 data sources: Users, Products, and Orders.",
  "sessionId": "auto-generated-or-provided-id"
}
```
- If `sessionId` is omitted, a new one is generated and returned
- If `message` is missing or empty, returns `400`

### `POST /api/reset`
**Request:**
```json
{
  "sessionId": "your-session-id"
}
```
**Response:**
```json
{
  "success": true
}
```

## Best Practices Applied
- **Dependency Injection**: `createServer({ sessionManager })` — no hard-wired dependencies
- **Factory Pattern**: `SessionManager` accepts an engine factory function
- **Testability**: App is created without `.listen()` — supertest can drive it directly
- **Input Validation**: All endpoints validate inputs before processing
- **Centralized Error Handling**: Express error middleware catches unhandled exceptions
- **CORS**: Enabled for cross-origin frontend requests
- **Immutable IDs**: `crypto.randomUUID()` for session identifiers
- **TDD**: Tests written first (red), then implementation (green)

## Running the Server
```bash
# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the server
npm run start:server
# → Fliplet AI Chatbot server running on http://localhost:3000
```

## Test Results
```
Tests:       127 passed, 127 total
Test Suites: 9 passed, 9 total
```

### New test breakdown
- `tests/server.test.js` — 12 tests (health, chat validation, session handling, CORS, 404, error forwarding)
- `tests/session-manager.test.js` — 11 tests (creation, reuse, isolation, destroy, ID generation)
