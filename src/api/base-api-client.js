import { OAuth2Client } from '../auth/oauth2-client.js';

/**
 * Base API client providing shared functionality for V1 and V2 clients
 *
 * This abstract class provides common patterns for:
 * - Authentication management via OAuth2Client
 * - HTTP request handling with proper headers
 * - URL encoding for safe parameter passing
 * - Session-aware configuration
 *
 * @abstract
 */
export class BaseApiClient {
  /**
   * Initialize base API client with configuration
   * @param {Object} sessionConfig - Session-specific configuration or null for environment config
   */
  constructor(sessionConfig = null) {
    // Use session config if provided, otherwise fall back to environment config
    // Session config is used for multi-user authentication scenarios
    this.config = sessionConfig;
    this.oauth2Client = new OAuth2Client(this.config);

    // Store base URL for convenience
    this.baseUrl = this.config.pega.apiBaseUrl;

    // Log configuration source for debugging
    const configSource = this.config._sessionMeta ?
      `session ${this.config._sessionMeta.sessionId}` : 'environment';
    console.log(`🔧 ${this.constructor.name} initialized with ${configSource} config (${this.oauth2Client.authMode} mode)`);
  }

  /**
   * Get API version-specific base URL
   * Must be implemented by subclass to provide correct base URL for API version
   *
   * @abstract
   * @returns {string} Full base URL for API requests
   * @example
   * // V1: https://pega.com/prweb/api/v1
   * // V2: https://pega.com/prweb/api/application/v2
   */
  getApiBaseUrl() {
    throw new Error('getApiBaseUrl() must be implemented by subclass');
  }

  /**
   * Get API version identifier
   * @abstract
   * @returns {string} API version ('v1' or 'v2')
   */
  getApiVersion() {
    throw new Error('getApiVersion() must be implemented by subclass');
  }

  /**
   * Make authenticated HTTP request with proper error handling
   *
   * @param {string} url - Full API URL
   * @param {Object} options - HTTP request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param {Object} options.headers - Additional headers
   * @param {string} options.body - Request body (pre-stringified)
   * @param {number} options.timeout - Request timeout in milliseconds
   * @returns {Promise<Object>} Structured response with success/error information
   *
   * @example
   * const response = await this.makeRequest(url, {
   *   method: 'GET',
   *   headers: { 'x-origin-channel': 'Web' }
   * });
   */
  async makeRequest(url, options = {}) {
    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();

      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      };

      // Make request with timeout
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: options.timeout || this.config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses using version-specific error handler
      if (!response.ok) {
        return await this.handleErrorResponse(response);
      }

      // Parse successful response - handle both JSON and empty/text responses
      let data;
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');

      // Check if response has content and is JSON
      if (contentLength === '0' || !contentType || !contentType.includes('application/json')) {
        // Handle empty response or non-JSON response (common for DELETE operations)
        const textResponse = await response.text();
        data = textResponse ? { message: textResponse } : { message: 'Operation completed successfully' };
      } else {
        // Handle JSON response
        try {
          data = await response.json();
        } catch (jsonError) {
          // Can't read body twice - use generic success message
          data = { message: 'Operation completed successfully' };
        }
      }

      // Extract eTag if present (V2 uses this for optimistic locking)
      const eTag = response.headers.get('etag');

