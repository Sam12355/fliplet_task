# Fliplet AI Chatbot

A full stack AI chatbot that talks to the **Fliplet REST API** using OpenAI tool calling. You ask questions in plain English about your app's data sources and files, and the AI figures out which API endpoints to call, fetches the real data, and gives you a proper answer.

It comes with a React chat UI, an Express backend that keeps your API keys safe, and a CLI if you prefer the terminal.

## Features

- **Natural language queries** about data sources, entries, files, and folders
- **AI tool calling** where the model picks which Fliplet API endpoints to hit
- **Multi round reasoning** so the AI can chain several API calls for complex questions
- **Parallel execution** when the AI needs multiple API calls in one go
- **Conversation memory** that keeps context across messages
- **React chat UI** with a responsive layout built on Tailwind CSS
- **REST API backend** with Express, session management, and security hardening
- **CLI interface** for quick terminal testing
- **Error handling** where API errors get explained by the AI in plain language
- **171 tests** covering the full stack with Jest (backend) and Vitest + RTL (frontend)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React + Vite + Tailwind)                              │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐               │
│  │ App.jsx   │→ │ ChatWindow │→ │ MessageList  │               │
│  │ (state)   │  │ (layout)   │  │ MessageInput │               │
│  └─────┬─────┘  └────────────┘  └──────────────┘               │
│        │ fetch('/api/chat')                                     │
└────────┼────────────────────────────────────────────────────────┘
         │ HTTP (Vite dev proxy in dev, same origin in prod)
┌────────▼────────────────────────────────────────────────────────┐
│  Express Server (server.js)                                     │
│  ┌──────────────────┐  ┌───────────────────┐                    │
│  │ POST /api/chat   │→ │ SessionManager    │                    │
│  │ POST /api/reset  │  │ (per-session      │                    │
│  │ GET  /api/health │  │  ChatEngine)      │                    │
│  └──────────────────┘  └────────┬──────────┘                    │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐│
│  │  ChatEngine → OpenAI API ↔ ToolExecutor → FlipletApiClient ││
│  └─────────────────────────────────────────────┬───────────────┘│
└────────────────────────────────────────────────┼────────────────┘
                                                 │ HTTPS
                                        ┌────────▼────────┐
                                        │  Fliplet REST   │
                                        │      API        │
                                        └─────────────────┘
```

## Project Structure

```
fliplet-ai-chatbot/
├── src/                       # Backend (Node.js)
│   ├── config.js              # Environment variable loader with validation
│   ├── tools.js               # OpenAI tool definitions (5 Fliplet API tools)
│   ├── fliplet-client.js      # HTTP wrapper for Fliplet REST API
│   ├── tool-executor.js       # Dispatcher that maps tool names to API methods
│   ├── chat-engine.js         # Conversation loop orchestrator
│   ├── cli.js                 # CLI factory function and formatting helpers
│   ├── index.js               # Interactive CLI entry point
│   ├── server.js              # Express REST API server
│   ├── session-manager.js     # Per session ChatEngine instances
│   └── start-server.js        # Server entry point
├── tests/                     # Backend tests (Jest)
│   ├── config.test.js         # Config loader (6 tests)
│   ├── tools.test.js          # Tool schemas (19 tests)
│   ├── fliplet-client.test.js # API client (32 tests)
│   ├── tool-executor.test.js  # Executor (12 tests)
│   ├── chat-engine.test.js    # Chat engine (17 tests)
│   ├── cli.test.js            # CLI module (11 tests)
│   ├── integration.test.js    # End to end flows (7 tests)
│   ├── server.test.js         # Express routes (13 tests)
│   └── session-manager.test.js # Sessions (11 tests)
├── frontend/                  # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── App.jsx            # Root component with all state management
│   │   ├── App.test.jsx       # Integration tests (9 tests)
│   │   ├── main.jsx           # React DOM mount
│   │   ├── index.css          # Tailwind directives and custom styles
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx      # Layout: header + messages + input
│   │   │   ├── MessageList.jsx     # Scrollable messages and empty state
│   │   │   ├── ChatMessage.jsx     # Message bubble (Markdown for AI)
│   │   │   ├── MessageInput.jsx    # Textarea and send button
│   │   │   ├── TypingIndicator.jsx # Animated dots
│   │   │   ├── ErrorBoundary.jsx   # Catches render time errors
│   │   │   └── *.test.jsx          # Component tests
│   │   └── services/
│   │       ├── api.js              # HTTP client for backend
│   │       └── api.test.js         # API service tests (9 tests)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── scripts/
│   └── refresh-token.js       # Refresh expired Fliplet API token
├── .env.example
├── jest.config.js
├── package.json
└── README.md
```

## Prerequisites

- **Node.js** >= 18.0.0 (needs built in `fetch`). Check with `node -v`
- **OpenAI API key** from https://platform.openai.com/api-keys (billing needs to be enabled)
- **Fliplet API token** from Fliplet Studio > Your Profile > API Tokens, or run `npm run refresh-token`
- **Fliplet App ID** from the URL in Fliplet Studio: `studio.fliplet.com/app/<APP_ID>`

> **About token expiration:** Fliplet session tokens can expire after inactivity. If you see 401 errors, just run `npm run refresh-token` and it will authenticate and update the `.env` file for you.

## Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd fliplet-ai-chatbot

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend && npm install && cd ..

# 4. Configure environment variables
# macOS / Linux:
cp .env.example .env
# Windows (PowerShell):
# Copy-Item .env.example .env
```

