import { BaseTool } from '../../registry/base-tool.js';

export class GetParticipantRolesTool extends BaseTool {
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
      name: 'get_participant_roles',
      description: 'Retrieve list of participant roles for a specific Pega case. Returns available roles that can be assigned to case participants for access control and permission management.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve participant roles for. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          }
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get participant roles operation
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
      `Participant Roles: ${caseID}`,
      async () => await this.pegaClient.getParticipantRoles(caseID.trim()),
      { caseID: caseID.trim() }
    );
  }
}
