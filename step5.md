# Step 5 — Chat Engine (TDD)

## What Was Built

The `ChatEngine` class in `src/chat-engine.js` — the core orchestrator that manages the full conversation loop between the user, OpenAI, and the ToolExecutor.

## How It Works

```
User: "How many data sources does this app have?"
        ↓
ChatEngine.chat(userMessage)
        ↓
OpenAI API (with system prompt + history + tool definitions)
        ↓
Response has tool_calls? ──YES──→ ToolExecutor.execute() for each
        │                                    ↓
        │                          Add results to history
        │                                    ↓
        │                          Loop back to OpenAI ───→ ...
        │
        NO (text response)
        ↓
Return assistant's text answer to user
```

## TDD Process

1. **Red** — Wrote 17 tests in `tests/chat-engine.test.js` before any implementation. All failed (`Cannot find module`).
2. **Green** — Implemented `src/chat-engine.js` to satisfy every test.
3. **Commit** — All 86 tests passing (6 config + 19 tools + 32 client + 12 executor + 17 engine).

## Files Created

| File | Purpose |
|------|---------|
| `src/chat-engine.js` | Conversation loop orchestrator |
| `tests/chat-engine.test.js` | 17 tests with mocked OpenAI and ToolExecutor |

## Best Practices Applied

| Practice | How |
|----------|-----|
| **Iterative Loop** | Handles multi-round tool calls — AI can call tools, see results, call more tools, then finally answer |
| **Parallel Execution** | When AI returns multiple tool calls in one response, all are executed concurrently via `Promise.all` |
| **Safety Guard** | `maxIterations` (default 10) prevents infinite tool-call loops |
| **Separation of Concerns** | No HTTP logic, no CLI logic — only orchestration between OpenAI and ToolExecutor |
| **Immutable History** | `getHistory()` returns a copy to prevent external mutation |
| **Dependency Injection** | OpenAI client, ToolExecutor, and tools are all injected via constructor |

## Key Features

### System Prompt
Sets the AI's context — tells it it's a Fliplet assistant that should use tools to look up real data, present details like names/IDs/columns, and be accurate.

### Message History
- Maintained across calls for multi-turn conversations
- `getHistory()` returns a copy
- `reset()` clears for a fresh start

### Tool Call Flow
1. User message added to history
2. OpenAI called with `[system prompt, ...history]` + tool definitions
3. If response has `tool_calls`:
   - Parse JSON arguments from each tool call
   - Execute all via `ToolExecutor` in parallel (`Promise.all`)
   - Add tool results to history in OpenAI's expected format
   - Loop back to call OpenAI again
4. If response is text → return it as the final answer

### Safety
If the AI keeps calling tools without ever producing a text answer, the engine stops after `maxIterations` and returns a user-friendly message.

## Tests (17 total)

### Constructor (5 tests)
- Throws on missing openai client, toolExecutor, tools
- Uses default model (`gpt-4o-mini`)
- Accepts custom model

### System Prompt (1 test)
- Contains Fliplet and data source context

### Message History (2 tests)
- Starts empty
- Clears on reset

### Simple Text Response (3 tests)
- Returns text when no tool calls
- Sends correct structure to OpenAI (model, tools, system prompt, user message)
- Adds user + assistant messages to history

### Single Tool Call (2 tests)
- Executes tool, feeds result back, returns final answer
- Passes parsed arguments correctly

### Multiple Tool Calls (1 test)
- Executes all tool calls from one response, feeds all results back

### Multi-Round Tool Calls (1 test)
- Handles AI calling tools → seeing results → calling more tools → final answer

### Safety Guard (1 test)
- Stops after maxIterations, returns safety message

### Error Handling (1 test)
- Propagates OpenAI API errors with meaningful messages

## Architecture So Far

```
src/
├── config.js          ← Step 1: loads env vars
├── tools.js           ← Step 2: tool definitions for OpenAI
├── fliplet-client.js  ← Step 3: HTTP wrapper for Fliplet API
├── tool-executor.js   ← Step 4: dispatches tool calls to client
├── chat-engine.js     ← Step 5: conversation loop orchestrator
└── index.js           ← placeholder (Step 6: CLI)
```

## Next

Step 6 will implement the interactive CLI interface — a terminal-based REPL where users can type questions and see the AI's answers in real time.
