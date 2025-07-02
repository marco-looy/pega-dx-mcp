import { config } from '../config.js';
import { OAuth2Client } from '../auth/oauth2-client.js';

export class PingServiceTool {
  static getDefinition() {
    return {
      name: 'ping_pega_service',
      description: 'Test OAuth2 connectivity to Pega Platform and verify authentication configuration',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    };
  }

  async execute(args) {
    try {
      const results = {
        success: true,
        timestamp: new Date().toISOString(),
        configuration: {
          baseUrl: config.pega.baseUrl,
          apiVersion: config.pega.apiVersion,
          tokenUrl: config.pega.tokenUrl,
          apiBaseUrl: config.pega.apiBaseUrl
        },
        tests: []
      };

      // Test OAuth endpoint connectivity
      const oauthResult = await this.testOAuthEndpoint();
      results.tests.push(oauthResult);

      if (!oauthResult.success) {
        results.success = false;
      }

      return {
        content: [
          {
            type: 'text',
            text: this.formatResults(results)
          }
        ]
      };
    } catch (error) {
      console.error('Ping service error:', error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Ping Service Test Failed**\n\nError: ${error.message}\n\nStack: ${error.stack || 'No stack trace available'}`
          }
        ]
      };
    }
  }

  async testOAuthEndpoint() {
    const startTime = Date.now();
    
    try {
      const oauth2Client = new OAuth2Client();
      await oauth2Client.getAccessToken();
      
      const duration = Date.now() - startTime;
      
      return {
        test: 'OAuth2 Authentication',
        success: true,
        duration: `${duration}ms`,
        endpoint: config.pega.tokenUrl,
        message: 'Successfully obtained access token'
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        test: 'OAuth2 Authentication',
        success: false,
        duration: `${duration}ms`,
        endpoint: config.pega.tokenUrl,
        error: error.message,
        troubleshooting: [
          'Verify PEGA_BASE_URL is correct and accessible',
          'Check PEGA_CLIENT_ID and PEGA_CLIENT_SECRET are valid',
          'Ensure OAuth2 client is configured in Pega Platform',
          'Verify network connectivity to Pega instance'
        ]
      };
    }
  }


  formatResults(results) {
    let output = '';
    
    if (results.success) {
      output += '✅ **Pega Service Ping - SUCCESS**\n\n';
    } else {
      output += '❌ **Pega Service Ping - FAILED**\n\n';
    }
    
    output += `**Configuration:**\n`;
    output += `- Base URL: ${results.configuration.baseUrl}\n`;
    output += `- API Version: ${results.configuration.apiVersion}\n`;
    output += `- Token URL: ${results.configuration.tokenUrl}\n`;
    output += `- API Base URL: ${results.configuration.apiBaseUrl}\n\n`;
    
    output += `**Test Results:**\n`;
    
    for (const test of results.tests) {
      if (test.success) {
        output += `✅ **${test.test}**\n`;
        output += `   - Endpoint: ${test.endpoint}\n`;
        output += `   - Duration: ${test.duration}\n`;
        output += `   - Status: ${test.message}\n`;
        if (test.status) {
          output += `   - HTTP Status: ${test.status}\n`;
        }
      } else {
        output += `❌ **${test.test}**\n`;
        output += `   - Endpoint: ${test.endpoint}\n`;
        output += `   - Duration: ${test.duration}\n`;
        output += `   - Error: ${test.error}\n`;
        if (test.status) {
          output += `   - HTTP Status: ${test.status}\n`;
        }
        if (test.troubleshooting) {
          output += `   - Troubleshooting:\n`;
          for (const tip of test.troubleshooting) {
            output += `     • ${tip}\n`;
          }
        }
      }
      output += '\n';
    }
    
    output += `**Test completed at:** ${results.timestamp}`;
    
    return output;
  }
}
