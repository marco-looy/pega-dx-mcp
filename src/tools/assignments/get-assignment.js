import { BaseTool } from '../../registry/base-tool.js';

export class GetAssignmentTool extends BaseTool {
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

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['assignmentID']);
    if (requiredValidation) {
      return requiredValidation;
    }

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
      `Assignment Details: ${assignmentID}`,
      async () => await this.pegaClient.getAssignment(assignmentID.trim(), {
        viewType,
        pageName
      }),
      { assignmentID, viewType, pageName }
    );
  }

  /**
   * Override formatSuccessResponse to add assignment specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { assignmentID, viewType } = options;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
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
    
    return response;
  }
}
