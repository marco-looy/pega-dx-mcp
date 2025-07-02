import { PegaAPIClient } from '../../api/pega-client.js';

export class GetCaseTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
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
            description: 'Full case handle (e.g., METE-MYDEMOAPP-WORK T-3)'
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
    const { caseID, viewType, pageName } = params;

    // Validate required parameters
    if (!caseID || typeof caseID !== 'string' || caseID.trim() === '') {
      return {
        error: 'Invalid caseID parameter. Case ID is required and must be a non-empty string.'
      };
    }

    // Validate viewType if provided
    if (viewType && !['none', 'page'].includes(viewType)) {
      return {
        error: 'Invalid viewType parameter. Must be either "none" or "page".'
      };
    }

    // Validate pageName usage
    if (pageName && viewType !== 'page') {
      return {
        error: 'pageName parameter can only be used when viewType is set to "page".'
      };
    }

    try {
      // Call Pega API to get case details
      const result = await this.pegaClient.getCase(caseID.trim(), {
        viewType,
        pageName
      });

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(caseID, result.data, { viewType, pageName })
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(caseID, result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving case ${caseID}: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(caseID, data, options) {
    const { viewType } = options;
    
    let response = `## Case Details: ${caseID}\n\n`;
    
    if (data.data) {
      response += '### Case Information\n';
      
      // Display case info if available
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += `- **Case ID**: ${caseInfo.ID || caseID}\n`;
        response += `- **Case Type**: ${caseInfo.caseTypeName || 'N/A'}\n`;
        response += `- **Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stage || 'N/A'}\n`;
        response += `- **Step**: ${caseInfo.step || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Created**: ${caseInfo.createTime || 'N/A'}\n`;
        response += `- **Last Updated**: ${caseInfo.lastUpdateTime || 'N/A'}\n`;
        response += `- **Created By**: ${caseInfo.createOpName || 'N/A'}\n`;

        // Display content if available
        if (caseInfo.content && Object.keys(caseInfo.content).length > 0) {
          response += '\n### Case Content\n';
          for (const [key, value] of Object.entries(caseInfo.content)) {
            response += `- **${key}**: ${value}\n`;
          }
        }
      }

      // Display child cases if available
      if (data.data.childCases && data.data.childCases.length > 0) {
        response += '\n### Child Cases\n';
        data.data.childCases.forEach((childCase, index) => {
          response += `${index + 1}. **${childCase.ID}** - ${childCase.caseTypeName} (${childCase.status})\n`;
        });
      }
    }

    // Display UI resources info if viewType is 'page'
    if (viewType === 'page' && data.uiResources) {
      response += '\n### UI Resources\n';
      response += '- UI metadata has been loaded for page view\n';
      if (data.uiResources.root) {
        response += `- Root component: ${data.uiResources.root.type || 'Unknown'}\n`;
      }
    }

    response += '\n---\n';
    response += `*Retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseID, error) {
    let response = `## Error retrieving case: ${caseID}\n\n`;
    
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
        response += '\n**Suggestion**: Verify the case ID is correct and the case exists in the system.\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to access this case.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: Check the case ID format and any additional parameters.\n';
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
