import { BaseTool } from '../../registry/base-tool.js';

export class GetCaseTool extends BaseTool {
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
      name: 'get_case',
      description: 'Get detailed information about a Pega case by case ID',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (e.g.,ON6E5R-DIYRECIPE-WORK-RECIPECOLLECTION R-1008)'
          },
          viewType: {
            type: 'string',
            enum: ['none', 'page'],
            description: 'Type of view data to return. "none" returns no UI resources, "page" returns full page UI metadata',
            default: 'none'
          },
          pageName: {
            type: 'string',
            description: 'If provided, view metadata for specific page name will be returned (only used when viewType is "page")'
          },
          originChannel: {
            type: 'string',
            description: 'Origin of this service. E.g. - Web, Mobile etc.'
          }
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get case operation
   */
  async execute(params) {
    const { caseID, viewType, pageName, originChannel } = params;

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

    // Validate pageName usage
    if (pageName && viewType !== 'page') {
      return {
        error: 'pageName parameter can only be used when viewType is set to "page".'
      };
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Case Details: ${caseID}`,
      async () => await this.pegaClient.getCase(caseID.trim(), { viewType, pageName, originChannel }),
      { caseID, viewType, pageName, originChannel }
    );
  }

  /**
   * Override formatSuccessResponse to display eTag information
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID } = options;
    
    let response = `## ${operation}\n\n`;
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    // Display eTag information prominently if available
    if (data.eTag) {
      response += '### 🔑 Current eTag Information\n';
      response += `- **eTag**: \`${data.eTag}\`\n`;
      response += '- **Usage**: Use this exact value as eTag parameter for update operations\n';
      response += '- **Format**: ISO date-time representing pxSaveDateTime\n\n';
    }
    
    // Add the standard data formatting
    if (data && typeof data === 'object') {
      response += this.formatDataSection(data);
    }
    
    return response;
  }

}
