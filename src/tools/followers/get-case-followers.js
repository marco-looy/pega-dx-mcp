import { BaseTool } from '../../registry/base-tool.js';

export class GetCaseFollowersTool extends BaseTool {
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
      name: 'get_case_followers',
      description: 'Get the list of all the Case Followers. Retrieves information about users who are following a case to receive notifications and updates.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve followers for. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters.'
          }
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get case followers operation
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
      `Get Case Followers: ${caseID}`,
      async () => await this.pegaClient.getCaseFollowers(caseID.trim())
    );
  }
}
