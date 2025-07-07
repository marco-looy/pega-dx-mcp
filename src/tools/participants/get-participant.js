import { BaseTool } from '../../registry/base-tool.js';

export class GetParticipantTool extends BaseTool {
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
      name: 'get_participant',
      description: 'Get detailed information about a specific participant in a Pega case by case ID and participant ID. Returns participant details including personal information, contact details, and optional UI resources for form display.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve participant from. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          participantID: {
            type: 'string',
            description: 'Participant ID to get details for. This identifies the specific participant within the case whose information you want to retrieve.'
          },
          viewType: {
            type: 'string',
            enum: ['form', 'none'],
            description: 'Type of view data to return. "form" returns form UI metadata in uiResources object for display purposes, "none" returns no UI resources. Default: "form".',
            default: 'form'
          }
        },
        required: ['caseID', 'participantID']
      }
    };
  }

  /**
   * Execute the get participant operation
   */
  async execute(params) {
    const { caseID, participantID, viewType } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'participantID']);
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
      `Get Participant: ${caseID.trim()} / ${participantID.trim()}`,
      async () => await this.pegaClient.getParticipant(caseID.trim(), participantID.trim(), { viewType }),
      { caseID: caseID.trim(), participantID: participantID.trim(), viewType }
    );
  }
}
