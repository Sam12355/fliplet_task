/**
 * Fliplet AI Chatbot — Entry Point
 *
 * Interactive CLI chatbot that uses OpenAI tool calling
 * to query Fliplet REST API for data sources and files.
 *
 * Usage: node src/index.js
 *
 * This file only contains the readline REPL loop.
 * All wiring and formatting logic is in cli.js (testable).
 */

const readline = require('readline');
const { loadConfig } = require('./config');
const { createApp, formatWelcome, formatError } = require('./cli');

// ---------------------------------------------------------------
// Main: start the interactive REPL
// ---------------------------------------------------------------

async function main() {
  // 1. Load and validate configuration
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(formatError(err));
    console.error('  Tip: Copy .env.example to .env and fill in your values.\n');
    process.exit(1);
  }

  // 2. Wire up all components
  const { chatEngine } = createApp(config);

  // 3. Show welcome message
  console.log(formatWelcome(config.flipletAppId));

  // 4. Create readline interface for interactive input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '  You: ',
  });

  // 5. Show the initial prompt
  rl.prompt();

  // 6. Handle each line of user input
  rl.on('line', async (line) => {
    const input = line.trim();

    // Skip empty input
    if (!input) {
      rl.prompt();
      return;
    }

    // Handle special commands
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\n  Goodbye! 👋\n');
      rl.close();
      return;
    }

    if (input.toLowerCase() === 'reset') {
      chatEngine.reset();
      console.log('\n  🔄 Conversation history cleared.\n');
      rl.prompt();
      return;
    }

    // Send to chat engine and display response
    try {
      // Show a thinking indicator
      process.stdout.write('\n  AI: Thinking...');

      const response = await chatEngine.chat(input);

      // Clear the "Thinking..." text and show the response
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(`\n  AI: ${response}\n`);
    } catch (err) {
      console.error(formatError(err));
    }

    rl.prompt();
  });

  // 7. Handle close event
  rl.on('close', () => {
    process.exit(0);
  });
}

// Run the app
main();
