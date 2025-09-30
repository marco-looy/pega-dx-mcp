import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class RelateCasesTool extends BaseTool {
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
      name: 'relate_cases',
      description: 'Create relationships between cases by relating a set of case instances to a primary case',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Primary case ID to relate other cases to. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          cases: {
            type: 'array',
            description: 'Array of case objects to relate to the primary case. Each case must have an ID property.',
            items: {
              type: 'object',
              properties: {
                ID: {
                  type: 'string',
                  description: 'Full case handle of the case to relate. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1009"'
                }
              },
              required: ['ID'],
              additionalProperties: false
            },
            minItems: 1,
            maxItems: 50
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID', 'cases']
      }
    };
  }

  /**
   * Execute the relate cases operation
   */
  async execute(params) {
    const { caseID, cases } = params;
    let sessionInfo = null;

    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID', 'cases']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Additional validation for cases array
      if (!Array.isArray(cases) || cases.length === 0) {
        return {
          content: [{
            type: 'text',
            text: this.formatErrorResponse(
              `Relate Cases to: ${caseID}`,
              {
                type: 'VALIDATION_ERROR',
                message: 'Invalid cases parameter',
                details: 'cases parameter must be a non-empty array of case objects with ID properties.',
                status: 400
              }
            )
          }]
        };
      }

      // Validate each case object has required ID property
      for (let i = 0; i < cases.length; i++) {
        const caseObj = cases[i];
        if (!caseObj || typeof caseObj !== 'object' || !caseObj.ID || typeof caseObj.ID !== 'string') {
          return {
            content: [{
              type: 'text',
              text: this.formatErrorResponse(
                `Relate Cases to: ${caseID}`,
                {
                  type: 'VALIDATION_ERROR',
                  message: 'Invalid case object structure',
                  details: `cases[${i}] must be an object with a required 'ID' string property.`,
                  status: 400
                }
              )
            }]
          };
        }
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Relate Cases to: ${caseID} (${cases.length} case${cases.length > 1 ? 's' : ''})`,
        async () => await this.pegaClient.relateCases(caseID.trim(), cases),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Relate Cases to: ${caseID}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
