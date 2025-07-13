import { BaseTool } from '../../registry/base-tool.js';

export class GetNextAssignmentTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'assignments';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_next_assignment',
      description: 'Get detailed information about the next assignment to be performed by the requestor. Uses Get Next Work functionality to fetch the assignment most suitable for the current user.',
      inputSchema: {
        type: 'object',
        properties: {
          viewType: {
            type: 'string',
            enum: ['form', 'page'],
            description: 'Type of view data to return. "form" returns only assignment UI metadata in uiResources object, "page" returns full page (read-only review mode) UI metadata in uiResources object',
            default: 'page'
          },
          pageName: {
            type: 'string',
            description: 'If provided, view metadata for specific page name will be returned (only used when viewType is "page")'
          }
        },
        required: []
      }
    };
  }

  /**
   * Execute the get next assignment operation
   */
  async execute(params) {
    const { viewType = 'page', pageName } = params;

    // Validate enum parameters using base class
    const enumValidation = this.validateEnumParams(params, {
      viewType: ['form', 'page']
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
      'Next Assignment',
      async () => await this.pegaClient.getNextAssignment({
        viewType,
        pageName
      }),
      { viewType, pageName }
    );
  }

  /**
   * Override formatSuccessResponse to add next assignment specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { viewType } = options;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    if (data.data) {
      response += '### Assignment Information\n';
      
      // Display assignment info if available
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += `- **Case ID**: ${caseInfo.ID || 'N/A'}\n`;
        response += `- **Case Type**: ${caseInfo.caseTypeName || 'N/A'}\n`;
        response += `- **Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stage || 'N/A'}\n`;
        response += `- **Step**: ${caseInfo.step || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Created**: ${caseInfo.createTime || 'N/A'}\n`;
        response += `- **Last Updated**: ${caseInfo.lastUpdateTime || 'N/A'}\n`;
      }

      // Display assignment specific information
      if (data.assignmentInfo) {
        response += '\n### Assignment Details\n';
        const assignmentInfo = data.assignmentInfo;
        response += `- **Assignment ID**: ${assignmentInfo.ID || 'N/A'}\n`;
        response += `- **Assignment Type**: ${assignmentInfo.assignmentType || 'N/A'}\n`;
        response += `- **Instructions**: ${assignmentInfo.instructions || 'N/A'}\n`;
        response += `- **Assigned To**: ${assignmentInfo.assignedTo || 'N/A'}\n`;
        response += `- **Due Date**: ${assignmentInfo.dueDate || 'N/A'}\n`;
      }

      // Display available actions if present
      if (data.actions && data.actions.length > 0) {
        response += '\n### Available Actions\n';
        data.actions.forEach((action, index) => {
          response += `${index + 1}. **${action.name}** - ${action.type || 'Action'}\n`;
          if (action.ID) {
            response += `   - Action ID: ${action.ID}\n`;
          }
        });
      }

      // Display content if available
      if (data.data && data.data.content && Object.keys(data.data.content).length > 0) {
        response += '\n### Assignment Content\n';
        for (const [key, value] of Object.entries(data.data.content)) {
          response += `- **${key}**: ${value}\n`;
        }
      }
    }

    // Display UI resources info if viewType is specified
    if (data.uiResources) {
      response += '\n### UI Resources\n';
      response += `- UI metadata loaded for ${viewType} view\n`;
      if (data.uiResources.root) {
        response += `- Root component: ${data.uiResources.root.type || 'Unknown'}\n`;
      }
    }

    // Display eTag if available for future operations
    if (data.etag) {
      response += '\n### Operation Support\n';
      response += `- eTag captured: ${data.etag}\n`;
      response += '- Ready for assignment execution operations\n';
    }
    
    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(error) {
    let response = `## Next Assignment Request Result\n\n`;
    
    // Handle the special case of no assignments available (404)
    if (error.type === 'NOT_FOUND') {
      response += `**Status**: No assignments currently available\n`;
      response += `**Message**: ${error.message}\n\n`;
      response += '### What This Means\n';
      response += '- Get Next Work functionality found no suitable assignments for you\n';
      response += '- This is a normal condition when your work queue is empty\n';
      response += '- New assignments may become available as workflows progress\n\n';
      response += '### Next Steps\n';
      response += '1. Check back later for new assignments\n';
      response += '2. Contact your supervisor if you expected assignments to be available\n';
      response += '3. Use `get_case_types` to see what case types you can create\n';
    } else {
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
        case 'FORBIDDEN':
          response += '\n**Suggestion**: Check if you have the necessary permissions to access assignments in this application.\n';
          break;
        case 'UNAUTHORIZED':
          response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
          break;
        case 'BAD_REQUEST':
          response += '\n**Suggestion**: Check the viewType and pageName parameters. Ensure pageName is only used with viewType="page".\n';
          break;
        case 'CONNECTION_ERROR':
          response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
          break;
        case 'SERVER_ERROR':
          response += '\n**Suggestion**: The Pega Infinity server encountered an internal error. Please try again or contact support.\n';
          break;
      }

      if (error.errorDetails && error.errorDetails.length > 0) {
        response += '\n### Additional Error Details\n';
        error.errorDetails.forEach((detail, index) => {
          response += `${index + 1}. ${detail.localizedValue || detail.message}\n`;
        });
      }
    }

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
