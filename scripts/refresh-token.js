/**
 * Token Refresh Script
 *
 * Fliplet session tokens (obtained via login) can expire after
 * a period of inactivity. Run this script to get a fresh token
 * and update the .env file automatically.
 *
 * Usage:
 *   node scripts/refresh-token.js
 *
 * You will be prompted for your Fliplet email and password.
 * The script will:
 *   1. Authenticate against the Fliplet REST API
 *   2. Receive a new session auth token
 *   3. Update FLIPLET_API_TOKEN in .env
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FLIPLET_API_URL = 'https://api.fliplet.com';
const ENV_PATH = path.resolve(__dirname, '..', '.env');

/**
 * Prompt the user for input (hides password characters).
 *
 * @param {string} question - The prompt text
 * @param {boolean} [hidden=false] - Whether to hide input (for passwords)
 * @returns {Promise<string>}
 */
function prompt(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      // Mute output for password entry
      process.stdout.write(question);
      const stdin = process.openStdin();
      let password = '';
      const onData = (char) => {
        char = char.toString();
        if (char === '\n' || char === '\r' || char === '\r\n') {
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(password);
        } else if (char === '\u0003') {
          // Ctrl+C
          process.exit();
        } else if (char === '\u007F' || char === '\b') {
          // Backspace
          password = password.slice(0, -1);
        } else {
          password += char;
          process.stdout.write('*');
        }
      };
      stdin.setRawMode(true);
      stdin.resume();
      stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

/**
 * Authenticate with Fliplet and return the new auth token.
 */
async function login(email, password) {
  const res = await fetch(`${FLIPLET_API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Login failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.auth_token;
}

/**
 * Update FLIPLET_API_TOKEN in the .env file.
 */
function updateEnvFile(newToken) {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`.env file not found at ${ENV_PATH}`);
  }

  let content = fs.readFileSync(ENV_PATH, 'utf-8');

  if (content.includes('FLIPLET_API_TOKEN=')) {
    content = content.replace(
      /FLIPLET_API_TOKEN=.*/,
      `FLIPLET_API_TOKEN=${newToken}`
    );
  } else {
    content += `\nFLIPLET_API_TOKEN=${newToken}\n`;
  }

  fs.writeFileSync(ENV_PATH, content, 'utf-8');
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------

async function main() {
  console.log('=== Fliplet Token Refresh ===\n');

  const email = await prompt('Fliplet email: ');
  const password = await prompt('Fliplet password: ', true);

  console.log('\nAuthenticating...');

  try {
    const token = await login(email, password);
    console.log(`\nNew token: ${token.substring(0, 20)}...`);

    updateEnvFile(token);
    console.log('Updated .env file with new FLIPLET_API_TOKEN.');

    // Verify token works
    console.log('\nVerifying token...');
    const verifyRes = await fetch(`${FLIPLET_API_URL}/v1/user`, {
      headers: { 'Auth-token': token },
    });

    if (verifyRes.ok) {
      const user = await verifyRes.json();
      console.log(`Authenticated as: ${user.user?.fullName || user.user?.email || 'OK'}`);
      console.log('\nToken refreshed successfully! You can now start the server.');
    } else {
      console.warn('Warning: Token verification returned non-OK status.');
    }
  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }
}

main();
