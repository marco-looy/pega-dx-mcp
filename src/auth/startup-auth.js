import { config } from '../config.js';
import { PegaClient } from '../api/pega-client.js';

/**
 * Attempt startup authentication with environment credentials
 * This function tries to authenticate at server startup to:
 * - Cache OAuth token early for faster first API call
 * - Provide fail-fast feedback if credentials are invalid
 * - Display authentication status in startup logs
 *
 * @returns {Promise<Object>} Authentication result
 */
export async function attemptStartupAuthentication() {
  const startTime = Date.now();

  try {
    // Check if environment credentials are configured
    const { pega } = config;

    if (!pega.baseUrl || !pega.clientId || !pega.clientSecret) {
      // No environment credentials - session-only mode
      return {
        status: 'no_env_credentials',
        mode: 'session-only',
        message: 'No environment credentials configured',
        details: 'Server started in session-only mode. Provide sessionCredentials with each tool call.'
      };
    }

    // Environment credentials present - attempt authentication
    console.error(`   🔑 Found environment credentials for ${pega.baseUrl}`);
    console.error(`   🔄 Attempting OAuth2 authentication...`);

    // Create PegaClient (uses environment config)
    const pegaClient = new PegaClient(null);

    // Get OAuth2 client from the version-specific client
    const oauth2Client = pegaClient.client.oauth2Client;

    // Attempt to get access token (triggers OAuth flow)
    const token = await oauth2Client.getAccessToken();

    const duration = Date.now() - startTime;

    // Get token info
    const tokenInfo = oauth2Client.getTokenInfo();

    // Calculate expiry
    const expiresInSeconds = tokenInfo.tokenExpiry
      ? Math.round((tokenInfo.tokenExpiry - Date.now()) / 1000)
      : 0;
    const expiresInMinutes = Math.round(expiresInSeconds / 60);

    return {
      status: 'success',
      mode: oauth2Client.authMode,
      duration: `${duration}ms`,
      tokenInfo: {
        acquired: !!token,
        length: token ? token.length : 0,
        prefix: token ? token.substring(0, 10) + '...' : 'None',
        expiresInSeconds,
        expiresInMinutes,
        expiresAt: tokenInfo.tokenExpiry ? new Date(tokenInfo.tokenExpiry).toISOString() : null
      },
      configuration: {
        baseUrl: pega.baseUrl,
        apiVersion: pegaClient.getApiVersion(),
        tokenUrl: oauth2Client.authMode === 'oauth' ? pega.tokenUrl : 'Direct Token'
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    // Authentication failed - return failure result
    // Server will continue (non-fatal)
    return {
      status: 'failed',
      duration: `${duration}ms`,
      error: {
        type: error.name || 'AuthenticationError',
        message: error.message,
        details: error.stack
      },
      configuration: {
        baseUrl: config.pega.baseUrl,
        hasClientId: !!config.pega.clientId,
        hasClientSecret: !!config.pega.clientSecret
      }
    };
  }
}

/**
 * Format authentication status for startup logs
 * @param {Object} result - Authentication result from attemptStartupAuthentication
 * @returns {string} Formatted status message for console.error
 */
export function formatAuthStatus(result) {
  let output = '';

  switch (result.status) {
    case 'success':
      output += '✅ Authentication successful\n';
      output += `   • Token acquired in ${result.duration}\n`;
      output += `   • Auth mode: ${result.mode.toUpperCase()}\n`;
      output += `   • API version: ${result.configuration.apiVersion.toUpperCase()}\n`;
      if (result.tokenInfo.expiresAt) {
        output += `   • Token expires: ${result.tokenInfo.expiresAt} (in ${result.tokenInfo.expiresInMinutes} minutes)\n`;
      }
      output += `   • Base URL: ${result.configuration.baseUrl}`;
      break;

    case 'failed':
      output += '⚠️  Authentication failed (server will continue)\n';
      output += `   • Error: ${result.error.message}\n`;
      output += `   • Duration: ${result.duration}\n`;
      output += '   • This is not fatal - you can still use sessionCredentials per-call\n';
      output += '   • Or fix your environment variables and restart';
      break;

    case 'no_env_credentials':
      output += 'ℹ️  No environment credentials configured\n';
      output += '   • Server started in session-only mode\n';
      output += '   • Provide sessionCredentials with each tool call\n';
      output += '   • Or configure PEGA_BASE_URL, PEGA_CLIENT_ID, PEGA_CLIENT_SECRET';
      break;

    default:
      output += '⚠️  Unknown authentication status';
  }

  return output;
}
