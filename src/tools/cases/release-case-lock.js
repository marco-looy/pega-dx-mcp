import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class ReleaseCaseLockTool extends BaseTool {
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
      name: 'release_case_lock',
      description: 'Release pessimistic lock on a Pega case and clean up any cached or pending updates. Used when canceling case operations that require locking.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to release lock from. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters.'
          },
          viewType: {
            type: 'string',
            enum: ['none', 'page'],
            description: 'Type of view data to return. "none" returns no view metadata or fields (default), "page" returns the full page UI metadata.',
            default: 'none'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the release case lock operation
   */
  async execute(params) {
    const { caseID, viewType } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Validate enum parameters using base class
      const enumValidation = this.validateEnumParams(params, {
        viewType: ['none', 'page']
      });
      if (enumValidation) {
        return enumValidation;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Release Case Lock: ${caseID}`,
        async () => await this.pegaClient.releaseCaseLock(caseID.trim(), { viewType }),
        { viewType, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Release Case Lock\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
