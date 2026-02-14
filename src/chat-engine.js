/**
 * Chat Engine
 *
 * Orchestrates the conversation loop between the user, OpenAI, and
 * the ToolExecutor. Manages message history and handles the iterative
 * tool-calling flow until the AI produces a final text answer.
 *
 * Best practices applied:
 * - Iterative Loop: handles multi-round tool calls (AI may call tools,
 *   see results, then call more tools before answering)
 * - Parallel Execution: when AI returns multiple tool calls, all are
 *   executed concurrently via Promise.all for efficiency
 * - Safety Guard: maxIterations prevents infinite tool-call loops
 * - Separation of Concerns: no HTTP logic, no CLI logic — just orchestration
 * - Immutable History: getHistory() returns a copy to prevent external mutation
 */

// The default maximum number of tool-call rounds before forcing a stop
const DEFAULT_MAX_ITERATIONS = 10;

class ChatEngine {
  /**
   * Create a new ChatEngine.
   *
   * @param {object} options - Engine configuration
   * @param {object} options.openai - OpenAI client instance (from the openai SDK)
   * @param {object} options.toolExecutor - ToolExecutor instance for dispatching tool calls
   * @param {Array} options.tools - Tool definitions array (from tools.js)
   * @param {string} [options.model='gpt-4o-mini'] - OpenAI model to use
   * @param {number} [options.maxIterations=10] - Max tool-call rounds before stopping
   */
  constructor(options = {}) {
    // Validate required dependencies
    if (!options.openai) {
      throw new Error('ChatEngine requires an openai client');
    }
    if (!options.toolExecutor) {
      throw new Error('ChatEngine requires a toolExecutor');
    }
    if (!options.tools) {
      throw new Error('ChatEngine requires a tools array');
    }

    // Store dependencies
    this._openai = options.openai;
    this._toolExecutor = options.toolExecutor;
    this._tools = options.tools;

    // Configuration with sensible defaults
    this.model = options.model || 'gpt-4o-mini';
    this._maxIterations = options.maxIterations || DEFAULT_MAX_ITERATIONS;

    // Conversation history (user + assistant + tool messages)
    this._history = [];
  }

  // ---------------------------------------------------------------
  // System Prompt
  // ---------------------------------------------------------------

  /**
   * Returns the system message that sets the AI's behavior and context.
   * This tells the AI what it is, what it can do, and how to behave.
   *
   * @returns {{ role: string, content: string }} System message object
   */
  getSystemPrompt() {
    return {
      role: 'system',
      content:
        'You are a Fliplet App Assistant. Your ONLY purpose is to answer ' +
        'questions about the data sources, data entries, and media files ' +
        'for a specific Fliplet app using the tools provided. ' +
        'You have access to tools that query the Fliplet REST API. ' +
        'Use these tools to look up real data before answering. ' +
        'Always be accurate — only state what the API data confirms. ' +
        'If a tool call fails, explain the error to the user clearly. ' +
        '\n\nScope rules:\n' +
        '- ONLY answer questions related to this Fliplet app\'s data sources, entries, files, and media.\n' +
        '- If the user asks something unrelated (general knowledge, coding help, opinions, etc.), ' +
        'politely decline and remind them you can only help with this app\'s data sources and files.\n' +
        '- Example refusal: "I can only help with questions about this Fliplet app\'s data sources and files. ' +
        'Try asking me things like: What data sources does this app have? or What media files are uploaded?"\n' +
        '\n\nFormatting rules:\n' +
        '- Use **Markdown tables** when listing multiple items with shared attributes (e.g. data sources with Name, ID, Columns).\n' +
        '- Keep responses concise — summarize large lists (e.g. show top 10 and state the total count).\n' +
        '- Use bold for names and IDs. Use bullet lists for short enumerations.\n' +
        '- For data source entries, format as a clean table with column headers.\n' +
        '- Avoid repeating obvious labels — let table headers do the work.\n' +
        '- If there are many items, group them by type or category when possible.',
    };
  }

  // ---------------------------------------------------------------
  // History Management
  // ---------------------------------------------------------------

  /**
   * Get a copy of the conversation history.
   * Returns a shallow copy to prevent external mutation.
   *
   * @returns {Array} Array of message objects
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Clear the conversation history to start a fresh chat.
   */
  reset() {
    this._history = [];
  }

  // ---------------------------------------------------------------
  // Main Chat Method
  // ---------------------------------------------------------------

  /**
   * Send a user message and get the AI's response.
   *
   * Handles the full conversation flow:
   * 1. Add user message to history
   * 2. Call OpenAI with system prompt + history + tools
   * 3. If response contains tool calls → execute them → add results → loop
   * 4. Return the final text response
   *
   * @param {string} userMessage - The user's question or message
   * @returns {Promise<string>} The AI's final text response
   * @throws {Error} If the OpenAI API call fails
   */
  async chat(userMessage) {
    // Add the user's message to conversation history
    this._history.push({ role: 'user', content: userMessage });

    // Iterative loop: keep going until we get a text response or hit max iterations
    let iterations = 0;

    while (iterations < this._maxIterations) {
      iterations++;

      // Build the full message array: system prompt + conversation history
      const messages = [this.getSystemPrompt(), ...this._history];

      // Call OpenAI API
      const response = await this._openai.chat.completions.create({
        model: this.model,
        messages,
        tools: this._tools.length > 0 ? this._tools : undefined,
      });

      // Extract the assistant's message from the response
      const assistantMessage = response.choices[0].message;

      // Check if the AI wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add the assistant's tool-call message to history
        this._history.push(assistantMessage);

        // Execute all tool calls concurrently for efficiency
        const toolResults = await Promise.all(
          assistantMessage.tool_calls.map(async (toolCall) => {
            // Parse the JSON arguments string from OpenAI
            const args = JSON.parse(toolCall.function.arguments);

            // Execute via the ToolExecutor
            const result = await this._toolExecutor.execute(toolCall.function.name, args);

            // Return the tool result in OpenAI's expected format
            return {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            };
          })
        );

        // Add all tool results to history
        this._history.push(...toolResults);

        // Continue the loop — OpenAI needs to see the results and respond
        continue;
      }

      // No tool calls — this is the final text response
      const answerText = assistantMessage.content;

      // Add the assistant's text response to history
      this._history.push({ role: 'assistant', content: answerText });

      return answerText;
    }

    // Safety: hit max iterations without a final answer
    const safetyMessage =
      'I reached the maximum number of tool calls without producing a final answer. ' +
      'Please try rephrasing your question.';

    this._history.push({ role: 'assistant', content: safetyMessage });

    return safetyMessage;
  }
}

module.exports = { ChatEngine };
