import { PegaAPIClient } from '../../api/pega-client.js';

export class GetAssignmentTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_assignment',
      description: 'Get detailed information about a specific assignment by assignment ID, including instructions and available actions. If the case type uses pessimistic locking and the client uses Constellation, this request locks the case.',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Full handle of an assignment. Example: ASSIGN-WORKLIST PBANK-LOAN-WORK V-76003!REVIEW_FLOW'
          },
          viewType: {
            type: 'string',
            enum: ['form', 'page'],
            description: 'Type of view data to return. "form" returns only assignment UI metadata in uiResources object, "page" returns full page (read-only review mode) UI metadata in uiResources object',
            default: 'page'
          },
          pageName: {
            type: 'string',
            description: 'If provided, returns view metadata for the pageName view (only used when viewType is "page")'
          }
        },
        required: ['assignmentID']
      }
    };
  }

  /**
   * Execute the get assignment operation
   */
  async execute(params) {
    const { assignmentID, viewType = 'page', pageName } = params;

    // Validate required parameters
    if (!assignmentID || typeof assignmentID !== 'string' || assignmentID.trim() === '') {
      return {
        error: 'Invalid assignmentID parameter. Assignment ID is required and must be a non-empty string.'
      };
    }

    // Validate viewType if provided
    if (viewType && !['form', 'page'].includes(viewType)) {
      return {
        error: 'Invalid viewType parameter. Must be either "form" or "page".'
      };
    }

    // Validate pageName usage
    if (pageName && viewType !== 'page') {
      return {
        error: 'pageName parameter can only be used when viewType is set to "page".'
      };
    }

    try {
      // Call Pega API to get assignment details
      const result = await this.pegaClient.getAssignment(assignmentID.trim(), {
        viewType,
        pageName
      });

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(assignmentID, result.data, { viewType, pageName })
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(assignmentID, result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving assignment ${assignmentID}: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(assignmentID, data, options) {
    const { viewType } = options;
    
    let response = `## Assignment Details: ${assignmentID}\n\n`;
    
    if (data.data) {
      // Display assignment information
      if (data.assignmentInfo || data.data.assignmentInfo) {
        const assignmentInfo = data.assignmentInfo || data.data.assignmentInfo;
        response += '### Assignment Information\n';
        response += `- **Assignment ID**: ${assignmentInfo.ID || assignmentID}\n`;
        response += `- **Assignment Type**: ${assignmentInfo.assignmentType || 'N/A'}\n`;
        response += `- **Instructions**: ${assignmentInfo.instructions || 'N/A'}\n`;
        response += `- **Assigned To**: ${assignmentInfo.assignedTo || 'N/A'}\n`;
        response += `- **Due Date**: ${assignmentInfo.dueDate || 'N/A'}\n`;
        response += `- **Priority**: ${assignmentInfo.priority || 'N/A'}\n`;
        response += `- **Status**: ${assignmentInfo.status || 'N/A'}\n`;
        
        if (assignmentInfo.stepPageName) {
          response += `- **Step Page**: ${assignmentInfo.stepPageName}\n`;
        }
        
        if (assignmentInfo.stepDescription) {
          response += `- **Step Description**: ${assignmentInfo.stepDescription}\n`;
        }
      }

      // Display case information if available
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += '\n### Associated Case Information\n';
        response += `- **Case ID**: ${caseInfo.ID || 'N/A'}\n`;
        response += `- **Case Type**: ${caseInfo.caseTypeName || 'N/A'}\n`;
        response += `- **Case Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stage || 'N/A'}\n`;
        response += `- **Step**: ${caseInfo.step || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Created**: ${caseInfo.createTime || 'N/A'}\n`;
        response += `- **Last Updated**: ${caseInfo.lastUpdateTime || 'N/A'}\n`;
      }

      // Display available actions if present
      if (data.actions && data.actions.length > 0) {
        response += '\n### Available Actions\n';
        data.actions.forEach((action, index) => {
          response += `${index + 1}. **${action.name}** - ${action.type || 'Action'}\n`;
          if (action.ID) {
            response += `   - Action ID: ${action.ID}\n`;
          }
          if (action.tooltip) {
            response += `   - Description: ${action.tooltip}\n`;
          }
        });
      }

      // Display assignment content if available
      if (data.data.content && Object.keys(data.data.content).length > 0) {
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
      if (data.uiResources.resources && data.uiResources.resources.fields) {
        const fieldCount = Object.keys(data.uiResources.resources.fields).length;
        response += `- Form fields available: ${fieldCount}\n`;
      }
    }

    // Display eTag if available for future operations
    if (data.etag) {
      response += '\n### Operation Support\n';
      response += `- eTag captured: ${data.etag}\n`;
      response += '- Ready for assignment action operations\n';
    }

    // Display locking information if applicable
    if (data.lockInfo || data.data.lockInfo) {
      const lockInfo = data.lockInfo || data.data.lockInfo;
      response += '\n### Case Locking Status\n';
      if (lockInfo.locked) {
        response += '- **Status**: Case is now locked (pessimistic locking)\n';
        response += `- **Locked By**: ${lockInfo.lockedBy || 'Current user'}\n`;
        response += '- **Note**: Case will remain locked until assignment is completed or explicitly unlocked\n';
      } else {
        response += '- **Status**: No locking applied\n';
      }
    }

    response += '\n---\n';
    response += `*Retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(assignmentID, error) {
    let response = `## Error retrieving assignment: ${assignmentID}\n\n`;
    
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
        response += '\n**Suggestion**: Verify the assignment ID is correct and the assignment exists in the system. Check if the assignment might have been completed or reassigned.\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to access this assignment. The assignment might be restricted to specific users or roles.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: Check the assignment ID format and any additional parameters. Assignment IDs should follow the pattern: ASSIGN-WORKLIST PBANK-LOAN-WORK V-76003!REVIEW_FLOW.\n';
        break;
      case 'LOCKED':
        response += '\n**Suggestion**: This assignment or its associated case is currently locked by another user. Wait for the lock to be released or contact the user who has the lock.\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Suggestion**: The Pega Platform encountered an internal error. Please try again or contact support if the issue persists.\n';
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
