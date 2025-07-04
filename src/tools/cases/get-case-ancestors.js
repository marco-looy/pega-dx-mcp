import { BaseTool } from '../../registry/base-tool.js';

export class GetCaseAncestorsTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'cases';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_case_ancestors',
      description: 'Get ancestor case hierarchy for a specific case. Retrieves ancestor hierarchy case list for the case ID passed in, showing the parent-child relationships up the case hierarchy chain. Each ancestor includes basic case information (ID, name) and HATEOAS navigation links.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve ancestors from. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters. The case must exist and be accessible to the current user.'
          }
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get case ancestors operation
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
      `Case Ancestors: ${caseID}`,
      async () => await this.pegaClient.getCaseAncestors(caseID.trim())
    );
  }
}
