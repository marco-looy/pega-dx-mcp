import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';
import {
  extractFieldsFromViews,
  extractValidationErrors,
  groupFieldsByRequired,
  formatValidationErrors
} from '../../utils/field-extractor.js';

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
      description: 'Get detailed information about a specific action that can be performed on an assignment. Retrieves assignment action defined for an assignment step in a case process, including UI metadata and preprocessing execution. If the case type uses pessimistic locking and the client uses Constellation, this request may lock the case. Get details for ONE specific action. Often optional - most workflows use: get_assignment (all actions + eTag) → perform_assignment_action. Use this when you need action-specific details.',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Assignment ID. Format: ASSIGN-WORKLIST {caseID}!{processID}. Example: "ASSIGN-WORKLIST MYORG-APP-WORK C-1001!PROCESS"'
          },
          actionID: {
            type: 'string',
            description: 'Action ID from assignment (Example: "pyApproval", "Submit"). CRITICAL: Action IDs are CASE-SENSITIVE and have no spaces even if display names do ("Complete Review" → "CompleteReview"). Use get_assignment to find correct ID from actions array - use "ID" field not "name" field.'
          },
          viewType: {
            type: 'string',
            enum: ['form', 'page'],
            description: 'UI resources to return. "form" returns the form UI metadata (in read-only review mode, without page-specific metadata), "page" returns the full page (in read-only review mode) UI metadata in the uiResources object',
            default: 'page'
          },
          excludeAdditionalActions: {
            type: 'boolean',
            description: 'Whether to exclude additional action information. Set true if actions already retrieved. Default: false',
            default: false
          },
          sessionCredentials: getSessionCredentialsSchema()
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
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

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
          error: 'Invalid excludeAdditionalActions parameter. a boolean value.'
        };
      }

      // Execute API call
      const result = await this.pegaClient.getAssignmentAction(
        assignmentID.trim(),
        actionID.trim(),
        {
          viewType,
          excludeAdditionalActions
        }
      );

      // Check if API call was successful
      if (result.success) {
        return this.formatSuccessResponse(
          `Assignment Action: ${actionID} for ${assignmentID}`,
          result.data,
          { assignmentID, actionID, viewType, excludeAdditionalActions, sessionInfo }
        );
      } else {
        // Check if this is an invalid action ID error
        const isInvalidActionError = this.isInvalidActionIdError(result.error);

        if (isInvalidActionError) {
          // Auto-discover available actions and show user the correct IDs
          return await this.discoverActionsAndGuide(assignmentID, actionID, result.error);
        }

        // Format and return error response from API
        return this.formatErrorResponse(result.error, { assignmentID, actionID, sessionInfo });
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Assignment Action\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Check if error indicates invalid action ID
   * Handles both NOT_FOUND and CONFLICT errors with invalid action messages
   */
  isInvalidActionIdError(error) {
    if (!error) return false;

    // Check for NOT_FOUND error type
    if (error.type === 'NOT_FOUND') {
      return true;
    }

    // Check for CONFLICT error with "not a valid action" message
    if (error.type === 'CONFLICT') {
      const message = error.message?.toLowerCase() || '';
      const details = typeof error.details === 'string' ? error.details.toLowerCase() : '';

      // Check main message and details
      if (message.includes('not a valid action') ||
          details.includes('not a valid action') ||
          (message.includes('action') && message.includes('invalid'))) {
        return true;
      }

      // Check errorDetails array for specific action validation errors
      if (error.errorDetails && Array.isArray(error.errorDetails)) {
        for (const errorDetail of error.errorDetails) {
          const detailMessage = (errorDetail.message || '').toLowerCase();
          const detailLocalized = (errorDetail.localizedValue || '').toLowerCase();

          if (detailMessage.includes('not a valid action') ||
              detailLocalized.includes('not a valid action') ||
              detailMessage.includes('is not a valid action to use') ||
              detailLocalized.includes('is not a valid action to use')) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Discover available actions when action ID is not found
   * Shows user the correct action IDs to use
   */
  async discoverActionsAndGuide(assignmentID, attemptedActionID, originalError) {
    try {
      // Fetch assignment to get available actions
      const assignmentResponse = await this.pegaClient.getAssignment(assignmentID, 'none');

      if (!assignmentResponse.success) {
        // If we can't fetch assignment, return original error
        return this.formatErrorResponse('Get Assignment Action', originalError, { assignmentID, actionID: attemptedActionID });
      }

      const assignmentData = assignmentResponse.data;
      const actions = assignmentData?.data?.caseInfo?.assignments?.[0]?.actions || [];

      if (actions.length === 0) {
        // No actions found, return original error
        return this.formatErrorResponse('Get Assignment Action', originalError, { assignmentID, actionID: attemptedActionID });
      }

      // Build guidance response with available actions
      let response = `# Assignment Action Not Found\n\n`;
      response += `**Attempted Action ID**: \`${attemptedActionID}\`\n`;
      response += `**Assignment ID**: ${assignmentID}\n\n`;

      response += `## ⚠️ Action ID Issue - CASE SENSITIVE!\n\n`;
      response += `The action ID "${attemptedActionID}" was not found for this assignment.\n\n`;
      response += `**Action IDs are CASE-SENSITIVE:**\n`;
      response += `- "Submit" ≠ "submit" ≠ "SUBMIT"\n`;
      response += `- "Complete Review" → usually "CompleteReview" (no spaces)\n`;
      response += `- Always use the exact ID from the "ID" field, not the "name" field\n\n`;

      response += `## ✅ Available Actions (${actions.length})\n\n`;
      response += `Copy the exact action ID from this table:\n\n`;

      response += `| Action ID | Display Name | Type |\n`;
      response += `|-----------|--------------|------|\n`;

      actions.forEach(action => {
        const actionID = action.ID || 'Unknown';
        const actionName = action.name || actionID;
        const actionType = action.type || 'FlowAction';
        response += `| \`${actionID}\` | ${actionName} | ${actionType} |\n`;
      });

      response += `\n`;

      // Show actionButtons if available (these are the recommended actions)
      const actionButtons = assignmentData?.uiResources?.actionButtons;
      if (actionButtons) {
        const mainButtons = actionButtons.main || [];
        const secondaryButtons = actionButtons.secondary || [];

        if (mainButtons.length > 0 || secondaryButtons.length > 0) {
          response += `## 🎯 Recommended Actions (from UI)\n\n`;

          if (mainButtons.length > 0) {
            response += `**Primary Actions** (submit buttons):\n`;
            mainButtons.forEach(button => {
              response += `- \`${button.actionID}\` - ${button.name}\n`;
            });
            response += `\n`;
          }

          if (secondaryButtons.length > 0) {
            response += `**Secondary Actions** (cancel, save, etc.):\n`;
            secondaryButtons.forEach(button => {
              response += `- \`${button.actionID}\` - ${button.name}\n`;
            });
            response += `\n`;
          }
        }
      }

      response += `## 💡 Next Steps\n\n`;
      response += `1. **Copy the exact action ID** from the table above (case-sensitive!)\n`;
      response += `2. Retry your call with the correct action ID\n\n`;

      response += `**Example:**\n`;
      if (actions.length > 0) {
        const exampleAction = actions[0];
        response += `\`\`\`javascript\n`;
        response += `get_assignment_action({\n`;
        response += `  assignmentID: "${assignmentID}",\n`;
        response += `  actionID: "${exampleAction.ID}"  // ⚠️ CASE-SENSITIVE - copy exactly!\n`;
        response += `})\n`;
        response += `\`\`\`\n\n`;
      }

      response += `*Action discovery completed at ${new Date().toISOString()}*`;

      return {
        content: [{
          type: 'text',
          text: response
        }]
      };

    } catch (discoveryError) {
      // If discovery fails, return original error with additional context
      return this.formatErrorResponse(
        'Get Assignment Action',
        {
          ...originalError,
          message: `${originalError.message}\n\nFailed to auto-discover available actions: ${discoveryError.message}`
        },
        { assignmentID, actionID: attemptedActionID }
      );
    }
  }

  /**
   * Override formatSuccessResponse to add assignment action specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { assignmentID, actionID, viewType, excludeAdditionalActions, sessionInfo } = options;
    const eTag = data.eTag || data.etag;

    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }
    
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

    // Display next steps guidance
    response += '\n### Next Steps\n\n';
    response += `To execute this action:\n`;
    response += `1. Prepare content with field values (see fields above)\n`;
    response += `2. Use \`perform_assignment_action\` with:\n`;
    response += `   - assignmentID: "${assignmentID}"\n`;
    response += `   - actionID: "${actionID}"\n`;
    if (eTag) {
      response += `   - eTag: "${eTag}" (from this response)\n`;
    }
    response += `   - content: {field values}\n\n`;

    response += '\n---\n';
    response += `*Retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(operation, error, options = {}) {
    const { assignmentID, actionID } = options;
    let response = `## Error retrieving assignment action: ${actionID || 'Unknown'}\n\n`;
    
    response += `**Assignment ID**: ${assignmentID || 'Unknown'}\n`;
    response += `**Action ID**: ${actionID || 'Unknown'}\n`;
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
        response += '\n**Suggestion**: Check the assignment ID and action ID format. Assignment IDs should follow the pattern: ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-36004!APPROVAL_FLOW. Action IDs should match the flow action rule names (Example: "Verify", "Approve").\n';
        break;
      case 'LOCKED':
        response += '\n**Suggestion**: This assignment or its associated case is currently locked by another user. Wait for the lock to be released or contact the user who has the lock. With pessimistic locking, only one user can access the assignment at a time.\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Suggestion**: The Pega Infinity server encountered an internal error. This could be due to preprocessing rule failures or other server-side issues. Please try again or contact support if the issue persists.\n';
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
