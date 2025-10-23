import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

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
            items: {
              type: 'object',
              properties: {
                instruction: {
                  type: 'string',
                  enum: ['UPDATE', 'REPLACE', 'DELETE', 'APPEND', 'INSERT', 'MOVE'],
                  description: 'The type of page instruction: UPDATE (add fields to page), REPLACE (replace entire page), DELETE (remove page), APPEND (add item to page list), INSERT (insert item in page list), MOVE (reorder page list items)'
                },
                target: {
                  type: 'string',
                  description: 'The target embedded page name'
                },
                content: {
                  type: 'object',
                  description: 'Content to set on the embedded page (required for UPDATE and REPLACE)'
                }
              },
              required: ['instruction', 'target'],
              description: 'Page operation for embedded pages. Use REPLACE instruction to set embedded page references with full object including pzInsKey. Example: {"instruction": "REPLACE", "target": "PageName", "content": {"Property": "value", "pyID": "ID-123", "pzInsKey": "CLASS-NAME ID-123"}}'
            },
            description: 'Optional list of page-related operations for embedded pages, page lists, or page groups. Required for setting embedded page references.'
          },
          sessionCredentials: getSessionCredentialsSchema()
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
    let sessionInfo = null;

    try {
      sessionInfo = this.initializeSessionConfig(params);

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
        async () => await this.pegaClient.updateDataRecordPartial(dataViewID, data, { eTag, pageInstructions }),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Partial Data Record Update: ${dataViewID}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
