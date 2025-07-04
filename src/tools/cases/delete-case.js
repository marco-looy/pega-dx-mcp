import { BaseTool } from '../../registry/base-tool.js';

export class DeleteCaseTool extends BaseTool {
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
      name: 'delete_case',
      description: 'Delete a case that is currently in the create stage',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (e.g.,ON6E5R-DIYRECIPE-WORK-RECIPECOLLECTION R-1008)'
          }
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the delete case operation
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
      `Case Deletion: ${caseID}`,
      async () => await this.pegaClient.deleteCase(caseID.trim()),
      { caseID }
    );
  }

  /**
   * Override formatSuccessResponse to add case deletion specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID } = options;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    response += `✅ **Case ID**: ${caseID}\n\n`;
    
    response += '### Operation Details\n';
    response += '- The case has been permanently removed from the system\n';
    response += '- This action cannot be undone\n';
    response += '- Only cases in the create stage can be deleted\n\n';
    
    return response;
  }
}
