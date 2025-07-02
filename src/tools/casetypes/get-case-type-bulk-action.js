import { PegaAPIClient } from '../../api/pega-client.js';

export class GetCaseTypeBulkActionTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_case_type_bulk_action',
      description: 'Get bulk action metadata for a specific case type and action ID',
      inputSchema: {
        type: 'object',
        properties: {
          caseTypeID: {
            type: 'string',
            description: 'ID of the case type for which the case action metadata is being retrieved (e.g., "Bug")'
          },
          actionID: {
            type: 'string',
            description: 'ID of the action for which the metadata is being retrieved (e.g., "Clone")'
          }
        },
        required: ['caseTypeID', 'actionID']
      }
    };
  }

  /**
   * Execute the get case type bulk action operation
   */
  async execute(params) {
    const { caseTypeID, actionID } = params;

    // Validate required parameters
    if (!caseTypeID || typeof caseTypeID !== 'string' || caseTypeID.trim() === '') {
      return {
        error: 'Invalid caseTypeID parameter. Case type ID is required and must be a non-empty string.'
      };
    }

    if (!actionID || typeof actionID !== 'string' || actionID.trim() === '') {
      return {
        error: 'Invalid actionID parameter. Action ID is required and must be a non-empty string.'
      };
    }

    try {
      // Call Pega API to get case type bulk action metadata
      const result = await this.pegaClient.getCaseTypeBulkAction(caseTypeID.trim(), actionID.trim());

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(caseTypeID, actionID, result.data)
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(caseTypeID, actionID, result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving bulk action metadata for case type ${caseTypeID}, action ${actionID}: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(caseTypeID, actionID, data) {
    let response = `## Case Type Bulk Action: ${caseTypeID} - ${actionID}\n\n`;
    
    if (data.data) {
      response += '### Action Metadata\n';
      
      // Display case info content if available
      if (data.data.caseInfo && data.data.caseInfo.content) {
        response += '#### Case Type Fields\n';
        const content = data.data.caseInfo.content;
        
        if (Object.keys(content).length > 0) {
          for (const [key, value] of Object.entries(content)) {
            if (typeof value === 'object' && value !== null) {
              response += `- **${key}**: ${JSON.stringify(value, null, 2)}\n`;
            } else {
              response += `- **${key}**: ${value}\n`;
            }
          }
        } else {
          response += '- No specific field metadata available\n';
        }
      }
    }

    // Display UI resources if available
    if (data.uiResources) {
      response += '\n### UI Resources\n';
      
      if (data.uiResources.root) {
        response += '#### Root Component\n';
        response += `- **Type**: ${data.uiResources.root.type || 'N/A'}\n`;
        response += `- **Name**: ${data.uiResources.root.name || 'N/A'}\n`;
        
        if (data.uiResources.root.children && data.uiResources.root.children.length > 0) {
          response += `- **Child Components**: ${data.uiResources.root.children.length}\n`;
        }
      }
      
      if (data.uiResources.resources) {
        response += '\n#### Available Resources\n';
        const resourceCount = Object.keys(data.uiResources.resources).length;
        response += `- **Total Resources**: ${resourceCount}\n`;
        
        // Show a few resource types if available
        const resourceTypes = Object.keys(data.uiResources.resources).slice(0, 5);
        if (resourceTypes.length > 0) {
          response += '- **Resource Types**: ';
          response += resourceTypes.join(', ');
          if (resourceCount > 5) {
            response += ` (and ${resourceCount - 5} more)`;
          }
          response += '\n';
        }
      }
    }

    // Display action details if available in the response
    if (data.actionMetadata) {
      response += '\n### Action Details\n';
      response += `- **Action ID**: ${actionID}\n`;
      response += `- **Case Type ID**: ${caseTypeID}\n`;
      
      if (data.actionMetadata.label) {
        response += `- **Label**: ${data.actionMetadata.label}\n`;
      }
      
      if (data.actionMetadata.tooltip) {
        response += `- **Tooltip**: ${data.actionMetadata.tooltip}\n`;
      }
      
      if (data.actionMetadata.enabled !== undefined) {
        response += `- **Enabled**: ${data.actionMetadata.enabled}\n`;
      }
    }

    response += '\n---\n';
    response += `*Retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseTypeID, actionID, error) {
    let response = `## Error retrieving bulk action: ${caseTypeID} - ${actionID}\n\n`;
    
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
        response += '\n**Suggestion**: Verify the case type ID and action ID are correct and exist in the system. Check if the action is available for this case type.\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to access this case type or action metadata.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: Check the case type ID and action ID format. Ensure they are valid identifiers.\n';
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
