# Step 4 — Tool Executor / Dispatcher (TDD)

## What Was Built

The `ToolExecutor` class in `src/tool-executor.js` — the bridge between AI tool calls and the `FlipletApiClient`. When the AI decides to call a tool (e.g. `get_data_source` with `{ dataSourceId: 42 }`), the executor dispatches it to the correct client method and returns the result.

## How It Works

```
AI response: call "get_data_source" with { dataSourceId: 42 }
        ↓
ToolExecutor.execute("get_data_source", { dataSourceId: 42 })
        ↓
client.getDataSource(42)
        ↓
Returns result (or structured error) back to AI
```

## TDD Process

1. **Red** — Wrote 12 tests in `tests/tool-executor.test.js` before any implementation. All failed (`Cannot find module`).
2. **Green** — Implemented `src/tool-executor.js` to satisfy every test.
3. **Commit** — All 69 tests passing (6 config + 19 tools + 32 client + 12 executor).

## Files Created

| File | Purpose |
|------|---------|
| `src/tool-executor.js` | Dispatcher mapping tool names → FlipletApiClient methods |
| `tests/tool-executor.test.js` | 12 tests with mocked client (no real HTTP calls) |

## Best Practices Applied

| Practice | How |
|----------|-----|
| **Strategy Pattern** | Dispatch map (`this._handlers`) instead of long if/else or switch chains |
| **Error Boundary** | API errors are caught and returned as structured data `{ error, message, statusCode, details }` so the AI can read them and adjust |
| **Single Responsibility** | Only maps names to calls — no HTTP logic, no AI logic |
| **Dependency Injection** | Receives the client via constructor — easy to mock in tests |

## Dispatch Map

| Tool Name | Client Method Called |
|-----------|-------------------|
| `list_data_sources` | `client.listDataSources()` |
| `get_data_source` | `client.getDataSource(dataSourceId)` |
| `get_data_source_entries` | `client.getDataSourceEntries(dataSourceId, { where, limit, offset })` |
| `list_media` | `client.listMedia(folderId)` |
| `get_media_file` | `client.getMediaFile(fileId)` |

## Error Handling

Errors are **not thrown** — they are returned as data so the AI can understand what went wrong:

```js
// Generic error
{ error: true, message: "Network failure" }

// Fliplet API error (includes extra context)
{ error: true, message: "Not found", statusCode: 404, details: { message: "Data source not found" } }
```

## Tests (12 total)

- Constructor validation (2 tests)
- Unknown tool rejection (1 test)
- `list_data_sources` dispatching (1 test)
- `get_data_source` dispatching (1 test)
- `get_data_source_entries` with full args and minimal args (2 tests)
- `list_media` with and without folderId (2 tests)
- `get_media_file` dispatching (1 test)
- Error handling: generic error and FlipletApiError (2 tests)

## Next

Step 5 will implement the `ChatEngine` — the conversation loop that sends messages to OpenAI, detects tool calls, executes them via `ToolExecutor`, and returns the final answer.
