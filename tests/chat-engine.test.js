/**
 * Chat Engine — Unit Tests (TDD)
 *
 * Written BEFORE implementation. The ChatEngine orchestrates the
 * conversation loop between the user, OpenAI, and the ToolExecutor.
 *
 * Flow:
 * 1. User sends a message
 * 2. ChatEngine sends message + tool definitions to OpenAI
 * 3. If OpenAI returns tool calls → execute via ToolExecutor → feed results back
 * 4. Repeat until OpenAI returns a final text response
 * 5. Return the assistant's answer to the user
 *
 * We mock both OpenAI and the ToolExecutor to isolate the engine logic.
 */

const { ChatEngine } = require('../src/chat-engine');

// ---------------------------------------------------------------
// Helpers: create mock dependencies
// ---------------------------------------------------------------

/**
 * Creates a mock OpenAI client with a controllable chat.completions.create method.
 * Each call to mockCreate can be configured to return different responses.
 */
function createMockOpenAI(mockCreate) {
  return {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  };
}

/**
 * Creates a mock ToolExecutor with a controllable execute method.
 */
function createMockExecutor() {
  return {
    execute: jest.fn(),
  };
}

/**
 * Builds an OpenAI-style response with a text message (no tool calls).
 */
function textResponse(content) {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content,
          tool_calls: undefined,
        },
        finish_reason: 'stop',
      },
    ],
  };
}

/**
 * Builds an OpenAI-style response with tool calls (no text).
 */
function toolCallResponse(toolCalls) {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          tool_calls: toolCalls.map((tc, i) => ({
            id: `call_${i}`,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        },
        finish_reason: 'tool_calls',
      },
    ],
  };
}

// ---------------------------------------------------------------
// Tests
// ---------------------------------------------------------------

