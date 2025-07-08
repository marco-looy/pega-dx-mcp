import { BaseTool } from '../../registry/base-tool.js';

export class PerformAssignmentActionTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'assignments';
  }

  /**
   * Get tool definition for MCP protocol
   * Implements PATCH /assignments/{assignmentID}/actions/{actionID}
   * Performs an action on an assignment, updating case data and progressing workflow
   */
  static getDefinition() {
    return {
      name: 'perform_assignment_action',
      description: 'Perform an action on a Pega assignment, updating case data and progressing the workflow. Takes the assignment ID and action ID as path parameters, along with optional content, page instructions, and attachments. Requires an eTag value from a previous get_assignment_action call. The API handles pre-processing logic, merges request data into the case, performs the action, and validates the results. If the action is a local action, the API stays at the current assignment. If it\'s a connector action, the API moves to the next assignment or provides a confirmation note if the workflow is complete. Returns detailed case information, optional UI resources based on viewType parameter, and either next assignment information or a confirmation message.',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Full handle of the assignment to perform the action on. Format: ASSIGN-WORKLIST {caseID}!{processID}. Example: "ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-35005!APPROVAL_FLOW". This is the complete assignment identifier that uniquely identifies the specific assignment instance.'
          },
          actionID: {
            type: 'string',
            description: 'Name of the assignment action to perform - ID of the flow action rule to be executed on the assignment. This corresponds to a specific flow action configured in the Pega application. Example: "CompleteVerification", "Approve", "Reject".'
          },
          eTag: {
            type: 'string',
            description: 'Required eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. This must be equal to the eTag header from the response of the most recent case update request, or from a get_assignment_action request for this assignment. Used for optimistic locking to prevent concurrent modification conflicts.'
          },
          content: {
            type: 'object',
            description: 'Optional map of scalar and embedded page values to be set to the fields included in the assignment action\'s view. Only fields that are part of the submitted assignment action\'s view can be modified. Field names should match the property names defined in the Pega application. Example: {"EmployeeName": "Celine", "EmployeeAge": 55, "EmployeeStatus": "Active"}. Values will overwrite any settings made from pre-processing Data Transforms.'
          },
          pageInstructions: {
            type: 'array',
            items: {
                      "type": "object",
                      "description": "Page operation object with instruction type and target"
            },
            description: 'Optional list of page-related operations to be performed on embedded pages, page lists, or page groups included in the assignment action\'s view. These operations allow manipulation of complex data structures within the case. Each instruction specifies the operation type and target page structure. Only pages included in the assignment action\'s view can be modified.'
          },
          attachments: {
            type: 'array',
            items: {
                      "type": "object",
                      "description": "Attachment object with file details and metadata"
            },
            description: 'Optional list of attachments to be added to or deleted from specific attachment fields included in the assignment action\'s view. Each attachment entry specifies the operation (add/delete) and attachment details. Only attachment fields included in the assignment action\'s view can be modified.'
          },
          viewType: {
            type: 'string',
            enum: ['none', 'form', 'page'],
            description: 'Type of UI resources to return in the response. "none" returns no UI resources (default), "form" returns form UI metadata in read-only review mode without page-specific metadata, "page" returns full page UI metadata in read-only review mode. Use "form" or "page" when you need UI structure information for displaying the results.',
            default: 'none'
          },
          originChannel: {
            type: 'string',
            description: 'Optional origin channel identifier for this service request. Indicates the source of the request for tracking and audit purposes. Examples: "Web", "Mobile", "WebChat". Default value is "Web" if not specified.'
          }
        },
        required: ['assignmentID', 'actionID', 'eTag']
      }
    };
  }

  /**
   * Execute the assignment action operation
   */
  async execute(params) {
    const { assignmentID, actionID, eTag, content, pageInstructions, attachments, viewType, originChannel } = params;

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['assignmentID', 'actionID', 'eTag']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate enum parameters using base class
    const enumValidation = this.validateEnumParams(params, {
      viewType: ['none', 'form', 'page']
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

    // Prepare request options
    const options = {};
    
    if (content) options.content = content;
    if (pageInstructions) options.pageInstructions = pageInstructions;
    if (attachments) options.attachments = attachments;
    if (viewType) options.viewType = viewType;
    if (originChannel) options.originChannel = originChannel;

    try {
      // Execute assignment action via API client
      const result = await this.pegaClient.performAssignmentAction(
        assignmentID,
        actionID,
        eTag,
        options
      );

      // Check if API call was successful
      if (result.success) {
        // Format and return successful response
        return this.formatSuccessResponse(result.data, params);
      } else {
        // Format and return error response from API
        return this.formatErrorResponse(result.error);
      }

    } catch (error) {
      // Format and return error response
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(data, params) {
    return {
      content: [
        {
          type: 'text',
          text: this.buildSuccessMarkdown(data, params)
        }
      ]
    };
  }

  /**
   * Build success response markdown
   */
  buildSuccessMarkdown(data, params) {
    let markdown = `# Assignment Action Executed Successfully\n\n`;
    markdown += `**Assignment ID:** ${params.assignmentID}\n`;
    markdown += `**Action ID:** ${params.actionID}\n`;
    markdown += `**Timestamp:** ${new Date().toISOString()}\n\n`;

    // Case Information
    if (data.data && data.data.caseInfo) {
      const caseInfo = data.data.caseInfo;
      markdown += `## Case Information\n\n`;
      markdown += `**Case ID:** ${caseInfo.ID || 'N/A'}\n`;
      markdown += `**Case Type:** ${caseInfo.caseTypeName || 'N/A'}\n`;
      markdown += `**Status:** ${caseInfo.status || 'N/A'}\n`;
      markdown += `**Stage:** ${caseInfo.stageLabel || 'N/A'}\n`;
      markdown += `**Urgency:** ${caseInfo.urgency || 'N/A'}\n`;
      markdown += `**Last Updated:** ${caseInfo.lastUpdateTime || 'N/A'}\n`;
      markdown += `**Updated By:** ${caseInfo.lastUpdatedBy || 'N/A'}\n\n`;

      // Available Actions
      if (caseInfo.availableActions && caseInfo.availableActions.length > 0) {
        markdown += `### Available Case Actions\n`;
        caseInfo.availableActions.forEach(action => {
          markdown += `- **${action.name}** (${action.ID}) - Type: ${action.type}\n`;
        });
        markdown += `\n`;
      }

      // Available Processes
      if (caseInfo.availableProcesses && caseInfo.availableProcesses.length > 0) {
        markdown += `### Available Processes\n`;
        caseInfo.availableProcesses.forEach(process => {
          markdown += `- **${process.name}** (${process.ID}) - Type: ${process.type}\n`;
        });
        markdown += `\n`;
      }

      // Current Assignments
      if (caseInfo.assignments && caseInfo.assignments.length > 0) {
        markdown += `### Current Assignments\n`;
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

      // Stage Information
      if (caseInfo.stages && caseInfo.stages.length > 0) {
        markdown += `### Case Stages\n`;
        caseInfo.stages.forEach(stage => {
          const status = stage.visited_status === 'active' ? '🔄' : 
                        stage.visited_status === 'completed' ? '✅' : '⭕';
          markdown += `${status} **${stage.name}** (${stage.ID}) - ${stage.visited_status}\n`;
          if (stage.entryTime) {
            markdown += `   Entry Time: ${stage.entryTime}\n`;
          }
        });
        markdown += `\n`;
      }
    }

    // Next Assignment Information
    if (data.nextAssignmentInfo) {
      markdown += `## Next Assignment Available\n\n`;
      markdown += `**Assignment ID:** ${data.nextAssignmentInfo.ID}\n`;
      markdown += `**Context:** ${data.nextAssignmentInfo.context}\n`;
      markdown += `**Class Name:** ${data.nextAssignmentInfo.className}\n\n`;
      markdown += `The workflow has progressed to the next assignment. Use the \`get_assignment\` tool with the assignment ID above to get details about the next assignment to work on.\n\n`;
    }

    // Confirmation Note
    if (data.confirmationNote) {
      markdown += `## Workflow Complete\n\n`;
      markdown += `${data.confirmationNote}\n\n`;
      markdown += `No further assignments are available for this workflow. The assignment action has been executed successfully and the workflow has completed.\n\n`;
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

    // Referenced Users
    if (data.data && data.data.referencedUsers && data.data.referencedUsers.length > 0) {
      markdown += `## Referenced Users\n`;
      data.data.referencedUsers.forEach(user => {
        markdown += `- **${user.UserName}** (${user.UserID})\n`;
      });
      markdown += `\n`;
    }

    // Usage Information
    markdown += `## Next Steps\n\n`;
    if (data.nextAssignmentInfo) {
      markdown += `- Use \`get_assignment\` with assignment ID "${data.nextAssignmentInfo.ID}" to get details about the next assignment\n`;
      markdown += `- Use \`get_assignment_action\` to get available actions for the next assignment\n`;
    } else {
      markdown += `- The workflow has completed successfully\n`;
      markdown += `- Use \`get_case\` with case ID "${data.data?.caseInfo?.ID || 'N/A'}" to get current case status\n`;
    }
    markdown += `- Use \`get_case_stages\` to see the updated stage progression\n\n`;

    markdown += `*Assignment action executed at ${new Date().toISOString()}*`;

    return markdown;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(error) {
    return {
      content: [
        {
          type: 'text',
          text: this.buildErrorMarkdown(error)
        }
      ]
    };
  }

  /**
   * Build error response markdown with comprehensive guidance
   */
  buildErrorMarkdown(error) {
    let markdown = `# Assignment Action Execution Failed\n\n`;
    markdown += `**Error Type:** ${error.type || 'UNKNOWN_ERROR'}\n`;
    markdown += `**Timestamp:** ${new Date().toISOString()}\n\n`;

    // Specific error guidance based on error type
    switch (error.type) {
      case 'NOT_FOUND':
        markdown += `## Assignment or Action Not Found\n\n`;
        markdown += `The specified assignment or action could not be found.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Assignment ID is incorrect or malformed\n`;
        markdown += `- Action ID does not exist for this assignment\n`;
        markdown += `- Assignment has already been completed or cancelled\n`;
        markdown += `- You don't have access to this assignment\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify the assignment ID format (should be ASSIGN-WORKLIST {caseID}!{processID})\n`;
        markdown += `- Use \`get_next_assignment\` to find available assignments\n`;
        markdown += `- Use \`get_assignment\` to verify the assignment exists\n`;
        markdown += `- Use \`get_assignment_action\` to get available actions for this assignment\n`;
        break;

      case 'UNAUTHORIZED':
        markdown += `## Authentication Failed\n\n`;
        markdown += `Your authentication token has expired or is invalid.\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- The system will automatically refresh your token\n`;
        markdown += `- Try the request again\n`;
        markdown += `- If the problem persists, check your Pega connection configuration\n`;
        break;

      case 'FORBIDDEN':
        markdown += `## Access Denied\n\n`;
        markdown += `You don't have permission to perform this action.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Assignment is not assigned to you\n`;
        markdown += `- Your user role doesn't have permission for this action\n`;
        markdown += `- Assignment is locked by another user\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Check if the assignment is assigned to your user\n`;
        markdown += `- Verify your user role has the necessary permissions\n`;
        markdown += `- Contact your Pega administrator for access\n`;
        break;

      case 'BAD_REQUEST':
        markdown += `## Invalid Request\n\n`;
        markdown += `The request contains invalid data or parameters.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Invalid assignment ID or action ID format\n`;
        markdown += `- Content fields not included in the assignment action's view\n`;
        markdown += `- Invalid field values or types\n`;
        markdown += `- Malformed pageInstructions or attachments\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify all required parameters are provided\n`;
        markdown += `- Check that content fields are part of the assignment action's view\n`;
        markdown += `- Use \`get_assignment_action\` to see the available fields and view structure\n`;
        markdown += `- Ensure all field values match the expected data types\n`;
        break;

      case 'CONFLICT':
        markdown += `## Conflict Error\n\n`;
        markdown += `The assignment state has changed since your last request.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Assignment was modified by another user\n`;
        markdown += `- Concurrent updates to the same case\n`;
        markdown += `- Workflow state has changed\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Use \`get_assignment\` to get the current assignment state\n`;
        markdown += `- Use \`get_assignment_action\` to get a fresh eTag value\n`;
        markdown += `- Retry the operation with the updated eTag\n`;
        break;

      case 'PRECONDITION_FAILED':
        markdown += `## eTag Mismatch\n\n`;
        markdown += `The provided eTag value doesn't match the current case state.\n\n`;
        markdown += `**Cause:**\n`;
        markdown += `- The case has been modified since you last retrieved the eTag\n`;
        markdown += `- The eTag value is incorrect or outdated\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Use \`get_assignment_action\` to get a fresh eTag value\n`;
        markdown += `- Retry the operation with the new eTag\n`;
        markdown += `- Ensure you're using the most recent eTag from the previous request\n`;
        break;

      case 'VALIDATION_FAIL':
        markdown += `## Validation Error\n\n`;
        markdown += `The submitted data failed validation rules.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Required fields are missing values\n`;
        markdown += `- Field values don't meet validation criteria\n`;
        markdown += `- Business rule violations\n`;
        markdown += `- Data type mismatches\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Review the validation error details\n`;
        markdown += `- Correct the invalid field values\n`;
        markdown += `- Use \`get_assignment_action\` to see field requirements and validation rules\n`;
        markdown += `- Ensure all required fields have valid values\n`;
        break;

      case 'LOCKED':
        markdown += `## Assignment Locked\n\n`;
        markdown += `The assignment is currently locked by another user.\n\n`;
        markdown += `**Cause:**\n`;
        markdown += `- Another user has the assignment open for editing\n`;
        markdown += `- Pessimistic locking is enabled for this case type\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Wait for the other user to complete their work\n`;
        markdown += `- Try again later\n`;
        markdown += `- Contact the user who has the assignment locked\n`;
        break;

      case 'FAILED_DEPENDENCY':
        markdown += `## Dependency Failure\n\n`;
        markdown += `A required dependency or pre-condition failed.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Required external system is unavailable\n`;
        markdown += `- Pre-processing automation failed\n`;
        markdown += `- Dependent case or data is missing\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Check the status of dependent systems\n`;
        markdown += `- Verify all required data is available\n`;
        markdown += `- Contact your system administrator\n`;
        break;

      case 'INTERNAL_SERVER_ERROR':
        markdown += `## Server Error\n\n`;
        markdown += `An internal server error occurred while processing the request.\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Try the request again\n`;
        markdown += `- If the problem persists, contact your Pega administrator\n`;
        markdown += `- Check the server logs for more details\n`;
        break;

      default:
        markdown += `## Error Details\n\n`;
        if (error.message) {
          markdown += `**Message:** ${error.message}\n\n`;
        }
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify all parameters are correct\n`;
        markdown += `- Check your Pega connection configuration\n`;
        markdown += `- Try the request again\n`;
        markdown += `- If the problem persists, contact support\n`;
    }

    markdown += `\n## Troubleshooting Tips\n\n`;
    markdown += `- Use \`ping_pega_service\` to verify your connection to Pega\n`;
    markdown += `- Use \`get_assignment\` to check the current assignment status\n`;
    markdown += `- Use \`get_assignment_action\` to get available actions and current eTag\n`;
    markdown += `- Ensure your user has the necessary permissions in Pega\n\n`;

    markdown += `*Error occurred at ${new Date().toISOString()}*`;

    return markdown;
  }
}
