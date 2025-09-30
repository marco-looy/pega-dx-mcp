/**
 * Tool schema utilities for consistent session credential parameter definitions
 * Provides standardized schema generation for MCP tools
 */

/**
 * Generate session credentials parameter schema
 * @returns {Object} Session credentials parameter schema
 */
export function getSessionCredentialsSchema() {
  return {
    type: 'object',
    description: 'Optional session-specific credentials. If not provided, uses environment variables.',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Optional session ID. If not provided, a new session will be created.'
      },
      baseUrl: {
        type: 'string',
        description: 'Pega base URL (required if providing credentials)'
      },
      apiVersion: {
        type: 'string',
        description: 'API version (optional, defaults to v2)',
        default: 'v2'
      },
      clientId: {
        type: 'string',
        description: 'OAuth2 client ID (required for OAuth mode)'
      },
      clientSecret: {
        type: 'string',
        description: 'OAuth2 client secret (required for OAuth mode)'
      },
      accessToken: {
        type: 'string',
        description: 'Direct access token (required for token mode)'
      },
      tokenExpiry: {
        type: 'number',
        description: 'Token expiry in seconds from now (optional for token mode)'
      }
    },
    oneOf: [
      {
        description: 'OAuth mode - provide client credentials',
        required: ['baseUrl', 'clientId', 'clientSecret']
      },
      {
        description: 'Token mode - provide access token directly',
        required: ['baseUrl', 'accessToken']
      }
    ]
  };
}

/**
 * Add session credentials parameter to existing tool schema
 * @param {Object} existingSchema - Existing tool input schema
 * @returns {Object} Updated schema with session credentials parameter
 */
export function addSessionCredentialsToSchema(existingSchema) {
  // Make a deep copy of the existing schema
  const updatedSchema = JSON.parse(JSON.stringify(existingSchema));

  // Add sessionCredentials to properties
  if (!updatedSchema.properties) {
    updatedSchema.properties = {};
  }

  updatedSchema.properties.sessionCredentials = getSessionCredentialsSchema();

  return updatedSchema;
}

/**
 * Create a complete tool schema with session credentials support
 * @param {Object} baseSchema - Base schema without session credentials
 * @returns {Object} Complete schema with session credentials
 */
export function createToolSchema(baseSchema) {
  return {
    type: 'object',
    properties: {
      ...baseSchema.properties,
      sessionCredentials: getSessionCredentialsSchema()
    },
    required: baseSchema.required || []
  };
}