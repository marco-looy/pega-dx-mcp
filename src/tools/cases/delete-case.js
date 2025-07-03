import { PegaAPIClient } from '../../api/pega-client.js';

export class DeleteCaseTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
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

    // Validate required parameters
    if (!caseID || typeof caseID !== 'string' || caseID.trim() === '') {
      return {
        error: 'Invalid caseID parameter. Case ID is required and must be a non-empty string.'
      };
    }

    try {
      // Call Pega API to delete the case
      const result = await this.pegaClient.deleteCase(caseID.trim());

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(caseID)
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
        error: `Unexpected error while deleting case ${caseID}: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(caseID) {
    let response = `## Case Successfully Deleted\n\n`;
    
    response += `✅ **Case ID**: ${caseID}\n`;
    response += `📅 **Deleted At**: ${new Date().toISOString()}\n\n`;
    
    response += '### Operation Details\n';
    response += '- The case has been permanently removed from the system\n';
    response += '- This action cannot be undone\n';
    response += '- Only cases in the create stage can be deleted\n\n';
    
    response += '---\n';
    response += `*Case deletion completed at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseID, error) {
    let response = `## Error deleting case: ${caseID}\n\n`;
    
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
        response += '\n**Suggestion**: Verify the case ID is correct and the case exists in the system. Check that you have access to this case.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: The case cannot be deleted. This typically occurs when:\n';
        response += '- The case has progressed beyond the create stage\n';
        response += '- The case is locked by another user\n';
        response += '- There are business rules preventing deletion\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: You do not have permission to delete this case. Contact your system administrator to verify your access rights.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
      default:
        response += '\n**Suggestion**: Check the case status and ensure it is in the create stage. Only newly created cases can be deleted.\n';
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