      return {
        success: true,
        data,
        eTag,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to connect to Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Handle error responses from Pega API
   * Must be implemented by subclass to handle version-specific error formats
   *
   * @abstract
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response
   */
  async handleErrorResponse(response) {
    throw new Error('handleErrorResponse() must be implemented by subclass');
  }

  /**
   * Safely encode URI component for use in URLs
   * Handles null/undefined values
   *
   * @param {string} value - Value to encode
   * @returns {string} Encoded value
   */
  encodeParam(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return encodeURIComponent(value);
  }

  /**
   * Build query string from parameters object
   *
   * @param {Object} params - Parameters object
   * @returns {string} Query string (with leading ? if not empty)
   *
   * @example
   * buildQueryString({ viewType: 'page', pageName: 'pyDetails' })
   * // Returns: "?viewType=page&pageName=pyDetails"
   */
  buildQueryString(params) {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value);
      }
    }

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Check if a property is a Pega system property
   * System properties start with 'px' or 'py' prefix
   *
   * @param {string} propertyName - Property name to check
   * @returns {boolean} True if system property
   */
  isSystemProperty(propertyName) {
    if (!propertyName || typeof propertyName !== 'string') {
      return false;
    }
    return propertyName.startsWith('px') ||
           propertyName.startsWith('py') ||
           propertyName.startsWith('pz');
  }

  /**
   * Test OAuth2 connectivity and verify authentication configuration
   *
   * @returns {Promise<Object>} Structured response with ping test results
   */
  async ping() {
    const startTime = Date.now();

    try {
      // Test authentication by getting an access token
      const token = await this.oauth2Client.getAccessToken();

      const duration = Date.now() - startTime;

      // Get token info without exposing the actual token
      const tokenInfo = {
        type: 'Bearer',
        length: token ? token.length : 0,
        prefix: token ? token.substring(0, 10) + '...' : 'None',
        acquired: !!token,
        cached: !!this.oauth2Client.accessToken,
        authMode: this.oauth2Client.authMode
      };

      // Use session-aware configuration
      const { pega } = this.config;

      return {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          apiVersion: this.getApiVersion(),
          configuration: {
            baseUrl: pega.baseUrl,
            apiVersion: pega.apiVersion,
            tokenUrl: pega.tokenUrl,
            apiBaseUrl: pega.apiBaseUrl,
            authMode: this.oauth2Client.authMode,
            configSource: this.config._sessionMeta ? 'session' : 'environment'
          },
          tests: [{
            test: `${this.oauth2Client.authMode.toUpperCase()} Authentication`,
            success: true,
            duration: `${duration}ms`,
            endpoint: this.oauth2Client.authMode === 'oauth' ? pega.tokenUrl : 'Direct Token',
            message: this.oauth2Client.authMode === 'oauth' ?
              'Successfully obtained access token' :
              'Successfully validated direct access token',
            tokenInfo: tokenInfo
          }]
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Use session-aware configuration for error reporting
      const { pega } = this.config;

      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: `${this.oauth2Client.authMode.toUpperCase()} authentication failed`,
          details: error.message,
          timestamp: new Date().toISOString(),
          apiVersion: this.getApiVersion(),
          configuration: {
            baseUrl: pega.baseUrl,
            apiVersion: pega.apiVersion,
            tokenUrl: pega.tokenUrl,
            apiBaseUrl: pega.apiBaseUrl,
            authMode: this.oauth2Client.authMode,
            configSource: this.config._sessionMeta ? 'session' : 'environment'
          },
          tests: [{
            test: `${this.oauth2Client.authMode.toUpperCase()} Authentication`,
            success: false,
            duration: `${duration}ms`,
            endpoint: this.oauth2Client.authMode === 'oauth' ? pega.tokenUrl : 'Direct Token',
            error: error.message,
            tokenInfo: {
              type: 'Bearer',
              length: 0,
              prefix: 'None',
              acquired: false,
              cached: false,
              authMode: this.oauth2Client.authMode
            },
            troubleshooting: this.oauth2Client.authMode === 'oauth' ? [
              'Verify baseUrl is correct and accessible',
              'Check clientId and clientSecret are valid',
              'Ensure OAuth2 client is configured in Pega Infinity',
              'Verify network connectivity to Pega instance'
            ] : [
              'Verify the provided access token is valid',
              'Check if the token has expired',
              'Ensure the token has appropriate permissions',
              'Verify network connectivity to Pega instance'
            ]
          }]
        }
      };
    }
  }
}
