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
- **Scope restricted** so the chatbot only answers questions about your Fliplet app's data and files, politely declining anything off topic
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
- **OpenAI API key** from https://platform.openai.com/api-keys (already added)
- **Fliplet API token** from Fliplet Studio > Profile > API Tokens, or run `npm run refresh-token`
- **Fliplet App ID** from the URL in Fliplet Studio: `studio.fliplet.com/app/<APP_ID>`

> **About token expiration:** Fliplet session tokens can expire after inactivity. If you see 401 errors, just run `npm run refresh-token` and it will authenticate and update the `.env` file.

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
  Goodbye!
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

## Applied Best Practices

The project went through a full audit across API, frontend, and backend layers. Here is what was checked and what ended up in the final codebase.

### API (14/14 passed)

| Practice | Status | Details |
|----------|--------|---------|
| RESTful endpoint design | Passed | Clean `/api/chat`, `/api/reset`, `/api/health` with correct HTTP methods and naming |
| Input validation and sanitization | Passed | Message type, emptiness, length (4000 char cap), control character stripping, UUID session ID format |
| Consistent error response format | Passed | Every error returns `{ error: "..." }` with the right status code |
| Rate limiting | Passed | 30 requests per minute on `/api/chat` via express rate limit with standard headers |
| Request/response content types | Passed | JSON parsing with `express.json()`, proper `Content-Type` on all outbound calls |
| Proper HTTP status codes | Passed | 200 (success), 400 (validation), 404 (not found), 429 (rate limit), 500 (server error) |
| Documentation | Passed | Full README with architecture, endpoint reference, tool docs, troubleshooting |
| Pagination support | Passed | `getDataSourceEntries()` accepts `limit` and `offset` passed through the AI tool schema |
| CORS configuration | Passed | Allowlist of specific origins (localhost:5173 and localhost:3000), not a wildcard |
| Request size limits | Passed | `express.json({ limit: '100kb' })` plus 4000 character message cap |
| Timeout handling | Passed | 30s AbortController on Fliplet API calls, 60s timeout on frontend fetch |
| Health check endpoint | Passed | `GET /api/health` returns `{ status: "ok" }` |
| Request correlation IDs | Passed | `crypto.randomUUID()` per request, logged with errors for tracing |
| Scope restriction | Passed | System prompt enforces that the AI only answers Fliplet app data questions and politely declines everything else |

### Frontend (14/14 passed)

| Practice | Status | Details |
|----------|--------|---------|
| Component composition | Passed | Clean tree: App (state) > ChatWindow (layout) > MessageList / MessageInput / TypingIndicator / ChatMessage |
| State management | Passed | State lifted to App.jsx, passed down as props with no prop drilling issues |
| React hooks | Passed | `useCallback` with correct deps, `useEffect` deps array correct, `useRef` for scroll and focus |
| Accessibility | Passed | `aria-label` on all interactive elements, `role="list"` / `role="listitem"` / `role="status"` / `role="alert"`, keyboard navigation with focus rings |
| Error boundary | Passed | `ErrorBoundary` class component catches render time crashes and shows a recovery UI |
| Loading states | Passed | Typing indicator, disabled input, changed placeholder text, optimistic user message rendering |
| Responsive design | Passed | Tailwind responsive classes, `max-w-2xl`, `h-[90vh]`, scrollable table wrapper for wide tables |
| Performance | Passed | `React.memo` on ChatMessage and TypingIndicator to prevent unnecessary re renders |
| PropTypes | Passed | Runtime type checking on all components with `prop-types` |
| CSS methodology | Passed | Utility first Tailwind with custom styles organized in `index.css` (scrollbar, prose, animations) |
| Testing | Passed | 43 tests covering unit, integration, and service layer with React Testing Library patterns |
| Build tooling | Passed | Vite with React plugin, dev proxy to backend, Vitest with jsdom, PostCSS + Tailwind pipeline |
| Form handling | Passed | Controlled textarea, trim on submit, empty check, Enter/Shift+Enter, auto resize, clear after send |
| XSS prevention | Passed | `react-markdown` renders to React elements (not dangerouslySetInnerHTML), user messages rendered as plain text |

### Backend (22/22 passed)

