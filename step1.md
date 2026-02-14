# Step 1 — Project Scaffolding & Git Init

## Project Structure

Created the `fliplet-ai-chatbot` project inside the Fliplet workspace with a clean folder layout separating source code (`src/`) from tests (`tests/`).

```
fliplet-ai-chatbot/
├── src/
│   ├── config.js          # Config loader with validation & defaults
│   └── index.js           # Entry point (placeholder)
├── tests/
│   └── config.test.js     # 6 passing tests for config loader
├── .env.example           # Documented env vars template
├── .gitignore             # Ignores node_modules, .env, coverage, etc.
├── jest.config.js         # Jest configuration
├── package.json           # Scripts: start, test, test:watch, test:coverage
└── package-lock.json
```

## Files Created

| File | Purpose |
|------|---------|
| `package.json` | Project metadata, npm scripts (`start`, `test`, `test:watch`, `test:coverage`), dependencies |
| `src/config.js` | Loads env vars via `dotenv`, validates required keys (`OPENAI_API_KEY`, `FLIPLET_API_TOKEN`, `FLIPLET_APP_ID`), applies defaults for optional ones, returns a frozen config object |
| `src/index.js` | Entry point placeholder — will become the CLI chat interface later |
| `tests/config.test.js` | 6 unit tests covering: successful load, default values, missing required vars (3 tests), immutability |
| `.env.example` | Template showing all env vars with descriptions so anyone cloning the repo knows what to configure |
| `.gitignore` | Ignores `node_modules/`, `.env`, `coverage/`, OS/IDE files |
| `jest.config.js` | Jest configured for Node environment, pointing to `tests/` directory |

## Dependencies

- **Runtime:** `openai` (AI SDK with tool-calling support), `dotenv` (env var loading)
- **Dev:** `jest` (testing framework)

## Tests

All 6 config tests pass — verifying the config loader handles valid input, defaults, missing vars, and immutability.

```
 PASS  tests/config.test.js
  Config Loader
    ✓ should load config when all required env vars are set
    ✓ should use default values for optional settings
    ✓ should throw when OPENAI_API_KEY is missing
    ✓ should throw when FLIPLET_API_TOKEN is missing
    ✓ should throw when FLIPLET_APP_ID is missing
    ✓ should return a frozen (immutable) config object

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

## Git

Initialized repo with one commit: `feat: initial project scaffolding`

## Next

Step 2 will define the Fliplet tool schemas — the JSON definitions that tell the AI model what Fliplet API operations it can call (list data sources, get files, etc.), built test-first with TDD.
