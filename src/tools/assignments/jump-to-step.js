import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class JumpToStepTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'assignments';
  }

  /**
   * Get tool definition for MCP protocol
   * Implements PATCH /assignments/{assignmentID}/navigation_steps/{stepID}
   * Jumps to a specified step within an assignment's navigation flow
   */
  static getDefinition() {
    return {
      name: 'jump_to_step',
      description: 'Jump to the specified step within an assignment\'s navigation flow and return the details of the step based on step ID passed. Additional "navigation" node will be returned under "uiResources" to build navigation breadcrumb. This is useful for multi-step assignments, screen flows, and complex processes where you need to navigate directly to a specific step rather than progressing sequentially. To discover valid step IDs: use get_assignment to see current step context, check navigation breadcrumb information for available steps, or examine the assignment\'s process flow. Step IDs typically follow formats like "SubProcessSF1_ASSIGNMENT66" or "ProcessStep_123".',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Full handle of the assignment to navigate within. Format: ASSIGN-WORKLIST {caseID}!{processID}. Example: "ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW". This is the complete assignment identifier that uniquely identifies the specific assignment instance containing the navigation steps.'
          },
          stepID: {
            type: 'string',
            description: 'Navigation step path to jump to within the assignment. This identifies the specific step in the assignment\'s navigation flow. Examples: "SubProcessSF1_ASSIGNMENT66", "ProcessStep_123", "ReviewStep_1". To find valid step IDs: use get_assignment to see current navigation context, examine the assignment\'s process definition, or check previous navigation responses for available step identifiers.'
          },
          eTag: {
            type: 'string',
            description: 'Optional eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. If not provided, the tool will automatically fetch the latest eTag from the assignment. For manual eTag management, provide the eTag from a previous assignment operation. Used for optimistic locking to prevent concurrent modification conflicts.'
          },
          content: {
            type: 'object',
            description: 'Optional map of scalar properties and embedded page properties to be set during the navigation to the specified step. Only fields that are part of the assignment\'s view can be modified. Field names should match the property names defined in the Pega application. Example: {"ReviewComments": "Approved with conditions", "Priority": "High"}. Values will be applied when jumping to the target step.'
          },
          pageInstructions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                instruction: {
                  type: 'string',
                  enum: ['UPDATE', 'REPLACE', 'DELETE', 'APPEND', 'INSERT', 'MOVE'],
                  description: 'The type of page instruction: UPDATE (add fields to page), REPLACE (replace entire page), DELETE (remove page), APPEND (add item to page list), INSERT (insert item in page list), MOVE (reorder page list items)'
                },
                target: {
                  type: 'string',
                  description: 'The target embedded page name'
                },
                content: {
                  type: 'object',
                  description: 'Content to set on the embedded page (required for UPDATE and REPLACE)'
                }
              },
              required: ['instruction', 'target'],
              description: 'Page operation for embedded pages. Use REPLACE instruction to set embedded page references with full object including pzInsKey. Example: {"instruction": "REPLACE", "target": "PageName", "content": {"Property": "value", "pyID": "ID-123", "pzInsKey": "CLASS-NAME ID-123"}}'
            },
            description: 'Optional list of page-related operations for embedded pages, page lists, or page groups. Required for setting embedded page references. Only pages included in the assignment\'s view can be modified.'
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  description: 'Name of the attachment file'
                },
                fileContent: {
                  type: 'string',
                  description: 'Base64 encoded file content'
                },
                mimeType: {
                  type: 'string',
                  description: 'MIME type of the attachment'
                }
              },
              description: 'Attachment object with file details and metadata'
            },
            description: 'Optional list of attachments to be added to or deleted from specific attachment fields during the step navigation. Each attachment entry specifies the operation (add/delete) and attachment details. Only attachment fields included in the assignment\'s view can be modified during navigation.'
          },
          viewType: {
            type: 'string',
            enum: ['form', 'page', 'none'],
            description: 'Type of view data to return in the response. "none" returns no UI resources (default), "form" returns form UI metadata in read-only review mode without page-specific metadata, "page" returns full page UI metadata in read-only review mode. The response will include navigation breadcrumb information under uiResources.navigation regardless of viewType to support navigation UI construction.',
            default: 'form'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['assignmentID', 'stepID']
      }
    };
  }

  /**
   * Execute the jump to step operation
   */
  async execute(params) {
    const { assignmentID, stepID, eTag, content, pageInstructions, attachments, viewType } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['assignmentID', 'stepID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate enum parameters using base class
    const enumValidation = this.validateEnumParams(params, {
      viewType: ['form', 'page', 'none']
    });
    if (enumValidation) {
      return enumValidation;
    }

    // Validate optional complex parameters
    if (content && typeof content !== 'object') {
      return {
        error: 'content must be an object when provided'
      };
    }

    if (pageInstructions && !Array.isArray(pageInstructions)) {
      return {
        error: 'pageInstructions must be an array when provided'
      };
    }

    if (attachments && !Array.isArray(attachments)) {
      return {
        error: 'attachments must be an array when provided'
      };
    }

    // Auto-fetch eTag if not provided
    let finalETag = eTag;
    let autoFetchedETag = false;
    
    if (!finalETag) {
      try {
        console.log(`Auto-fetching latest eTag for step jump on ${assignmentID}...`);
        const response = await this.pegaClient.getAssignment(assignmentID.trim(), {
          viewType: 'form'  // Use form view for eTag retrieval
        });
        
        if (!response || !response.success) {
          const errorMsg = `Failed to auto-fetch eTag: ${response?.error?.message || 'Unknown error'}`;
          return {
            error: errorMsg
          };
        }
        
        finalETag = response.eTag;
        autoFetchedETag = true;
        console.log(`Successfully auto-fetched eTag: ${finalETag}`);
        
        if (!finalETag) {
          const errorMsg = 'Auto-fetch succeeded but no eTag was returned from getAssignment. This may indicate a server issue.';
          return {
            error: errorMsg
          };
        }
      } catch (error) {
        const errorMsg = `Failed to auto-fetch eTag: ${error.message}`;
        return {
          error: errorMsg
        };
      }
    }
    
    // Validate eTag format (should be a timestamp-like string)
    if (typeof finalETag !== 'string' || finalETag.trim().length === 0) {
      return {
        error: 'Invalid eTag parameter. Must be a non-empty string representing case save date time.'
      };
    }



    // Prepare request options
    const options = {};
    
    if (content) options.content = content;
    if (pageInstructions) options.pageInstructions = pageInstructions;
    if (attachments) options.attachments = attachments;
    if (viewType) options.viewType = viewType;

    // Execute jump to step operation with comprehensive error handling
    return await this.executeWithErrorHandling(
      `Jump to Step: ${stepID} in Assignment: ${assignmentID}`,
      async () => await this.pegaClient.jumpToAssignmentStep(assignmentID, stepID, finalETag, options),
      { params: { assignmentID, stepID, eTag: finalETag, viewType, content, pageInstructions, attachments }, sessionInfo }
    );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Jump to Step\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(operation, data, options = {}) {
    return this.buildSuccessMarkdown(data, options.params || {});
  }

  /**
   * Build success response markdown with navigation context
   */
  buildSuccessMarkdown(data, params) {
    const { sessionInfo } = params;
    let markdown = `# Assignment Step Navigation Successful\n\n`;
    markdown += `**Assignment ID:** ${params.assignmentID}\n`;
    markdown += `**Target Step ID:** ${params.stepID}\n`;
    markdown += `**Navigation Completed:** ${new Date().toISOString()}\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      markdown += `## Session Information\n\n`;
      markdown += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      markdown += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      markdown += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }

    // Current Step Information
    if (data.data && data.data.caseInfo) {
      const caseInfo = data.data.caseInfo;
      markdown += `## Current Assignment Context\n\n`;
      markdown += `**Case ID:** ${caseInfo.ID || 'N/A'}\n`;
      markdown += `**Case Type:** ${caseInfo.caseTypeName || 'N/A'}\n`;
      markdown += `**Status:** ${caseInfo.status || 'N/A'}\n`;
      markdown += `**Stage:** ${caseInfo.stageLabel || 'N/A'}\n`;
      markdown += `**Last Updated:** ${caseInfo.lastUpdateTime || 'N/A'}\n\n`;

      // Current Assignments after navigation
      if (caseInfo.assignments && caseInfo.assignments.length > 0) {
        markdown += `### Current Assignment Details\n`;
        caseInfo.assignments.forEach(assignment => {
          markdown += `- **${assignment.name}** (${assignment.ID})\n`;
          markdown += `  - Process: ${assignment.processName}\n`;
          markdown += `  - Assignee: ${assignment.assigneeInfo?.name || 'N/A'}\n`;
          markdown += `  - Urgency: ${assignment.urgency}\n`;
          markdown += `  - Can Perform: ${assignment.canPerform}\n`;
          
          if (assignment.actions && assignment.actions.length > 0) {
            markdown += `  - Available Actions: ${assignment.actions.map(a => a.name).join(', ')}\n`;
          }
        });
        markdown += `\n`;
      }
    }

    // Navigation Breadcrumb Information
    if (data.uiResources && data.uiResources.navigation) {
      markdown += `## Navigation Breadcrumb\n\n`;
      markdown += `The navigation breadcrumb provides context for the current step position within the assignment flow:\n\n`;
      
      if (data.uiResources.navigation.breadcrumb) {
        markdown += `### Breadcrumb Trail\n`;
        data.uiResources.navigation.breadcrumb.forEach((step, index) => {
          const isCurrent = step.current || step.active;
          const status = isCurrent ? '👉 **CURRENT**' : step.completed ? '✅' : '⭕';
          markdown += `${index + 1}. ${status} ${step.name || step.label} (${step.ID || step.stepID})\n`;
          if (step.description) {
            markdown += `   - ${step.description}\n`;
          }
        });
        markdown += `\n`;
      }

      // Available Navigation Options
      if (data.uiResources.navigation.availableSteps) {
        markdown += `### Available Navigation Steps\n`;
        data.uiResources.navigation.availableSteps.forEach(step => {
          markdown += `- **${step.name || step.label}** (ID: ${step.ID || step.stepID})\n`;
          if (step.description) {
            markdown += `  - ${step.description}\n`;
          }
          if (step.accessible !== undefined) {
            markdown += `  - Accessible: ${step.accessible ? 'Yes' : 'No'}\n`;
          }
        });
        markdown += `\n`;
      }
    }

    // UI Resources Information
    if (data.uiResources && params.viewType !== 'none') {
      markdown += `## UI Resources\n\n`;
      markdown += `**View Type:** ${params.viewType}\n`;
      
      if (data.uiResources.resources) {
        if (data.uiResources.resources.views) {
          const viewCount = Object.keys(data.uiResources.resources.views).length;
          markdown += `**Available Views:** ${viewCount}\n`;
        }
        
        if (data.uiResources.resources.fields) {
          const fieldCount = Object.keys(data.uiResources.resources.fields).length;
          markdown += `**Available Fields:** ${fieldCount}\n`;
        }
      }

      if (data.uiResources.components) {
        markdown += `**Components:** ${data.uiResources.components.length}\n`;
      }

      if (data.uiResources.actionButtons) {
        markdown += `**Action Buttons Available:** Yes\n`;
        if (data.uiResources.actionButtons.main) {
          markdown += `- Main Actions: ${data.uiResources.actionButtons.main.length}\n`;
        }
        if (data.uiResources.actionButtons.secondary) {
          markdown += `- Secondary Actions: ${data.uiResources.actionButtons.secondary.length}\n`;
        }
      }
      markdown += `\n`;
    }

    // Next Steps and Usage Information
    markdown += `## Next Steps\n\n`;
    markdown += `- Use \`get_assignment\` to get detailed information about the current assignment state\n`;
    markdown += `- Use \`get_assignment_action\` to explore available actions for the current step\n`;
    markdown += `- Use \`perform_assignment_action\` to execute actions on the current step\n`;
    markdown += `- Use \`jump_to_step\` again to navigate to other steps within the assignment\n`;
    markdown += `- Use \`navigate_assignment_previous\` to go back to the previous step if needed\n\n`;

    // Step ID Discovery Guidance
    markdown += `## Finding Valid Step IDs\n\n`;
    markdown += `To discover available step IDs for navigation:\n\n`;
    markdown += `1. **Current Assignment Context:** Use \`get_assignment\` to see the current step and navigation context\n`;
    markdown += `2. **Navigation Breadcrumb:** Check the navigation information returned in this response under uiResources.navigation\n`;
    markdown += `3. **Process Flow:** Examine the assignment's underlying process definition for step identifiers\n`;
    markdown += `4. **Previous Responses:** Look at previous navigation operation responses for step ID patterns\n\n`;
    markdown += `**Common Step ID Formats:**\n`;
    markdown += `- Process-based: "SubProcessSF1_ASSIGNMENT66"\n`;
    markdown += `- Sequential: "ProcessStep_123" or "Step_1", "Step_2"\n`;
    markdown += `- Descriptive: "ReviewStep_1", "ApprovalStep_Final"\n`;
    markdown += `- Flow-based: "ASSIGNMENT_STEP_ID" or "FlowStep_XYZ"\n\n`;

    markdown += `*Navigation completed at ${new Date().toISOString()}*`;

    return markdown;
  }

  /**
   * Format error response for display with navigation-specific guidance
   */
  formatErrorResponse(operation, error, options = {}) {
    return this.buildNavigationErrorMarkdown(error);
  }

  /**
   * Build error response markdown with navigation-specific guidance
   */
  buildNavigationErrorMarkdown(error) {
    let markdown = `# Assignment Step Navigation Failed\n\n`;
    markdown += `**Error Type:** ${error.type || 'UNKNOWN_ERROR'}\n`;
    markdown += `**Timestamp:** ${new Date().toISOString()}\n\n`;

    // Specific error guidance based on error type
    switch (error.type) {
      case 'NOT_FOUND':
        markdown += `## Assignment or Step Not Found\n\n`;
        markdown += `The specified assignment or navigation step could not be found.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Assignment ID is incorrect or malformed\n`;
        markdown += `- Step ID does not exist within this assignment's navigation flow\n`;
        markdown += `- Assignment has been completed or cancelled\n`;
        markdown += `- Navigation step is not accessible from the current state\n`;
        markdown += `- You don't have access to this assignment or step\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify the assignment ID format (should be ASSIGN-WORKLIST {caseID}!{processID})\n`;
        markdown += `- Use \`get_assignment\` to verify the assignment exists and see available navigation context\n`;
        markdown += `- Check the assignment's process flow for valid step identifiers\n`;
        markdown += `- Use \`get_next_assignment\` to find available assignments\n`;
        markdown += `- Verify the step ID matches the expected format for this assignment type\n`;
        break;

      case 'BAD_REQUEST':
        markdown += `## Invalid Navigation Request\n\n`;
        markdown += `The navigation request contains invalid data or parameters.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Invalid assignment ID or step ID format\n`;
        markdown += `- Step ID is not valid for the current assignment state\n`;
        markdown += `- Content fields not applicable to the target step\n`;
        markdown += `- Invalid field values or types\n`;
        markdown += `- Navigation not supported for this assignment type\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify all required parameters are provided correctly\n`;
        markdown += `- Check that the step ID follows the correct format for this assignment\n`;
        markdown += `- Use \`get_assignment\` to see the current assignment structure and available navigation options\n`;
        markdown += `- Ensure content fields are appropriate for the target step\n`;
        markdown += `- Verify this assignment supports multi-step navigation\n`;
        break;

      case 'PRECONDITION_FAILED':
        markdown += `## finalETag.trim() Mismatch\n\n`;
        markdown += `The provided finalETag.trim() value doesn't match the current assignment state.\n\n`;
        markdown += `**Cause:**\n`;
        markdown += `- The assignment has been modified since you last retrieved the eTag\n`;
        markdown += `- The eTag value is incorrect or outdated\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Use \`get_assignment\` to get a fresh eTag value\n`;
        markdown += `- Retry the navigation with the new eTag\n`;
        markdown += `- Ensure you're using the most recent finalETag.trim() from the previous request\n`;
        break;

      case 'CONFLICT':
        markdown += `## Navigation Conflict\n\n`;
        markdown += `The assignment state has changed and prevents navigation to the specified step.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Assignment was modified by another user\n`;
        markdown += `- The target step is no longer accessible from the current state\n`;
        markdown += `- Concurrent navigation operations\n`;
        markdown += `- Workflow state has changed\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Use \`get_assignment\` to get the current assignment state\n`;
        markdown += `- Check the current navigation context and available steps\n`;
        markdown += `- Retry navigation with updated assignment information\n`;
        markdown += `- Consider if the target step is still valid given the current workflow state\n`;
        break;

      case 'FORBIDDEN':
        markdown += `## Access Denied\n\n`;
        markdown += `You don't have permission to navigate to this step.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Assignment is not assigned to you\n`;
        markdown += `- Your user role doesn't have permission for step navigation\n`;
        markdown += `- The target step requires higher privileges\n`;
        markdown += `- Assignment is locked by another user\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Check if the assignment is assigned to your user\n`;
        markdown += `- Verify your user role has the necessary navigation permissions\n`;
        markdown += `- Contact your Pega administrator for access\n`;
        markdown += `- Check if the assignment is currently locked\n`;
        break;

      case 'LOCKED':
        markdown += `## Assignment Locked\n\n`;
        markdown += `The assignment is currently locked by another user.\n\n`;
        markdown += `**Cause:**\n`;
        markdown += `- Another user has the assignment open for editing\n`;
        markdown += `- Pessimistic locking is enabled for this assignment type\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Wait for the other user to complete their work\n`;
        markdown += `- Try again later\n`;
        markdown += `- Contact the user who has the assignment locked\n`;
        break;

      default:
        markdown += `## Navigation Error Details\n\n`;
        if (error.message) {
          markdown += `**Message:** ${error.message}\n\n`;
        }
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify all parameters are correct\n`;
        markdown += `- Check your Pega connection configuration\n`;
        markdown += `- Use \`get_assignment\` to verify assignment state\n`;
        markdown += `- Try the navigation request again\n`;
        markdown += `- If the problem persists, contact support\n`;
    }

    markdown += `\n## Navigation Troubleshooting Tips\n\n`;
    markdown += `- Use \`ping_pega_service\` to verify your connection to Pega\n`;
    markdown += `- Use \`get_assignment\` to check the current assignment status and navigation context\n`;
    markdown += `- Use \`get_assignment_action\` to see available actions for the current step\n`;
    markdown += `- Ensure your user has the necessary permissions for assignment navigation\n\n`;

    markdown += `## Step ID Discovery Help\n\n`;
    markdown += `If you're having trouble finding valid step IDs:\n\n`;
    markdown += `1. **Get Assignment Details:** Use \`get_assignment ASSIGNMENT_ID\` to see current navigation context\n`;
    markdown += `2. **Check Process Flow:** Look at the assignment's underlying process definition\n`;
    markdown += `3. **Navigation History:** Check previous navigation responses for step ID patterns\n`;
    markdown += `4. **Assignment Type:** Different assignment types may use different step ID conventions\n\n`;
    markdown += `**Common Step ID Patterns:**\n`;
    markdown += `- "SubProcessSF1_ASSIGNMENT66" (subprocess with assignment number)\n`;
    markdown += `- "ProcessStep_1", "ProcessStep_2" (sequential numbering)\n`;
    markdown += `- "ReviewStep", "ApprovalStep" (descriptive names)\n`;
    markdown += `- "STEP_ID_CONSTANT" (configured constants)\n\n`;

    markdown += `*Navigation error occurred at ${new Date().toISOString()}*`;

    return markdown;
  }
}
