/**
 * API Service — Unit Tests
 *
 * Tests the HTTP abstraction layer that talks to the backend.
 * Uses vi.fn() to mock the global fetch function so no real
 * network requests are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage, resetSession, checkHealth } from '../services/api';

// ---------------------------------------------------------------
// Mock fetch globally before each test
// ---------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
});

// Helper: mock a successful JSON response
function mockFetchOk(data) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

// Helper: mock a failed response
function mockFetchFail(status, errorBody = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(errorBody),
  });
}

// ---------------------------------------------------------------
// sendMessage()
// ---------------------------------------------------------------

describe('sendMessage', () => {
  it('should POST to /api/chat with message and sessionId', async () => {
    mockFetchOk({ response: 'Hello!', sessionId: 'sess-1' });

    const result = await sendMessage('Hi', 'sess-1');

    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hi', sessionId: 'sess-1' }),
    });
    expect(result).toEqual({ response: 'Hello!', sessionId: 'sess-1' });
  });

  it('should omit sessionId from body when null', async () => {
    mockFetchOk({ response: 'Hello!', sessionId: 'new-id' });

    await sendMessage('Hi', null);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual({ message: 'Hi' });
    expect(body).not.toHaveProperty('sessionId');
  });

  it('should throw on non-OK response with error message', async () => {
    mockFetchFail(400, { error: 'Message is required' });

    await expect(sendMessage('')).rejects.toThrow('Message is required');
  });

  it('should throw generic error when response has no error field', async () => {
    mockFetchFail(500, {});

    await expect(sendMessage('Hi')).rejects.toThrow('Request failed with status 500');
  });
});

// ---------------------------------------------------------------
// resetSession()
// ---------------------------------------------------------------

describe('resetSession', () => {
  it('should POST to /api/reset with sessionId', async () => {
    mockFetchOk({ success: true });

    const result = await resetSession('sess-1');

    expect(global.fetch).toHaveBeenCalledWith('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sess-1' }),
    });
    expect(result).toEqual({ success: true });
  });

  it('should throw on failure', async () => {
    mockFetchFail(400, { error: 'sessionId required' });

    await expect(resetSession()).rejects.toThrow('sessionId required');
  });
});

// ---------------------------------------------------------------
// checkHealth()
// ---------------------------------------------------------------

describe('checkHealth', () => {
  it('should return true when backend is healthy', async () => {
    mockFetchOk({ status: 'ok' });

    const result = await checkHealth();

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/health');
  });

  it('should return false when backend returns unexpected response', async () => {
    mockFetchOk({ status: 'error' });

    const result = await checkHealth();

    expect(result).toBe(false);
  });

  it('should return false when fetch throws (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await checkHealth();

    expect(result).toBe(false);
  });
});
