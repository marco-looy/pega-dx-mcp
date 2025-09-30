import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class GetCaseDescendantsTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'cases';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_case_descendants',
      description: 'Get descendants of a case instance. This API loops through all the child cases recursively descending from the specific one, and returns the assignments and actions for each. If the current user does not have access to a given child case, they can only see limited information, and can not drill down into any child cases.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve descendants from. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters. The case must exist and be accessible to the current user.'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get case descendants operation
   */
  async execute(params) {
    const { caseID } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Case Descendants: ${caseID}`,
        async () => await this.pegaClient.getCaseDescendants(caseID.trim()),
        { caseID, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Get Case Descendants\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
