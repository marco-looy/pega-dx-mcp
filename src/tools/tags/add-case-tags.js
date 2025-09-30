import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class AddCaseTagsTool extends BaseTool {
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
      name: 'add_case_tags',
      description: 'Add multiple tags to a case',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to add tags to. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters.'
          },
          tags: {
            type: 'array',
            description: 'Array of tag objects to add to the case. Each tag object must contain a Name property.',
            items: {
              type: 'object',
              properties: {
                Name: {
                  type: 'string',
                  description: 'Name of the tag to add to the case'
                }
              },
              required: ['Name'],
              additionalProperties: false
            },
            minItems: 1,
            maxItems: 50
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID', 'tags']
      }
    };
  }

  /**
   * Execute the add case tags operation
   */
  async execute(params) {
    const { caseID, tags } = params;
    let sessionInfo = null;

    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID', 'tags']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Additional validation for tags array
      if (!Array.isArray(tags) || tags.length === 0) {
        return {
          error: 'Invalid tags parameter. tags must be a non-empty array of tag objects.'
        };
      }

      // Validate each tag object has required Name property
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        if (!tag || typeof tag !== 'object' || !tag.Name || typeof tag.Name !== 'string' || tag.Name.trim() === '') {
          return {
            error: `Invalid tag at index ${i}. Each tag must be an object with a non-empty Name property.`
          };
        }
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Add Tags to Case: ${caseID}`,
        async () => await this.pegaClient.addCaseTags(caseID.trim(), tags),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Add Tags to Case: ${caseID}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
