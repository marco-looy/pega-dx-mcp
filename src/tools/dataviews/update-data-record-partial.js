import { BaseTool } from '../../registry/base-tool.js';

export class UpdateDataRecordPartialTool extends BaseTool {
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
      name: 'update_data_record_partial',
      description: 'Partially update an existing data record based on conditional save plan configured for a savable Data Page. Only updates the provided fields, leaving other fields unchanged. Note: Not supported for PEGA System of records.',
      inputSchema: {
        type: 'object',
        properties: {
          dataViewID: {
            type: 'string',
            description: 'ID of savable Data Page to update. Must be a valid, existing data view identifier.'
          },
          data: {
            type: 'object',
            description: 'Data object containing properties to update in the data record. Only the specified properties will be updated, other fields remain unchanged.',
            additionalProperties: true
          },
          eTag: {
            type: 'string',
            description: 'eTag unique value for optimistic locking. Used to ensure the record has not been modified since the last read. Recommended for concurrent access scenarios.'
          },
          pageInstructions: {
            type: 'array',
            description: 'Optional list of page-related operations to be performed on embedded pages, page lists, or page group properties during the update.',
            items: {
              type: 'object'
            }
          }
        },
        required: ['dataViewID', 'data']
      }
    };
  }

  /**
   * Execute the partial update data record operation
   */
  async execute(params) {
    const { dataViewID, data, eTag, pageInstructions } = params;

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
      `Partial Data Record Update: ${dataViewID}`,
      async () => await this.pegaClient.updateDataRecordPartial(dataViewID, data, { eTag, pageInstructions })
    );
  }
}
