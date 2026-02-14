/**
 * Configuration Loader
 *
 * Loads and validates environment variables required by the chatbot.
 * Uses dotenv to read from .env file in development.
 */

const path = require('path');

// Load .env file from project root
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Validated application configuration.
 * Throws on missing required values to fail fast.
 */
function loadConfig() {
  const config = {
    // OpenAI settings
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',

    // Fliplet settings
    flipletApiToken: process.env.FLIPLET_API_TOKEN,
    flipletAppId: process.env.FLIPLET_APP_ID,
    flipletApiUrl: process.env.FLIPLET_API_URL || 'https://api.fliplet.com',
  };

  // Validate required fields
  const required = ['openaiApiKey', 'flipletApiToken', 'flipletAppId'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in your values.'
    );
  }

  return Object.freeze(config); // Immutable config object
}

module.exports = { loadConfig };
