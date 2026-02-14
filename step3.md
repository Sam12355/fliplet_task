# Step 3 — Fliplet API Client (TDD)

## Goal

Build a `FlipletApiClient` class that wraps the Fliplet REST API into clean, reusable methods. Each method maps directly to one of the tool definitions from Step 2.

## Architecture

```
ChatEngine  →  ToolExecutor  →  FlipletApiClient  →  Fliplet REST API
                                   ↑ (this step)
```

The client is a **pure HTTP wrapper** — no AI logic, no tool-calling awareness. It just knows how to talk to Fliplet's API.

## Design Decisions & Best Practices

| Practice | How |
|----------|-----|
| **Single Responsibility** | Client only handles HTTP to Fliplet — nothing else |
| **Dependency Injection** | `fetch` is injected so we can mock it in tests |
| **Immutable Config** | Constructor receives frozen config, never mutates it |
| **Error Handling** | Wraps HTTP errors into descriptive `FlipletApiError` with status code |
| **No Side Effects** | Pure functions — same input = same output |
| **DRY** | Shared `_request()` base method handles auth, headers, error parsing |

## Methods

| Method | Fliplet API Endpoint | Returns |
|--------|---------------------|---------|
| `listDataSources()` | `GET /v1/data-sources?appId=X` | Array of data source objects |
| `getDataSource(id)` | `GET /v1/data-sources/:id` | Single data source object |
| `getDataSourceEntries(id, opts)` | `POST /v1/data-sources/:id/data/query` | Array of entry objects |
| `listMedia(folderId?)` | `GET /v1/media?appId=X` | `{ folders, files }` |
| `getMediaFile(fileId)` | `GET /v1/media/files/:id/contents` | File metadata object |

## TDD Plan

### Tests Written BEFORE Implementation

1. **Constructor** — validates config, stores base URL and token
2. **_request()** — sends correct headers, handles HTTP errors
3. **listDataSources()** — calls correct endpoint with appId
4. **getDataSource()** — calls correct endpoint with data source ID
5. **getDataSourceEntries()** — sends POST with query body
6. **listMedia()** — calls correct endpoint, optional folderId
7. **getMediaFile()** — calls correct endpoint with file ID
8. **Error handling** — throws FlipletApiError on 401, 404, 500

### Mocking Strategy

- `global.fetch` is mocked with Jest (no real HTTP calls)
- Each test sets up a mock response matching Fliplet's documented format
- Tests verify the correct URL, method, headers, and body are sent

## Files

| File | Purpose |
|------|---------|
| `src/fliplet-client.js` | FlipletApiClient class |
| `tests/fliplet-client.test.js` | Unit tests with mocked fetch |
