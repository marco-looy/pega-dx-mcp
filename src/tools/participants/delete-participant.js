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
      description: 'Delete a participant from a Pega case by case ID and participant ID. If no eTag is provided, automatically fetches the latest eTag from the case for seamless operation. Requires an eTag value for optimistic locking to ensure data consistency. Returns success confirmation or detailed error information.',
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
            description: 'Optional eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. If not provided, the tool will automatically fetch the latest eTag from the case. For manual eTag management, provide the eTag from a previous case operation. Used for optimistic locking to prevent concurrent modification conflicts.'
          }
        },
        required: ['caseID', 'participantID']
      }
    };
  }

  /**
   * Execute the delete participant operation
   */
  async execute(params) {
    const { caseID, participantID, eTag } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'participantID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Execute with standardized error handling
// Auto-fetch eTag if not provided
    let finalETag = eTag;
    let autoFetchedETag = false;
    
    if (!finalETag) {
      try {
        console.log(`Auto-fetching latest eTag for participant operation on ${caseID}...`);
        const caseResponse = await this.pegaClient.getCase(caseID.trim(), {
          viewType: 'form'  // Use form view for eTag retrieval
        });
        
        if (!caseResponse || !caseResponse.success) {
          const errorMsg = `Failed to auto-fetch eTag: ${caseResponse?.error?.message || 'Unknown error'}`;
          return {
            error: errorMsg
          };
        }
        
        finalETag = caseResponse.eTag;
        autoFetchedETag = true;
        console.log(`Successfully auto-fetched eTag: ${finalETag}`);
        
        if (!finalETag) {
          const errorMsg = 'Auto-fetch succeeded but no eTag was returned from get_case. This may indicate a server issue.';
          return {
            error: errorMsg
          };
        }
      } catch (error) {
        const errorMsg = `Failed to auto-fetch eTag: ${error.message}`;
        return {
          error: errorMsg
        };
      }
    }
    
    // Validate eTag format (should be a timestamp-like string)
    if (typeof finalETag !== 'string' || finalETag.trim().length === 0) {
      return {
        error: 'Invalid eTag parameter. Must be a non-empty string representing case save date time.'
      };
    }

    return await this.executeWithErrorHandling(
      `Delete Participant: ${caseID.trim()} / ${participantID.trim()}`,
      async () => await this.pegaClient.deleteParticipant(caseID.trim(), participantID.trim(), eTag.trim()),
      { caseID: caseID.trim(), participantID: participantID.trim(), eTag: '***' } // Hide eTag in logs for security
    );
  }
}
