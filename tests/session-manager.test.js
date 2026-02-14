/**
 * Session Manager — Unit Tests (TDD)
 *
 * The SessionManager creates and maintains per-session ChatEngine
 * instances so multiple users can chat concurrently without
 * sharing conversation history.
 */

const { SessionManager } = require('../src/session-manager');

// ---------------------------------------------------------------
// Mock factory function
// ---------------------------------------------------------------

function mockEngineFactory() {
  return {
    chat: jest.fn(),
    reset: jest.fn(),
    getHistory: jest.fn().mockReturnValue([]),
  };
}

// ---------------------------------------------------------------
// Tests
// ---------------------------------------------------------------

describe('SessionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new SessionManager(mockEngineFactory);
  });

  test('should throw if no factory function is provided', () => {
    expect(() => new SessionManager()).toThrow('factory function');
  });

  test('should create a new engine for a new session ID', () => {
    const engine = manager.getOrCreate('session-1');
    expect(engine).toBeDefined();
    expect(engine).toHaveProperty('chat');
  });

  test('should return the same engine for the same session ID', () => {
    const engine1 = manager.getOrCreate('session-1');
    const engine2 = manager.getOrCreate('session-1');
    expect(engine1).toBe(engine2);
  });

  test('should return different engines for different session IDs', () => {
    const engine1 = manager.getOrCreate('session-1');
    const engine2 = manager.getOrCreate('session-2');
    expect(engine1).not.toBe(engine2);
  });

  test('has() should return true for existing sessions', () => {
    manager.getOrCreate('session-1');
    expect(manager.has('session-1')).toBe(true);
  });

  test('has() should return false for unknown sessions', () => {
    expect(manager.has('unknown')).toBe(false);
  });

  test('destroy() should remove a session', () => {
    manager.getOrCreate('session-1');
    manager.destroy('session-1');
    expect(manager.has('session-1')).toBe(false);
  });

  test('destroy() should not throw for unknown sessions', () => {
    expect(() => manager.destroy('unknown')).not.toThrow();
  });

  test('should create a new engine after a session is destroyed', () => {
    const engine1 = manager.getOrCreate('session-1');
    manager.destroy('session-1');
    const engine2 = manager.getOrCreate('session-1');
    expect(engine2).not.toBe(engine1);
  });

  test('generateId() should return a non-empty string', () => {
    const id = manager.generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('generateId() should return unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => manager.generateId()));
    expect(ids.size).toBe(100);
  });
});
