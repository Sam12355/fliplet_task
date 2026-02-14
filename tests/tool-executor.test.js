/**
 * Tool Executor — Unit Tests (TDD)
 *
 * Written BEFORE implementation. The ToolExecutor is the bridge between
 * AI tool calls (name + JSON arguments) and the FlipletApiClient methods.
 *
 * Responsibilities:
 * - Map tool names to client methods
 * - Parse and forward arguments correctly
 * - Return structured results (or error messages) to feed back to the AI
 */

const { ToolExecutor } = require('../src/tool-executor');

// ---------------------------------------------------------------
// Mock FlipletApiClient — we isolate the executor from real HTTP
// ---------------------------------------------------------------

function createMockClient() {
  return {
    listDataSources: jest.fn(),
    getDataSource: jest.fn(),
    getDataSourceEntries: jest.fn(),
    listMedia: jest.fn(),
    getMediaFile: jest.fn(),
  };
}

describe('ToolExecutor', () => {
  let executor;
  let mockClient;

  beforeEach(() => {
    mockClient = createMockClient();
    executor = new ToolExecutor(mockClient);
  });

  // ---------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------

  test('should throw if no client is provided', () => {
    expect(() => new ToolExecutor()).toThrow('ToolExecutor requires a FlipletApiClient');
  });

  test('should store the client reference', () => {
    expect(executor.client).toBe(mockClient);
  });

  // ---------------------------------------------------------------
  // execute() — dispatching
  // ---------------------------------------------------------------

  test('should throw on unknown tool name', async () => {
    await expect(executor.execute('unknown_tool', {})).rejects.toThrow(
      'Unknown tool: unknown_tool'
    );
  });

  // ---------------------------------------------------------------
  // list_data_sources
  // ---------------------------------------------------------------

  describe('list_data_sources', () => {
    test('should call client.listDataSources() with no arguments', async () => {
      const mockResult = [{ id: 1, name: 'Users' }];
      mockClient.listDataSources.mockResolvedValue(mockResult);

      const result = await executor.execute('list_data_sources', {});

      expect(mockClient.listDataSources).toHaveBeenCalledTimes(1);
      expect(mockClient.listDataSources).toHaveBeenCalledWith();
      expect(result).toEqual(mockResult);
    });
  });

  // ---------------------------------------------------------------
  // get_data_source
  // ---------------------------------------------------------------

  describe('get_data_source', () => {
    test('should call client.getDataSource() with dataSourceId', async () => {
      const mockResult = { id: 42, name: 'Products' };
      mockClient.getDataSource.mockResolvedValue(mockResult);

      const result = await executor.execute('get_data_source', { dataSourceId: 42 });

      expect(mockClient.getDataSource).toHaveBeenCalledWith(42);
      expect(result).toEqual(mockResult);
    });
  });

  // ---------------------------------------------------------------
  // get_data_source_entries
  // ---------------------------------------------------------------

  describe('get_data_source_entries', () => {
    test('should call client.getDataSourceEntries() with dataSourceId and options', async () => {
      const mockResult = [{ id: 1, data: { name: 'Alice' } }];
      mockClient.getDataSourceEntries.mockResolvedValue(mockResult);

      const args = {
        dataSourceId: 10,
        where: { Status: 'Active' },
        limit: 5,
        offset: 0,
      };

      const result = await executor.execute('get_data_source_entries', args);

      // Should pass dataSourceId as first arg, rest as options object
      expect(mockClient.getDataSourceEntries).toHaveBeenCalledWith(10, {
        where: { Status: 'Active' },
        limit: 5,
        offset: 0,
      });
      expect(result).toEqual(mockResult);
    });

    test('should pass empty options when only dataSourceId is provided', async () => {
      mockClient.getDataSourceEntries.mockResolvedValue([]);

      await executor.execute('get_data_source_entries', { dataSourceId: 10 });

      expect(mockClient.getDataSourceEntries).toHaveBeenCalledWith(10, {});
    });
  });

  // ---------------------------------------------------------------
  // list_media
  // ---------------------------------------------------------------

  describe('list_media', () => {
    test('should call client.listMedia() without folderId when not provided', async () => {
      const mockResult = { folders: [], files: [] };
      mockClient.listMedia.mockResolvedValue(mockResult);

      const result = await executor.execute('list_media', {});

      expect(mockClient.listMedia).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockResult);
    });

    test('should call client.listMedia() with folderId when provided', async () => {
      const mockResult = { folders: [], files: [{ id: 1, name: 'logo.png' }] };
      mockClient.listMedia.mockResolvedValue(mockResult);

      const result = await executor.execute('list_media', { folderId: 99 });

      expect(mockClient.listMedia).toHaveBeenCalledWith(99);
      expect(result).toEqual(mockResult);
    });
  });

  // ---------------------------------------------------------------
  // get_media_file
  // ---------------------------------------------------------------

  describe('get_media_file', () => {
    test('should call client.getMediaFile() with fileId', async () => {
      const mockResult = { id: 5, name: 'doc.pdf', url: 'https://cdn.fliplet.com/doc.pdf' };
      mockClient.getMediaFile.mockResolvedValue(mockResult);

      const result = await executor.execute('get_media_file', { fileId: 5 });

      expect(mockClient.getMediaFile).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockResult);
    });
  });

  // ---------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------

  describe('error handling', () => {
    test('should return an error object when the client method throws', async () => {
      mockClient.listDataSources.mockRejectedValue(new Error('Network failure'));

      const result = await executor.execute('list_data_sources', {});

      // Should NOT throw — should return a structured error for the AI to read
      expect(result).toEqual({
        error: true,
        message: 'Network failure',
      });
    });

    test('should include statusCode if error is a FlipletApiError', async () => {
      // Simulate a FlipletApiError
      const apiError = new Error('Not found');
      apiError.name = 'FlipletApiError';
      apiError.statusCode = 404;
      apiError.responseBody = { message: 'Data source not found' };

      mockClient.getDataSource.mockRejectedValue(apiError);

      const result = await executor.execute('get_data_source', { dataSourceId: 999 });

      expect(result).toEqual({
        error: true,
        message: 'Not found',
        statusCode: 404,
        details: { message: 'Data source not found' },
      });
    });
  });
});
