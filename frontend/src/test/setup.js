/**
 * Vitest Test Setup
 *
 * Runs before every test file. Extends expect() with
 * DOM-specific matchers from @testing-library/jest-dom
 * (e.g. toBeInTheDocument, toHaveTextContent, toBeDisabled).
 */

import '@testing-library/jest-dom';

// jsdom doesn't implement scrollIntoView — mock it globally
Element.prototype.scrollIntoView = () => {};
