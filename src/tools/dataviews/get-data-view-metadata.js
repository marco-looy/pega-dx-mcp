import { BaseTool } from '../../registry/base-tool.js';

export class GetDataViewMetadataTool extends BaseTool {
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
      name: 'get_data_view_metadata',
      description: 'Retrieve data view metadata which includes data view parameters and list of queryable fields. Supports both queryable and non-queryable data views.',
      inputSchema: {
        type: 'object',
        properties: {
          dataViewID: {
            type: 'string',
            description: 'ID of the data view to retrieve metadata for. Example: "D_CaseList", "D_WorkBasket"'
          }
        },
        required: ['dataViewID']
      }
    };
  }

  /**
   * Execute the get data view metadata operation
   */
  async execute(params) {
    const { dataViewID } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['dataViewID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Data View Metadata: ${dataViewID}`,
      async () => await this.pegaClient.getDataViewMetadata(dataViewID.trim())
    );
  }
}
