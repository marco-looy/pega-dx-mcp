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
      description: 'Test connectivity to Pega Infinity server and verify authentication configuration. Supports both environment credentials and session-based credentials.',
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

      // Perform ping operation
      const result = await this.pegaClient.ping();

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
   * Format ping-specific response with detailed information
   * @param {Object} data - Ping response data
   * @param {Object} sessionInfo - Session information (if applicable)
   * @returns {string} Formatted ping response
   */
  formatPingResponse(data, sessionInfo = null) {
    let response = `## Ping Pega Service\n\n`;
    response += `*Operation completed at: ${data.timestamp}*\n\n`;
    
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
    response += `- **Token URL**: ${data.configuration.tokenUrl}\n`;
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
        response += `   - **Endpoint**: ${test.endpoint}\n`;
        response += `   - **Duration**: ${test.duration}\n`;
        response += `   - **Status**: ${test.message}\n`;
        
        // Add token information if available
        if (test.tokenInfo) {
          response += `   - **Token Details**:\n`;
          response += `     - Type: ${test.tokenInfo.type}\n`;
          response += `     - Length: ${test.tokenInfo.length} characters\n`;
          response += `     - Prefix: ${test.tokenInfo.prefix}\n`;
          response += `     - Acquired: ${test.tokenInfo.acquired ? 'Yes' : 'No'}\n`;
          response += `     - Cached: ${test.tokenInfo.cached ? 'Yes' : 'No'}\n`;
        }
        
        if (test.status) {
          response += `   - **HTTP Status**: ${test.status}\n`;
        }
      } else {
        response += `❌ **${test.test}**\n`;
        response += `   - **Endpoint**: ${test.endpoint}\n`;
        response += `   - **Duration**: ${test.duration}\n`;
        response += `   - **Error**: ${test.error}\n`;
        
        if (test.tokenInfo) {
          response += `   - **Token Details**:\n`;
          response += `     - Type: ${test.tokenInfo.type}\n`;
          response += `     - Length: ${test.tokenInfo.length} characters\n`;
          response += `     - Prefix: ${test.tokenInfo.prefix}\n`;
          response += `     - Acquired: ${test.tokenInfo.acquired ? 'Yes' : 'No'}\n`;
          response += `     - Cached: ${test.tokenInfo.cached ? 'Yes' : 'No'}\n`;
        }
        
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