| Practice | Status | Details |
|----------|--------|---------|
| Dependency injection | Passed | Every class takes dependencies through constructor: `ChatEngine({openai, toolExecutor, tools})`, `FlipletApiClient(config, fetchFn)`, `SessionManager(engineFactory)` |
| Separation of concerns | Passed | HTTP layer (server.js) is pure routing, chat-engine.js is orchestration, fliplet-client.js is I/O, tool-executor.js is dispatch |
| Design patterns | Passed | Strategy pattern in ToolExecutor dispatch map, Factory pattern in SessionManager and createApp composition root |
| Environment management | Passed | Centralized in config.js with dotenv, validation, fail fast on missing vars, `.env.example` provided |
| Immutable configuration | Passed | `Object.freeze(config)` prevents accidental mutation after load |
| Custom error classes | Passed | `FlipletApiError` extends Error with `statusCode` and `responseBody` |
| Centralized error handling | Passed | Express error middleware catches all unhandled errors, logs full stack server side, returns generic message to client |
| Graceful shutdown | Passed | SIGTERM and SIGINT handlers stop cleanup, drain connections, force exit after 10s |
| Session management | Passed | 30 minute TTL, 100 max sessions, LRU eviction, periodic cleanup every 5 minutes |
| Memory leak prevention | Passed | Sliding window history (50 messages), session TTL + cap, cleanup interval uses `.unref()` |
| Security headers | Passed | Helmet middleware adds X-Content-Type-Options, X-Frame-Options, HSTS, CSP defaults |
| Rate limiting | Passed | 30 req/min on `/api/chat` with standard headers |
| Request body limits | Passed | 100kb JSON limit plus 4000 character message cap |
| Input validation | Passed | Message type/empty/length, UUID session ID format, dataSourceId/fileId presence checks, URL format validation on config |
| Testability | Passed | All dependencies injectable, 128 backend tests with pure mocks, no real network calls |
| No circular dependencies | Passed | Strictly layered: config > fliplet-client > tool-executor > chat-engine > server. No cycles |
| Module exports | Passed | Named exports everywhere (`{ ChatEngine }`, `{ createServer }`, `{ tools, getToolByName }`) |
| Signal handling | Passed | Both SIGTERM and SIGINT handled in start-server.js |
| Shared stateless clients | Passed | OpenAI, FlipletApiClient, and ToolExecutor created once, reused across all sessions |
| Error as data for AI | Passed | ToolExecutor never throws on API errors, returns `{ error: true, message }` so the AI can read and explain it |
| Max iteration guard | Passed | `DEFAULT_MAX_ITERATIONS = 10` prevents infinite tool call loops |
| `createServer()` testability | Passed | Returns Express app without calling `.listen()`, so Supertest can test it directly |

### Scope: 50/50 checks passed

## Built With Claude Code

This project was built using **Claude Code** (Anthropic's AI coding agent) as the primary development tool, guided step by step through every decision.

The approach was not "generate the whole thing and hope for the best." It was planned and directed like a real software project, with me making the architectural calls and Claude handling the implementation under my guidance.

### How I Planned and Directed the Build

**Requirements gathering first.** Before writing any code, I broke the task down into what it actually needed: a way to talk to Fliplet's REST API, an AI layer that could decide which endpoints to call, a backend to keep API keys secure, and a frontend for the recruiter to interact with. That gave me the 11 step build plan.

**Architecture decisions were mine.** I chose dependency injection over hardcoded imports. I chose the Strategy pattern for tool dispatch. I chose to separate the HTTP layer from business logic so everything stays testable. I chose Express 5 with a composition root pattern. Claude implemented what I designed.

**TDD was enforced throughout.** Every step followed the same cycle: write the tests first, watch them fail, implement just enough to make them pass, commit. I did not let the AI skip tests or write implementation before the test suite existed. This is why there are 171 tests and not zero.

**Incremental delivery, not big bang.** The CLI worked standalone as v1.0.0 before the backend or frontend existed. The backend was tested independently before the React UI touched it. Each layer proved itself before the next one started.

**Security and hardening were deliberate.** After the core was working, I ran a full audit across API, frontend, and backend practices. I identified 44 issues across the codebase, prioritized them by impact, and directed fixes in two rounds until all 50 checks passed.

**Scope restriction was a conscious choice.** I decided the chatbot should only answer questions about the configured Fliplet app's data. If someone asks it to write code or answer general knowledge questions, it politely declines. This was done through system prompt engineering, not by limiting the model.

### What This Demonstrates

- **Planning** what to build and in what order
- **Architecture** decisions that affect testability, maintainability, and security
- **Quality gates** like TDD, code audits, and incremental validation
- **Prioritization** when issues come up (fix the security holes before adding polish)
- **Understanding the full SDLC** from requirements through testing, deployment, and documentation

The git history reflects this process. Every commit follows conventional commit format, each step builds on the last, and the test count grows with every commit because nothing shipped without tests.

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
