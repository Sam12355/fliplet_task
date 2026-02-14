/**
 * Config Loader — Unit Tests
 *
 * Verifies that configuration loads correctly and
 * throws on missing required environment variables.
 */

describe('Config Loader', () => {
  // Store original env so we can restore after each test
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules so dotenv re-evaluates
    jest.resetModules();
    // Clone env to avoid cross-test pollution
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  test('should load config when all required env vars are set', () => {
    // Arrange — set all required variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.FLIPLET_API_TOKEN = 'test-fliplet-token';
    process.env.FLIPLET_APP_ID = '12345';

    // Act
    const { loadConfig } = require('../src/config');
    const config = loadConfig();

    // Assert
    expect(config.openaiApiKey).toBe('test-openai-key');
    expect(config.flipletApiToken).toBe('test-fliplet-token');
    expect(config.flipletAppId).toBe('12345');
  });

  test('should use default values for optional settings', () => {
    // Arrange
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.FLIPLET_API_TOKEN = 'test-token';
    process.env.FLIPLET_APP_ID = '123';

    // Act
    const { loadConfig } = require('../src/config');
    const config = loadConfig();

    // Assert — defaults should kick in
    expect(config.openaiModel).toBe('gpt-4o-mini');
    expect(config.flipletApiUrl).toBe('https://api.fliplet.com');
  });

  test('should throw when OPENAI_API_KEY is missing', () => {
    // Arrange — omit OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY;
    process.env.FLIPLET_API_TOKEN = 'test-token';
    process.env.FLIPLET_APP_ID = '123';

    // Act & Assert
    const { loadConfig } = require('../src/config');
    expect(() => loadConfig()).toThrow('Missing required environment variables');
  });

  test('should throw when FLIPLET_API_TOKEN is missing', () => {
    // Arrange
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.FLIPLET_API_TOKEN;
    process.env.FLIPLET_APP_ID = '123';

    // Act & Assert
    const { loadConfig } = require('../src/config');
    expect(() => loadConfig()).toThrow('Missing required environment variables');
  });

  test('should throw when FLIPLET_APP_ID is missing', () => {
    // Arrange
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.FLIPLET_API_TOKEN = 'test-token';
    delete process.env.FLIPLET_APP_ID;

    // Act & Assert
    const { loadConfig } = require('../src/config');
    expect(() => loadConfig()).toThrow('Missing required environment variables');
  });

  test('should return a frozen (immutable) config object', () => {
    // Arrange
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.FLIPLET_API_TOKEN = 'test-token';
    process.env.FLIPLET_APP_ID = '123';

    // Act
    const { loadConfig } = require('../src/config');
    const config = loadConfig();

    // Assert — attempting to modify should throw in strict mode
    expect(Object.isFrozen(config)).toBe(true);
  });
});
