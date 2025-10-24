import { BaseTool } from '../../registry/base-tool.js';

export class DiagnoseConfigTool extends BaseTool {
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
      name: 'diagnose_pega_config',
      description: 'Diagnose Pega configuration and environment variables to troubleshoot connection issues. Shows what configuration the MCP server is using (without exposing secrets).',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  /**
   * Execute the diagnostic operation
   */
  async execute(params) {
    try {
      const config = this.pegaClient.client.config.pega;
      const oauth2Client = this.pegaClient.client.oauth2Client;

      // Mask sensitive values
      const maskValue = (value) => {
        if (!value) return '❌ NOT SET';
        if (value.length <= 4) return '***';
        return value.substring(0, 4) + '***' + value.substring(value.length - 4);
      };

      let response = `## Pega Configuration Diagnostics\n\n`;
      response += `*Generated at: ${new Date().toISOString()}*\n\n`;

      // Environment Variables Status
      response += `### Environment Variables\n`;
      response += `- **PEGA_BASE_URL**: ${process.env.PEGA_BASE_URL || '❌ NOT SET'}\n`;
      response += `- **PEGA_API_VERSION**: ${process.env.PEGA_API_VERSION || '❌ NOT SET (defaults to v2)'}\n`;
      response += `- **PEGA_CLIENT_ID**: ${maskValue(process.env.PEGA_CLIENT_ID)}\n`;
      response += `- **PEGA_CLIENT_SECRET**: ${maskValue(process.env.PEGA_CLIENT_SECRET)}\n`;
      response += `\n`;

      // Loaded Configuration
      response += `### Loaded Configuration\n`;
      response += `- **Base URL**: ${config.baseUrl || '❌ NOT SET'}\n`;
      response += `- **API Version**: ${config.apiVersion}\n`;
      response += `- **Client ID**: ${maskValue(config.clientId)}\n`;
      response += `- **Client Secret**: ${maskValue(config.clientSecret)}\n`;
      response += `- **Token URL**: ${config.tokenUrl || '❌ NOT SET'}\n`;
      response += `- **API Base URL**: ${config.apiBaseUrl || '❌ NOT SET'}\n`;
      response += `\n`;

      // Authentication Status
      response += `### Authentication Status\n`;
      const tokenInfo = oauth2Client.getTokenInfo();
      response += `- **Auth Mode**: ${tokenInfo.authMode.toUpperCase()}\n`;
      response += `- **Has Token**: ${tokenInfo.hasToken ? '✅ Yes' : '❌ No'}\n`;
      response += `- **Token Expired**: ${tokenInfo.isExpired ? '⚠️ Yes' : '✅ No'}\n`;
      response += `- **Config Source**: ${tokenInfo.configSource}\n`;
      response += `- **Cache Key**: ${tokenInfo.cacheKey}\n`;
      if (tokenInfo.hasToken && !tokenInfo.isExpired) {
        response += `- **Expires In**: ${tokenInfo.expiresInMinutes} minutes\n`;
      }
      response += `\n`;

      // Validation Checks
      response += `### Validation Checks\n`;
      const checks = [
        {
          name: 'Base URL set',
          passed: !!config.baseUrl,
          message: config.baseUrl ? '✅ Pass' : '❌ Fail - PEGA_BASE_URL not set'
        },
        {
          name: 'Client ID set',
          passed: !!config.clientId,
          message: config.clientId ? '✅ Pass' : '❌ Fail - PEGA_CLIENT_ID not set'
        },
        {
          name: 'Client Secret set',
          passed: !!config.clientSecret,
          message: config.clientSecret ? '✅ Pass' : '❌ Fail - PEGA_CLIENT_SECRET not set'
        },
        {
          name: 'Base URL format',
          passed: config.baseUrl && config.baseUrl.startsWith('http'),
          message: config.baseUrl && config.baseUrl.startsWith('http') ? '✅ Pass' : '❌ Fail - Invalid URL format'
        },
        {
          name: 'No /prweb in Base URL',
          passed: config.baseUrl && !config.baseUrl.includes('/prweb'),
          message: config.baseUrl && !config.baseUrl.includes('/prweb') ? '✅ Pass' : '⚠️ Warning - /prweb will be auto-cleaned'
        }
      ];

      for (const check of checks) {
        response += `- **${check.name}**: ${check.message}\n`;
      }
      response += `\n`;

      // Next Steps
      const allChecksPass = checks.every(c => c.passed);
      if (allChecksPass) {
        response += `### Status: ✅ Configuration Valid\n\n`;
        response += `All configuration checks passed. If you're still experiencing issues:\n`;
        response += `1. Try using the \`authenticate_pega\` tool to test authentication\n`;
        response += `2. Verify network connectivity to: ${config.baseUrl}\n`;
        response += `3. Check OAuth client configuration in Pega Infinity\n`;
      } else {
        response += `### Status: ❌ Configuration Issues Detected\n\n`;
        response += `Please fix the failing validation checks above.\n\n`;
        response += `**For MCP servers run via npx:**\n`;
        response += `- Ensure environment variables are set in your MCP client config\n`;
        response += `- Restart your MCP client completely after updating config\n\n`;
        response += `**For local development:**\n`;
        response += `- Create a \`.env\` file in the project root\n`;
        response += `- Set PEGA_BASE_URL, PEGA_CLIENT_ID, PEGA_CLIENT_SECRET\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: response
          }
        ]
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `## Error: Diagnose Configuration\n\n**Error**: ${error.message}\n\n*Error occurred at: ${new Date().toISOString()}*`
          }
        ]
      };
    }
  }
}
