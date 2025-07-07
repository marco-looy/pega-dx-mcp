import { BaseTool } from '../../registry/base-tool.js';

export class GetParticipantRoleDetailsTool extends BaseTool {
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
      name: 'get_participant_role_details',
      description: 'Get detailed information about a specific participant role in a Pega case, including role configuration, permissions, and user details. Returns participant role metadata with optional UI resources.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve participant role details from. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          participantRoleID: {
            type: 'string',
            description: 'Participant role ID to get details for. This identifies the specific role within the case that you want detailed information about.'
          },
          viewType: {
            type: 'string',
            enum: ['form', 'none'],
            description: 'Type of view data to return. "form" returns form UI metadata in uiResources object, "none" returns no UI resources. Default: "form".',
            default: 'form'
          }
        },
        required: ['caseID', 'participantRoleID']
      }
    };
  }

  /**
   * Execute the get participant role details operation
   */
  async execute(params) {
    const { caseID, participantRoleID, viewType } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'participantRoleID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate enum parameters using base class
    const enumValidation = this.validateEnumParams(params, {
      viewType: ['form', 'none']
    });
    if (enumValidation) {
      return enumValidation;
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Participant Role Details: ${caseID} / ${participantRoleID}`,
      async () => await this.pegaClient.getParticipantRoleDetails(caseID.trim(), participantRoleID.trim(), { viewType }),
      { caseID: caseID.trim(), participantRoleID: participantRoleID.trim(), viewType }
    );
  }
}
