import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class DeleteDataRecordTool extends BaseTool {
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
      name: 'delete_data_record',
      description: 'Delete a data record based on conditional save plan configured for a savable Data Page. Only supported on data object classes. Requires primary key(s) to uniquely identify the record to delete.',
      inputSchema: {
        type: 'object',
        properties: {
          dataViewID: {
            type: 'string',
            description: 'ID of savable Data Page containing the record to delete. Must be a valid data page identifier configured for delete operations.'
          },
          dataViewParameters: {
            type: 'string',
            description: 'Primary key(s) as JSON string to uniquely identify the data record to delete. Must be a valid JSON object containing key-value pairs. For example: "{\\"CustomerID\\": \\"12345\\"}" or "{\\"OrderID\\": \\"O-1001\\", \\"CustomerID\\": \\"C-5678\\"}". Note: String format like "CustomerID=12345" will cause validation errors.'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['dataViewID', 'dataViewParameters']
      }
    };
  }

  /**
   * Execute the delete data record operation
   */
  async execute(params) {
    const { dataViewID, dataViewParameters } = params;
    let sessionInfo = null;

    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters
      const requiredValidation = this.validateRequiredParams(params, ['dataViewID', 'dataViewParameters']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Delete Data Record: ${dataViewID}`,
        async () => await this.pegaClient.deleteDataRecord(dataViewID, dataViewParameters),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Delete Data Record: ${dataViewID}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
