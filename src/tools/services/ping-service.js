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
    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      'Ping Pega Service',
      async () => await this.pegaClient.ping(),
      {}
    );
  }
}
