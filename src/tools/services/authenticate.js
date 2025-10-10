import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class AuthenticateTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'services';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'authenticate_pega',
      description: 'Authenticate with Pega Infinity server using OAuth2 client credentials or direct access token. Stores the authentication token in session for use by other tools. This tool should be used before making API calls when you want to explicitly manage authentication.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: []
      }
    };
  }

  /**
   * Execute the authentication operation
   */
  async execute(params) {
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Perform authentication
      const result = await this.authenticateAndStore();

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatAuthenticationResponse(result.data, sessionInfo)
            }
          ]
        };
      } else {
        return this.createResponse(false, 'Authenticate Pega', result.error);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `## Error: Authenticate Pega\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
          }
        ]
      };
    }
  }

  /**
   * Authenticate and store token in OAuth2Client
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateAndStore() {
    const startTime = Date.now();

    try {
      // Get OAuth2 client from PegaClient
      const oauth2Client = this.pegaClient.client.oauth2Client;

      // Attempt to get or fetch access token
      const token = await oauth2Client.getAccessToken();

      const duration = Date.now() - startTime;

      // Get token info (without exposing actual token)
      const tokenInfo = oauth2Client.getTokenInfo();

      // Calculate expiry time
      const expiresInSeconds = tokenInfo.tokenExpiry
        ? Math.round((tokenInfo.tokenExpiry - Date.now()) / 1000)
        : 0;

      return {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          sessionId: oauth2Client.cacheKey,
          authMode: oauth2Client.authMode,
          tokenInfo: {
            type: 'Bearer',
            length: token ? token.length : 0,
            prefix: token ? token.substring(0, 10) + '...' : 'None',
            acquired: !!token,
            cached: !!oauth2Client.accessToken,
            expiresIn: expiresInSeconds,
            expiresAt: tokenInfo.tokenExpiry ? new Date(tokenInfo.tokenExpiry).toISOString() : null
          },
          configuration: {
            baseUrl: this.pegaClient.client.config.pega.baseUrl,
            apiVersion: this.pegaClient.getApiVersion(),
            tokenUrl: oauth2Client.authMode === 'oauth'
              ? this.pegaClient.client.config.pega.tokenUrl
              : 'Direct Token',
            configSource: tokenInfo.configSource
          }
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const oauth2Client = this.pegaClient.client.oauth2Client;

      return {
        success: false,
        error: {
          type: 'AUTHENTICATION_ERROR',
          message: `${oauth2Client.authMode.toUpperCase()} authentication failed`,
          details: error.message,
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          authMode: oauth2Client.authMode,
          troubleshooting: oauth2Client.authMode === 'oauth' ? [
            'Verify baseUrl is correct and accessible',
            'Check clientId and clientSecret are valid',
            'Ensure OAuth2 client is configured in Pega Infinity',
            'Verify network connectivity to Pega instance',
            'Check that the OAuth2 client has appropriate permissions'
          ] : [
            'Verify the provided access token is valid',
            'Check if the token has expired',
            'Ensure the token has appropriate permissions',
            'Verify network connectivity to Pega instance'
          ]
        }
      };
    }
  }

  /**
   * Format authentication-specific response
   * @param {Object} data - Authentication response data
   * @param {Object} sessionInfo - Session information (if applicable)
   * @returns {string} Formatted authentication response
   */
  formatAuthenticationResponse(data, sessionInfo = null) {
    let response = `## Authenticate Pega\n\n`;
    response += `✅ **Authentication Successful**\n\n`;
    response += `*Completed at: ${data.timestamp}*\n`;
    response += `*Duration: ${data.duration}*\n\n`;

    // Session Information
    response += `### Session Information\n`;
    response += `- **Session ID**: ${data.sessionId}\n`;
    response += `- **Authentication Mode**: ${data.authMode.toUpperCase()}\n`;
    response += `- **Configuration Source**: ${data.configuration.configSource}\n`;
    response += '\n';

    // Configuration Section
    response += `### Configuration\n`;
    response += `- **Base URL**: ${data.configuration.baseUrl}\n`;
    response += `- **API Version**: ${data.configuration.apiVersion}\n`;
    response += `- **Token URL**: ${data.configuration.tokenUrl}\n`;
    response += '\n';

    // Token Information Section
    response += `### Token Information\n`;
    response += `- **Type**: ${data.tokenInfo.type}\n`;
    response += `- **Length**: ${data.tokenInfo.length} characters\n`;
    response += `- **Prefix**: ${data.tokenInfo.prefix}\n`;
    response += `- **Acquired**: ${data.tokenInfo.acquired ? 'Yes' : 'No'}\n`;
    response += `- **Cached**: ${data.tokenInfo.cached ? 'Yes' : 'No'}\n`;
    if (data.tokenInfo.expiresIn > 0) {
      response += `- **Expires In**: ${data.tokenInfo.expiresIn} seconds (${Math.round(data.tokenInfo.expiresIn / 60)} minutes)\n`;
      response += `- **Expires At**: ${data.tokenInfo.expiresAt}\n`;
    }
    response += '\n';

    // Usage Instructions
    response += `### Next Steps\n`;
    response += `The authentication token has been stored in the session cache. You can now:\n`;
    response += `- Use other Pega tools without re-authenticating\n`;
    response += `- Test connectivity with the \`ping_pega_service\` tool\n`;
    if (sessionInfo) {
      response += `- Reference this session using sessionId: \`${data.sessionId}\`\n`;
    }
    response += '\n';

    return response;
  }
}
