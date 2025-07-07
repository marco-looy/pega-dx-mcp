import { BaseTool } from '../../registry/base-tool.js';

export class GetRelatedCasesTool extends BaseTool {
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
      name: 'get_related_cases',
      description: 'Get list of related cases for a specific case based on case ID',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle to retrieve related cases for. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          }
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get related cases operation
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
      `Related Cases for: ${caseID}`,
      async () => await this.pegaClient.getRelatedCases(caseID.trim())
    );
  }
}