Open `.env` and fill in your values:

```env
OPENAI_API_KEY=sk-...your-key...
OPENAI_MODEL=gpt-4o-mini
FLIPLET_API_TOKEN=eu--your-fliplet-token
FLIPLET_APP_ID=12345
FLIPLET_API_URL=https://api.fliplet.com
PORT=3000
```

## How to Test

Testing is split across backend and frontend. Everything runs with a single command per layer and no real API calls are made since all external dependencies are mocked.

### Run All Tests (quick version)

```bash
# Backend (128 tests, takes about 3 seconds)
npm test

# Frontend (43 tests, takes about 15 seconds)
cd frontend && npm test
```

That's it. Both commands will print a full pass/fail summary.

### Backend Tests (Jest)

```bash
# Run once with verbose output
npm test

# Watch mode (re runs on file changes, great during development)
npm run test:watch

# Generate a coverage report
npm run test:coverage
```

The backend has **128 tests across 9 suites** covering every module:

| Suite | What it tests | Tests |
|-------|--------------|-------|
| Config loader | Environment variable parsing, validation, missing key errors | 6 |
| Tool schemas | OpenAI function definitions, required params, types | 19 |
| Fliplet API client | HTTP calls, error handling, timeouts, input validation | 32 |
| Tool executor | Dispatching tool names to the right API methods | 12 |
| Chat engine | Conversation loop, tool calling, history, error messages | 17 |
| CLI module | Factory function, formatting helpers | 11 |
| Integration (e2e) | Full flows: user message > OpenAI > tools > response | 7 |
| Express server | Routes, validation, status codes, CORS, error middleware | 13 |
| Session manager | TTL eviction, max sessions, cleanup | 11 |

### Frontend Tests (Vitest + React Testing Library)

