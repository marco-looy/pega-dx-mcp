import { BaseTool } from '../../registry/base-tool.js';

export class DeleteCaseFollowerTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'followers';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'delete_case_follower',
      description: 'Remove a follower from a case, ending their subscription to case notifications and updates. Removes the follower association between case and user.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to remove follower from. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters.'
          },
          followerID: {
            type: 'string',
            description: 'User ID of the follower to remove from the case. This is the unique identifier for the user in the Pega system who will no longer follow the case.'
          }
        },
        required: ['caseID', 'followerID']
      }
    };
  }

  /**
   * Execute the delete case follower operation
   */
  async execute(params) {
    const { caseID, followerID } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'followerID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Delete Case Follower: ${caseID} - ${followerID}`,
      async () => await this.pegaClient.deleteCaseFollower(caseID.trim(), followerID.trim())
    );
  }
}
