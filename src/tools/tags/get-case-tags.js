import { BaseTool } from '../../registry/base-tool.js';

export class GetCaseTagsTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'tags';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_case_tags',
      description: 'Get list of tags associated to a case',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve tags from. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters.'
          }
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get case tags operation
   */
  async execute(params) {
    const { caseID } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Case Tags: ${caseID}`,
      async () => await this.pegaClient.getCaseTags(caseID.trim())
    );
  }
}
