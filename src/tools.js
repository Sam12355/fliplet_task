/**
 * Fliplet Tool Definitions
 *
 * Defines the tools (functions) that the AI model can call.
 * Each tool maps to a Fliplet REST API endpoint.
 *
 * Format follows the OpenAI function-calling schema:
 * { type: 'function', function: { name, description, parameters } }
 *
 * The AI reads these descriptions to decide WHEN and HOW to call each tool.
 * Parameters use JSON Schema format so the AI generates valid arguments.
 */

const tools = [
  // ------------------------------------------------------------------
  // Data Sources
  // ------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'list_data_sources',
      description:
        'List all data sources belonging to the current Fliplet app. ' +
        'Returns an array of data source objects with id, name, columns, ' +
        'and metadata. Use this to discover what data is available.',
      parameters: {
        type: 'object',
        properties: {},
        // No required params — appId comes from config, not from the AI
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_data_source',
      description:
        'Get detailed information about a specific data source by its ID. ' +
        'Returns the data source object including name, columns, hooks, ' +
        'encryption status, and timestamps.',
      parameters: {
        type: 'object',
        properties: {
          dataSourceId: {
            type: 'number',
            description: 'The unique ID of the data source to retrieve.',
          },
        },
        required: ['dataSourceId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_data_source_entries',
      description:
        'Query and retrieve entries (rows) from a specific data source. ' +
        'Supports filtering with a where clause, pagination with limit/offset, ' +
        'and ordering. Returns an array of entry objects with id, data, and timestamps.',
      parameters: {
        type: 'object',
        properties: {
          dataSourceId: {
            type: 'number',
            description: 'The unique ID of the data source to query.',
          },
          where: {
            type: 'object',
            description:
              'Optional filter conditions as key-value pairs. ' +
              'Example: { "email": "john@example.com" } or ' +
              '{ "Status": "Active" }. Supports MongoDB-style operators.',
          },
          limit: {
            type: 'number',
            description:
              'Maximum number of entries to return. Useful for pagination ' +
              'or previewing data. Default is all entries.',
          },
          offset: {
            type: 'number',
            description:
              'Number of entries to skip before returning results. ' +
              'Use with limit for pagination.',
          },
        },
        required: ['dataSourceId'],
      },
    },
  },

  // ------------------------------------------------------------------
  // Media / Files
  // ------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'list_media',
      description:
        'List all media files and folders belonging to the current Fliplet app. ' +
        'Optionally filter by a specific folder ID to browse subfolder contents. ' +
        'Returns arrays of folders and files with names, URLs, and metadata.',
      parameters: {
        type: 'object',
        properties: {
          folderId: {
            type: 'number',
            description:
              'Optional folder ID to list contents of a specific folder. ' +
              'Omit to list root-level files and folders for the app.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_media_file',
      description:
        'Get metadata and the download URL for a specific media file by its ID. ' +
        'Returns file details including name, content type, size, URL, and timestamps.',
      parameters: {
        type: 'object',
        properties: {
          fileId: {
            type: 'number',
            description: 'The unique ID of the media file to retrieve.',
          },
        },
        required: ['fileId'],
      },
    },
  },
];

/**
 * Helper to find a tool definition by its function name.
 *
 * @param {string} name - The function name to look up (e.g. 'list_data_sources')
 * @returns {object|undefined} The tool definition or undefined if not found
 */
function getToolByName(name) {
  return tools.find((tool) => tool.function.name === name);
}

module.exports = { tools, getToolByName };
