/**
 * Server Entry Point
 *
 * Boots up the Express backend proxy on the configured port.
 * Wires together real dependencies: config, ChatEngine factory, SessionManager.
 *
 * Usage:
 *   node src/start-server.js
 *   npm run start:server
 */

const { loadConfig } = require('./config');
const { createApp } = require('./cli');
const { SessionManager } = require('./session-manager');
const { createServer } = require('./server');

// ---------------------------------------------------------------
// Composition root — assemble real dependencies
// ---------------------------------------------------------------

const config = loadConfig();

/** Factory that creates a real ChatEngine for each session */
function engineFactory() {
  const { chatEngine } = createApp(config);
  return chatEngine;
}

const sessionManager = new SessionManager(engineFactory);
const app = createServer({ sessionManager });

// ---------------------------------------------------------------
// Start listening
// ---------------------------------------------------------------

const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log(`Fliplet AI Chatbot server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
