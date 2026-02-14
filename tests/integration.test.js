/**
 * Integration Tests
 *
 * End-to-end tests that verify the full flow from user question
 * to final answer, with mocked HTTP responses for both OpenAI
 * and Fliplet APIs. No real network calls are made.
 *
 * These tests prove that all components work together correctly:
 * config → tools → FlipletApiClient → ToolExecutor → ChatEngine
 */

const { ChatEngine } = require('../src/chat-engine');
const { FlipletApiClient } = require('../src/fliplet-client');
const { ToolExecutor } = require('../src/tool-executor');
const { tools } = require('../src/tools');

// ---------------------------------------------------------------
// Helpers: mock HTTP and OpenAI
// ---------------------------------------------------------------

/**
 * Creates a mock fetch that returns predefined responses
 * based on the URL pattern. Simulates the Fliplet REST API.
 */
function createMockFlipletFetch(responses) {
  return jest.fn(async (url) => {
    // Find the matching response by URL pattern
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => data,
        };
      }
    }

    // Default: 404 not found
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Not found' }),
    };
  });
}

/**
 * Creates a mock OpenAI client that returns predefined responses.
 * Supports sequencing: each call returns the next response in the array.
 */
function createMockOpenAI(responses) {
  let callIndex = 0;
  return {
    chat: {
      completions: {
        create: jest.fn(async () => {
          const response = responses[callIndex] || responses[responses.length - 1];
          callIndex++;
          return response;
        }),
      },
    },
  };
}

/** Build an OpenAI text response */
function textResponse(content) {
  return {
    choices: [{
      message: { role: 'assistant', content, tool_calls: undefined },
      finish_reason: 'stop',
    }],
  };
}

