/**
 * Tool Executor
 *
 * Bridges AI tool calls to FlipletApiClient methods.
 * When the AI decides to call a tool, this class:
 * 1. Looks up the tool name in a dispatch map
 * 2. Extracts and forwards the correct arguments
 * 3. Returns the result (or a structured error) to feed back to the AI
 *
 * Best practices applied:
 * - Strategy Pattern: dispatch map instead of long if/else chains
 * - Error Boundary: catches API errors and returns them as data
 *   (so the AI can read the error and adjust its approach)
 * - Single Responsibility: only maps names → calls, no HTTP logic
 */

class ToolExecutor {
  /**
   * Create a new ToolExecutor.
   *
   * @param {object} client - An instance of FlipletApiClient
   * @throws {Error} If client is not provided
   */
  constructor(client) {
    if (!client) {
      throw new Error('ToolExecutor requires a FlipletApiClient');
    }

    // Store client reference for method calls
    this.client = client;

    // Dispatch map: tool name → handler function
    // Each handler receives parsed arguments and returns the API result
    this._handlers = {
      list_data_sources: () => this.client.listDataSources(),

      get_data_source: (args) => this.client.getDataSource(args.dataSourceId),

      get_data_source_entries: (args) => {
        // Separate dataSourceId from the rest (which are query options)
        const { dataSourceId, ...options } = args;
        return this.client.getDataSourceEntries(dataSourceId, options);
      },

      list_media: (args) => this.client.listMedia(args.folderId),

      get_media_file: (args) => this.client.getMediaFile(args.fileId),
    };
  }

  /**
   * Execute a tool call by name with the given arguments.
   *
   * Returns the API result on success, or a structured error object
   * on failure. Never throws — errors are returned as data so the AI
   * can read them and decide how to proceed.
   *
   * @param {string} toolName - The tool function name (e.g. 'list_data_sources')
   * @param {object} args - The parsed arguments from the AI's tool call
   * @returns {Promise<object>} The API result or an error object
   * @throws {Error} Only if tool name is unknown (programmer error, not API error)
   */
  async execute(toolName, args) {
    // Look up the handler for this tool name
    const handler = this._handlers[toolName];

    // Unknown tool = programmer error, throw immediately
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    try {
      // Execute the handler and return the API result
      return await handler(args);
    } catch (error) {
      // Catch API errors and return as structured data for the AI
      return this._formatError(error);
    }
  }

  /**
   * Convert an error into a structured object the AI can understand.
   *
   * @param {Error} error - The caught error
   * @returns {object} Structured error with message and optional details
   * @private
   */
  _formatError(error) {
    const result = {
      error: true,
      message: error.message,
    };

    // Include extra info if it's a Fliplet API error
    if (error.name === 'FlipletApiError') {
      result.statusCode = error.statusCode;
      result.details = error.responseBody;
    }

    return result;
  }
}

module.exports = { ToolExecutor };
