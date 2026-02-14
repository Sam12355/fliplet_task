# Step 6 — CLI Interface (TDD)

## What Was Built

The interactive terminal interface that lets users chat with the AI about their Fliplet app's data sources and files.

Two files:
- `src/cli.js` — Testable factory function + formatting helpers
- `src/index.js` — The readline REPL loop (entry point)

## How It Works

```
$ node src/index.js

╔══════════════════════════════════════════════════╗
║           Fliplet AI Chatbot                    ║
╚══════════════════════════════════════════════════╝

  Connected to Fliplet App ID: 12345

  Ask me anything about your app's data sources
  and files. I'll query the Fliplet API for you.

  Commands:
    exit / quit  — End the session
    reset        — Clear conversation history

  You: How many data sources does this app have?

  AI: Thinking...
  AI: This app has 3 data sources: Users, Products, and Orders.

  You: exit

  Goodbye! 👋
```

## TDD Process

1. **Red** — Wrote 11 tests in `tests/cli.test.js` before implementation. All failed.
2. **Green** — Implemented `src/cli.js` to satisfy every test, then updated `src/index.js` with the REPL.
3. **Commit** — All 97 tests passing.

## Files Created / Modified

| File | Purpose |
|------|---------|
| `src/cli.js` (new) | `createApp()` factory, `formatWelcome()`, `formatError()` |
| `src/index.js` (updated) | Interactive readline REPL loop |
| `tests/cli.test.js` (new) | 11 tests for factory and formatting |

## Architecture Decision: cli.js vs index.js

Separated into two files for testability:

| File | Contains | Testable? |
|------|----------|-----------|
| `src/cli.js` | Factory function, formatting helpers | ✅ Yes — pure functions |
| `src/index.js` | Readline REPL loop | Manual testing — involves stdin/stdout |

## Best Practices Applied

| Practice | How |
|----------|-----|
| **Factory Pattern** | `createApp(config)` is the composition root — single place where all dependencies are assembled |
| **Separation of Concerns** | Wiring logic (testable) separated from I/O loop (manual test) |
| **Graceful Error Handling** | Missing `.env` shows helpful tip; API errors are caught and displayed |
| **UX Polish** | "Thinking..." indicator; box-drawn welcome banner; special commands |
| **Fail Fast** | Config validation runs first — exits with clear message if `.env` is missing |

## Special Commands

| Command | Action |
|---------|--------|
| `exit` / `quit` | End the session |
| `reset` | Clear conversation history for a fresh start |
| Empty input | Ignored (re-prompts) |

## Tests (11 total)

### createApp() Factory (5 tests)
- Returns object with `chatEngine`, `flipletClient`, `toolExecutor` properties
- Throws if config is missing
- Uses model from config

### formatWelcome() (3 tests)
- Includes app ID
- Includes exit/quit instructions
- Non-empty string

### formatError() (3 tests)
- Includes error message
- Prefixed with error indicator
- Handles missing message gracefully

## Running the Chatbot

```bash
# 1. Copy and fill in your environment variables
cp .env.example .env
# Edit .env with your OpenAI API key, Fliplet token, and app ID

# 2. Start the chatbot
npm start
```

## Architecture Complete

```
src/
├── config.js          ← Step 1: loads env vars
├── tools.js           ← Step 2: tool definitions for OpenAI
├── fliplet-client.js  ← Step 3: HTTP wrapper for Fliplet API
├── tool-executor.js   ← Step 4: dispatches tool calls to client
├── chat-engine.js     ← Step 5: conversation loop orchestrator
├── cli.js             ← Step 6: factory + formatting helpers
└── index.js           ← Step 6: interactive REPL entry point
```

## Next

Step 7 will add integration tests, a comprehensive README, and tag the release as `v1.0.0`.
