# Fliplet AI Chatbot

A full-stack AI chatbot that interacts with the **Fliplet REST API** via OpenAI tool calling to answer questions about data sources and files for a specific Fliplet app.

Ask questions in plain English — the AI queries the real Fliplet API and returns actual data from your app. Includes a React chat UI, an Express backend proxy, and a CLI interface.

## Features

- **Natural language queries** — ask about data sources, entries, files, and folders
- **AI tool calling** — the AI decides which Fliplet API endpoints to call
- **Multi-round reasoning** — AI can chain multiple API calls to answer complex questions
- **Parallel execution** — multiple tool calls in one round run concurrently
- **Conversation memory** — maintains context across multiple messages
- **React chat UI** — responsive browser interface with Tailwind CSS
- **REST API backend** — Express server with session management
- **CLI interface** — interactive terminal mode for quick testing
- **Error handling** — API errors are explained by the AI in plain language
- **167+ tests** — full TDD coverage across backend (Jest) and frontend (Vitest + RTL)

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
│   ├── tool-executor.js       # Dispatcher: tool names → API client methods
│   ├── chat-engine.js         # Conversation loop orchestrator
│   ├── cli.js                 # CLI factory function + formatting helpers
│   ├── index.js               # Interactive CLI entry point
│   ├── server.js              # Express REST API server
│   ├── session-manager.js     # Per-session ChatEngine instances
│   └── start-server.js        # Server entry point
├── tests/                     # Backend tests (Jest)
│   ├── config.test.js         # Config loader (6 tests)
│   ├── tools.test.js          # Tool schemas (19 tests)
│   ├── fliplet-client.test.js # API client (32 tests)
│   ├── tool-executor.test.js  # Executor (12 tests)
│   ├── chat-engine.test.js    # Chat engine (17 tests)
│   ├── cli.test.js            # CLI module (11 tests)
│   ├── integration.test.js    # End-to-end flows (7 tests)
│   ├── server.test.js         # Express routes (12 tests)
│   └── session-manager.test.js # Sessions (11 tests)
├── frontend/                  # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── App.jsx            # Root component — all state management
│   │   ├── App.test.jsx       # Integration tests (9 tests)
│   │   ├── main.jsx           # React DOM mount
│   │   ├── index.css          # Tailwind directives + custom styles
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx      # Layout: header + messages + input
│   │   │   ├── MessageList.jsx     # Scrollable messages + empty state
│   │   │   ├── ChatMessage.jsx     # Message bubble (Markdown for AI)
│   │   │   ├── MessageInput.jsx    # Textarea + send button
│   │   │   ├── TypingIndicator.jsx # Animated dots
│   │   │   ├── ErrorBoundary.jsx   # Catches render-time errors
│   │   │   └── *.test.jsx          # Component tests
│   │   └── services/
│   │       ├── api.js              # HTTP client for backend
│   │       └── api.test.js         # API service tests (9 tests)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── .env.example
├── jest.config.js
├── package.json
└── README.md
```

## Prerequisites

- **Node.js** ≥ 18.0.0 (for built-in `fetch`) — verify with `node -v`
- **OpenAI API key** ([get one here](https://platform.openai.com/api-keys)) — requires billing enabled on your OpenAI account
- **Fliplet API token** (Fliplet Studio → Your Profile → API Tokens, or run `npm run refresh-token`)
- **Fliplet App ID** (from the URL in Fliplet Studio: `studio.fliplet.com/app/<APP_ID>`)

> **Token Expiration:** Fliplet session tokens may expire after inactivity. If the app returns 401 errors, run `npm run refresh-token` to authenticate and get a fresh token automatically.

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

Edit `.env` with your values:

```env
OPENAI_API_KEY=sk-...your-key...
OPENAI_MODEL=gpt-4o-mini
FLIPLET_API_TOKEN=eu--your-fliplet-token
FLIPLET_APP_ID=12345
FLIPLET_API_URL=https://api.fliplet.com
PORT=3000
```

## Usage

### Web UI (React frontend + Express backend)

> **Important:** Start the backend **before** the frontend — the Vite dev server proxies `/api/*` to the backend.

```bash
# Terminal 1 — Start the backend server (start this FIRST)
npm run start:server
# → Fliplet AI Chatbot server running on http://localhost:3000

# Terminal 2 — Start the frontend dev server
npm run start:frontend
# → http://localhost:5173
```

Open `http://localhost:5173` in your browser. The Vite dev server proxies `/api/*` to the backend.

### CLI Mode (terminal only)

```bash
npm start
```

### Example Session

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

### Commands

| Command | Action |
|---------|--------|
| `exit` / `quit` | End the session |
| `reset` | Clear conversation history |

## REST API Endpoints

The Express backend exposes these endpoints (all JSON):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a message, get AI response. Body: `{ message, sessionId? }` |
| `POST` | `/api/reset` | Clear conversation for a session. Body: `{ sessionId }` |
| `GET` | `/api/health` | Health check. Returns `{ status: "ok" }` |

## Available AI Tools

The AI can call these tools to query your Fliplet app:

| Tool | Fliplet API Endpoint | Description |
|------|---------------------|-------------|
| `list_data_sources` | `GET /v1/data-sources?appId=X` | List all data sources for the app |
| `get_data_source` | `GET /v1/data-sources/:id` | Get details of a specific data source |
| `get_data_source_entries` | `POST /v1/data-sources/:id/data/query` | Query entries with filters, pagination |
| `list_media` | `GET /v1/media?appId=X` | List files and folders for the app |
| `get_media_file` | `GET /v1/media/files/:id` | Get metadata for a specific file |

## Testing

```bash
# Backend tests (Jest)
npm test

# Frontend tests (Vitest + React Testing Library)
cd frontend && npm test

# Watch modes
npm run test:watch          # Backend
cd frontend && npm run test:watch  # Frontend

# Coverage
npm run test:coverage       # Backend
```

### Test Summary

| Suite | Tests | Framework |
|-------|-------|-----------|
| Config loader | 6 | Jest |
| Tool schemas | 19 | Jest |
| Fliplet API client | 32 | Jest |
| Tool executor | 12 | Jest |
| Chat engine | 17 | Jest |
| CLI module | 11 | Jest |
| Integration (e2e) | 7 | Jest |
| Express server | 12 | Jest + Supertest |
| Session manager | 11 | Jest |
| API service | 9 | Vitest |
| React components | 22 | Vitest + RTL |
| App integration | 9 | Vitest + RTL |
| **Total** | **167** | |

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **OpenAI SDK** | Industry standard, best tool-calling support, well-documented |
| **Dependency Injection** | All components accept dependencies via constructor — easy to mock and test |
| **TDD** | Every module was tested before implementation (red → green → commit) |
| **Strategy Pattern** (ToolExecutor) | Dispatch map instead of if/else chains — clean and extensible |
| **Factory Pattern** (cli.js) | Single composition root keeps wiring logic in one place |
| **Error as Data** (ToolExecutor) | API errors returned as structured objects so the AI can explain them |
| **Provider Agnostic Design** | ChatEngine accepts any OpenAI-compatible client — easy to swap providers |

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| AI | OpenAI SDK (GPT-4o-mini) | Tool calling, natural language understanding |
| Backend | Node.js 18+, Express | REST API, session management |
| Frontend | React 18, Vite 5, Tailwind CSS 3 | Chat UI, responsive design |
| Testing | Jest, Vitest, React Testing Library, Supertest | TDD across full stack |
| External API | Fliplet REST API | Data sources, media files |

## Development Process

Each step was built using **Test-Driven Development** (red → green → commit):

1. **Step 1** — Project scaffolding, config loader
2. **Step 2** — OpenAI tool schema definitions
3. **Step 3** — Fliplet API HTTP client
4. **Step 4** — Tool executor / dispatcher
5. **Step 5** — Chat engine (conversation loop)
6. **Step 6** — Interactive CLI interface
7. **Step 7** — Integration tests, README, v1.0.0
8. **Step 8** — Express backend proxy + session management
9. **Step 9** — React + Vite + Tailwind frontend chat UI
10. **Step 10** — Frontend tests (Vitest + React Testing Library)
11. **Step 11** — Final polish, updated README, v2.0.0

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node src/index.js` | CLI chatbot (terminal) |
| `npm run start:server` | `node src/start-server.js` | Express backend (port 3000) |
| `npm run start:frontend` | `cd frontend && npm run dev` | Vite dev server (port 5173) |
| `npm test` | `jest --verbose` | Backend tests |
| `npm run test:watch` | `jest --watch` | Backend tests (watch) |
| `npm run test:coverage` | `jest --coverage` | Backend coverage report |
| `npm run refresh-token` | `node scripts/refresh-token.js` | Refresh expired Fliplet token |
| `npm run build:frontend` | `cd frontend && npm run build` | Production frontend build |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `fetch is not defined` | Upgrade to Node.js ≥ 18.0.0 (`node -v` to check) |
| `OPENAI_API_KEY is required` | Ensure `.env` file exists with a valid key |
| Port 3000 already in use | Set a different port in `.env`: `PORT=3001` |
| Frontend shows "Network Error" | Make sure the backend is running first on port 3000 |
| Fliplet API returns 401 | Your `FLIPLET_API_TOKEN` may be expired — run `npm run refresh-token` to get a fresh one |
| `crypto.randomUUID is not a function` | Use a modern browser and access via `localhost` (secure context required) |

> **Note:** The example session in the README shows illustrative output. Actual results will vary depending on your configured Fliplet app's data.

## License

ISC
