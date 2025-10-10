import { config } from '../config.js';

export class OAuth2Client {
  constructor(sessionConfig = null) {
    // Use session config if provided, otherwise fall back to environment config
    this.config = sessionConfig || config;

    // Determine authentication mode
    this.authMode = this.determineAuthMode();

    // Token management
    this.accessToken = null;
    this.tokenExpiry = null;
    this.tokenExpiryBuffer = 5 * 60 * 1000; // 5 minutes buffer

    // Session-specific token cache key (for multi-session support)
    this.cacheKey = this.generateCacheKey();

    // Initialize token for direct token mode
    if (this.authMode === 'token') {
      this.initializeDirectToken();
    }
  }

  /**
   * Determine authentication mode based on configuration
   * @returns {string} 'oauth' or 'token'
   */
  determineAuthMode() {
    const { pega } = this.config;

    // Check if we have a direct access token
    if (pega.accessToken) {
      return 'token';
    }

    // Check if we have OAuth credentials
    if (pega.clientId && pega.clientSecret) {
      return 'oauth';
    }

    // Default to oauth mode (for backward compatibility)
    return 'oauth';
  }

  /**
   * Generate cache key for session-specific token storage
   * @returns {string} Cache key
   */
  generateCacheKey() {
    if (this.config._sessionMeta) {
      return `session_${this.config._sessionMeta.sessionId}`;
    }
    return 'global'; // For environment-based authentication
  }

  /**
   * Initialize direct token from configuration
   */
  initializeDirectToken() {
    const { pega } = this.config;

    if (pega.accessToken) {
      this.accessToken = pega.accessToken;

      // Set expiry if provided
      if (pega.tokenExpiry) {
        this.tokenExpiry = pega.tokenExpiry;
      }

      console.log(`🔐 Direct token initialized for ${this.cacheKey}`);
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getAccessToken() {
    // For direct token mode, return the token directly
    if (this.authMode === 'token') {
      return this.getDirectToken();
    }

    // For OAuth mode, check cache and refresh if needed
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - this.tokenExpiryBuffer) {
      return this.accessToken;
    }

    // Need to get a new token via OAuth
    return await this.fetchAccessToken();
  }

  /**
   * Get direct access token with expiry validation
   * @returns {string} Access token
   * @throws {Error} If token is missing or expired
   */
  getDirectToken() {
    if (!this.accessToken) {
      throw new Error('Direct access token not available');
    }

    // Check token expiry if provided
    if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
      throw new Error('Direct access token has expired');
    }

    return this.accessToken;
  }

  /**
   * Fetch a new access token using OAuth2 Client Credentials flow
   */
  async fetchAccessToken() {
    if (this.authMode === 'token') {
      throw new Error('Cannot fetch token in direct token mode');
    }

    try {
      const { pega } = this.config;
      const tokenUrl = pega.tokenUrl;
      const clientId = pega.clientId;
      const clientSecret = pega.clientSecret;

      if (!tokenUrl || !clientId || !clientSecret) {
        const configSource = this.config._sessionMeta ? 'session configuration' : 'environment variables';
        throw new Error(`OAuth2 configuration incomplete in ${configSource}. Need baseUrl, clientId, and clientSecret.`);
      }

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials',
        timeout: 30000
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth2 token request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const tokenData = await response.json();

      if (!tokenData.access_token) {
        throw new Error('OAuth2 response missing access_token');
      }

      // Cache the token
      this.accessToken = tokenData.access_token;
      
      // Calculate expiry time (default to 1 hour if not provided)
      const expiresIn = tokenData.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn * 1000);

      return this.accessToken;

    } catch (error) {
      // Clear cached token on error
      this.clearTokenCache();
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Failed to connect to OAuth2 endpoint: ${this.config.pega.tokenUrl}`);
      }
      
      throw error;
    }
  }

  /**
   * Clear cached token (used when token becomes invalid)
   */
  clearTokenCache() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Explicitly set access token (useful for direct token provisioning)
   * @param {string} token - Access token to store
   * @param {number} expiresInSeconds - Token expiry in seconds from now (default: 3600)
   */
  setAccessToken(token, expiresInSeconds = 3600) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token: must be a non-empty string');
    }

    this.accessToken = token;
    this.tokenExpiry = Date.now() + (expiresInSeconds * 1000);

    // Update auth mode to token if not already set
    if (this.authMode !== 'token') {
      this.authMode = 'token';
    }

    console.log(`🔐 Access token explicitly set for ${this.cacheKey} (expires in ${expiresInSeconds}s)`);
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo() {
    return {
      authMode: this.authMode,
      cacheKey: this.cacheKey,
      hasToken: !!this.accessToken,
      tokenExpiry: this.tokenExpiry,
      isExpired: this.tokenExpiry ? Date.now() > this.tokenExpiry : (this.authMode === 'token'),
      expiresInMinutes: this.tokenExpiry ? Math.round((this.tokenExpiry - Date.now()) / (1000 * 60)) : 0,
      configSource: this.config._sessionMeta ? 'session' : 'environment'
    };
  }
}
