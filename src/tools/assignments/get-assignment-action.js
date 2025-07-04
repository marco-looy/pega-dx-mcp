import { BaseTool } from '../../registry/base-tool.js';

export class GetAssignmentActionTool extends BaseTool {
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
      name: 'get_assignment_action',
      description: 'Get detailed information about a specific action that can be performed on an assignment. Retrieves assignment action defined for an assignment step in a case process, including UI metadata and preprocessing execution. If the case type uses pessimistic locking and the client uses Constellation, this request may lock the case.',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Full handle of the assignment. Example: ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-36004!APPROVAL_FLOW'
          },
          actionID: {
            type: 'string',
            description: 'Name of the action to be retrieved - ID of the flow action rule. Example: Verify, Approve, Reject'
          },
          viewType: {
            type: 'string',
            enum: ['form', 'page'],
            description: 'Type of view data to return. "form" returns the form UI metadata (in read-only review mode, without page-specific metadata), "page" returns the full page (in read-only review mode) UI metadata in the uiResources object',
            default: 'page'
          },
          excludeAdditionalActions: {
            type: 'boolean',
            description: 'When true, excludes information on all actions performable on the case. Set to true if action information was already retrieved in a previous call. When false, response includes data.caseInfo.availableActions and data.caseInfo.assignments.actions fields',
            default: false
          }
        },
        required: ['assignmentID', 'actionID']
      }
    };
  }

  /**
   * Execute the get assignment action operation
   */
  async execute(params) {
    const { assignmentID, actionID, viewType = 'page', excludeAdditionalActions = false } = params;

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['assignmentID', 'actionID']);
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

    // Validate excludeAdditionalActions if provided
    if (excludeAdditionalActions !== undefined && typeof excludeAdditionalActions !== 'boolean') {
      return {
        error: 'Invalid excludeAdditionalActions parameter. Must be a boolean value.'
      };
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Assignment Action: ${actionID} for ${assignmentID}`,
      async () => await this.pegaClient.getAssignmentAction(
        assignmentID.trim(), 
        actionID.trim(), 
        {
          viewType,
          excludeAdditionalActions
        }
      ),
      { assignmentID, actionID, viewType, excludeAdditionalActions }
    );
  }

  /**
   * Override formatSuccessResponse to add assignment action specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { assignmentID, actionID, viewType, excludeAdditionalActions } = options;
    const eTag = data.eTag || data.etag;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    response += `**Assignment ID**: ${assignmentID}\n`;
    response += `**Action ID**: ${actionID}\n`;
    response += `**View Type**: ${viewType}\n\n`;
    
    if (data.data) {
      // Display case information if available  
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += '### Associated Case Information\n';
        response += `- **Case ID**: ${caseInfo.ID || caseInfo.businessID || 'N/A'}\n`;
        response += `- **Case Type**: ${caseInfo.caseTypeName || caseInfo.caseTypeID || 'N/A'}\n`;
        response += `- **Case Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stageLabel || caseInfo.stageID || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Owner**: ${caseInfo.owner || caseInfo.createdBy || 'N/A'}\n`;
        response += `- **Created**: ${caseInfo.createTime || 'N/A'}\n`;
        response += `- **Last Updated**: ${caseInfo.lastUpdateTime || 'N/A'}\n`;

        // Display assignment context within case
        if (caseInfo.assignments && caseInfo.assignments.length > 0) {
          response += '\n### Current Assignments\n';
          caseInfo.assignments.forEach((assignment, index) => {
            response += `${index + 1}. **${assignment.name || assignment.ID}**\n`;
            response += `   - Assignment ID: ${assignment.ID}\n`;
            response += `   - Process: ${assignment.processName || assignment.processID || 'N/A'}\n`;
            response += `   - Assigned To: ${assignment.assigneeInfo?.name || assignment.assigneeInfo?.ID || 'N/A'}\n`;
            response += `   - Instructions: ${assignment.instructions || 'N/A'}\n`;
            response += `   - Urgency: ${assignment.urgency || 'N/A'}\n`;
            response += `   - Can Perform: ${assignment.canPerform || 'N/A'}\n`;
            
            // Show actions for this assignment
            if (assignment.actions && assignment.actions.length > 0) {
              response += `   - Available Actions: ${assignment.actions.map(action => action.name || action.ID).join(', ')}\n`;
            }
          });
        }

        // Display available case actions if not excluded
        if (!excludeAdditionalActions && caseInfo.availableActions && caseInfo.availableActions.length > 0) {
          response += '\n### Available Case Actions\n';
          caseInfo.availableActions.forEach((action, index) => {
            response += `${index + 1}. **${action.name}** (${action.type})\n`;
            response += `   - Action ID: ${action.ID}\n`;
            if (action.tooltip) {
              response += `   - Description: ${action.tooltip}\n`;
            }
          });
        }

        // Display case stages if available
        if (caseInfo.stages && caseInfo.stages.length > 0) {
          response += '\n### Case Stages\n';
          caseInfo.stages.forEach((stage, index) => {
            const status = stage.visited_status === 'active' ? '🔄 Active' : 
                          stage.visited_status === 'completed' ? '✅ Completed' : '⭕ Pending';
            response += `${index + 1}. **${stage.name}** - ${status}\n`;
            response += `   - Stage ID: ${stage.ID}\n`;
            response += `   - Type: ${stage.type}\n`;
            if (stage.entryTime) {
              response += `   - Entry Time: ${stage.entryTime}\n`;
            }
          });
        }

        // Display case content if available
        if (caseInfo.content && Object.keys(caseInfo.content).length > 0) {
          response += '\n### Case Content\n';
          for (const [key, value] of Object.entries(caseInfo.content)) {
            if (key !== 'classID' && key !== 'summary_of_associated_lists__') {
              response += `- **${key}**: ${value}\n`;
            }
          }
        }
      }

      // Display referenced users if available
      if (data.data.referencedUsers && data.data.referencedUsers.length > 0) {
        response += '\n### Referenced Users\n';
        data.data.referencedUsers.forEach((user, index) => {
          response += `${index + 1}. **${user.UserName}** (${user.UserID})\n`;
        });
      }
    }

    // Display UI resources information
    if (data.uiResources) {
      response += '\n### UI Resources\n';
      response += `- UI metadata loaded for ${viewType} view\n`;
      
      if (data.uiResources.root) {
        response += `- Root component: ${data.uiResources.root.type || 'Unknown'}\n`;
        if (data.uiResources.root.config?.name) {
          response += `- View name: ${data.uiResources.root.config.name}\n`;
        }
      }
      
      if (data.uiResources.resources) {
        // Display available views
        if (data.uiResources.resources.views) {
          const viewCount = Object.keys(data.uiResources.resources.views).length;
          response += `- Available views: ${viewCount}\n`;
          for (const viewName of Object.keys(data.uiResources.resources.views)) {
            response += `  - ${viewName}\n`;
          }
        }
        
        // Display form fields
        if (data.uiResources.resources.fields) {
          const fieldCount = Object.keys(data.uiResources.resources.fields).length;
          response += `- Form fields available: ${fieldCount}\n`;
          const fieldNames = Object.keys(data.uiResources.resources.fields).slice(0, 10);
          if (fieldNames.length > 0) {
            response += `- Key fields: ${fieldNames.join(', ')}\n`;
            if (Object.keys(data.uiResources.resources.fields).length > 10) {
              response += `- (and ${Object.keys(data.uiResources.resources.fields).length - 10} more...)\n`;
            }
          }
        }
        
        // Display components
        if (data.uiResources.components && data.uiResources.components.length > 0) {
          response += `- UI components: ${data.uiResources.components.length}\n`;
          response += `- Component types: ${data.uiResources.components.slice(0, 8).join(', ')}\n`;
          if (data.uiResources.components.length > 8) {
            response += `- (and ${data.uiResources.components.length - 8} more...)\n`;
          }
        }
      }
      
      // Display action buttons if available
      if (data.uiResources.actionButtons) {
        response += '\n### Action Buttons\n';
        
        if (data.uiResources.actionButtons.main && data.uiResources.actionButtons.main.length > 0) {
          response += '**Primary Actions:**\n';
          data.uiResources.actionButtons.main.forEach((button, index) => {
            response += `${index + 1}. **${button.name}** (${button.actionID})\n`;
            if (button.jsAction) {
              response += `   - JavaScript Action: ${button.jsAction}\n`;
            }
          });
        }
        
        if (data.uiResources.actionButtons.secondary && data.uiResources.actionButtons.secondary.length > 0) {
          response += '\n**Secondary Actions:**\n';
          data.uiResources.actionButtons.secondary.forEach((button, index) => {
            response += `${index + 1}. **${button.name}** (${button.actionID})\n`;
            if (button.jsAction) {
              response += `   - JavaScript Action: ${button.jsAction}\n`;
            }
          });
        }
      }

      // Display context data if available
      if (data.uiResources.context_data) {
        response += '\n### Context Data\n';
        response += '- Form context data available for UI rendering\n';
      }
    }

    // Display locking information
    response += '\n### Assignment Access\n';
    response += '- Assignment action retrieved successfully\n';
    response += '- Any preprocessing rules have been executed\n';
    if (data.data?.caseInfo?.owner) {
      response += '- Case locking behavior depends on case type configuration\n';
    }

    // Display eTag if available for future operations
    if (eTag) {
      response += '\n### Operation Support\n';
      response += `- eTag captured: ${eTag}\n`;
      response += '- Ready for assignment action execution (PATCH operations)\n';
    }

    // Display optimization information
    if (excludeAdditionalActions) {
      response += '\n### Response Optimization\n';
      response += '- Additional actions excluded from response (optimization enabled)\n';
    }

    response += '\n---\n';
    response += `*Retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(assignmentID, actionID, error) {
    let response = `## Error retrieving assignment action: ${actionID}\n\n`;
    
    response += `**Assignment ID**: ${assignmentID}\n`;
    response += `**Action ID**: ${actionID}\n`;
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
        response += '\n**Suggestion**: Verify both the assignment ID and action ID are correct. The assignment might not exist, might have been completed, or the specific action might not be available for this assignment. Check the assignment\'s available actions first.\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to access this assignment action. The assignment might be restricted to specific users or roles, or the action might not be available in the current assignment state.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: Check the assignment ID and action ID format. Assignment IDs should follow the pattern: ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-36004!APPROVAL_FLOW. Action IDs should match the flow action rule names (e.g., "Verify", "Approve").\n';
        break;
      case 'LOCKED':
        response += '\n**Suggestion**: This assignment or its associated case is currently locked by another user. Wait for the lock to be released or contact the user who has the lock. With pessimistic locking, only one user can access the assignment at a time.\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Suggestion**: The Pega Platform encountered an internal error. This could be due to preprocessing rule failures or other server-side issues. Please try again or contact support if the issue persists.\n';
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
