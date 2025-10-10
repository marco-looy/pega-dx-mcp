import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class PingServiceTool extends BaseTool {
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
      name: 'ping_pega_service',
      description: 'Test connectivity and system availability of Pega Infinity server using existing authentication. Makes a lightweight API call to verify the server is responding. Use authenticate_pega tool first if you need to establish authentication.',
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
   * Execute the ping service operation
   */
  async execute(params) {
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Perform connectivity test (uses existing auth)
      const result = await this.testConnectivity();

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatPingResponse(result.data, sessionInfo)
            }
          ]
        };
      } else {
        return this.createResponse(false, 'Ping Pega Service', result.error);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `## Error: Ping Pega Service\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
          }
        ]
      };
    }
  }

  /**
   * Test connectivity to Pega server using a lightweight API call
   * @returns {Promise<Object>} Connectivity test results
   */
  async testConnectivity() {
    const tests = [];
    const startTime = Date.now();

    try {
      // Get OAuth2 client info
      const oauth2Client = this.pegaClient.client.oauth2Client;
      const tokenInfo = oauth2Client.getTokenInfo();

      // Test 1: Verify we have authentication
      const authTestStart = Date.now();
      let token;
      try {
        token = await oauth2Client.getAccessToken();
        const authTestDuration = Date.now() - authTestStart;

        tests.push({
          test: 'Authentication Available',
          success: true,
          duration: `${authTestDuration}ms`,
          endpoint: oauth2Client.authMode === 'oauth' ? 'OAuth2 Token' : 'Direct Token',
          message: `Using ${oauth2Client.authMode.toUpperCase()} authentication`,
          tokenInfo: {
            type: 'Bearer',
            length: token ? token.length : 0,
            prefix: token ? token.substring(0, 10) + '...' : 'None',
            acquired: !!token,
            cached: tokenInfo.cached,
            expiresInMinutes: tokenInfo.expiresInMinutes
          }
        });
      } catch (authError) {
        const authTestDuration = Date.now() - authTestStart;
        tests.push({
          test: 'Authentication Available',
          success: false,
          duration: `${authTestDuration}ms`,
          endpoint: oauth2Client.authMode === 'oauth' ? 'OAuth2 Token' : 'Direct Token',
          error: authError.message,
          troubleshooting: [
            'Run authenticate_pega tool to establish authentication',
            'Verify credentials are valid',
            'Check if token has expired'
          ]
        });

        // If auth fails, return early
        return {
          success: false,
          error: {
            type: 'AUTHENTICATION_ERROR',
            message: 'Authentication not available',
            details: authError.message,
            tests
          }
        };
      }

      // Test 2: Make a lightweight API call to test connectivity
      const apiTestStart = Date.now();
      try {
        const result = await this.pegaClient.getCaseTypes();
        const apiTestDuration = Date.now() - apiTestStart;

        if (result.success) {
          const caseTypeCount = result.data?.caseTypes?.length || 0;
          tests.push({
            test: 'API Connectivity',
            success: true,
            duration: `${apiTestDuration}ms`,
            endpoint: `${this.pegaClient.client.getApiBaseUrl()}/casetypes`,
            status: result.status,
            message: `Server is responding (found ${caseTypeCount} case types)`
          });
        } else {
          tests.push({
            test: 'API Connectivity',
            success: false,
            duration: `${apiTestDuration}ms`,
            endpoint: `${this.pegaClient.client.getApiBaseUrl()}/casetypes`,
            status: result.error?.status,
            error: result.error?.message || 'API call failed',
            troubleshooting: [
              'Verify baseUrl is correct',
              'Check network connectivity',
              'Ensure user has access to case types',
              'Verify Pega DX API is enabled'
            ]
          });
        }
      } catch (apiError) {
        const apiTestDuration = Date.now() - apiTestStart;
        tests.push({
          test: 'API Connectivity',
          success: false,
          duration: `${apiTestDuration}ms`,
          endpoint: `${this.pegaClient.client.getApiBaseUrl()}/casetypes`,
          error: apiError.message,
          troubleshooting: [
            'Verify baseUrl is correct and accessible',
            'Check network connectivity to Pega instance',
            'Ensure Pega DX API is enabled',
            'Check firewall settings'
          ]
        });
      }

      const totalDuration = Date.now() - startTime;
      const allTestsPassed = tests.every(test => test.success);

      return {
        success: allTestsPassed,
        data: {
          timestamp: new Date().toISOString(),
          totalDuration: `${totalDuration}ms`,
          apiVersion: this.pegaClient.getApiVersion(),
          configuration: {
            baseUrl: this.pegaClient.client.config.pega.baseUrl,
            apiVersion: this.pegaClient.client.config.pega.apiVersion,
            apiBaseUrl: this.pegaClient.client.config.pega.apiBaseUrl,
            authMode: oauth2Client.authMode,
            configSource: tokenInfo.configSource
          },
          tests
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Connectivity test failed',
          details: error.message,
          tests
        }
      };
    }
  }

  /**
   * Format ping-specific response with detailed information
   * @param {Object} data - Ping response data
   * @param {Object} sessionInfo - Session information (if applicable)
   * @returns {string} Formatted ping response
   */
  formatPingResponse(data, sessionInfo = null) {
    let response = `## Ping Pega Service\n\n`;

    // Check overall status
    const allTestsPassed = data.tests.every(test => test.success);
    if (allTestsPassed) {
      response += `✅ **All Tests Passed**\n\n`;
    } else {
      response += `⚠️  **Some Tests Failed**\n\n`;
    }

    response += `*Completed at: ${data.timestamp}*\n`;
    response += `*Total Duration: ${data.totalDuration}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n`;
      response += '\n';
    }

    // Configuration Section
    response += `### Configuration\n`;
    response += `- **Base URL**: ${data.configuration.baseUrl}\n`;
    response += `- **API Base URL**: ${data.configuration.apiBaseUrl}\n`;
    if (data.configuration.apiVersion) {
      response += `- **API Version**: ${data.configuration.apiVersion}\n`;
    }
    response += `- **Authentication Mode**: ${data.configuration.authMode.toUpperCase()}\n`;
    response += `- **Configuration Source**: ${data.configuration.configSource}\n`;
    response += '\n';

    // Test Results Section
    response += `### Test Results\n`;
    for (const test of data.tests) {
      if (test.success) {
        response += `✅ **${test.test}**\n`;
        response += `   - **Duration**: ${test.duration}\n`;
        if (test.endpoint) {
          response += `   - **Endpoint**: ${test.endpoint}\n`;
        }
        if (test.message) {
          response += `   - **Status**: ${test.message}\n`;
        }

        // Add token information if available
        if (test.tokenInfo) {
          response += `   - **Token Details**:\n`;
          response += `     - Type: ${test.tokenInfo.type}\n`;
          response += `     - Length: ${test.tokenInfo.length} characters\n`;
          response += `     - Prefix: ${test.tokenInfo.prefix}\n`;
          response += `     - Cached: ${test.tokenInfo.cached ? 'Yes' : 'No'}\n`;
          if (test.tokenInfo.expiresInMinutes > 0) {
            response += `     - Expires In: ${test.tokenInfo.expiresInMinutes} minutes\n`;
          }
        }

        if (test.status) {
          response += `   - **HTTP Status**: ${test.status}\n`;
        }
      } else {
        response += `❌ **${test.test}**\n`;
        response += `   - **Duration**: ${test.duration}\n`;
        if (test.endpoint) {
          response += `   - **Endpoint**: ${test.endpoint}\n`;
        }
        response += `   - **Error**: ${test.error}\n`;

        if (test.status) {
          response += `   - **HTTP Status**: ${test.status}\n`;
        }

        if (test.troubleshooting) {
          response += `   - **Troubleshooting**:\n`;
          for (const tip of test.troubleshooting) {
            response += `     • ${tip}\n`;
          }
        }
      }
      response += '\n';
    }

    return response;
  }
}