describe('ChatEngine', () => {
  // ---------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------

  describe('constructor', () => {
    test('should throw if openai client is not provided', () => {
      expect(() => new ChatEngine({})).toThrow('ChatEngine requires an openai client');
    });

    test('should throw if toolExecutor is not provided', () => {
      const mockOpenAI = createMockOpenAI(jest.fn());
      expect(() => new ChatEngine({ openai: mockOpenAI })).toThrow(
        'ChatEngine requires a toolExecutor'
      );
    });

    test('should throw if tools array is not provided', () => {
      const mockOpenAI = createMockOpenAI(jest.fn());
      const mockExecutor = createMockExecutor();
      expect(() => new ChatEngine({ openai: mockOpenAI, toolExecutor: mockExecutor })).toThrow(
        'ChatEngine requires a tools array'
      );
    });

    test('should use default model if not specified', () => {
      const mockOpenAI = createMockOpenAI(jest.fn());
      const mockExecutor = createMockExecutor();
      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
      });
      expect(engine.model).toBe('gpt-4o-mini');
    });

    test('should accept a custom model', () => {
      const mockOpenAI = createMockOpenAI(jest.fn());
      const mockExecutor = createMockExecutor();
      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
        model: 'gpt-4o',
      });
      expect(engine.model).toBe('gpt-4o');
    });
  });

  // ---------------------------------------------------------------
  // System prompt
  // ---------------------------------------------------------------

  describe('system prompt', () => {
    test('should include a system message with Fliplet context', () => {
      const mockOpenAI = createMockOpenAI(jest.fn());
      const mockExecutor = createMockExecutor();
      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
      });

      // The system prompt should mention Fliplet and data sources
      const systemMsg = engine.getSystemPrompt();
      expect(systemMsg.role).toBe('system');
      expect(systemMsg.content.toLowerCase()).toContain('fliplet');
      expect(systemMsg.content.toLowerCase()).toContain('data source');
    });
  });

  // ---------------------------------------------------------------
  // Message history management
  // ---------------------------------------------------------------

  describe('message history', () => {
    test('should start with an empty conversation history', () => {
      const mockOpenAI = createMockOpenAI(jest.fn());
      const mockExecutor = createMockExecutor();
      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
      });

      expect(engine.getHistory()).toEqual([]);
    });

    test('should clear conversation history on reset', async () => {
      const mockCreate = jest.fn().mockResolvedValue(textResponse('Hello!'));
      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();
      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
      });

      // Send a message to populate history
      await engine.chat('Hi');
      expect(engine.getHistory().length).toBeGreaterThan(0);

      // Reset clears history
      engine.reset();
      expect(engine.getHistory()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------
  // Simple text response (no tool calls)
  // ---------------------------------------------------------------

  describe('simple text response', () => {
    test('should return assistant text when no tool calls are made', async () => {
      const mockCreate = jest.fn().mockResolvedValue(textResponse('There are 3 data sources.'));
      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();
      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [{ type: 'function', function: { name: 'test' } }],
      });

      const answer = await engine.chat('How many data sources are there?');

      expect(answer).toBe('There are 3 data sources.');
    });

    test('should send user message to OpenAI with tools and system prompt', async () => {
      const mockCreate = jest.fn().mockResolvedValue(textResponse('Hello!'));
      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();
      const testTools = [{ type: 'function', function: { name: 'list_data_sources' } }];
      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: testTools,
        model: 'gpt-4o-mini',
      });

      await engine.chat('Hi');

      // Verify OpenAI was called with correct structure
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o-mini');
      expect(callArgs.tools).toBe(testTools);

      // First message should be system prompt, second should be user message
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[1]).toEqual({ role: 'user', content: 'Hi' });
    });

    test('should add user and assistant messages to history', async () => {
      const mockCreate = jest.fn().mockResolvedValue(textResponse('Hello there!'));
      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();
      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
      });

      await engine.chat('Hi');

      const history = engine.getHistory();
      expect(history).toContainEqual({ role: 'user', content: 'Hi' });
      expect(history).toContainEqual({ role: 'assistant', content: 'Hello there!' });
    });
  });

  // ---------------------------------------------------------------
  // Tool call flow (single round)
  // ---------------------------------------------------------------

  describe('single tool call', () => {
    test('should execute a tool call and feed the result back to OpenAI', async () => {
      const toolResult = [{ id: 1, name: 'Users' }, { id: 2, name: 'Products' }];

      // First call: OpenAI asks to call list_data_sources
      // Second call: OpenAI returns the final text answer
      const mockCreate = jest
        .fn()
        .mockResolvedValueOnce(
          toolCallResponse([{ name: 'list_data_sources', arguments: {} }])
        )
        .mockResolvedValueOnce(textResponse('Found 2 data sources: Users and Products.'));

      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();
      mockExecutor.execute.mockResolvedValue(toolResult);

      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [{ type: 'function', function: { name: 'list_data_sources' } }],
      });

      const answer = await engine.chat('List all data sources');

      // ToolExecutor should have been called
      expect(mockExecutor.execute).toHaveBeenCalledWith('list_data_sources', {});

      // OpenAI should have been called twice (initial + after tool result)
      expect(mockCreate).toHaveBeenCalledTimes(2);

      // Final answer should be the text response
      expect(answer).toBe('Found 2 data sources: Users and Products.');
    });

    test('should pass parsed arguments to the tool executor', async () => {
      const mockCreate = jest
        .fn()
        .mockResolvedValueOnce(
          toolCallResponse([
            { name: 'get_data_source_entries', arguments: { dataSourceId: 42, limit: 5 } },
          ])
        )
        .mockResolvedValueOnce(textResponse('Here are the entries.'));

      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();
      mockExecutor.execute.mockResolvedValue([]);

      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
      });

      await engine.chat('Show me 5 rows from data source 42');

      expect(mockExecutor.execute).toHaveBeenCalledWith('get_data_source_entries', {
        dataSourceId: 42,
        limit: 5,
      });
    });
  });

  // ---------------------------------------------------------------
  // Multiple tool calls in one response
  // ---------------------------------------------------------------

  describe('multiple tool calls in one response', () => {
    test('should execute all tool calls and feed all results back', async () => {
      const mockCreate = jest
        .fn()
        .mockResolvedValueOnce(
          toolCallResponse([
            { name: 'list_data_sources', arguments: {} },
            { name: 'list_media', arguments: {} },
          ])
        )
        .mockResolvedValueOnce(textResponse('Found data sources and files.'));

      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();
      mockExecutor.execute
        .mockResolvedValueOnce([{ id: 1, name: 'Users' }])
        .mockResolvedValueOnce({ folders: [], files: [{ id: 5, name: 'logo.png' }] });

      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
      });

      const answer = await engine.chat('What data and files does this app have?');

      // Both tools should have been called
      expect(mockExecutor.execute).toHaveBeenCalledTimes(2);
      expect(mockExecutor.execute).toHaveBeenCalledWith('list_data_sources', {});
      expect(mockExecutor.execute).toHaveBeenCalledWith('list_media', {});

      expect(answer).toBe('Found data sources and files.');
    });
  });

  // ---------------------------------------------------------------
  // Multi-round tool calls (chained)
  // ---------------------------------------------------------------

  describe('multi-round tool calls', () => {
    test('should handle multiple rounds of tool calls before final answer', async () => {
      const mockCreate = jest
        .fn()
        // Round 1: list data sources
        .mockResolvedValueOnce(
          toolCallResponse([{ name: 'list_data_sources', arguments: {} }])
        )
        // Round 2: get specific data source entries
        .mockResolvedValueOnce(
          toolCallResponse([
            { name: 'get_data_source_entries', arguments: { dataSourceId: 1, limit: 3 } },
          ])
        )
        // Round 3: final text answer
        .mockResolvedValueOnce(textResponse('The Users table has 3 entries.'));

      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();
      mockExecutor.execute
        .mockResolvedValueOnce([{ id: 1, name: 'Users' }])
        .mockResolvedValueOnce([{ id: 10, data: { name: 'Alice' } }]);

      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
      });

      const answer = await engine.chat('How many entries in the first data source?');

      // OpenAI called 3 times (2 tool rounds + 1 final)
      expect(mockCreate).toHaveBeenCalledTimes(3);
      // ToolExecutor called twice
      expect(mockExecutor.execute).toHaveBeenCalledTimes(2);
      expect(answer).toBe('The Users table has 3 entries.');
    });
  });

  // ---------------------------------------------------------------
  // Safety: max iterations guard
  // ---------------------------------------------------------------

  describe('max iterations guard', () => {
    test('should stop after max iterations to prevent infinite loops', async () => {
      // OpenAI keeps returning tool calls forever
      const mockCreate = jest.fn().mockResolvedValue(
        toolCallResponse([{ name: 'list_data_sources', arguments: {} }])
      );

      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();
      mockExecutor.execute.mockResolvedValue([]);

      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
        maxIterations: 3,
      });

      const answer = await engine.chat('Do something');

      // Should have stopped after maxIterations rounds
      expect(mockCreate.mock.calls.length).toBeLessThanOrEqual(4); // initial + 3 iterations max
      expect(answer).toContain('maximum number of tool calls');
    });
  });

  // ---------------------------------------------------------------
  // OpenAI API error handling
  // ---------------------------------------------------------------

  describe('error handling', () => {
    test('should throw a meaningful error if OpenAI API call fails', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('API rate limit exceeded'));
      const mockOpenAI = createMockOpenAI(mockCreate);
      const mockExecutor = createMockExecutor();

      const engine = new ChatEngine({
        openai: mockOpenAI,
        toolExecutor: mockExecutor,
        tools: [],
      });

      await expect(engine.chat('Hello')).rejects.toThrow('API rate limit exceeded');
    });
  });
});
