import { PegaAPIClient } from '../../api/pega-client.js';

export class GetCaseViewTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
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
            description: 'Full case handle (e.g., METE-MYDEMOAPP-WORK T-3)'
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

    // Validate required parameters
    if (!caseID || typeof caseID !== 'string' || caseID.trim() === '') {
      return {
        error: 'Invalid caseID parameter. Case ID is required and must be a non-empty string.'
      };
    }

    if (!viewID || typeof viewID !== 'string' || viewID.trim() === '') {
      return {
        error: 'Invalid viewID parameter. View ID is required and must be a non-empty string.'
      };
    }

    try {
      // Call Pega API to get case view details
      const result = await this.pegaClient.getCaseView(caseID.trim(), viewID.trim());

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(caseID, viewID, result.data)
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(caseID, viewID, result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving view ${viewID} for case ${caseID}: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(caseID, viewID, data) {
    let response = `## Case View Details: ${viewID}\n`;
    response += `**Case ID**: ${caseID}\n\n`;
    
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

    response += '\n---\n';
    response += `*Retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseID, viewID, error) {
    let response = `## Error retrieving view: ${viewID}\n`;
    response += `**Case ID**: ${caseID}\n\n`;
    
    response += `**Error Type**: ${error.type}\n`;
    response += `**Message**: ${error.message}\n`;
    
    if (error.details) {
      response += `**Details**: ${error.details}\n`;
    }
    
    if (error.status) {
      response += `**HTTP Status**: ${error.status} ${error.statusText}\n`;
    }

    // Add specific guidance based on error type
    switch (error.type) {
      case 'NOT_FOUND':
        response += '\n**Suggestions**:\n';
        response += '- Verify the case ID is correct and the case exists\n';
        response += '- Check that the view name is valid for this case type\n';
        response += '- Ensure you have access permissions to this case and view\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to access this case and view.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestions**:\n';
        response += '- Check the case ID format (should be full case handle)\n';
        response += '- Verify the view ID is correctly spelled\n';
        response += '- Ensure both parameters are properly encoded\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
    }

    if (error.errorDetails && error.errorDetails.length > 0) {
      response += '\n### Additional Error Details\n';
      error.errorDetails.forEach((detail, index) => {
        response += `${index + 1}. ${detail.localizedValue || detail.message}\n`;
      });
    }

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
