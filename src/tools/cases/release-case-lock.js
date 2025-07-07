import { BaseTool } from '../../registry/base-tool.js';

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
          }
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
      { viewType }
    );
  }
}
