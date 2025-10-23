import { config as envConfig } from '../config.js';
import { sessionManager } from '../session/session-manager.js';

/**
 * Session-aware configuration provider
 * Returns configuration from either session credentials or environment variables
 */
export class SessionConfig {
  /**
   * Get configuration for a session or fall back to environment
   * @param {string} [sessionId] - Optional session ID
   * @returns {Object} Configuration object
   */
  static getConfig(sessionId) {
    if (!sessionId) {
      // No session provided, use environment configuration
      return envConfig;
    }

    // Try to get session configuration
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      // Session not found or expired, fall back to environment
      console.warn(`⚠️ Session ${sessionId} not found, falling back to environment config`);
      return envConfig;
    }

    // Build session-specific configuration
    const sessionConfig = this.buildSessionConfig(session);

    console.log(`🔧 Using session config for ${sessionId} (${session.authMode} mode)`);
    return sessionConfig;
  }

  /**
   * Build configuration object from session data
   * @param {Object} session - Session object from session manager
   * @returns {Object} Pega configuration object
   */
  static buildSessionConfig(session) {
    const { credentials } = session;

    // Clean base URL (remove /prweb if present)
    let baseUrl = credentials.baseUrl;
    if (baseUrl && baseUrl.includes('/prweb')) {
      console.warn('⚠️ Session baseUrl contains "/prweb" - cleaning URL');
      baseUrl = baseUrl.replace(/\/prweb.*$/, '');
    }

    // Validate and normalize API version
    let apiVersion = (credentials.apiVersion || 'v2').toLowerCase();
    if (apiVersion !== 'v1' && apiVersion !== 'v2') {
      console.warn(`⚠️ Session API version "${apiVersion}" invalid. Must be "v1" or "v2". Defaulting to "v2".`);
      apiVersion = 'v2';
    }

    // Build configuration similar to env config structure
    const config = {
      pega: {
        baseUrl: baseUrl,
        _apiVersion: apiVersion,  // Store normalized version
        requestTimeout: 30000,

        // Authentication-specific fields
        ...(session.authMode === 'oauth' ? {
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          scope: ''  // Default empty scope like env config
        } : {
          // For token mode, we'll handle the token in OAuth2Client
          accessToken: credentials.accessToken,
          tokenExpiry: credentials.tokenExpiry
        }),

        // Computed URLs based on base URL and API version
        get tokenUrl() {
          return `${this.baseUrl}/prweb/PRRestService/oauth2/v1/token`;
        },
        get apiBaseUrl() {
          // Version-aware API base URL
          if (this._apiVersion === 'v1') {
            return `${this.baseUrl}/prweb/api/v1`;
          }
          return `${this.baseUrl}/prweb/api/application/${this._apiVersion}`;
        },
        get apiVersion() {
          return this._apiVersion;
        }
      },

      // Session metadata (for debugging/logging)
      _sessionMeta: {
        sessionId: session.sessionId,
        authMode: session.authMode,
        createdAt: session.createdAt,
        lastAccessed: session.lastAccessed
      }
    };

    return config;
  }

  /**
   * Validate that session configuration is complete
   * @param {Object} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  static validateConfig(config) {
    if (!config || !config.pega) {
      throw new Error('Invalid configuration: missing pega section');
    }

    const { pega } = config;

    // Required fields
    if (!pega.baseUrl) {
      throw new Error('Missing required configuration: pega.baseUrl');
    }

    // For OAuth mode, need client credentials
    if (pega.clientId || pega.clientSecret) {
      if (!pega.clientId || !pega.clientSecret) {
        throw new Error('OAuth mode requires both clientId and clientSecret');
      }
    }

    // For token mode, need access token
    if (pega.accessToken && typeof pega.accessToken !== 'string') {
      throw new Error('accessToken must be a string');
    }

    // Validate computed URLs
    try {
      const tokenUrl = pega.tokenUrl;
      const apiBaseUrl = pega.apiBaseUrl;

      if (!tokenUrl || !apiBaseUrl) {
        throw new Error('Failed to generate required URLs');
      }
    } catch (error) {
      throw new Error(`Configuration validation failed: ${error.message}`);
    }
  }

  /**
   * Create session-aware configuration with fallback
   * @param {string} [sessionId] - Optional session ID
   * @returns {Object} Configuration with session awareness
   */
  static createConfig(sessionId) {
    const config = this.getConfig(sessionId);

    // Validate the configuration
    this.validateConfig(config);

    // Add session-aware methods
    return new Proxy(config, {
      get(target, prop) {
        // Add helper methods to config object
        if (prop === 'isSessionConfig') {
          return !!sessionId && !!target._sessionMeta;
        }

        if (prop === 'getSessionInfo') {
          return () => target._sessionMeta || null;
        }

        if (prop === 'getAuthMode') {
          return () => target._sessionMeta?.authMode || 'oauth';
        }

        return target[prop];
      }
    });
  }
}

/**
 * Create configuration for a specific session or environment fallback
 * @param {string} [sessionId] - Optional session ID
 * @returns {Object} Configuration object
 */
export function getSessionConfig(sessionId) {
  return SessionConfig.createConfig(sessionId);
}

/**
 * Create configuration from session credentials directly
 * @param {Object} sessionCredentials - Session credentials
 * @param {string} [existingSessionId] - Optional existing session ID to update
 * @returns {Object} Object containing sessionId and configuration
 */
export function createSessionFromCredentials(sessionCredentials, existingSessionId = null) {
  let sessionId = existingSessionId;

  if (!sessionId || !sessionManager.getSession(sessionId)) {
    // Create new session
    sessionId = sessionManager.createSession(sessionCredentials);
  } else {
    // Update existing session
    sessionManager.updateSession(sessionId, sessionCredentials);
  }

  // Return session ID and configuration
  return {
    sessionId,
    config: SessionConfig.createConfig(sessionId)
  };
}