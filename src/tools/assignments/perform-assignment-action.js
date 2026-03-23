import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';
import {
  extractValidationErrors,
  formatValidationErrors,
  extractFieldMetadata,
  formatFieldMetadata,
  extractFieldsForCurrentView,
  formatCurrentStepFields
} from '../../utils/field-extractor.js';

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
      description: 'Perform an assignment action to submit completed work and progress workflow. This is the FINAL step after all required fields are filled. Auto-fetches eTag if not provided. Returns updated case with either nextAssignmentInfo (more work) or confirmationNote (workflow complete). Local actions stay at current assignment; connector actions progress to next assignment.',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Assignment ID. Format: ASSIGN-WORKLIST {caseID}!{processID}. Example: "ASSIGN-WORKLIST MYORG-APP-WORK C-1001!PROCESS""ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-35005!APPROVAL_FLOW". This is the complete assignment identifier that uniquely identifies the specific assignment instance.'
          },
          actionID: {
            type: 'string',
            description: 'Action ID from assignment (Example: "pyApproval", "Submit"). CRITICAL: Action IDs are CASE-SENSITIVE and have no spaces even if display names do ("Complete Review" → "CompleteReview"). Use get_assignment to find correct ID from actions array - use "ID" field not "name" field.'
          },
          eTag: {
            type: 'string',
            description: 'Optional. Auto-fetched if omitted. For faster execution, use eTag from previous response.'
          },
          content: {
            type: 'object',
            description: 'Field values to submit. ALL required fields must have valid values (see get_assignment to identify required fields with "required": true). Only fields in the assignment action view can be modified.'
          },
          pageInstructions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                instruction: {
                  type: 'string',
                  enum: ['UPDATE', 'REPLACE', 'DELETE', 'APPEND', 'INSERT', 'MOVE'],
                  description: 'Page instruction type. UPDATE (add fields to page), REPLACE (replace entire page), DELETE (remove page), APPEND (add item to page list), INSERT (insert item in page list), MOVE (reorder page list items)'
                },
                target: {
                  type: 'string',
                  description: 'Target embedded page name'
                },
                content: {
                  type: 'object',
                  description: 'Content to set on the embedded page (required for UPDATE and REPLACE)'
                }
              },
              required: ['instruction', 'target'],
              description: 'Page operation for embedded pages. Use REPLACE instruction to set embedded page references with full object including pzInsKey. Example: {"instruction": "REPLACE", "target": "PageName", "content": {"Property": "value", "pyID": "ID-123", "pzInsKey": "CLASS-NAME ID-123"}}'
            },
            description: 'Optional list of page-related operations for embedded pages, page lists, or page groups. Required for setting embedded page references. Only pages included in the assignment action\'s view can be modified.'
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              description: 'Attachment object with file details and metadata'
            },
            description: 'Optional list of binary file attachments to upload inline during action execution. NOTE: This is NOT the correct way to link a previously uploaded temporary attachment (from upload_attachment) to an attachment field in the form. For that use case, use pageInstructions with instruction "REPLACE", target ".FieldName", and content {"ID": "temporary-attachment-id"} instead.'
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
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['assignmentID', 'actionID']
      }
    };
  }

  /**
   * Execute the assignment action operation
   */
  async execute(params) {
    const { assignmentID, actionID, eTag, content, pageInstructions, attachments, viewType, originChannel } = params;
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
        console.log(`Auto-fetching latest eTag for assignment action on ${assignmentID}...`);
        const assignmentResponse = await this.pegaClient.getAssignment(assignmentID.trim(), {
          viewType: 'form'  // Use form view for eTag retrieval
        });
        
        if (!assignmentResponse || !assignmentResponse.success) {
          const errorMsg = `Failed to auto-fetch eTag: ${assignmentResponse?.error?.message || 'Unknown error'}`;
          return {
            error: errorMsg
          };
        }
        
        finalETag = assignmentResponse.eTag;
        autoFetchedETag = true;
        console.log(`Successfully auto-fetched eTag: ${finalETag}`);
        
        if (!finalETag) {
          const errorMsg = 'Auto-fetch succeeded but no eTag was returned from get_assignment. This may indicate a server issue.';
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
        error: 'Invalid eTag parameter. a non-empty string representing case save date time.'
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
        finalETag.trim(),
        options
      );

      // Check if API call was successful
      if (result.success) {
        // Auto-fetch next assignment fields if there's a next assignment
        let nextAssignmentFields = null;
        let nextAssignmentNavigation = null;

        if (result.data?.nextAssignmentInfo?.ID) {
          try {
            console.log(`Auto-fetching next assignment fields for ${result.data.nextAssignmentInfo.ID}...`);
            const nextAssignmentResponse = await this.pegaClient.getAssignment(
              result.data.nextAssignmentInfo.ID,
              { viewType: 'form' }
            );

            if (nextAssignmentResponse?.success && nextAssignmentResponse?.data?.uiResources) {
              const uiResources = nextAssignmentResponse.data.uiResources;
              nextAssignmentFields = extractFieldsForCurrentView(uiResources);
              nextAssignmentNavigation = uiResources.navigation;
              console.log(`Found ${nextAssignmentFields.length} fields for next step`);
            }
          } catch (fetchError) {
            console.log(`Could not auto-fetch next assignment: ${fetchError.message}`);
            // Continue without next assignment fields - not a critical error
          }
        }

        // Format and return successful response with next assignment fields
        return this.formatSuccessResponse(result.data, {
          ...params,
          sessionInfo,
          nextAssignmentFields,
          nextAssignmentNavigation,
          newETag: result.eTag
        });
      } else {
        // Check if this is an invalid action ID error (can be NOT_FOUND or CONFLICT)
        const isInvalidActionError = this.isInvalidActionIdError(result.error);

        if (isInvalidActionError) {
          // Auto-discover available actions and show user the correct IDs
          return await this.discoverActionsAndGuide(assignmentID, actionID, result.error);
        }

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
          text: `## Error: Perform Assignment Action\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
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
    const { sessionInfo } = params;
    let markdown = `# Assignment Action Executed Successfully\n\n`;
    markdown += `**Assignment ID:** ${params.assignmentID}\n`;
    markdown += `**Action ID:** ${params.actionID}\n`;
    markdown += `**Timestamp:** ${new Date().toISOString()}\n\n`;

    // Add new eTag prominently at the top (from response header)
    if (params.newETag) {
      markdown += `## 🔑 New eTag for Subsequent Operations\n\n`;
      markdown += `\`\`\`\n${params.newETag}\n\`\`\`\n\n`;
      markdown += `**Tip:** Provide this eTag in your next operation to skip auto-fetch (faster).\n\n`;
    }

    // Session Information (if applicable)
    if (sessionInfo) {
      markdown += `## Session Information\n\n`;
      markdown += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      markdown += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      markdown += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }

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

    // Next Assignment Information with auto-fetched fields
    if (data.nextAssignmentInfo) {
      markdown += `## Next Assignment Available\n\n`;
      markdown += `**Assignment ID:** ${data.nextAssignmentInfo.ID}\n`;

      // Show navigation progress if available
      const { nextAssignmentFields, nextAssignmentNavigation } = params;

      if (nextAssignmentNavigation?.steps) {
        markdown += `\n### Screen Flow Progress\n\n`;
        markdown += `| Step | Status |\n`;
        markdown += `|------|--------|\n`;

        nextAssignmentNavigation.steps.forEach(step => {
          const status = step.visited_status === 'success' ? '✅' :
                         step.visited_status === 'current' ? '🔄 **CURRENT**' : '⭕';
          markdown += `| ${step.name} | ${status} |\n`;
        });
        markdown += `\n`;
      }

      // Show next step fields if auto-fetched
      if (nextAssignmentFields && nextAssignmentFields.length > 0) {
        markdown += formatCurrentStepFields(nextAssignmentFields);
      } else if (nextAssignmentFields && nextAssignmentFields.length === 0) {
        markdown += `\n### Next Step Fields\n\nNo editable fields for this step (may be an attachment or confirmation step).\n\n`;
      }
    }

    // Navigation Steps (for screen flows)
    if (data.uiResources?.navigation?.steps) {
      markdown += `## Screen Flow Progress\n\n`;
      markdown += `**Multi-step screen flow detected. Current progress:**\n\n`;
      markdown += `| Step | Action ID | Status |\n`;
      markdown += `|------|-----------|--------|\n`;

      data.uiResources.navigation.steps.forEach(step => {
        const status = step.visited_status === 'success' ? '✅' :
                       step.visited_status === 'current' ? '🔄 CURRENT' : '⭕';
        markdown += `| ${step.name} | \`${step.actionID}\` | ${status} |\n`;
      });
      markdown += `\n**Next step:** Use the Action ID marked as CURRENT for the next \`perform_assignment_action\` call.\n\n`;
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

      // Extract and display field metadata including dropdown options
      const fieldMetadata = extractFieldMetadata(data.uiResources);
      if (fieldMetadata.length > 0) {
        markdown += formatFieldMetadata(fieldMetadata);
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
      const { nextAssignmentFields, nextAssignmentNavigation } = params;
      const currentStep = nextAssignmentNavigation?.steps?.find(s => s.visited_status === 'current');

      if (nextAssignmentFields && nextAssignmentFields.length > 0) {
        markdown += `### Ready to Continue\n\n`;
        markdown += `Fill in the fields shown above and call:\n\n`;
        markdown += `\`\`\`javascript\n`;
        markdown += `perform_assignment_action({\n`;
        markdown += `  assignmentID: "${data.nextAssignmentInfo.ID}",\n`;
        markdown += `  actionID: "${currentStep?.actionID || 'ACTION_ID'}",\n`;
        markdown += `  content: { /* field values from above */ }\n`;
        markdown += `})\n`;
        markdown += `\`\`\`\n\n`;
      } else {
        markdown += `### Next Assignment Ready\n\n`;
        markdown += `Use **perform_assignment_action** with assignment ID "${data.nextAssignmentInfo.ID}" to continue.\n\n`;
      }
    } else {
      markdown += `### Workflow Complete\n\n`;
      markdown += `The assignment action has been executed successfully and the workflow has completed.\n\n`;
      markdown += `- **get_case** with case ID "${data.data?.caseInfo?.ID || 'N/A'}" to get current case status\n`;
      markdown += `- **get_case_history** to see the complete case audit trail\n`;
    }
    markdown += `\n**Case Stage Tracking**: Use \`get_case_stages\` to see the updated stage progression.\n\n`;

    markdown += `*Assignment action executed at ${new Date().toISOString()}*`;

    return markdown;
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
   * Similar to field discovery in create_case
   */
  async discoverActionsAndGuide(assignmentID, attemptedActionID, originalError) {
    try {
      // Fetch assignment to get available actions
      const assignmentResponse = await this.pegaClient.getAssignment(assignmentID, 'none');

      if (!assignmentResponse.success) {
        // If we can't fetch assignment, return original error
        return this.formatErrorResponse(originalError);
      }

      const assignmentData = assignmentResponse.data;
      const actions = assignmentData?.data?.caseInfo?.assignments?.[0]?.actions || [];

      if (actions.length === 0) {
        // No actions found, return original error
        return this.formatErrorResponse(originalError);
      }

      // Build guidance response with available actions
      let response = `# Assignment Action Not Found\n\n`;
      response += `**Attempted Action ID**: \`${attemptedActionID}\`\n`;
      response += `**Assignment ID**: ${assignmentID}\n\n`;

      response += `## ⚠️ Action ID Issue\n\n`;
      response += `The action ID "${attemptedActionID}" was not found for this assignment.\n\n`;
      response += `**Common Causes:**\n`;
      response += `- Action IDs are **CASE-SENSITIVE** (Example: "submit" ≠ "Submit")\n`;
      response += `- Display names differ from actual IDs (Example: "Complete Review" → "CompleteReview")\n`;
      response += `- Spaces in display names are removed from IDs\n\n`;

      response += `## ✅ Available Actions (${actions.length})\n\n`;
      response += `Use one of these exact action IDs:\n\n`;

      response += `| Action ID | Display Name | Type |\n`;
      response += `|-----------|--------------|------|\n`;

      actions.forEach(action => {
        const actionID = action.ID || 'Unknown';
        const actionName = action.name || actionID;
        const actionType = action.type || 'FlowAction';
        response += `| \`${actionID}\` | ${actionName} | ${actionType} |\n`;
      });

      response += `\n`;

      // Show actionButtons if available
      const actionButtons = assignmentData?.uiResources?.actionButtons;
      if (actionButtons) {
        const mainButtons = actionButtons.main || [];
        const secondaryButtons = actionButtons.secondary || [];

        if (mainButtons.length > 0 || secondaryButtons.length > 0) {
          response += `## 🎯 Recommended Actions\n\n`;

          if (mainButtons.length > 0) {
            response += `**Primary Actions:**\n`;
            mainButtons.forEach(button => {
              response += `- \`${button.actionID}\` - ${button.name}\n`;
            });
            response += `\n`;
          }

          if (secondaryButtons.length > 0) {
            response += `**Secondary Actions:**\n`;
            secondaryButtons.forEach(button => {
              response += `- \`${button.actionID}\` - ${button.name}\n`;
            });
            response += `\n`;
          }
        }
      }

      response += `## 💡 Next Steps\n\n`;
      response += `1. Choose the correct action ID from the table above\n`;
      response += `2. Copy the exact ID (including correct capitalization)\n`;
      response += `3. Retry \`perform_assignment_action\` with the correct action ID\n\n`;

      response += `**Example:**\n`;
      if (actions.length > 0) {
        const exampleAction = actions[0];
        response += `\`\`\`javascript\n`;
        response += `perform_assignment_action({\n`;
        response += `  assignmentID: "${assignmentID}",\n`;
        response += `  actionID: "${exampleAction.ID}",  // Use exact ID from table\n`;
        response += `  content: { /* your field values */ }\n`;
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
      return this.formatErrorResponse({
        ...originalError,
        message: `${originalError.message}\n\nFailed to auto-discover available actions: ${discoveryError.message}`
      });
    }
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
        markdown += `**⚠️ COMMON ISSUE: Action IDs are CASE-SENSITIVE**\n\n`;
        markdown += `Action IDs often differ from display names:\n`;
        markdown += `- Display name: "Submit" → Actual ID might be: "submit", "CreateForm", "pySubmit"\n`;
        markdown += `- Display name: "Complete Review" → Actual ID: "CompleteReview" (no spaces)\n\n`;
        markdown += `**Possible Causes:**\n`;
        markdown += `- **Action ID is incorrect or has wrong case** (most common)\n`;
        markdown += `- Assignment ID is incorrect or malformed\n`;
        markdown += `- Assignment has already been completed or cancelled\n`;
        markdown += `- You don't have access to this assignment\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `1. **Use \`get_assignment\` to see all available actions with their exact IDs**\n`;
        markdown += `   - Look at the "actions" array in the response\n`;
        markdown += `   - Use the "ID" field (not the "name" field)\n`;
        markdown += `   - Copy the exact ID including correct capitalization\n`;
        markdown += `2. Verify the assignment ID format (should be ASSIGN-WORKLIST {caseID}!{processID})\n`;
        markdown += `3. Use \`get_next_assignment\` to find available assignments\n`;
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

        // Extract and display specific field validation errors
        if (error.details) {
          try {
            // Try to parse error details if it's a string
            const errorData = typeof error.details === 'string'
              ? JSON.parse(error.details)
              : error.details;

            // Extract validation errors using utility
            const validationErrors = extractValidationErrors(errorData);

            if (validationErrors.length > 0) {
              markdown += `### Specific Field Errors\n\n`;
              markdown += formatValidationErrors(validationErrors);
              markdown += `\n`;
            }
          } catch (parseError) {
            // If parsing fails, show raw message
            if (error.message) {
              markdown += `**Error Message:** ${error.message}\n\n`;
            }
          }
        } else if (error.message) {
          markdown += `**Error Message:** ${error.message}\n\n`;
        }

        markdown += `**Possible Causes:**\n`;
        markdown += `- Invalid assignment ID or action ID format\n`;
        markdown += `- Content fields not included in the assignment action's view\n`;
        markdown += `- Invalid field values or types\n`;
        markdown += `- Malformed pageInstructions or attachments\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Review the field errors listed above\n`;
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

        // Extract and display specific field validation errors
        if (error.details) {
          try {
            // Try to parse error details if it's a string
            const errorData = typeof error.details === 'string'
              ? JSON.parse(error.details)
              : error.details;

            // Extract validation errors using utility
            const validationErrors = extractValidationErrors(errorData);

            if (validationErrors.length > 0) {
              markdown += `### Specific Field Errors\n\n`;
              markdown += formatValidationErrors(validationErrors);
              markdown += `\n`;
            }
          } catch (parseError) {
            // If parsing fails, show raw details
            if (error.details) {
              markdown += `**Error Details:** ${typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}\n\n`;
            }
          }
        } else if (error.message) {
          markdown += `**Error Message:** ${error.message}\n\n`;
        }

        markdown += `**Common Causes:**\n`;
        markdown += `- Required fields are missing values\n`;
        markdown += `- Field values don't meet validation criteria (format, length, range)\n`;
        markdown += `- Business rule violations\n`;
        markdown += `- Data type mismatches\n\n`;
        markdown += `**Next Steps:**\n`;
        markdown += `- Review the field errors listed above\n`;
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
