import { BaseTool } from '../../registry/base-tool.js';

export class GetCaseViewTool extends BaseTool {
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
      name: 'get_case_view',
      description: 'Get view details based on case ID and view name. Returns view metadata with customizable logic from pyUpgradeOnOpen Data Transform.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (e.g.,ON6E5R-DIYRECIPE-WORK-RECIPECOLLECTION R-1008)'
          },
          viewID: {
            type: 'string',
            description: 'Name of the view to retrieve'
          }
        },
        required: ['caseID', 'viewID']
      }
    };
  }

  /**
   * Execute the get case view operation
   */
  async execute(params) {
    const { caseID, viewID } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'viewID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Case View Details: ${viewID} for ${caseID}`,
      async () => await this.pegaClient.getCaseView(caseID.trim(), viewID.trim()),
      { caseID, viewID }
    );
  }

  /**
   * Override formatSuccessResponse to add case view specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID, viewID } = options;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    // Display case data if available
    if (data.data) {
      response += '### Case Data\n';
      
      // Handle case info
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += `- **Case Type**: ${caseInfo.caseTypeName || 'N/A'}\n`;
        response += `- **Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stage || 'N/A'}\n`;
        response += `- **Step**: ${caseInfo.step || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Last Updated**: ${caseInfo.lastUpdateTime || 'N/A'}\n`;
        
        // Display content if available
        if (caseInfo.content && Object.keys(caseInfo.content).length > 0) {
          response += '\n#### Case Content\n';
          for (const [key, value] of Object.entries(caseInfo.content)) {
            if (value !== null && value !== undefined) {
              response += `- **${key}**: ${value}\n`;
            }
          }
        }
      }

      // Display any other data properties
      const otherDataKeys = Object.keys(data.data).filter(key => key !== 'caseInfo');
      if (otherDataKeys.length > 0) {
        response += '\n#### Additional Data\n';
        otherDataKeys.forEach(key => {
          const value = data.data[key];
          if (value !== null && value !== undefined) {
            if (typeof value === 'object') {
              response += `- **${key}**: ${JSON.stringify(value, null, 2)}\n`;
            } else {
              response += `- **${key}**: ${value}\n`;
            }
          }
        });
      }
    }

    // Display UI resources if available
    if (data.uiResources) {
      response += '\n### UI Resources\n';
      response += '- View metadata loaded successfully\n';
      
      if (data.uiResources.root) {
        response += `- **Root Component Type**: ${data.uiResources.root.type || 'Unknown'}\n`;
        
        if (data.uiResources.root.config) {
          response += '- **Component Configuration**: Available\n';
        }
        
        if (data.uiResources.root.children && data.uiResources.root.children.length > 0) {
          response += `- **Child Components**: ${data.uiResources.root.children.length} components\n`;
        }
      }

      // Display view configuration if available
      if (data.uiResources.config) {
        response += '- **View Configuration**: Available\n';
      }

      // Display resources summary
      const resourceKeys = Object.keys(data.uiResources).filter(key => key !== 'root' && key !== 'config');
      if (resourceKeys.length > 0) {
        response += `- **Additional Resources**: ${resourceKeys.join(', ')}\n`;
      }
    }

    response += '\n### Processing Details\n';
    response += '- **Data Transform**: pyUpgradeOnOpen executed successfully\n';
    response += '- **View Type**: Read-only view (or form if used in modal pop-up)\n';
    
    return response;
  }
}
