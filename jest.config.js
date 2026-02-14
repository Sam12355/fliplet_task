/** @type {import('jest').Config} */
module.exports = {
  // Use Node test environment (not browser)
  testEnvironment: 'node',

  // Look for tests in the tests/ directory
  testMatch: ['<rootDir>/tests/**/*.test.js'],

  // Collect coverage from src/ files
  collectCoverageFrom: ['src/**/*.js'],

  // Clear mocks between tests for isolation
  clearMocks: true,

  // Show verbose output for better debugging
  verbose: true,
};
