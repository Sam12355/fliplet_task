# Step 9 — Frontend Chat UI (React + Vite + Tailwind)

## Goal
Build a professional chat interface that connects to the Express backend from Step 8, providing a browser-based way to interact with the AI chatbot.

## Tech Stack
| Technology | Version | Why |
|------------|---------|-----|
| React | 18 | Component model, hooks, industry standard |
| Vite | 5 | Fast dev server, HMR, modern build tooling |
| Tailwind CSS | 3 | Utility-first CSS, rapid styling, responsive |
| react-markdown | 9 | Render AI responses as formatted Markdown |

## Architecture

```
frontend/
├── index.html                 # Entry HTML (Vite root)
├── vite.config.js             # Dev proxy + React plugin
├── tailwind.config.js         # Custom Fliplet-inspired colors
├── postcss.config.js          # PostCSS + Tailwind + Autoprefixer
├── package.json               # Frontend-specific deps & scripts
└── src/
    ├── main.jsx               # React DOM mount point
    ├── App.jsx                # Root component — all state lives here
    ├── index.css              # Tailwind directives + custom styles
    ├── services/
    │   └── api.js             # HTTP client (sendMessage, resetSession, checkHealth)
    └── components/
        ├── ChatWindow.jsx     # Layout: header + messages + input
        ├── MessageList.jsx    # Scrollable message container + empty state
        ├── ChatMessage.jsx    # Single message bubble (user/AI)
        ├── MessageInput.jsx   # Textarea + send button
        └── TypingIndicator.jsx # Animated dots while AI thinks
```

## Component Tree
```
App (state: messages, sessionId, isLoading, error)
 └── ChatWindow
      ├── Header (title + "New chat" reset button)
      ├── Error banner (conditional)
      ├── MessageList
      │    ├── Empty state (when no messages)
      │    ├── ChatMessage × N (user & AI bubbles)
      │    ├── TypingIndicator (when loading)
      │    └── Auto-scroll anchor
      └── MessageInput (textarea + send button)
```

## Frontend Best Practices Applied
- **State lifted to App** — single source of truth, passed down as props
- **Optimistic UI** — user message appears instantly before server responds
- **Controlled inputs** — textarea value managed via `useState`
- **`useCallback`** — stable handler references prevent unnecessary re-renders
- **`useRef` + `useEffect`** — imperative auto-scroll when messages change
- **Responsive design** — max-w-2xl container, works on mobile and desktop
- **Accessibility** — `role="list"`, `role="alert"`, `aria-label` on interactive elements, semantic `<header>`, `<main>`
- **Keyboard support** — Enter to send, Shift+Enter for newline
- **Error handling** — error banner with clear messaging, non-blocking reset failures
- **API abstraction** — `services/api.js` isolates HTTP logic from components
- **Dev proxy** — Vite forwards `/api/*` to `localhost:3000` so no CORS issues in dev
- **Markdown rendering** — AI responses display formatted lists, code blocks, bold text

## How to Run

```bash
# Terminal 1 — Start the backend
npm run start:server
# → http://localhost:3000

# Terminal 2 — Start the frontend dev server
npm run start:frontend
# → http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to the backend on port 3000, so the frontend and backend communicate seamlessly.

## Build for Production
```bash
npm run build:frontend
# → Output in frontend/dist/
```

## Test Results
```
Backend: 127 tests passing, 9 suites
Frontend: Builds successfully (✓ 199 modules transformed)
```
