# Step 2 — Define Fliplet Tool Schemas (TDD)

## What Was Built

Defined 5 OpenAI function-calling tool schemas in `src/tools.js` that describe the Fliplet API operations the AI model can invoke. These tell the AI **what tools are available**, **what parameters they accept**, and **when to use them**.

## TDD Process

1. **Red** — Wrote 19 tests in `tests/tools.test.js` before any implementation. All failed (`Cannot find module`).
2. **Green** — Implemented `src/tools.js` to satisfy every test.
3. **Commit** — All 25 tests passing (6 config + 19 tools).

## Files Created

| File | Purpose |
|------|---------|
| `src/tools.js` | 5 tool definitions in OpenAI function-calling format + `getToolByName()` helper |
| `tests/tools.test.js` | 19 tests covering schema shape, naming, uniqueness, and per-tool params |

## Tool Definitions

Each tool follows the OpenAI format: `{ type: 'function', function: { name, description, parameters } }`

| Tool Name | Maps to Fliplet API | Required Params | Optional Params |
|-----------|-------------------|-----------------|-----------------|
| `list_data_sources` | `GET /v1/data-sources?appId=X` | none (appId from config) | — |
| `get_data_source` | `GET /v1/data-sources/:id` | `dataSourceId` (number) | — |
| `get_data_source_entries` | `POST /v1/data-sources/:id/data/query` | `dataSourceId` (number) | `where` (object), `limit` (number), `offset` (number) |
| `list_media` | `GET /v1/media?appId=X` | — | `folderId` (number) |
| `get_media_file` | `GET /v1/media/files/:id` | `fileId` (number) | — |

## Tests (19 total)

### Structure & Format (6 tests)
- Exports an array of tool definitions
- Correct top-level shape (`type: 'function'`, `function: { name, description, parameters }`)
- Snake_case naming convention enforced
- Non-empty descriptions (> 10 chars)
- Valid JSON Schema parameters
- Unique tool names (no duplicates)

### Helper Function (2 tests)
- `getToolByName()` returns correct tool
- Returns `undefined` for unknown tools

### Per-Tool Validation (11 tests)
- Each tool exists, has correct required/optional params, correct types

## Next

Step 3 will implement the `FlipletApiClient` class — the HTTP wrapper that actually calls these Fliplet endpoints.
