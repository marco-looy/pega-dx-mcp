import { BaseTool } from '../../registry/base-tool.js';

export class DeleteParticipantTool extends BaseTool {
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
      name: 'delete_participant',
      description: 'Delete a participant from a Pega case by case ID and participant ID. Requires an eTag value for optimistic locking to ensure data consistency. Returns success confirmation or detailed error information.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to remove participant from. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          participantID: {
            type: 'string',
            description: 'Participant ID to remove from the case. This identifies the specific participant that will be deleted from the case participant list.'
          },
          eTag: {
            type: 'string',
            description: 'Required eTag unique value for optimistic locking. This must be obtained from a previous GET request (get_participant, get_case_participants, etc.) and represents the current state of the participant data. Used to prevent concurrent modification conflicts.'
          }
        },
        required: ['caseID', 'participantID', 'eTag']
      }
    };
  }

  /**
   * Execute the delete participant operation
   */
  async execute(params) {
    const { caseID, participantID, eTag } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'participantID', 'eTag']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Delete Participant: ${caseID.trim()} / ${participantID.trim()}`,
      async () => await this.pegaClient.deleteParticipant(caseID.trim(), participantID.trim(), eTag.trim()),
      { caseID: caseID.trim(), participantID: participantID.trim(), eTag: '***' } // Hide eTag in logs for security
    );
  }
}
