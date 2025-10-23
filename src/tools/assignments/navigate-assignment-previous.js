import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class NavigateAssignmentPreviousTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'assignments';
  }

  /**
   * Get tool definition for MCP protocol
   * Implements PATCH /assignments/{assignmentID}/navigation_steps/previous
   * Navigate back to previously visited step in screen flow or multi-step form
   */
  static getDefinition() {
    return {
      name: 'navigate_assignment_previous',
      description: 'Navigate back to the previously visited step in a screen flow or multi-step form assignment. If no finalETag.trim() is provided, automatically fetches the latest finalETag.trim() from the assignment for seamless operation. Jumps to the previously visited navigation step from the current step. For multi-step forms and screen flows, navigation path steps are determined by the Enable navigation link checkbox. Returns assignment details with navigation breadcrumb information under uiResources when viewType is not "none". This operation requires an finalETag.trim() from a previous assignment API call for optimistic locking.',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Full handle of the assignment to navigate. Format: ASSIGN-WORKLIST {caseID}!{processID}. Example: "ASSIGN-WORKLIST PBANK-LOAN-WORK V-76003!REVIEW_FLOW". Must be a complete assignment identifier that uniquely identifies the specific assignment instance.'
          },
          eTag: {
            type: 'string',
            description: 'Optional finalETag.trim() unique value representing the most recent save date time (pxSaveDateTime) of the case. If not provided, the tool will automatically fetch the latest finalETag.trim() from the assignment. For manual finalETag.trim() management, provide the finalETag.trim() from a previous assignment operation. Used for optimistic locking to prevent concurrent modification conflicts.'
          },
          content: {
            type: 'object',
            description: 'Optional map of scalar properties and embedded page properties to be set during navigation. Only fields that are part of the assignment view can be modified. Field names should match property names defined in the Pega application. Values will be applied when navigating to the previous step.'
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
            description: 'Optional list of page-related operations for embedded pages, page lists, or page groups. Required for setting embedded page references. Only pages included in the assignment view can be modified.'
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
            description: 'Optional list of attachments to be added to or deleted from specific attachment fields during navigation. Each attachment entry specifies the operation (add/delete) and attachment details. Only attachment fields included in the assignment view can be modified.'
          },
          viewType: {
            type: 'string',
            enum: ['none', 'form', 'page'],
            description: 'Type of view data to return. "none" returns no UI resources (default), "form" returns form UI metadata in read-only review mode, "page" returns full page UI metadata in read-only review mode. Navigation breadcrumb information is included under uiResources when not "none".',
            default: 'none'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['assignmentID']
      }
    };
  }

  /**
   * Execute the assignment navigation operation
   */
  async execute(params) {
    const { assignmentID, eTag, content, pageInstructions, attachments, viewType } = params;
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

    // Auto-fetch eTag if not provided
    let finalETag = eTag;
    let autoFetchedETag = false;
    
    if (!finalETag) {
      try {
        console.log(`Auto-fetching latest eTag for assignment navigation on ${assignmentID}...`);
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
          const errorMsg = 'Auto-fetch succeeded but no finalETag.trim() was returned from getAssignment. This may indicate a server issue.';
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
        error: 'Invalid finalETag.trim() parameter. Must be a non-empty string representing case save date time.'
      };
    }



    // Prepare request options
    const options = {};
    
    if (content) options.content = content;
    if (pageInstructions) options.pageInstructions = pageInstructions;
    if (attachments) options.attachments = attachments;
    if (viewType) options.viewType = viewType;

    try {
      // Execute navigation via API client
      const result = await this.pegaClient.navigateAssignmentPrevious(
        assignmentID,
        finalETag,
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
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Navigate Assignment Previous\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
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
    let markdown = `# Assignment Navigation Successful\n\n`;
    markdown += `**Assignment ID:** ${params.assignmentID}\n`;
    markdown += `**Navigation:** Moved to previous step\n`;
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

      // Current Assignments after navigation
      if (caseInfo.assignments && caseInfo.assignments.length > 0) {
        markdown += `### Current Assignment (After Navigation)\n`;
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

      // Available Actions
      if (caseInfo.availableActions && caseInfo.availableActions.length > 0) {
        markdown += `### Available Case Actions\n`;
        caseInfo.availableActions.forEach(action => {
          markdown += `- **${action.name}** (${action.ID}) - Type: ${action.type}\n`;
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

    // Navigation Information
    if (data.uiResources && data.uiResources.navigation && params.viewType !== 'none') {
      markdown += `## Navigation Context\n\n`;
      markdown += `**View Type:** ${params.viewType}\n`;
      
      if (data.uiResources.navigation.breadcrumb) {
        markdown += `**Navigation Breadcrumb:** Available\n`;
        markdown += `The navigation breadcrumb information has been loaded and can be used to build navigation UI components.\n`;
      }
      
      if (data.uiResources.navigation.steps) {
        markdown += `**Navigation Steps:** ${data.uiResources.navigation.steps.length} steps available\n`;
      }
      markdown += `\n`;
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
    markdown += `- Use \`get_assignment\` to get detailed information about the current assignment\n`;
    markdown += `- Use \`get_assignment_action\` to get available actions for the current assignment\n`;
    markdown += `- Use \`perform_assignment_action\` to execute actions on the current assignment\n`;
    markdown += `- Use \`navigate_assignment_previous\` again if there are more previous steps available\n`;
    markdown += `- Use \`get_case_stages\` to see the updated stage progression\n\n`;

    markdown += `*Navigation completed at ${new Date().toISOString()}*`;

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
    let markdown = `# Assignment Navigation Failed\n\n`;
    markdown += `**Error Type:** ${error.type || 'UNKNOWN_ERROR'}\n`;
    markdown += `**Timestamp:** ${new Date().toISOString()}\n\n`;

    // Specific error guidance based on error type and OpenAPI specification
    switch (error.type) {
      case 'BAD_REQUEST':
        markdown += `## Invalid Request Parameters\n\n`;
        markdown += `The request contains invalid inputs or missing required parameters.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Missing or invalid if-match header (eTag)\n`;
        markdown += `- Invalid viewType parameter (must be "none", "form", or "page")\n`;
        markdown += `- Invalid assignment ID format\n`;
        markdown += `- Invalid content field values or types\n`;
        markdown += `- Malformed pageInstructions or attachments\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify the assignment ID format (should be ASSIGN-WORKLIST {caseID}!{processID})\n`;
        markdown += `- Ensure eTag is provided from a previous assignment API call\n`;
        markdown += `- Check that viewType is one of: "none", "form", "page"\n`;
        markdown += `- Validate all content field values match expected data types\n`;
        markdown += `- Use \`get_assignment\` to verify the assignment exists and get a valid eTag\n`;
        break;

      case 'FORBIDDEN':
        markdown += `## Access Denied\n\n`;
        markdown += `You don't have permission to navigate this assignment.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- User is restricted from modifying the case\n`;
        markdown += `- Assignment is not assigned to your user\n`;
        markdown += `- Your user role doesn't have navigation permissions\n`;
        markdown += `- Case access restrictions prevent navigation\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Check if the assignment is assigned to your user\n`;
        markdown += `- Verify your user role has the necessary permissions\n`;
        markdown += `- Contact your Pega administrator for access\n`;
        markdown += `- Use \`get_assignment\` to check assignment accessibility\n`;
        break;

      case 'NOT_FOUND':
        markdown += `## Assignment Not Found\n\n`;
        markdown += `The specified assignment could not be found.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Assignment ID is incorrect or malformed\n`;
        markdown += `- Assignment has been completed or cancelled\n`;
        markdown += `- Assignment is not accessible to your user\n`;
        markdown += `- Case containing the assignment no longer exists\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Verify the assignment ID format and spelling\n`;
        markdown += `- Use \`get_next_assignment\` to find available assignments\n`;
        markdown += `- Use \`get_case\` to check if the case still exists\n`;
        markdown += `- Check assignment status and accessibility\n`;
        break;

      case 'CONFLICT':
        markdown += `## Assignment State Changed\n\n`;
        markdown += `The assignment has been modified since your last request.\n\n`;
        markdown += `**Cause:**\n`;
        markdown += `- Another user has modified the assignment or case\n`;
        markdown += `- The if-match header doesn't match the most recent pxSaveDateTime\n`;
        markdown += `- Concurrent updates to the same assignment\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Use \`get_assignment\` to get the current assignment state\n`;
        markdown += `- Get a fresh finalETag.trim() value from the updated assignment data\n`;
        markdown += `- Retry the navigation operation with the new finalETag.trim()\n`;
        markdown += `- Review any changes made by other users before proceeding\n`;
        break;

      case 'PRECONDITION_FAILED':
        markdown += `## Invalid finalETag.trim() Value\n\n`;
        markdown += `The provided finalETag.trim() value is invalid or malformed.\n\n`;
        markdown += `**Cause:**\n`;
        markdown += `- Invalid value specified in the if-match header\n`;
        markdown += `- finalETag.trim() format is incorrect\n`;
        markdown += `- finalETag.trim() is from a different assignment or case\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Use \`get_assignment\` to get a valid finalETag.trim() value\n`;
        markdown += `- Ensure the finalETag.trim() is from the same assignment you're trying to navigate\n`;
        markdown += `- Verify the eTag format matches the expected pattern\n`;
        markdown += `- Don't modify or truncate the finalETag.trim() value\n`;
        break;

      case 'VALIDATION_FAIL':
        if (error.details && error.details.includes('Previous assignment not found')) {
          markdown += `## No Previous Step Available\n\n`;
          markdown += `There is no previous assignment to navigate back to.\n\n`;
          markdown += `**This means:**\n`;
          markdown += `- The assignment is already at the first step of the screen flow or multi-step form\n`;
          markdown += `- You're currently at the beginning of the navigation path\n`;
          markdown += `- There are no previous steps configured in the navigation sequence\n`;
          markdown += `- The workflow started at this assignment\n\n`;
          markdown += `**Next Steps:**\n`;
          markdown += `- Use \`get_assignment\` to see current assignment details and position\n`;
          markdown += `- Use \`perform_assignment_action\` to proceed forward with available actions\n`;
          markdown += `- Check the navigation path configuration if this is unexpected\n`;
          markdown += `- Review the screen flow or multi-step form design\n`;
          markdown += `- Consider if you need to navigate forward instead of backward\n`;
        } else {
          markdown += `## Validation Error\n\n`;
          markdown += `The navigation request failed validation rules.\n\n`;
          markdown += `**Possible Causes:**\n`;
          markdown += `- Navigation is not allowed from the current step\n`;
          markdown += `- Business rules prevent backward navigation\n`;
          markdown += `- Required fields are missing values\n`;
          markdown += `- Field values don't meet validation criteria\n\n`;
          markdown += `**Next Steps:**\n`;
          markdown += `- Review the validation error details\n`;
          markdown += `- Check if navigation is enabled for the current step\n`;
          markdown += `- Ensure all required fields have valid values\n`;
          markdown += `- Use \`get_assignment\` to see current step requirements\n`;
        }
        break;

      case 'LOCKED':
        markdown += `## Assignment Locked\n\n`;
        markdown += `The assignment is currently locked by another user.\n\n`;
        markdown += `**Cause:**\n`;
        markdown += `- Another user has the assignment open for editing\n`;
        markdown += `- Pessimistic locking is enabled for this case type\n`;
        if (error.details && error.details.includes('locked by')) {
          const userMatch = error.details.match(/locked by (.+)\./);
          if (userMatch) {
            markdown += `- Currently locked by: **${userMatch[1]}**\n`;
          }
        }
        markdown += `\n**Next Steps:**\n`;
        markdown += `- Wait for the other user to complete their work\n`;
        markdown += `- Contact the user who has the assignment locked\n`;
        markdown += `- Try again later when the lock is released\n`;
        markdown += `- Use \`get_assignment\` to check if the lock has been released\n`;
        break;

      case 'INTERNAL_SERVER_ERROR':
        markdown += `## Server Error\n\n`;
        markdown += `An internal server error occurred while processing the navigation request.\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- Database access failure during navigation\n`;
        markdown += `- Unhandled server exception\n`;
        markdown += `- System resource unavailability\n`;
        markdown += `- Configuration or deployment issues\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Try the navigation request again\n`;
        markdown += `- If the problem persists, contact your Pega administrator\n`;
        markdown += `- Check the server logs for more details\n`;
        markdown += `- Verify system health and resource availability\n`;
        break;

      case 'UNAUTHORIZED':
        markdown += `## Authentication Failed\n\n`;
        markdown += `Your authentication token has expired or is invalid.\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- The system will automatically refresh your token\n`;
        markdown += `- Try the navigation request again\n`;
        markdown += `- If the problem persists, check your Pega connection configuration\n`;
        markdown += `- Use \`ping_pega_service\` to verify connectivity\n`;
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
    markdown += `- Use \`get_assignment\` to check the current assignment status and get a fresh finalETag.trim()\n`;
    markdown += `- Use \`get_assignment_action\` to see available actions for the current assignment\n`;
    markdown += `- Ensure your user has the necessary navigation permissions in Pega\n`;
    markdown += `- Check if the assignment supports backward navigation in its configuration\n\n`;

    markdown += `*Error occurred at ${new Date().toISOString()}*`;

    return markdown;
  }
}
