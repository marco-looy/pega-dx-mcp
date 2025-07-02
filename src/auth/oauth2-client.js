import { config } from '../config.js';

export class OAuth2Client {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.tokenExpiryBuffer = 5 * 60 * 1000; // 5 minutes buffer
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getAccessToken() {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - this.tokenExpiryBuffer) {
      return this.accessToken;
    }

    // Need to get a new token
    return await this.fetchAccessToken();
  }

  /**
   * Fetch a new access token using OAuth2 Client Credentials flow
   */
  async fetchAccessToken() {
    try {
      const tokenUrl = config.pega.tokenUrl;
      const clientId = config.pega.clientId;
      const clientSecret = config.pega.clientSecret;

      if (!tokenUrl || !clientId || !clientSecret) {
        throw new Error('OAuth2 configuration incomplete. Check PEGA_BASE_URL, PEGA_CLIENT_ID, and PEGA_CLIENT_SECRET environment variables.');
      }

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials',
        timeout: config.server.requestTimeout
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
        throw new Error(`Failed to connect to OAuth2 endpoint: ${config.pega.tokenUrl}`);
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
   * Get token info for debugging
   */
  getTokenInfo() {
    return {
      hasToken: !!this.accessToken,
      tokenExpiry: this.tokenExpiry,
      isExpired: this.tokenExpiry ? Date.now() > this.tokenExpiry : true,
      expiresInMinutes: this.tokenExpiry ? Math.round((this.tokenExpiry - Date.now()) / (1000 * 60)) : 0
    };
  }
}
