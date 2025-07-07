import { BaseTool } from '../../registry/base-tool.js';

export class AddCaseFollowersTool extends BaseTool {
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
      name: 'add_case_followers',
      description: 'Add multiple followers to a work object. Allows users to follow a case to receive notifications and updates about case progress.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to add followers to. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters.'
          },
          users: {
            type: 'array',
            description: 'Array of user objects to add as followers to the case. Each user object should contain user identification information.',
            items: {
              type: 'object',
              properties: {
                ID: {
                  type: 'string',
                  description: 'User identifier of the person to add as a follower. This is the unique identifier for the user in the Pega system.'
                }
              },
              required: ['ID']
            },
            minItems: 1
          }
        },
        required: ['caseID', 'users']
      }
    };
  }

  /**
   * Execute the add case followers operation
   */
  async execute(params) {
    const { caseID, users } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'users']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate users array
    if (!Array.isArray(users) || users.length === 0) {
      return {
        error: 'users parameter must be a non-empty array of user objects.'
      };
    }

    // Validate each user object
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (!user.ID) {
        return {
          error: `User at index ${i} is missing required ID field.`
        };
      }
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Add Case Followers: ${caseID}`,
      async () => await this.pegaClient.addCaseFollowers(caseID.trim(), users)
    );
  }
}
