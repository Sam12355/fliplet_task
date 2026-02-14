# Fliplet AI Chatbot

An AI-powered chatbot that interacts with the **Fliplet REST API** via OpenAI tool calling to answer questions about data sources and files for a specific Fliplet app.

Ask questions in plain English — the AI queries the real Fliplet API and returns actual data from your app.

## Features

- **Natural language queries** — ask about data sources, entries, files, and folders
- **AI tool calling** — the AI decides which Fliplet API endpoints to call
- **Multi-round reasoning** — AI can chain multiple API calls to answer complex questions
- **Parallel execution** — multiple tool calls in one round run concurrently
- **Conversation memory** — maintains context across multiple messages
- **Error handling** — API errors are explained by the AI in plain language
- **Safety guard** — max iterations prevent infinite tool-call loops

## Architecture

```
User Question
     ↓
┌─────────────────┐
│   ChatEngine    │  ← Orchestrates the conversation loop
│   (chat-engine) │
└────────┬────────┘
         ↓
┌─────────────────┐     ┌──────────────────┐
│   OpenAI API    │ ←→  │  Tool Executor   │  ← Dispatches tool calls
│  (tool calling) │     │  (tool-executor) │
└─────────────────┘     └────────┬─────────┘
                                 ↓
                        ┌──────────────────┐
                        │ FlipletApiClient │  ← HTTP wrapper for Fliplet
                        │ (fliplet-client) │
                        └────────┬─────────┘
                                 ↓
                        ┌──────────────────┐
                        │  Fliplet REST    │
                        │      API         │
                        └──────────────────┘
```

## Project Structure

```
fliplet-ai-chatbot/
├── src/
│   ├── config.js          # Environment variable loader with validation
│   ├── tools.js           # OpenAI tool definitions (5 Fliplet API tools)
│   ├── fliplet-client.js  # HTTP wrapper for Fliplet REST API
│   ├── tool-executor.js   # Dispatcher: tool names → API client methods
│   ├── chat-engine.js     # Conversation loop orchestrator
│   ├── cli.js             # Factory function + formatting helpers
│   └── index.js           # Interactive CLI entry point
├── tests/
│   ├── config.test.js           # Config loader tests (6)
│   ├── tools.test.js            # Tool schema tests (19)
│   ├── fliplet-client.test.js   # API client tests (32)
│   ├── tool-executor.test.js    # Executor tests (12)
│   ├── chat-engine.test.js      # Chat engine tests (17)
│   ├── cli.test.js              # CLI module tests (11)
│   └── integration.test.js      # End-to-end flow tests (7)
├── .env.example           # Environment variable template
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```

## Prerequisites

- **Node.js** ≥ 18.0.0 (for built-in `fetch`)
- **OpenAI API key** ([get one here](https://platform.openai.com/api-keys))
- **Fliplet API token** (Fliplet Studio → Your Profile → API Tokens)
- **Fliplet App ID** (from the URL in Fliplet Studio: `studio.fliplet.com/app/<APP_ID>`)

## Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd fliplet-ai-chatbot

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

Edit `.env` with your values:

```env
OPENAI_API_KEY=sk-...your-key...
OPENAI_MODEL=gpt-4o-mini
FLIPLET_API_TOKEN=eu--your-fliplet-token
FLIPLET_APP_ID=12345
FLIPLET_API_URL=https://api.fliplet.com
```

## Usage

```bash
# Start the chatbot
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
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npm test -- tests/integration.test.js
```

### Test Summary

| Test Suite | Tests | Description |
|-----------|-------|-------------|
| `config.test.js` | 6 | Environment variable loading and validation |
| `tools.test.js` | 19 | Tool schema format and structure |
| `fliplet-client.test.js` | 32 | HTTP client with mocked fetch |
| `tool-executor.test.js` | 12 | Tool name → API method dispatching |
| `chat-engine.test.js` | 17 | Conversation loop with mocked OpenAI |
| `cli.test.js` | 11 | Factory function and formatting |
| `integration.test.js` | 7 | End-to-end flows with all mocks |
| **Total** | **104** | |

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

## Development Process

Each step was built using **Test-Driven Development**:

1. **Step 1** — Project scaffolding, config loader
2. **Step 2** — OpenAI tool schema definitions
3. **Step 3** — Fliplet API HTTP client
4. **Step 4** — Tool executor / dispatcher
5. **Step 5** — Chat engine (conversation loop)
6. **Step 6** — Interactive CLI interface
7. **Step 7** — Integration tests and documentation

## License

ISC
