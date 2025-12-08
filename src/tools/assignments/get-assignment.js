import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';
import {
  extractFieldsFromViews,
  extractValidationErrors,
  groupFieldsByRequired,
  formatValidationErrors,
  extractFieldMetadata,
  formatFieldMetadata,
  extractFieldsForCurrentView,
  formatCurrentStepFields
} from '../../utils/field-extractor.js';

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
      description: 'Get assignment details including form fields, required fields, available actions, and eTag. Used BETWEEN case creation and action performance. Returns form structure, action IDs, and eTag needed for subsequent operations. Required fields marked with "required": true in view config (uiResources.resources.views). Pessimistic locking may apply.',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Assignment ID from create_case (nextAssignmentInfo.ID) or perform_assignment_action. Format: ASSIGN-WORKLIST {caseID}!{processID}. Example: ASSIGN-WORKLIST PBANK-LOAN-WORK V-76003!REVIEW_FLOW'
          },
          viewType: {
            type: 'string',
            enum: ['form', 'page'],
            description: 'UI resources to return. "form" (recommended): field metadata and view structure. "page": full page UI metadata. Both include required field markers in view config.',
            default: 'form'
          },
          pageName: {
            type: 'string',
            description: 'If provided, returns view metadata for the pageName view (only used when viewType is "page")'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['assignmentID']
      }
    };
  }

  /**
   * Execute the get assignment operation
   */
  async execute(params) {
    const { assignmentID, viewType = 'form', pageName } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

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
        { assignmentID, viewType, pageName, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Assignment Details\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Override formatSuccessResponse to add assignment specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { assignmentID, viewType, sessionInfo } = options;

    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }
    
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
      // Actions can be in data.actions or data.data.caseInfo.assignments[0].actions
      let actions = data.actions;

      if (!actions || actions.length === 0) {
        // Try alternate location
        const assignments = data.data?.caseInfo?.assignments;
        if (assignments && assignments.length > 0 && assignments[0].actions) {
          actions = assignments[0].actions;
        }
      }

      if (actions && actions.length > 0) {
        response += '\n### ⚠️ Available Actions - CASE SENSITIVE!\n\n';
        response += '**Action IDs are case-sensitive. Copy the exact ID from the table below:**\n\n';
        response += '| Action ID | Display Name | Type |\n';
        response += '|-----------|--------------|------|\n';

        actions.forEach((action) => {
          const actionID = action.ID || 'Unknown';
          const actionName = action.name || actionID;
          const actionType = action.type || 'Action';
          response += `| \`${actionID}\` | ${actionName} | ${actionType} |\n`;
        });
        response += '\n';

        // Show actionButtons if available (recommended actions from UI)
        if (data.uiResources?.actionButtons) {
          const actionButtons = data.uiResources.actionButtons;
          const mainButtons = actionButtons.main || [];
          const secondaryButtons = actionButtons.secondary || [];

          if (mainButtons.length > 0 || secondaryButtons.length > 0) {
            response += '**🎯 Recommended Actions (from UI):**\n\n';

            if (mainButtons.length > 0) {
              response += 'Primary Actions (submit buttons):\n';
              mainButtons.forEach(button => {
                response += `- \`${button.actionID}\` - ${button.name}\n`;
              });
              response += '\n';
            }

            if (secondaryButtons.length > 0) {
              response += 'Secondary Actions (cancel, save, etc.):\n';
              secondaryButtons.forEach(button => {
                response += `- \`${button.actionID}\` - ${button.name}\n`;
              });
              response += '\n';
            }
          }
        }

        // Display navigation steps for screen flows (if available)
        if (data.uiResources?.navigation?.steps) {
          response += '\n### Screen Flow Navigation\n\n';
          response += '**This is a multi-step screen flow. Current step progress:**\n\n';
          response += '| Step | Action ID | Status |\n';
          response += '|------|-----------|--------|\n';

          data.uiResources.navigation.steps.forEach(step => {
            const status = step.visited_status === 'success' ? '✅' :
                           step.visited_status === 'current' ? '🔄 CURRENT' : '⭕';
            response += `| ${step.name} | \`${step.actionID}\` | ${status} |\n`;
          });
          response += '\n**Use the Action ID of the CURRENT step for `perform_assignment_action`**\n\n';
        }
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
      // PRIORITY: Show current step fields first (fields actually editable in this step)
      const currentStepFields = extractFieldsForCurrentView(data.uiResources);
      if (currentStepFields.length > 0) {
        response += formatCurrentStepFields(currentStepFields);
      }

      // Show all case fields in a collapsed/secondary section
      const allFieldMetadata = extractFieldMetadata(data.uiResources);
      if (allFieldMetadata.length > 0 && allFieldMetadata.length !== currentStepFields.length) {
        response += `\n<details>\n<summary>📋 All Case Fields (${allFieldMetadata.length} total - click to expand)</summary>\n`;
        response += formatFieldMetadata(allFieldMetadata);
        response += `</details>\n`;
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

    // Add workflow guidance
    // Get actions for example (check both locations)
    let exampleActions = data.actions;
    if (!exampleActions || exampleActions.length === 0) {
      const assignments = data.data?.caseInfo?.assignments;
      if (assignments && assignments.length > 0 && assignments[0].actions) {
        exampleActions = assignments[0].actions;
      }
    }

    response += '\n### Next Steps\n\n';
    response += '**To complete this assignment**:\n\n';
    response += '1. **Identify Required Fields**: Look for "required": true in the UI Resources view config above\n';
    response += '2. **Prepare Field Values**: Gather values for all required fields\n';
    response += '3. **Optional - Progressive Filling**: Use `refresh_assignment_action` to fill and validate fields progressively\n';
    response += '4. **Submit Assignment**: Use `perform_assignment_action` with:\n';
    response += '   - Assignment ID: The assignment ID from above\n';
    response += '   - **Action ID: Copy the EXACT action ID from "Available Actions" table** (case-sensitive!)\n\n';

    if (exampleActions && exampleActions.length > 0 && exampleActions[0].ID) {
      response += `**Example:**\n`;
      response += `\`\`\`javascript\n`;
      response += `perform_assignment_action({\n`;
      response += `  assignmentID: "${assignmentID}",\n`;
      response += `  actionID: "${exampleActions[0].ID}",  // ⚠️ Copy exactly from table above!\n`;
      response += `  content: { /* your field values */ }\n`;
      response += `})\n`;
      response += `\`\`\`\n\n`;
    }

    response += '**Helpful Tools**:\n';
    response += '- `refresh_assignment_action`: Update fields progressively with real-time validation\n';
    response += '- `perform_assignment_action`: Submit completed assignment\n';
    response += '- `get_assignment_action`: Get details about a specific action\n\n';

    return response;
  }
}
