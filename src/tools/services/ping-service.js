import { BaseTool } from '../../registry/base-tool.js';

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
      description: 'Test OAuth2 connectivity to Pega Platform and verify authentication configuration',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  /**
   * Execute the ping service operation
   */
  async execute(params) {
    try {
      const result = await this.pegaClient.ping();
      
      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatPingResponse(result.data)
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
            text: `## Error: Ping Pega Service\n\n**Unexpected Error**: ${error.message}\n\n*Error occurred at: ${new Date().toISOString()}*`
          }
        ]
      };
    }
  }

  /**
   * Format ping-specific response with detailed information
   * @param {Object} data - Ping response data
   * @returns {string} Formatted ping response
   */
  formatPingResponse(data) {
    let response = `## Ping Pega Service\n\n`;
    response += `*Operation completed at: ${data.timestamp}*\n\n`;
    
    // Configuration Section
    response += `### Configuration\n`;
    response += `- **Base URL**: ${data.configuration.baseUrl}\n`;
    response += `- **API Base URL**: ${data.configuration.apiBaseUrl}\n`;
    response += `- **Token URL**: ${data.configuration.tokenUrl}\n`;
    if (data.configuration.apiVersion) {
      response += `- **API Version**: ${data.configuration.apiVersion}\n`;
    }
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
