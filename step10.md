# Step 10 — Frontend Testing (Vitest + React Testing Library)

## Goal
Add comprehensive frontend tests matching the TDD discipline used in the backend, ensuring UI components and the API service layer work correctly.

## Tech Stack
| Tool | Purpose |
|------|---------|
| Vitest | Fast test runner, native Vite integration |
| React Testing Library (RTL) | Renders components, queries by accessible roles/labels |
| @testing-library/jest-dom | Extra matchers: `toBeInTheDocument`, `toBeDisabled` |
| @testing-library/user-event | Simulates real user interactions (typing, clicking) |
| jsdom | Browser environment for running tests in Node |

## Test Files & Coverage

| File | Tests | What's tested |
|------|-------|---------------|
| `services/api.test.js` | 9 | sendMessage (4), resetSession (2), checkHealth (3) — fetch mocking |
| `components/ChatMessage.test.jsx` | 5 | User/AI bubbles, Markdown rendering, bold/lists, ARIA |
| `components/MessageInput.test.jsx` | 7 | Typing, Enter send, clearing, disabled state, placeholder |
| `components/MessageList.test.jsx` | 7 | Empty state, messages, typing indicator, scroll, ARIA role |
| `components/TypingIndicator.test.jsx` | 3 | Status role, 3 dots, AI avatar |
| `App.test.jsx` | 9 | Full flow: send → response, optimistic UI, error banner, reset, session persistence |
| **Total frontend** | **40** | |
| **Total project** | **167** | 127 backend + 40 frontend |

## Testing Patterns Demonstrated

### 1. User-Centric Queries (RTL best practice)
```jsx
screen.getByLabelText('Message input')   // Accessibility-first
screen.getByRole('status', { name: /thinking/i })
screen.getByText('Ask me anything')
```

### 2. User Event Simulation
```jsx
const user = userEvent.setup();
await user.type(input, 'Hello');
await user.click(sendButton);
```

### 3. Fetch Mocking (API tests)
```js
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ response: 'Hello!' }),
});
```

### 4. Module Mocking (App integration)
```js
vi.mock('./services/api', () => ({
  sendMessage: vi.fn(),
  resetSession: vi.fn(),
}));
```

### 5. Optimistic UI Testing
```jsx
sendMessage.mockReturnValue(new Promise(() => {})); // Never resolves
await user.type(input, 'Hello');
await user.click(sendButton);
expect(screen.getByText('Hello')).toBeInTheDocument(); // Appears immediately
```

## Running Tests

```bash
# Frontend tests
cd frontend && npm test        # Single run
cd frontend && npm run test:watch  # Watch mode

# Backend tests
npm test                       # From project root

# Both
npm test && cd frontend && npm test
```

## Test Results
```
Frontend: 6 test files, 40 tests passed
Backend:  9 test files, 127 tests passed
Total:    167 tests, all green ✓
```
