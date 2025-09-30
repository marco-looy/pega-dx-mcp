import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class GetCaseTagsTool extends BaseTool {
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
      name: 'get_case_tags',
      description: 'Get list of tags associated to a case',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve tags from. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters.'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get case tags operation
   */
  async execute(params) {
    const { caseID } = params;
    let sessionInfo = null;

    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Case Tags: ${caseID}`,
        async () => await this.pegaClient.getCaseTags(caseID.trim()),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Case Tags: ${caseID}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
