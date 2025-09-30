/**
 * Session parameter utilities for MCP tool integration
 * Provides standardized session parameter extraction and validation
 */

/**
 * Extract and validate session parameters from tool arguments
 * @param {Object} params - Tool execution parameters
 * @returns {Object|null} Extracted session parameters or null if none provided
 */
export function extractSessionParams(params) {
  if (!params || !params.sessionCredentials) {
    return null;
  }

  try {
    // Extract and parse session credentials (handle both object and string)
    let sessionCredentials = params.sessionCredentials;

    // If it's a string, try to parse it as JSON
    if (typeof sessionCredentials === 'string') {
      console.log(`🔧 Parsing session credentials from string: ${sessionCredentials.substring(0, 100)}...`);
      sessionCredentials = JSON.parse(sessionCredentials);
    }

    console.log(`🔧 Session credentials type: ${typeof sessionCredentials}`, sessionCredentials);

    // Validate the structure
    if (!sessionCredentials || typeof sessionCredentials !== 'object') {
      throw new Error('Session credentials must be an object');
    }

    return sessionCredentials;

  } catch (error) {
    console.error('❌ Failed to extract session parameters:', error.message);
    throw new Error(`Session parameter extraction error: ${error.message}`);
  }
}

/**
 * Validate session credentials structure
 * @param {Object} sessionCredentials - Session credentials to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateSessionCredentials(sessionCredentials) {
  const errors = [];

  if (!sessionCredentials || typeof sessionCredentials !== 'object') {
    return {
      isValid: false,
      errors: ['Session credentials must be an object']
    };
  }

  // Check for required baseUrl
  if (!sessionCredentials.baseUrl || typeof sessionCredentials.baseUrl !== 'string') {
    errors.push('baseUrl is required and must be a string');
  }

  // Validate authentication mode
  const hasOAuthCreds = sessionCredentials.clientId && sessionCredentials.clientSecret;
  const hasToken = sessionCredentials.accessToken;

  if (!hasOAuthCreds && !hasToken) {
    errors.push('Either provide clientId+clientSecret or accessToken');
  }

  if (hasOAuthCreds && hasToken) {
    errors.push('Cannot provide both OAuth credentials and access token');
  }

  // Validate OAuth credentials
  if (hasOAuthCreds) {
    if (typeof sessionCredentials.clientId !== 'string') {
      errors.push('clientId must be a string');
    }
    if (typeof sessionCredentials.clientSecret !== 'string') {
      errors.push('clientSecret must be a string');
    }
  }

  // Validate token credentials
  if (hasToken) {
    if (typeof sessionCredentials.accessToken !== 'string') {
      errors.push('accessToken must be a string');
    }
    if (sessionCredentials.tokenExpiry && typeof sessionCredentials.tokenExpiry !== 'number') {
      errors.push('tokenExpiry must be a number (seconds)');
    }
  }

  // Validate optional fields
  if (sessionCredentials.apiVersion && typeof sessionCredentials.apiVersion !== 'string') {
    errors.push('apiVersion must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get authentication mode from session credentials
 * @param {Object} sessionCredentials - Session credentials object
 * @returns {string} 'oauth' or 'token'
 */
export function getAuthMode(sessionCredentials) {
  if (!sessionCredentials) {
    return 'oauth'; // Default fallback
  }

  return sessionCredentials.accessToken ? 'token' : 'oauth';
}

/**
 * Create session info object for responses
 * @param {string} sessionId - Session ID
 * @param {Object} sessionCredentials - Session credentials
 * @returns {Object} Session info for response formatting
 */
export function createSessionInfo(sessionId, sessionCredentials) {
  return {
    sessionId,
    authMode: getAuthMode(sessionCredentials),
    configSource: 'session'
  };
}