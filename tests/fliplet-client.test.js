/**
 * Fliplet API Client — Unit Tests (TDD)
 *
 * Written BEFORE implementation. Uses mocked fetch to verify
 * correct HTTP calls without hitting real Fliplet servers.
 *
 * Mocking strategy:
 * - global.fetch is replaced with a Jest mock before each test
 * - Each test configures the mock to return a specific response
 * - Assertions verify URL, method, headers, and body sent
 */

const {
  FlipletApiClient,
  FlipletApiError,
} = require('../src/fliplet-client');

// ---------------------------------------------------------------
// Helpers — build a mock fetch response matching Fliplet's format
// ---------------------------------------------------------------

/**
 * Creates a mock Response object that fetch would return.
 *
 * @param {object} body - The JSON body to return
 * @param {number} status - HTTP status code (default 200)
 * @returns {Promise<Response>} A resolved promise with a mock Response
 */
function mockResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

// ---------------------------------------------------------------
// Test config — matches what loadConfig() produces
// ---------------------------------------------------------------
const TEST_CONFIG = Object.freeze({
  flipletApiUrl: 'https://api.fliplet.com',
  flipletApiToken: 'test-token-abc123',
  flipletAppId: '9999',
});

describe('FlipletApiClient', () => {
  let client;
  let mockFetch;

  beforeEach(() => {
    // Create a fresh mock fetch for each test (isolation)
    mockFetch = jest.fn();
    // Inject mock fetch via constructor (dependency injection)
    client = new FlipletApiClient(TEST_CONFIG, mockFetch);
  });

  // ---------------------------------------------------------------
  // Constructor tests
  // ---------------------------------------------------------------

  describe('constructor', () => {
    test('should store the base URL from config', () => {
      expect(client.baseUrl).toBe('https://api.fliplet.com');
    });

    test('should store the API token from config', () => {
      expect(client.token).toBe('test-token-abc123');
    });

    test('should store the app ID from config', () => {
      expect(client.appId).toBe('9999');
    });

    test('should throw if config is missing', () => {
      expect(() => new FlipletApiClient(null, mockFetch)).toThrow();
    });

    test('should use global fetch if none is injected', () => {
      // Should not throw even without second argument
      const c = new FlipletApiClient(TEST_CONFIG);
      expect(c).toBeDefined();
    });
  });

  // ---------------------------------------------------------------
  // _request() — shared HTTP method
  // ---------------------------------------------------------------

  describe('_request()', () => {
    test('should send Auth-token header on every request', async () => {
      mockFetch.mockReturnValue(mockResponse({ dataSources: [] }));

      await client._request('/v1/data-sources?appId=9999');

      // Verify the auth header was sent
      const callArgs = mockFetch.mock.calls[0];
      const url = callArgs[0];
      const options = callArgs[1];
      expect(url).toBe('https://api.fliplet.com/v1/data-sources?appId=9999');
      expect(options.headers['Auth-token']).toBe('test-token-abc123');
    });

    test('should send Content-Type: application/json header', async () => {
      mockFetch.mockReturnValue(mockResponse({ dataSources: [] }));

      await client._request('/v1/data-sources?appId=9999');

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    test('should default to GET method', async () => {
      mockFetch.mockReturnValue(mockResponse({}));

      await client._request('/v1/data-sources');

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe('GET');
    });

    test('should support POST method with JSON body', async () => {
      const body = { type: 'select', where: { status: 'Active' } };
      mockFetch.mockReturnValue(mockResponse({ entries: [] }));

      await client._request('/v1/data-sources/1/data/query', 'POST', body);

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(body);
    });

    test('should throw FlipletApiError on non-OK response', async () => {
      mockFetch.mockReturnValue(
        mockResponse({ error: 'Unauthorized' }, 401)
      );

      await expect(client._request('/v1/data-sources')).rejects.toThrow(
        FlipletApiError
      );
    });

    test('should include status code in FlipletApiError', async () => {
      mockFetch.mockReturnValue(
        mockResponse({ error: 'Not Found' }, 404)
      );

      try {
        await client._request('/v1/data-sources/99999');
        // Fail if no error thrown
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(FlipletApiError);
        expect(err.statusCode).toBe(404);
      }
    });

    test('should include response body in FlipletApiError', async () => {
      mockFetch.mockReturnValue(
        mockResponse({ error: 'Server Error' }, 500)
      );

      try {
        await client._request('/v1/data-sources');
        expect(true).toBe(false);
      } catch (err) {
        expect(err.responseBody).toBeDefined();
      }
    });
  });

  // ---------------------------------------------------------------
  // listDataSources()
  // ---------------------------------------------------------------

  describe('listDataSources()', () => {
    const MOCK_DATA_SOURCES = {
      dataSources: [
        { id: 1, name: 'Users', columns: ['email', 'name'] },
        { id: 2, name: 'Products', columns: ['title', 'price'] },
      ],
    };

    test('should call GET /v1/data-sources with appId', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_DATA_SOURCES));

      await client.listDataSources();

      const url = mockFetch.mock.calls[0][0];
      expect(url).toBe('https://api.fliplet.com/v1/data-sources?appId=9999');
    });

    test('should return the dataSources array from response', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_DATA_SOURCES));

      const result = await client.listDataSources();

      expect(result).toEqual(MOCK_DATA_SOURCES.dataSources);
    });
  });

  // ---------------------------------------------------------------
  // getDataSource()
  // ---------------------------------------------------------------

  describe('getDataSource()', () => {
    const MOCK_DATA_SOURCE = {
      dataSource: {
        id: 1,
        name: 'Users',
        columns: ['email', 'name'],
        encrypted: false,
      },
    };

    test('should call GET /v1/data-sources/:id', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_DATA_SOURCE));

      await client.getDataSource(1);

      const url = mockFetch.mock.calls[0][0];
      expect(url).toBe('https://api.fliplet.com/v1/data-sources/1');
    });

    test('should return the dataSource object from response', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_DATA_SOURCE));

      const result = await client.getDataSource(1);

      expect(result).toEqual(MOCK_DATA_SOURCE.dataSource);
    });

    test('should throw if dataSourceId is not provided', async () => {
      await expect(client.getDataSource()).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------
  // getDataSourceEntries()
  // ---------------------------------------------------------------

  describe('getDataSourceEntries()', () => {
    const MOCK_ENTRIES = {
      entries: [
        { id: 100, data: { email: 'john@example.com', name: 'John' } },
        { id: 101, data: { email: 'jane@example.com', name: 'Jane' } },
      ],
    };

    test('should call POST /v1/data-sources/:id/data/query', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_ENTRIES));

      await client.getDataSourceEntries(1);

      const url = mockFetch.mock.calls[0][0];
      const options = mockFetch.mock.calls[0][1];
      expect(url).toBe(
        'https://api.fliplet.com/v1/data-sources/1/data/query'
      );
      expect(options.method).toBe('POST');
    });

    test('should send default query body with type: select', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_ENTRIES));

      await client.getDataSourceEntries(1);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.type).toBe('select');
    });

    test('should include where clause when provided', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_ENTRIES));

      await client.getDataSourceEntries(1, {
        where: { email: 'john@example.com' },
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.where).toEqual({ email: 'john@example.com' });
    });

    test('should include limit and offset when provided', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_ENTRIES));

      await client.getDataSourceEntries(1, { limit: 10, offset: 20 });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.limit).toBe(10);
      expect(body.offset).toBe(20);
    });

    test('should return the entries array from response', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_ENTRIES));

      const result = await client.getDataSourceEntries(1);

      expect(result).toEqual(MOCK_ENTRIES.entries);
    });

    test('should throw if dataSourceId is not provided', async () => {
      await expect(client.getDataSourceEntries()).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------
  // listMedia()
  // ---------------------------------------------------------------

  describe('listMedia()', () => {
    const MOCK_MEDIA = {
      folders: [{ id: 10, name: 'Images' }],
      files: [
        {
          id: 20,
          name: 'logo.png',
          contentType: 'image/png',
          url: 'https://cdn.fliplet.com/apps/9999/logo.png',
        },
      ],
    };

    test('should call GET /v1/media with appId', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_MEDIA));

      await client.listMedia();

      const url = mockFetch.mock.calls[0][0];
      expect(url).toBe('https://api.fliplet.com/v1/media?appId=9999');
    });

    test('should include folderId when provided', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_MEDIA));

      await client.listMedia(10);

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('folderId=10');
      expect(url).toContain('appId=9999');
    });

    test('should return both folders and files from response', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_MEDIA));

      const result = await client.listMedia();

      expect(result.folders).toEqual(MOCK_MEDIA.folders);
      expect(result.files).toEqual(MOCK_MEDIA.files);
    });
  });

  // ---------------------------------------------------------------
  // getMediaFile()
  // ---------------------------------------------------------------

  describe('getMediaFile()', () => {
    const MOCK_FILE = {
      file: {
        id: 20,
        name: 'logo.png',
        contentType: 'image/png',
        url: 'https://cdn.fliplet.com/apps/9999/logo.png',
        size: [500, 375],
      },
    };

    test('should call GET /v1/media/files/:id', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_FILE));

      await client.getMediaFile(20);

      const url = mockFetch.mock.calls[0][0];
      expect(url).toBe('https://api.fliplet.com/v1/media/files/20');
    });

    test('should return the file object from response', async () => {
      mockFetch.mockReturnValue(mockResponse(MOCK_FILE));

      const result = await client.getMediaFile(20);

      expect(result).toEqual(MOCK_FILE.file);
    });

    test('should throw if fileId is not provided', async () => {
      await expect(client.getMediaFile()).rejects.toThrow();
    });
  });
});

// ---------------------------------------------------------------
// FlipletApiError
// ---------------------------------------------------------------

describe('FlipletApiError', () => {
  test('should be an instance of Error', () => {
    const err = new FlipletApiError('test error', 400, {});
    expect(err).toBeInstanceOf(Error);
  });

  test('should store message, statusCode, and responseBody', () => {
    const body = { error: 'Bad Request' };
    const err = new FlipletApiError('Request failed', 400, body);

    expect(err.message).toBe('Request failed');
    expect(err.statusCode).toBe(400);
    expect(err.responseBody).toEqual(body);
  });

  test('should have the name FlipletApiError', () => {
    const err = new FlipletApiError('test', 500, {});
    expect(err.name).toBe('FlipletApiError');
  });
});
