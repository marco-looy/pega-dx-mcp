import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class GetDataObjectsTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'dataviews';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_data_objects',
      description: 'Retrieve list of available data objects with metadata and HATEOAS links. Can optionally filter by data object type (data or case).',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['data', 'case'],
            description: 'Optional filter for data object type. "data" returns data type objects, "case" returns case type objects. If not provided, returns all data objects.'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: []
      }
    };
  }

  /**
   * Execute the get data objects operation
   */
  async execute(params) {
    const { type } = params;
    let sessionInfo = null;

    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Validate enum parameters if provided
      const enumValidation = this.validateEnumParams(params, {
        type: ['data', 'case']
      });
      if (enumValidation) {
        return enumValidation;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Data Objects List${type ? ` (type: ${type})` : ''}`,
        async () => await this.pegaClient.getDataObjects({ type }),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Data Objects List${type ? ` (type: ${type})` : ''}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
