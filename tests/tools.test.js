/**
 * Fliplet Tool Definitions — Unit Tests (TDD)
 *
 * Written BEFORE implementation to define expected behavior.
 * Each tool must follow the OpenAI function-calling schema format:
 * { type: 'function', function: { name, description, parameters } }
 */

const { tools, getToolByName } = require('../src/tools');

describe('Fliplet Tool Definitions', () => {
  // -------------------------------------------------------
  // Structure & format tests
  // -------------------------------------------------------

  test('should export an array of tool definitions', () => {
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  test('every tool should have the correct top-level shape', () => {
    // OpenAI requires { type: "function", function: { ... } }
    tools.forEach((tool) => {
      expect(tool).toHaveProperty('type', 'function');
      expect(tool).toHaveProperty('function');
      expect(tool.function).toHaveProperty('name');
      expect(tool.function).toHaveProperty('description');
      expect(tool.function).toHaveProperty('parameters');
    });
  });

  test('every tool name should be a non-empty snake_case string', () => {
    const snakeCaseRegex = /^[a-z][a-z0-9_]*$/;

    tools.forEach((tool) => {
      expect(tool.function.name).toMatch(snakeCaseRegex);
    });
  });

  test('every tool description should be a non-empty string', () => {
    tools.forEach((tool) => {
      expect(typeof tool.function.description).toBe('string');
      expect(tool.function.description.length).toBeGreaterThan(10);
    });
  });

  test('every tool parameters should be a valid JSON Schema object', () => {
    tools.forEach((tool) => {
      const params = tool.function.parameters;
      expect(params).toHaveProperty('type', 'object');
      expect(params).toHaveProperty('properties');
      // required is optional but if present must be an array
      if (params.required) {
        expect(Array.isArray(params.required)).toBe(true);
      }
    });
  });

  test('tool names should be unique (no duplicates)', () => {
    const names = tools.map((t) => t.function.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  // -------------------------------------------------------
  // getToolByName helper tests
  // -------------------------------------------------------

  test('getToolByName should return the correct tool definition', () => {
    const tool = getToolByName('list_data_sources');
    expect(tool).toBeDefined();
    expect(tool.function.name).toBe('list_data_sources');
  });

  test('getToolByName should return undefined for unknown tools', () => {
    const tool = getToolByName('nonexistent_tool');
    expect(tool).toBeUndefined();
  });

  // -------------------------------------------------------
  // Individual tool definition tests
  // -------------------------------------------------------

  describe('list_data_sources', () => {
    test('should exist and require no parameters', () => {
      const tool = getToolByName('list_data_sources');
      expect(tool).toBeDefined();
      // appId is injected from config, not from the AI — no required params
      const required = tool.function.parameters.required || [];
      expect(required).toEqual([]);
    });

    test('should describe its purpose in the description', () => {
      const tool = getToolByName('list_data_sources');
      expect(tool.function.description.toLowerCase()).toContain('data source');
    });
  });

  describe('get_data_source', () => {
    test('should exist and require dataSourceId', () => {
      const tool = getToolByName('get_data_source');
      expect(tool).toBeDefined();
      expect(tool.function.parameters.required).toContain('dataSourceId');
    });

    test('dataSourceId should be a number type', () => {
      const tool = getToolByName('get_data_source');
      const props = tool.function.parameters.properties;
      expect(props.dataSourceId.type).toBe('number');
    });
  });

  describe('get_data_source_entries', () => {
    test('should exist and require dataSourceId', () => {
      const tool = getToolByName('get_data_source_entries');
      expect(tool).toBeDefined();
      expect(tool.function.parameters.required).toContain('dataSourceId');
    });

    test('should support optional query parameters (where, limit, offset)', () => {
      const tool = getToolByName('get_data_source_entries');
      const props = tool.function.parameters.properties;
      // These are optional but should be defined in the schema
      expect(props).toHaveProperty('where');
      expect(props).toHaveProperty('limit');
      expect(props).toHaveProperty('offset');
    });

    test('limit should be a number type', () => {
      const tool = getToolByName('get_data_source_entries');
      expect(tool.function.parameters.properties.limit.type).toBe('number');
    });
  });

  describe('list_media', () => {
    test('should exist and have optional folderId parameter', () => {
      const tool = getToolByName('list_media');
      expect(tool).toBeDefined();
      const props = tool.function.parameters.properties;
      expect(props).toHaveProperty('folderId');
    });

    test('should describe its purpose related to files and folders', () => {
      const tool = getToolByName('list_media');
      const desc = tool.function.description.toLowerCase();
      expect(desc).toMatch(/file|media|folder/);
    });
  });

  describe('get_media_file', () => {
    test('should exist and require fileId', () => {
      const tool = getToolByName('get_media_file');
      expect(tool).toBeDefined();
      expect(tool.function.parameters.required).toContain('fileId');
    });

    test('fileId should be a number type', () => {
      const tool = getToolByName('get_media_file');
      const props = tool.function.parameters.properties;
      expect(props.fileId.type).toBe('number');
    });
  });
});
