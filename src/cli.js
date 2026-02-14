/**
 * CLI Module
 *
 * Provides the factory function to wire up all components and
 * formatting helpers for the terminal interface.
 *
 * Separated from index.js so the wiring logic is testable
 * without triggering the readline loop.
 *
 * Best practices applied:
 * - Factory Pattern: createApp() wires all dependencies in one place
 * - Separation of Concerns: wiring logic is testable, REPL loop is in index.js
 * - Single Source of Truth: all component creation happens here
 */

const OpenAI = require('openai');
const { FlipletApiClient } = require('./fliplet-client');
const { ToolExecutor } = require('./tool-executor');
const { ChatEngine } = require('./chat-engine');
const { tools } = require('./tools');

// ---------------------------------------------------------------
// Factory: wire up all components from config
// ---------------------------------------------------------------

/**
 * Create and wire all application components from a config object.
 *
 * This is the composition root — the single place where dependencies
 * are assembled. Makes the app easy to test and modify.
 *
 * @param {object} config - Validated config from loadConfig()
 * @returns {{ chatEngine: ChatEngine, flipletClient: FlipletApiClient, toolExecutor: ToolExecutor }}
 */
function createApp(config) {
  // 1. Create OpenAI client with the user's API key
  const openai = new OpenAI({ apiKey: config.openaiApiKey });

  // 2. Create Fliplet API client for HTTP calls
  const flipletClient = new FlipletApiClient(config);

  // 3. Create tool executor to bridge AI calls → API client
  const toolExecutor = new ToolExecutor(flipletClient);

  // 4. Create chat engine — the conversation orchestrator
  const chatEngine = new ChatEngine({
    openai,
    toolExecutor,
    tools,
    model: config.openaiModel,
  });

  return { chatEngine, flipletClient, toolExecutor };
}

// ---------------------------------------------------------------
// Formatting helpers for terminal output
// ---------------------------------------------------------------

/**
 * Format the welcome message shown at startup.
 *
 * @param {string} appId - The Fliplet app ID being queried
 * @returns {string} Formatted welcome message
 */
function formatWelcome(appId) {
  return [
    '',
    '╔══════════════════════════════════════════════════╗',
    '║           Fliplet AI Chatbot                    ║',
    '╚══════════════════════════════════════════════════╝',
    '',
    `  Connected to Fliplet App ID: ${appId}`,
    '',
    '  Ask me anything about your app\'s data sources',
    '  and files. I\'ll query the Fliplet API for you.',
    '',
    '  Commands:',
    '    exit / quit  — End the session',
    '    reset        — Clear conversation history',
    '',
  ].join('\n');
}

/**
 * Format an error message for terminal display.
 *
 * @param {Error} error - The error to format
 * @returns {string} Formatted error string
 */
function formatError(error) {
  return `\n  ❌ Error: ${error.message || 'An unknown error occurred'}\n`;
}

module.exports = { createApp, formatWelcome, formatError };
