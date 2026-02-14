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

const server = app.listen(PORT, () => {
  console.log(`Fliplet AI Chatbot server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// ---------------------------------------------------------------
// Graceful shutdown — drain in-flight requests on SIGTERM / SIGINT
// ---------------------------------------------------------------

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  sessionManager.stopCleanup();
  server.close(() => {
    console.log('Server closed. Goodbye!');
    process.exit(0);
  });
  // Force exit after 10 seconds if connections don't drain
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
