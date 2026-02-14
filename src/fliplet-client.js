/**
 * Fliplet API Client
 *
 * HTTP wrapper around the Fliplet REST API. Each public method
 * maps to one tool definition from tools.js.
 *
 * Best practices applied:
 * - Single Responsibility: only handles Fliplet HTTP communication
 * - Dependency Injection: fetch is injectable for easy testing
 * - DRY: shared _request() handles auth, headers, error parsing
 * - Fail Fast: validates required params before making HTTP calls
 * - Custom Error Class: FlipletApiError carries status + response body
 */

// ---------------------------------------------------------------
// Custom error class for Fliplet API failures
// ---------------------------------------------------------------

/**
 * Represents an error returned by the Fliplet REST API.
 * Extends Error with HTTP status code and response body for debugging.
 */
class FlipletApiError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {number} statusCode - HTTP status code (e.g. 401, 404, 500)
   * @param {object} responseBody - Parsed JSON body from the error response
   */
  constructor(message, statusCode, responseBody) {
    super(message);
    this.name = 'FlipletApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

// ---------------------------------------------------------------
// Fliplet API Client class
// ---------------------------------------------------------------

class FlipletApiClient {
  /**
   * Create a new Fliplet API client.
   *
   * @param {object} config - App configuration (from loadConfig())
   * @param {string} config.flipletApiUrl - Base URL (e.g. https://api.fliplet.com)
   * @param {string} config.flipletApiToken - Auth token for Fliplet API
   * @param {string} config.flipletAppId - The Fliplet app ID to query
   * @param {Function} [fetchFn=global.fetch] - Fetch implementation (injectable for testing)
   */
  constructor(config, fetchFn) {
    // Fail fast if config is missing
    if (!config) {
      throw new Error('FlipletApiClient requires a config object');
    }

    // Store config values as instance properties
    this.baseUrl = config.flipletApiUrl;
    this.token = config.flipletApiToken;
    this.appId = config.flipletAppId;

    // Use injected fetch or fall back to global (Node 18+ built-in)
    this._fetch = fetchFn || global.fetch;
  }

  // ---------------------------------------------------------------
  // Private: shared HTTP request method
  // ---------------------------------------------------------------

  /**
   * Make an authenticated HTTP request to the Fliplet API.
   *
   * @param {string} path - API path (e.g. '/v1/data-sources?appId=123')
   * @param {string} [method='GET'] - HTTP method
   * @param {object} [body=null] - Request body (will be JSON-stringified)
   * @returns {Promise<object>} Parsed JSON response
   * @throws {FlipletApiError} If the response status is not OK (2xx)
   */
  async _request(path, method = 'GET', body = null) {
    // Build the full URL by combining base URL and path
    const url = `${this.baseUrl}${path}`;

    // Set a 30-second timeout to prevent hanging requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    // Configure request options with auth and content headers
    const options = {
      method,
      headers: {
        'Auth-token': this.token,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };

    // Attach body for POST/PUT/PATCH requests
    if (body) {
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      // Execute the HTTP request
      response = await this._fetch(url, options);
    } catch (fetchError) {
      clearTimeout(timeout);
      // Translate AbortError into a user-friendly timeout message
      if (fetchError.name === 'AbortError') {
        throw new FlipletApiError('Fliplet API request timed out after 30 seconds', 0, {});
      }
      throw fetchError;
    }

    clearTimeout(timeout);

    // Parse response body (safely handle non-JSON responses like HTML error pages)
    let data;
    try {
      data = await response.json();
    } catch {
      throw new FlipletApiError(
        `Fliplet API returned non-JSON response: ${response.status} ${response.statusText} — ${url}`,
        response.status,
        {}
      );
    }

    // Throw custom error for non-2xx responses
    if (!response.ok) {
      throw new FlipletApiError(
        `Fliplet API error: ${response.status} ${response.statusText} — ${url}`,
        response.status,
        data
      );
    }

    return data;
  }

  // ---------------------------------------------------------------
  // Public: Data Sources
  // ---------------------------------------------------------------

  /**
   * List all data sources belonging to the configured app.
   * Maps to tool: list_data_sources
   *
   * @returns {Promise<Array>} Array of data source objects
   */
  async listDataSources() {
    const data = await this._request(`/v1/data-sources?appId=${this.appId}`);
    // Fliplet wraps result in { dataSources: [...] }
    return data.dataSources;
  }

  /**
   * Get detailed info about a specific data source.
   * Maps to tool: get_data_source
   *
   * @param {number} dataSourceId - The data source ID
   * @returns {Promise<object>} Data source object
   * @throws {Error} If dataSourceId is not provided
   */
  async getDataSource(dataSourceId) {
    // Validate required parameter
    if (dataSourceId === undefined || dataSourceId === null) {
      throw new Error('getDataSource() requires a dataSourceId');
    }

    const data = await this._request(`/v1/data-sources/${dataSourceId}`);
    // Fliplet wraps result in { dataSource: {...} }
    return data.dataSource;
  }

  /**
   * Query entries from a data source with optional filters.
   * Maps to tool: get_data_source_entries
   *
   * @param {number} dataSourceId - The data source ID to query
   * @param {object} [options={}] - Query options
   * @param {object} [options.where] - Filter conditions (MongoDB-style)
   * @param {number} [options.limit] - Max entries to return
   * @param {number} [options.offset] - Entries to skip (pagination)
   * @returns {Promise<Array>} Array of entry objects
   * @throws {Error} If dataSourceId is not provided
   */
  async getDataSourceEntries(dataSourceId, options = {}) {
    // Validate required parameter
    if (dataSourceId === undefined || dataSourceId === null) {
      throw new Error('getDataSourceEntries() requires a dataSourceId');
    }

    // Build the query body matching Fliplet's POST /data/query format
    const body = { type: 'select' };

    // Only include optional fields if they were provided
    if (options.where) body.where = options.where;
    if (options.limit !== undefined) body.limit = options.limit;
    if (options.offset !== undefined) body.offset = options.offset;

    const data = await this._request(
      `/v1/data-sources/${dataSourceId}/data/query`,
      'POST',
      body
    );

    // Fliplet wraps result in { entries: [...] }
    return data.entries;
  }

  // ---------------------------------------------------------------
  // Public: Media / Files
  // ---------------------------------------------------------------

  /**
   * List media files and folders for the configured app.
   * Maps to tool: list_media
   *
   * @param {number} [folderId] - Optional folder ID to browse into
   * @returns {Promise<{folders: Array, files: Array}>} Folders and files
   */
  async listMedia(folderId) {
    // Build query string — always include appId
    let path = `/v1/media?appId=${this.appId}`;

    // Optionally filter by folder
    if (folderId !== undefined && folderId !== null) {
      path += `&folderId=${folderId}`;
    }

    const data = await this._request(path);

    // Return both folders and files as-is from Fliplet's response
    return { folders: data.folders, files: data.files };
  }

  /**
   * Get metadata for a specific media file.
   * Maps to tool: get_media_file
   *
   * @param {number} fileId - The file ID to retrieve
   * @returns {Promise<object>} File metadata object
   * @throws {Error} If fileId is not provided
   */
  async getMediaFile(fileId) {
    // Validate required parameter
    if (fileId === undefined || fileId === null) {
      throw new Error('getMediaFile() requires a fileId');
    }

    const data = await this._request(`/v1/media/files/${fileId}`);
    // Fliplet wraps result in { file: {...} }
    return data.file;
  }
}

module.exports = { FlipletApiClient, FlipletApiError };
