import { BaseTool } from '../../registry/base-tool.js';

export class UpdateDataRecordFullTool extends BaseTool {
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
      name: 'update_data_record_full',
      description: 'Fully update an existing data record based on conditional save plan configured for a savable Data Page. Overrides the entire data record with the provided data object.',
      inputSchema: {
        type: 'object',
        properties: {
          dataViewID: {
            type: 'string',
            description: 'ID of savable Data Page to update. Must be a valid, existing data view identifier.'
          },
          data: {
            type: 'object',
            description: 'Data object containing all properties to update in the data record. This will replace the entire existing record.',
            additionalProperties: true
          }
        },
        required: ['dataViewID', 'data']
      }
    };
  }

  /**
   * Execute the update data record full operation
   */
  async execute(params) {
    const { dataViewID, data } = params;

    // Validate required parameters
    const requiredValidation = this.validateRequiredParams(params, ['dataViewID', 'data']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate that data is an object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {
        error: 'Invalid data parameter. data must be a valid object containing the record properties to update.'
      };
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Full Data Record Update: ${dataViewID}`,
      async () => await this.pegaClient.updateDataRecordFull(dataViewID, data)
    );
  }
}