/** Build an OpenAI tool-call response */
function toolCallResponse(calls) {
  return {
    choices: [{
      message: {
        role: 'assistant',
        content: null,
        tool_calls: calls.map((tc, i) => ({
          id: `call_${i}`,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      },
      finish_reason: 'tool_calls',
    }],
  };
}

// ---------------------------------------------------------------
// Test config used across all integration tests
// ---------------------------------------------------------------

const TEST_CONFIG = {
  flipletApiUrl: 'https://api.fliplet.com',
  flipletApiToken: 'test-token-123',
  flipletAppId: '9999',
  openaiApiKey: 'test-openai-key',
  openaiModel: 'gpt-4o-mini',
};

// ---------------------------------------------------------------
// Integration test: list data sources flow
// ---------------------------------------------------------------

describe('Integration: List Data Sources', () => {
  test('should return data sources when user asks about them', async () => {
    // Mock Fliplet API: return 2 data sources
    const mockFetch = createMockFlipletFetch({
      '/v1/data-sources': {
        dataSources: [
          { id: 1, name: 'Users', columns: ['name', 'email'] },
          { id: 2, name: 'Products', columns: ['title', 'price'] },
        ],
      },
    });

    // Mock OpenAI: first calls list_data_sources, then gives text answer
    const mockOpenAI = createMockOpenAI([
      toolCallResponse([{ name: 'list_data_sources', arguments: {} }]),
      textResponse('This app has 2 data sources: Users and Products.'),
    ]);

    // Wire everything together (just like createApp does, but with mocks)
    const client = new FlipletApiClient(TEST_CONFIG, mockFetch);
    const executor = new ToolExecutor(client);
    const engine = new ChatEngine({
      openai: mockOpenAI,
      toolExecutor: executor,
      tools,
      model: TEST_CONFIG.openaiModel,
    });

    // Act
    const answer = await engine.chat('What data sources does this app have?');

    // Assert
    expect(answer).toBe('This app has 2 data sources: Users and Products.');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain('/v1/data-sources?appId=9999');
  });
});

// ---------------------------------------------------------------
// Integration test: get data source entries flow
// ---------------------------------------------------------------

describe('Integration: Query Data Source Entries', () => {
  test('should query entries with filters when user asks', async () => {
    // Mock Fliplet API: return entries from a query
    const mockFetch = createMockFlipletFetch({
      '/v1/data-sources/1/data/query': {
        entries: [
          { id: 10, data: { name: 'Alice', email: 'alice@test.com' } },
          { id: 11, data: { name: 'Bob', email: 'bob@test.com' } },
        ],
      },
    });

    // Mock OpenAI: calls get_data_source_entries with filter, then text
    const mockOpenAI = createMockOpenAI([
      toolCallResponse([{
        name: 'get_data_source_entries',
        arguments: { dataSourceId: 1, limit: 2 },
      }]),
      textResponse('Found 2 entries: Alice and Bob.'),
    ]);

    const client = new FlipletApiClient(TEST_CONFIG, mockFetch);
    const executor = new ToolExecutor(client);
    const engine = new ChatEngine({
      openai: mockOpenAI,
      toolExecutor: executor,
      tools,
      model: TEST_CONFIG.openaiModel,
    });

    // Act
    const answer = await engine.chat('Show me the first 2 users');

    // Assert
    expect(answer).toBe('Found 2 entries: Alice and Bob.');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify the POST body included limit
    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.type).toBe('select');
    expect(body.limit).toBe(2);
  });
});

// ---------------------------------------------------------------
// Integration test: list media flow
// ---------------------------------------------------------------

describe('Integration: List Media Files', () => {
  test('should list files and folders when user asks', async () => {
    // Mock Fliplet API: return folders and files
    const mockFetch = createMockFlipletFetch({
      '/v1/media': {
        folders: [{ id: 100, name: 'Images' }],
        files: [
          { id: 200, name: 'logo.png', contentType: 'image/png', url: 'https://cdn.fliplet.com/logo.png' },
          { id: 201, name: 'report.pdf', contentType: 'application/pdf', url: 'https://cdn.fliplet.com/report.pdf' },
        ],
      },
    });

    // Mock OpenAI: calls list_media, then text
    const mockOpenAI = createMockOpenAI([
      toolCallResponse([{ name: 'list_media', arguments: {} }]),
      textResponse('Found 1 folder (Images) and 2 files (logo.png, report.pdf).'),
    ]);

    const client = new FlipletApiClient(TEST_CONFIG, mockFetch);
    const executor = new ToolExecutor(client);
    const engine = new ChatEngine({
      openai: mockOpenAI,
      toolExecutor: executor,
      tools,
      model: TEST_CONFIG.openaiModel,
    });

    // Act
    const answer = await engine.chat('What files are in this app?');

    // Assert
    expect(answer).toBe('Found 1 folder (Images) and 2 files (logo.png, report.pdf).');
    expect(mockFetch.mock.calls[0][0]).toContain('/v1/media?appId=9999');
  });
});

// ---------------------------------------------------------------
// Integration test: multi-round tool calls
// ---------------------------------------------------------------

describe('Integration: Multi-Round Tool Calls', () => {
  test('should handle AI calling multiple tools across rounds', async () => {
    // Mock Fliplet API: data sources and then entries
    const mockFetch = createMockFlipletFetch({
      '/v1/data-sources?appId': {
        dataSources: [{ id: 1, name: 'Users' }, { id: 2, name: 'Orders' }],
      },
      '/v1/data-sources/1/data/query': {
        entries: [
          { id: 10, data: { name: 'Alice' } },
          { id: 11, data: { name: 'Bob' } },
          { id: 12, data: { name: 'Charlie' } },
        ],
      },
    });

    // Mock OpenAI: list data sources → get entries → final answer
    const mockOpenAI = createMockOpenAI([
      toolCallResponse([{ name: 'list_data_sources', arguments: {} }]),
      toolCallResponse([{
        name: 'get_data_source_entries',
        arguments: { dataSourceId: 1 },
      }]),
      textResponse('The Users data source has 3 entries: Alice, Bob, and Charlie.'),
    ]);

    const client = new FlipletApiClient(TEST_CONFIG, mockFetch);
    const executor = new ToolExecutor(client);
    const engine = new ChatEngine({
      openai: mockOpenAI,
      toolExecutor: executor,
      tools,
      model: TEST_CONFIG.openaiModel,
    });

    // Act
    const answer = await engine.chat('How many users are there?');

    // Assert — AI made 2 API calls across 2 rounds
    expect(answer).toBe('The Users data source has 3 entries: Alice, Bob, and Charlie.');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------
// Integration test: parallel tool calls in one round
// ---------------------------------------------------------------

describe('Integration: Parallel Tool Calls', () => {
  test('should execute multiple tools in parallel when AI requests them together', async () => {
    // Mock Fliplet API
    const mockFetch = createMockFlipletFetch({
      '/v1/data-sources?appId': {
        dataSources: [{ id: 1, name: 'Users' }],
      },
      '/v1/media': {
        folders: [],
        files: [{ id: 5, name: 'logo.png' }],
      },
    });

    // Mock OpenAI: calls both tools at once, then text
    const mockOpenAI = createMockOpenAI([
      toolCallResponse([
        { name: 'list_data_sources', arguments: {} },
        { name: 'list_media', arguments: {} },
      ]),
      textResponse('App has 1 data source and 1 file.'),
    ]);

    const client = new FlipletApiClient(TEST_CONFIG, mockFetch);
    const executor = new ToolExecutor(client);
    const engine = new ChatEngine({
      openai: mockOpenAI,
      toolExecutor: executor,
      tools,
      model: TEST_CONFIG.openaiModel,
    });

    // Act
    const answer = await engine.chat('Give me an overview of this app');

    // Assert — both API calls were made
    expect(answer).toBe('App has 1 data source and 1 file.');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------
// Integration test: API error handling
// ---------------------------------------------------------------

describe('Integration: Fliplet API Error', () => {
  test('should handle Fliplet API errors gracefully and let AI explain', async () => {
    // Mock Fliplet API: return 401 unauthorized
    const mockFetch = jest.fn(async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid auth token' }),
    }));

    // Mock OpenAI: calls list_data_sources (will fail), then explains error
    const mockOpenAI = createMockOpenAI([
      toolCallResponse([{ name: 'list_data_sources', arguments: {} }]),
      textResponse('I was unable to list data sources because the API token is invalid. Please check your Fliplet API token.'),
    ]);

    const client = new FlipletApiClient(TEST_CONFIG, mockFetch);
    const executor = new ToolExecutor(client);
    const engine = new ChatEngine({
      openai: mockOpenAI,
      toolExecutor: executor,
      tools,
      model: TEST_CONFIG.openaiModel,
    });

    // Act — should NOT throw, the AI should handle the error
    const answer = await engine.chat('List data sources');

    // Assert — AI received the error and explained it
    expect(answer).toContain('invalid');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------
// Integration test: conversation history (multi-turn)
// ---------------------------------------------------------------

describe('Integration: Multi-Turn Conversation', () => {
  test('should maintain context across multiple user messages', async () => {
    const mockFetch = createMockFlipletFetch({
      '/v1/data-sources?appId': {
        dataSources: [{ id: 1, name: 'Users' }],
      },
      '/v1/data-sources/1': {
        dataSource: { id: 1, name: 'Users', columns: ['name', 'email', 'role'] },
      },
    });

    // Turn 1: list data sources
    // Turn 2: get details (AI remembers the context from turn 1)
    const mockOpenAI = createMockOpenAI([
      // Turn 1
      toolCallResponse([{ name: 'list_data_sources', arguments: {} }]),
      textResponse('This app has 1 data source called Users.'),
      // Turn 2
      toolCallResponse([{ name: 'get_data_source', arguments: { dataSourceId: 1 } }]),
      textResponse('The Users data source has 3 columns: name, email, and role.'),
    ]);

    const client = new FlipletApiClient(TEST_CONFIG, mockFetch);
    const executor = new ToolExecutor(client);
    const engine = new ChatEngine({
      openai: mockOpenAI,
      toolExecutor: executor,
      tools,
      model: TEST_CONFIG.openaiModel,
    });

    // Turn 1
    const answer1 = await engine.chat('What data sources are there?');
    expect(answer1).toContain('Users');

    // Turn 2 — references "it" from turn 1
    const answer2 = await engine.chat('What columns does it have?');
    expect(answer2).toContain('name');
    expect(answer2).toContain('email');

    // History should contain both turns
    const history = engine.getHistory();
    const userMessages = history.filter((m) => m.role === 'user');
    expect(userMessages).toHaveLength(2);
  });
});
