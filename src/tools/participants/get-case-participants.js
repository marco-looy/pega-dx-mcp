import { BaseTool } from '../../registry/base-tool.js';

export class GetCaseParticipantsTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'participants';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_case_participants',
      description: 'Get all participants associated with a specific Pega case. Returns comprehensive list of case participants with their roles, permissions, and contact information for case access management.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve participants from. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          }
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get case participants operation
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
      `Case Participants: ${caseID}`,
      async () => await this.pegaClient.getCaseParticipants(caseID.trim()),
      { caseID: caseID.trim() }
    );
  }
}
