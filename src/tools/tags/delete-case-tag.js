import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class DeleteCaseTagTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'tags';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'delete_case_tag', 
      description: 'Delete a specific tag from a case by case ID and tag ID',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to delete tag from. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters.'
          },
          tagID: {
            type: 'string',
            description: 'Tag ID to be deleted from the case. This is the unique identifier of the specific tag to remove.'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID', 'tagID']
      }
    };
  }

  /**
   * Execute the delete case tag operation
   */
  async execute(params) {
    const { caseID, tagID } = params;
    let sessionInfo = null;

    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID', 'tagID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Delete Tag: ${tagID} from Case: ${caseID}`,
        async () => await this.pegaClient.deleteCaseTag(caseID.trim(), tagID.trim()),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Delete Tag: ${tagID} from Case: ${caseID}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
