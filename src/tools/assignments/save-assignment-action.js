import { BaseTool } from '../../registry/base-tool.js';

export class SaveAssignmentActionTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'assignments';
  }

  /**
   * Get tool definition for MCP protocol
   * Implements PATCH /assignments/{assignmentID}/actions/{actionID}/save
   * Saves assignment form data without executing the action - "Save for later" functionality
   */
  static getDefinition() {
    return {
      name: 'save_assignment_action',
      description: 'Save assignment action form data without executing the action. Implements "Save for later" functionality that preserves form data in progress so changes will not be lost when returned to the assignment. Available for Connector actions like Collect info steps, screen flow assignments and customized approval steps. Required field validations are ignored - only server-side validations (dictionary validations) are performed. The saved form data can be retrieved later when the assignment is reopened for continued editing or action execution.',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Full handle of the assignment to save form data for. Format: ASSIGN-WORKLIST {caseID}!{processID}. Example: "ASSIGN-WORKLIST PBANK-LOAN-WORK V-76003!REVIEW_FLOW". This uniquely identifies the specific assignment instance where form data will be saved.'
          },
          actionID: {
            type: 'string',
            description: 'Name of the assignment action - ID of the flow action rule for which form data is being saved. This corresponds to the Flow Action rule configured in the Pega application where the save functionality is available. Example: "CompleteVerification", "CollectInformation".'
          },
          eTag: {
            type: 'string',
            description: 'Required eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. This must be equal to the eTag header from the response of the most recent case update request, or from a get_assignment_action request for this assignment. Used for optimistic locking to prevent concurrent modification conflicts.'
          },
          content: {
            type: 'object',
            description: 'Optional map of scalar properties and embedded page properties containing form data to be saved. Only fields that are part of the assignment action\'s view can be saved. Field names should match the property names defined in the Pega application. Example: {"CustomerName": "John Doe", "RequestAmount": 5000, "Comments": "Initial request details"}. This data will be preserved and available when the assignment is reopened.'
          },
          pageInstructions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                instruction: {
                  type: 'string',
                  description: 'The type of page instruction to perform'
                },
                target: {
                  type: 'string',
                  description: 'The target page or page list for the instruction'
                }
              },
              description: 'Page operation object with instruction type and target'
            },
            description: 'Optional list of page-related operations to be performed on embedded pages, page lists, or page groups included in the assignment action\'s view during the save operation. These operations allow manipulation of complex data structures within the assignment. Each instruction specifies the operation type and target page structure.'
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
            description: 'Optional list of attachments to be added to specific attachment fields included in the assignment action\'s view during the save operation. Each attachment entry specifies the attachment details and target field. Only attachment fields included in the assignment action\'s view can be modified during save.'
          },
          originChannel: {
            type: 'string',
            description: 'Optional origin channel identifier for this service request. Indicates the source of the save request for tracking and audit purposes. Examples: "Web", "Mobile", "WebChat". Default value is "Web" if not specified.'
          }
        },
        required: ['assignmentID', 'actionID', 'eTag']
      }
    };
  }

  /**
   * Execute the assignment action save operation
   */
  async execute(params) {
    const { assignmentID, actionID, eTag, content, pageInstructions, attachments, originChannel } = params;

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['assignmentID', 'actionID', 'eTag']);
    if (requiredValidation) {
      return requiredValidation;
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
    if (originChannel) options.originChannel = originChannel;

    // Execute assignment action save via API client using error handling wrapper
    return await this.executeWithErrorHandling(
      `Saving assignment action form data: ${assignmentID} -> ${actionID}`,
      async () => await this.pegaClient.saveAssignmentAction(assignmentID, actionID, eTag, options)
    );
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
    let markdown = `# Assignment Form Data Saved Successfully\n\n`;
    markdown += `**Assignment ID:** ${params.assignmentID}\n`;
    markdown += `**Action ID:** ${params.actionID}\n`;
    markdown += `**Save Operation:** Form data preserved for later use\n`;
    markdown += `**Timestamp:** ${new Date().toISOString()}\n\n`;

    // Save confirmation details
    if (data.data) {
      markdown += `## Save Details\n\n`;
      
      if (data.data.confirmationNote) {
        markdown += `**Status:** ${data.data.confirmationNote}\n`;
      } else {
        markdown += `**Status:** Form data saved successfully - work in progress preserved\n`;
      }
      
      // Show saved field count if content was provided
      if (params.content && Object.keys(params.content).length > 0) {
        markdown += `**Fields Saved:** ${Object.keys(params.content).length} form fields preserved\n`;
      }
      
      // Show attachment count if attachments were provided
      if (params.attachments && params.attachments.length > 0) {
        markdown += `**Attachments Saved:** ${params.attachments.length} attachment(s) preserved\n`;
      }
      
      // Show page instructions count if provided
      if (params.pageInstructions && params.pageInstructions.length > 0) {
        markdown += `**Page Operations:** ${params.pageInstructions.length} page instruction(s) applied\n`;
      }
      
      markdown += `\n`;

      // Case Information
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        markdown += `## Associated Case Information\n\n`;
        markdown += `**Case ID:** ${caseInfo.ID || 'N/A'}\n`;
        markdown += `**Case Type:** ${caseInfo.caseTypeName || 'N/A'}\n`;
        markdown += `**Status:** ${caseInfo.status || 'N/A'}\n`;
        markdown += `**Stage:** ${caseInfo.stageLabel || 'N/A'}\n`;
        markdown += `**Last Updated:** ${caseInfo.lastUpdateTime || 'N/A'}\n`;
        markdown += `**Updated By:** ${caseInfo.lastUpdatedBy || 'N/A'}\n\n`;
      }
    }

    // Important information about save functionality
    markdown += `## Save for Later Details\n\n`;
    markdown += `### What was saved:\n`;
    markdown += `- ✅ Form field values preserved in assignment\n`;
    markdown += `- ✅ Data will be available when assignment is reopened\n`;
    markdown += `- ✅ No validation errors generated (except server-side validations)\n`;
    markdown += `- ✅ Assignment workflow not progressed - remains at current step\n\n`;

    markdown += `### What happens next:\n`;
    markdown += `- The assignment remains open and available for continued editing\n`;
    markdown += `- Saved form data will be pre-populated when you return to the assignment\n`;
    markdown += `- You can continue editing and save again, or execute the action when ready\n`;
    markdown += `- Required field validations will apply when you perform the actual action\n\n`;

    markdown += `### Supported Assignment Types:\n`;
    markdown += `- ✅ Connector actions (Collect info steps)\n`;
    markdown += `- ✅ Screen flow assignments\n`;
    markdown += `- ✅ Customized approval steps\n`;
    markdown += `- ❌ System flow actions (automations)\n`;
    markdown += `- ❌ Create stage steps\n`;
    markdown += `- ❌ Out-of-the-box approve/reject steps\n`;
    markdown += `- ❌ Local actions\n\n`;

    // Next steps guidance
    markdown += `## Next Steps\n\n`;
    markdown += `**Continue Editing:**\n`;
    markdown += `- Use \`get_assignment\` with assignment ID "${params.assignmentID}" to reopen the assignment\n`;
    markdown += `- Use \`get_assignment_action\` to get the current form state and available actions\n`;
    markdown += `- Use \`refresh_assignment_action\` to refresh form data with updated calculations\n\n`;
    
    markdown += `**Execute Action When Ready:**\n`;
    markdown += `- Use \`perform_assignment_action\` to execute the action and progress the workflow\n`;
    markdown += `- All saved form data will be included in the action execution\n`;
    markdown += `- Required field validations will be applied during action execution\n\n`;

    markdown += `**Additional Options:**\n`;
    markdown += `- Use \`save_assignment_action\` again to update saved form data\n`;
    markdown += `- Use \`get_case\` to view current case status and available actions\n\n`;

    markdown += `*Form data saved at ${new Date().toISOString()}*`;

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
    let markdown = `# Assignment Form Data Save Failed\n\n`;
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
        markdown += `- You don't have access to this assignment\n`;
        markdown += `- Save functionality not supported for this action type\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify the assignment ID format (should be ASSIGN-WORKLIST {caseID}!{processID})\n`;
        markdown += `- Use \`get_next_assignment\` to find available assignments\n`;
        markdown += `- Use \`get_assignment\` to verify the assignment exists and is accessible\n`;
        markdown += `- Use \`get_assignment_action\` to check available actions for this assignment\n`;
        markdown += `- Check if this action type supports save functionality (Connector actions, screen flows, customized approval steps)\n`;
        break;

      case 'UNAUTHORIZED':
        markdown += `## Authentication Failed\n\n`;
        markdown += `Your authentication token has expired or is invalid.\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- The system will automatically refresh your token\n`;
        markdown += `- Try the save request again\n`;
        markdown += `- If the problem persists, check your Pega connection configuration\n`;
        break;

      case 'FORBIDDEN':
        markdown += `## Access Denied\n\n`;
        markdown += `You don't have permission to save data for this assignment.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Assignment is not assigned to you\n`;
        markdown += `- Your user role doesn't have permission for this action\n`;
        markdown += `- Assignment is locked by another user\n`;
        markdown += `- Save functionality is disabled for this action type\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Check if the assignment is assigned to your user\n`;
        markdown += `- Verify your user role has the necessary permissions\n`;
        markdown += `- Contact your Pega administrator for access\n`;
        markdown += `- Verify that save functionality is enabled for this action type\n`;
        break;

      case 'BAD_REQUEST':
        markdown += `## Invalid Save Request\n\n`;
        markdown += `The request contains invalid data or parameters.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Invalid assignment ID or action ID format\n`;
        markdown += `- Content fields not included in the assignment action's view\n`;
        markdown += `- Invalid field values or types (server-side validation failures)\n`;
        markdown += `- Malformed pageInstructions or attachments\n`;
        markdown += `- Save operation not supported for this action type\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify all required parameters are provided\n`;
        markdown += `- Check that content fields are part of the assignment action's view\n`;
        markdown += `- Use \`get_assignment_action\` to see the available fields and view structure\n`;
        markdown += `- Ensure all field values match the expected data types\n`;
        markdown += `- Verify this is a supported action type (Connector actions, screen flows, customized approval)\n`;
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
        markdown += `- Retry the save operation with the updated eTag\n`;
        break;

      case 'PRECONDITION_FAILED':
        markdown += `## eTag Mismatch\n\n`;
        markdown += `The provided eTag value doesn't match the current case state.\n\n`;
        markdown += `**Cause:**\n`;
        markdown += `- The case has been modified since you last retrieved the eTag\n`;
        markdown += `- The eTag value is incorrect or outdated\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Use \`get_assignment_action\` to get a fresh eTag value\n`;
        markdown += `- Retry the save operation with the new eTag\n`;
        markdown += `- Ensure you're using the most recent eTag from the previous request\n`;
        break;

      case 'VALIDATION_FAIL':
        markdown += `## Server-Side Validation Error\n\n`;
        markdown += `The submitted data failed server-side validation rules.\n\n`;
        markdown += `**Note:** Save operations skip required field validations but still apply server-side validations.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Field values don't meet dictionary validation criteria\n`;
        markdown += `- Data type mismatches (e.g., text in numeric field)\n`;
        markdown += `- Business rule violations at the server level\n`;
        markdown += `- Invalid format for specific field types\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Review the validation error details\n`;
        markdown += `- Correct the invalid field values to match server-side validation rules\n`;
        markdown += `- Use \`get_assignment_action\` to see field requirements and validation rules\n`;
        markdown += `- Ensure field values match the expected data types and formats\n`;
        break;

      case 'LOCKED':
        markdown += `## Assignment Locked\n\n`;
        markdown += `The assignment is currently locked by another user.\n\n`;
        markdown += `**Cause:**\n`;
        markdown += `- Another user has the assignment open for editing\n`;
        markdown += `- Pessimistic locking is enabled for this case type\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Wait for the other user to complete their work\n`;
        markdown += `- Try the save operation again later\n`;
        markdown += `- Contact the user who has the assignment locked\n`;
        break;

      case 'FAILED_DEPENDENCY':
        markdown += `## Dependency Failure\n\n`;
        markdown += `A required dependency or pre-condition failed during save.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Required external system is unavailable\n`;
        markdown += `- Dependent case or data is missing\n`;
        markdown += `- Pre-processing logic failed\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Check the status of dependent systems\n`;
        markdown += `- Verify all required data is available\n`;
        markdown += `- Contact your system administrator\n`;
        break;

      case 'INTERNAL_SERVER_ERROR':
        markdown += `## Server Error\n\n`;
        markdown += `An internal server error occurred while saving form data.\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Try the save request again\n`;
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
        markdown += `- Try the save request again\n`;
        markdown += `- If the problem persists, contact support\n`;
    }

    // Common troubleshooting section
    markdown += `\n## Troubleshooting Tips\n\n`;
    markdown += `- Use \`ping_pega_service\` to verify your connection to Pega\n`;
    markdown += `- Use \`get_assignment\` to check the current assignment status\n`;
    markdown += `- Use \`get_assignment_action\` to get available actions and current eTag\n`;
    markdown += `- Ensure your user has the necessary permissions in Pega\n`;
    markdown += `- Verify the action type supports save functionality:\n`;
    markdown += `  - ✅ Connector actions (Collect info steps)\n`;
    markdown += `  - ✅ Screen flow assignments\n`;
    markdown += `  - ✅ Customized approval steps\n`;
    markdown += `  - ❌ System flow actions, Create stage steps, Local actions\n\n`;

    markdown += `*Error occurred at ${new Date().toISOString()}*`;

    return markdown;
  }
}
