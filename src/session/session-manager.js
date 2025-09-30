import crypto from 'crypto';

/**
 * Session Manager for handling multi-user credential caching
 * Supports both OAuth credential-based and direct token-based authentication
 */
export class SessionManager {
  constructor(options = {}) {
    this.sessions = new Map();
    this.defaultTTL = options.defaultTTL || 2 * 60 * 60 * 1000; // 2 hours default
    this.cleanupInterval = options.cleanupInterval || 15 * 60 * 1000; // 15 minutes

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Create a new session with credentials
   * @param {Object} credentials - Session credentials
   * @param {string} credentials.baseUrl - Pega base URL (required)
   * @param {string} [credentials.apiVersion='v2'] - API version
   * @param {string} [credentials.clientId] - OAuth client ID
   * @param {string} [credentials.clientSecret] - OAuth client secret
   * @param {string} [credentials.accessToken] - Direct access token
   * @param {number} [credentials.tokenExpiry] - Token expiry in seconds from now
   * @param {number} [ttl] - Session TTL in milliseconds
   * @returns {string} Session ID
   */
  createSession(credentials, ttl = this.defaultTTL) {
    this.validateCredentials(credentials);

    const sessionId = this.generateSessionId();
    const expiresAt = Date.now() + ttl;

    // Determine authentication mode
    const authMode = credentials.accessToken ? 'token' : 'oauth';

    // Calculate token expiry for direct token mode
    let tokenExpiry = null;
    if (authMode === 'token' && credentials.tokenExpiry) {
      tokenExpiry = Date.now() + (credentials.tokenExpiry * 1000);
    }

    const sessionData = {
      sessionId,
      createdAt: Date.now(),
      expiresAt,
      lastAccessed: Date.now(),
      authMode,
      credentials: {
        baseUrl: credentials.baseUrl,
        apiVersion: credentials.apiVersion || 'v2',
        ...(authMode === 'oauth' ? {
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret
        } : {
          accessToken: credentials.accessToken,
          tokenExpiry
        })
      }
    };

    this.sessions.set(sessionId, sessionData);

    console.log(`📋 Session created: ${sessionId} (${authMode} mode, expires in ${Math.round(ttl / (1000 * 60))} minutes)`);

    return sessionId;
  }

  /**
   * Get session data by session ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session data or null if not found/expired
   */
  getSession(sessionId) {
    if (!sessionId) {
      return null;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      console.log(`🕒 Session expired and removed: ${sessionId}`);
      return null;
    }

    // Check if token is expired (for token mode)
    if (session.authMode === 'token' && session.credentials.tokenExpiry) {
      if (Date.now() > session.credentials.tokenExpiry) {
        this.sessions.delete(sessionId);
        console.log(`🔐 Token expired, session removed: ${sessionId}`);
        return null;
      }
    }

    // Update last accessed time
    session.lastAccessed = Date.now();

    return session;
  }

  /**
   * Update session credentials
   * @param {string} sessionId - Session ID
   * @param {Object} newCredentials - Updated credentials
   * @returns {boolean} Success status
   */
  updateSession(sessionId, newCredentials) {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    this.validateCredentials(newCredentials);

    // Update credentials while preserving session metadata
    const authMode = newCredentials.accessToken ? 'token' : 'oauth';

    let tokenExpiry = null;
    if (authMode === 'token' && newCredentials.tokenExpiry) {
      tokenExpiry = Date.now() + (newCredentials.tokenExpiry * 1000);
    }

    session.authMode = authMode;
    session.credentials = {
      baseUrl: newCredentials.baseUrl,
      apiVersion: newCredentials.apiVersion || session.credentials.apiVersion || 'v2',
      ...(authMode === 'oauth' ? {
        clientId: newCredentials.clientId,
        clientSecret: newCredentials.clientSecret
      } : {
        accessToken: newCredentials.accessToken,
        tokenExpiry
      })
    };

    console.log(`🔄 Session updated: ${sessionId} (${authMode} mode)`);

    return true;
  }

  /**
   * Delete a session
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  deleteSession(sessionId) {
    const existed = this.sessions.delete(sessionId);
    if (existed) {
      console.log(`🗑️ Session deleted: ${sessionId}`);
    }
    return existed;
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getStats() {
    const now = Date.now();
    const activeSessions = Array.from(this.sessions.values());

    return {
      totalSessions: activeSessions.length,
      oauthSessions: activeSessions.filter(s => s.authMode === 'oauth').length,
      tokenSessions: activeSessions.filter(s => s.authMode === 'token').length,
      expiredSessions: activeSessions.filter(s => now > s.expiresAt).length,
      oldestSession: activeSessions.length > 0 ?
        Math.min(...activeSessions.map(s => s.createdAt)) : null
    };
  }

  /**
   * Clean up expired sessions
   * @returns {number} Number of sessions cleaned up
   */
  cleanup() {
    const now = Date.now();
    let cleanedUp = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      // Check session expiry
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedUp++;
        continue;
      }

      // Check token expiry for token-based sessions
      if (session.authMode === 'token' && session.credentials.tokenExpiry) {
        if (now > session.credentials.tokenExpiry) {
          this.sessions.delete(sessionId);
          cleanedUp++;
        }
      }
    }

    if (cleanedUp > 0) {
      console.log(`🧹 Cleaned up ${cleanedUp} expired sessions`);
    }

    return cleanedUp;
  }

  /**
   * Start periodic cleanup
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Generate a unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Validate credentials object
   * @param {Object} credentials - Credentials to validate
   * @throws {Error} If credentials are invalid
   */
  validateCredentials(credentials) {
    console.log('🔍 SessionManager validateCredentials called with:', typeof credentials, credentials);
    if (!credentials || typeof credentials !== 'object') {
      console.log('❌ Validation failed: credentials is not an object');
      throw new Error('Credentials must be an object');
    }

    if (!credentials.baseUrl || typeof credentials.baseUrl !== 'string') {
      throw new Error('baseUrl is required and must be a string');
    }

    // Validate authentication mode
    const hasOAuthCreds = credentials.clientId && credentials.clientSecret;
    const hasToken = credentials.accessToken;

    if (!hasOAuthCreds && !hasToken) {
      throw new Error('Either provide clientId+clientSecret or accessToken');
    }

    if (hasOAuthCreds && hasToken) {
      throw new Error('Cannot provide both OAuth credentials and access token');
    }

    // Validate OAuth credentials
    if (hasOAuthCreds) {
      if (typeof credentials.clientId !== 'string' ||
          typeof credentials.clientSecret !== 'string') {
        throw new Error('clientId and clientSecret must be strings');
      }
    }

    // Validate token credentials
    if (hasToken) {
      if (typeof credentials.accessToken !== 'string') {
        throw new Error('accessToken must be a string');
      }

      if (credentials.tokenExpiry && typeof credentials.tokenExpiry !== 'number') {
        throw new Error('tokenExpiry must be a number (seconds)');
      }
    }

    // Validate optional fields
    if (credentials.apiVersion && typeof credentials.apiVersion !== 'string') {
      throw new Error('apiVersion must be a string');
    }
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();