```bash
cd frontend

# Run once
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

The frontend has **43 tests across 7 suites**:

| Suite | What it tests | Tests |
|-------|--------------|-------|
| API service | HTTP calls, timeouts, error handling | 9 |
| TypingIndicator | Renders dots, accessible status role | 3 |
| ErrorBoundary | Catches render errors, shows fallback, recovery | 3 |
| ChatMessage | User vs AI bubbles, Markdown rendering | 5 |
| MessageList | Empty state, suggestion chips, typing indicator, scroll | 7 |
| MessageInput | Controlled input, send on Enter, disabled state, auto resize | 7 |
| App (integration) | Full chat flow: send, receive, error, retry, reset | 9 |

### What the Tests Cover

Every test mocks external dependencies so nothing hits the network. The backend tests mock OpenAI and Fliplet API responses. The frontend tests mock the API service layer so no HTTP requests go out.

Key things verified:
- Input validation (empty messages, bad session IDs, oversized payloads)
- Error handling at every layer (network failures, API errors, OpenAI errors)
- Session management (creation, TTL expiration, eviction at capacity)
- Tool calling flow (AI picks tools, executor dispatches, results feed back)
- React component rendering (user messages, AI Markdown, loading states)
- Accessibility (ARIA labels, roles, keyboard navigation)
- Edge cases (parallel tool calls, multi round conversations, rate limiting)

### Total: 171 tests

| Layer | Tests | Framework |
|-------|-------|-----------|
| Backend | 128 | Jest + Supertest |
| Frontend | 43 | Vitest + React Testing Library |
| **Total** | **171** | |

## Usage

### Web UI (React + Express)

Start the backend first because the Vite dev server proxies `/api/*` requests to it.

```bash
# Terminal 1: Start the backend (do this first)
npm run start:server
# Output: Fliplet AI Chatbot server running on http://localhost:3000

# Terminal 2: Start the frontend
npm run start:frontend
# Output: http://localhost:5173
```

Open http://localhost:5173 in your browser and start chatting.

### CLI Mode

If you just want to test in the terminal without the UI:

```bash
npm start
```

### Example Conversation

```
╔══════════════════════════════════════════════════╗
║           Fliplet AI Chatbot                    ║
╚══════════════════════════════════════════════════╝

  Connected to Fliplet App ID: 12345

  You: What data sources does this app have?

  AI: This app has 3 data sources:
      1. Users (columns: name, email, role)
      2. Products (columns: title, price, category)
      3. Orders (columns: orderId, userId, total)

  You: Show me the first 3 entries from Users

  AI: Here are the first 3 entries from the Users data source:
      1. Alice (alice@example.com) - Admin
      2. Bob (bob@example.com) - User
      3. Charlie (charlie@example.com) - User

  You: What files are uploaded?

  AI: This app has 2 files:
      - logo.png (image/png, 45KB)
      - report.pdf (application/pdf, 2.1MB)

  You: exit
  Goodbye! 👋
```

### CLI Commands

| Command | Action |
|---------|--------|
| `exit` / `quit` | End the session |
| `reset` | Clear conversation history |

## REST API Endpoints

The Express backend exposes these JSON endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a message, get AI response. Body: `{ message, sessionId? }` |
| `POST` | `/api/reset` | Clear conversation for a session. Body: `{ sessionId }` |
| `GET` | `/api/health` | Health check. Returns `{ status: "ok" }` |

## Available AI Tools

These are the tools the AI can call to interact with your Fliplet app:

| Tool | Fliplet API Endpoint | Description |
|------|---------------------|-------------|
| `list_data_sources` | `GET /v1/data-sources?appId=X` | List all data sources for the app |
| `get_data_source` | `GET /v1/data-sources/:id` | Get details of a specific data source |
| `get_data_source_entries` | `POST /v1/data-sources/:id/data/query` | Query entries with filters and pagination |
| `list_media` | `GET /v1/media?appId=X` | List files and folders for the app |
| `get_media_file` | `GET /v1/media/files/:id` | Get metadata for a specific file |

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **OpenAI SDK** | Industry standard with the best tool calling support and solid docs |
| **Dependency Injection** | Every class takes its dependencies through the constructor, making everything easy to mock and test |
| **TDD** | Each module was tested before implementation following red, green, commit |
| **Strategy Pattern** (ToolExecutor) | Uses a dispatch map instead of if/else chains so it stays clean and extensible |
| **Factory Pattern** (cli.js) | Single composition root keeps all the wiring logic in one place |
| **Error as Data** (ToolExecutor) | API errors get returned as structured objects so the AI can read and explain them to the user |
| **Provider Agnostic** | ChatEngine accepts any OpenAI compatible client which makes it easy to swap models later |

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| AI | OpenAI SDK (GPT 4o mini) | Tool calling and natural language understanding |
| Backend | Node.js 18+, Express 5 | REST API and session management |
| Frontend | React 18, Vite 5, Tailwind CSS 3 | Chat UI with responsive design |
| Testing | Jest, Vitest, React Testing Library, Supertest | TDD across the full stack |
| External API | Fliplet REST API | Data sources and media files |

## Development Process

Each step was built using Test Driven Development (red, green, commit):

1. **Step 1** Project scaffolding and config loader
2. **Step 2** OpenAI tool schema definitions
3. **Step 3** Fliplet API HTTP client
4. **Step 4** Tool executor / dispatcher
5. **Step 5** Chat engine (conversation loop)
6. **Step 6** Interactive CLI interface
7. **Step 7** Integration tests, README, v1.0.0
8. **Step 8** Express backend proxy and session management
9. **Step 9** React + Vite + Tailwind frontend chat UI
10. **Step 10** Frontend tests (Vitest + React Testing Library)
11. **Step 11** Final polish, updated README, v2.0.0

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node src/index.js` | CLI chatbot (terminal) |
| `npm run start:server` | `node src/start-server.js` | Express backend (port 3000) |
| `npm run start:frontend` | `cd frontend && npm run dev` | Vite dev server (port 5173) |
| `npm test` | `jest --verbose` | Backend tests |
| `npm run test:watch` | `jest --watch` | Backend tests in watch mode |
| `npm run test:coverage` | `jest --coverage` | Backend coverage report |
| `npm run refresh-token` | `node scripts/refresh-token.js` | Refresh expired Fliplet token |
| `npm run build:frontend` | `cd frontend && npm run build` | Production frontend build |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `fetch is not defined` | Upgrade to Node.js >= 18.0.0 (check with `node -v`) |
| `OPENAI_API_KEY is required` | Make sure the `.env` file exists and has a valid key |
| Port 3000 already in use | Set a different port in `.env` like `PORT=3001` |
| Frontend shows "Network Error" | Make sure the backend is running first on port 3000 |
| Fliplet API returns 401 | Your token probably expired. Run `npm run refresh-token` to get a fresh one |
| `crypto.randomUUID is not a function` | Use a modern browser and access via `localhost` (needs a secure context) |

> The example session above shows illustrative output. Actual results depend on the data in your configured Fliplet app.

## License

ISC
