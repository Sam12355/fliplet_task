/**
 * CLI Application — Unit Tests (TDD)
 *
 * Tests the CLI factory function and formatting helpers.
 * The interactive readline loop is tested separately via manual testing,
 * but the wiring and formatting logic can be unit-tested.
 */

const { createApp, formatWelcome, formatError } = require('../src/cli');

// ---------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------

function createMockConfig() {
  return {
    openaiApiKey: 'test-key',
    openaiModel: 'gpt-4o-mini',
    flipletApiToken: 'test-token',
    flipletAppId: '12345',
    flipletApiUrl: 'https://api.fliplet.com',
  };
}

describe('CLI Module', () => {
  // ---------------------------------------------------------------
  // createApp factory
  // ---------------------------------------------------------------

  describe('createApp()', () => {
    test('should return an object with chatEngine property', () => {
      const app = createApp(createMockConfig());
      expect(app).toHaveProperty('chatEngine');
    });

    test('should return an object with flipletClient property', () => {
      const app = createApp(createMockConfig());
      expect(app).toHaveProperty('flipletClient');
    });

    test('should return an object with toolExecutor property', () => {
      const app = createApp(createMockConfig());
      expect(app).toHaveProperty('toolExecutor');
    });

    test('should throw if config is missing', () => {
      expect(() => createApp()).toThrow();
    });

    test('should use the model from config', () => {
      const config = createMockConfig();
      config.openaiModel = 'gpt-4o';
      const app = createApp(config);
      expect(app.chatEngine.model).toBe('gpt-4o');
    });
  });

  // ---------------------------------------------------------------
  // formatWelcome
  // ---------------------------------------------------------------

  describe('formatWelcome()', () => {
    test('should include the app ID', () => {
      const msg = formatWelcome('12345');
      expect(msg).toContain('12345');
    });

    test('should include usage instructions', () => {
      const msg = formatWelcome('12345');
      // Should tell user how to exit
      const lower = msg.toLowerCase();
      expect(lower).toMatch(/exit|quit/);
    });

    test('should be a non-empty string', () => {
      const msg = formatWelcome('99');
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------
  // formatError
  // ---------------------------------------------------------------

  describe('formatError()', () => {
    test('should include the error message', () => {
      const output = formatError(new Error('Something broke'));
      expect(output).toContain('Something broke');
    });

    test('should prefix with an error indicator', () => {
      const output = formatError(new Error('fail'));
      // Should start with some kind of error prefix
      expect(output).toMatch(/error|Error|❌|⚠/i);
    });

    test('should handle errors without a message gracefully', () => {
      const output = formatError(new Error());
      expect(typeof output).toBe('string');
    });
  });
});
