import { BaseTool } from '../../registry/base-tool.js';

export class DeleteRelatedCaseTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'related_cases';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'delete_related_case',
      description: 'Remove related work association between two cases by deleting a specific relationship',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Primary case ID from which to remove the related case. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          related_caseID: {
            type: 'string',
            description: 'Related case ID to be removed from the primary case. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1009". Must be a complete case identifier including spaces and special characters.'
          }
        },
        required: ['caseID', 'related_caseID']
      }
    };
  }

  /**
   * Execute the delete related case operation
   */
  async execute(params) {
    const { caseID, related_caseID } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'related_caseID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Delete Related Case: ${related_caseID} from ${caseID}`,
      async () => await this.pegaClient.deleteRelatedCase(caseID.trim(), related_caseID.trim())
    );
  }
}
