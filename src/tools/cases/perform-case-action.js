import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class PerformCaseActionTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'cases';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'perform_case_action',
      description: 'Perform an action on a Pega case, updating case data and progressing the workflow. Takes the case ID and action ID as parameters, along with optional content, page instructions, and attachments. If no eTag is provided, automatically fetches the latest eTag from the case action. For manual eTag management, provide an eTag value from a previous get_case_action call. The API handles pre-processing logic, merges request data into the case, performs the action, and validates the results.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to perform the action on. Format: {OrgID}-{AppName}-{CaseType} {CaseNumber}. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          actionID: {
            type: 'string',
            description: 'Name of the case or stage wide optional action to be performed - ID of the flow action rule. This corresponds to a specific flow action configured in the Pega application. IMPORTANT: Action IDs typically do not contain spaces even if the display name does. For example, "Edit details" has ID "pyUpdateCaseDetails". Use get_case to retrieve the correct action ID from the availableActions array. Common IDs: "pyUpdateCaseDetails", "pyChangeStage", "pyApproval", "pyReject".'
          },
          eTag: {
            type: 'string',
            description: 'Optional eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. If not provided, the tool will automatically fetch the latest eTag from the case action. For manual eTag management, provide the eTag from a previous get_case_action request. Used for optimistic locking to prevent concurrent modification conflicts.'
          },
          content: {
            type: 'object',
            description: 'Optional map of scalar and embedded page values to be set to the fields included in the case action\'s view. Only fields that are part of the submitted case action\'s view can be modified. Field names should match the property names defined in the Pega application. Example: {"CustomerName": "John Doe", "Priority": "High", "Status": "InProgress"}. Values will overwrite any settings made from pre-processing Data Transforms.'
          },
          pageInstructions: {
            type: 'array',
            description: 'Optional list of page-related operations to be performed on embedded pages, page lists, or page groups included in the case action\'s view. These operations allow manipulation of complex data structures within the case. Each instruction specifies the operation type and target page structure. Only pages included in the case action\'s view can be modified.',
            items: {
              type: 'object'
            }
          },
          attachments: {
            type: 'array',
            description: 'Optional list of attachments to be added to or deleted from specific attachment fields included in the case action\'s view. Each attachment entry specifies the operation (add/delete) and attachment details. Only attachment fields included in the case action\'s view can be modified.',
            items: {
              type: 'object'
            }
          },
          viewType: {
            type: 'string',
            enum: ['none', 'form', 'page'],
            description: 'Type of UI resources to return in the response. "none" returns no UI resources (default), "form" returns form UI metadata in read-only review mode without page-specific metadata, "page" returns full page UI metadata in read-only review mode. Use "form" or "page" when you need UI structure information for displaying the results.',
            default: 'none'
          },
          skipRoboticAutomation: {
            type: 'boolean',
            description: 'When set to true, post processing robotic automation is skipped while submitting the form. When set to false, post processing robotic automation is considered while submitting the form. Default: false. Use true when robotic automation failures are preventing form submission.',
            default: false
          },
          originChannel: {
            type: 'string',
            description: 'Optional origin channel identifier for this service request. Indicates the source of the request for tracking and audit purposes. Examples: "Web", "Mobile", "WebChat". Default value is "Web" if not specified.'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID', 'actionID']
      }
    };
  }

  /**
   * Execute the perform case action operation
   */
  async execute(params) {
    const {
      caseID,
      actionID,
      eTag,
      content,
      pageInstructions,
      attachments,
      viewType,
      skipRoboticAutomation,
      originChannel
    } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'actionID']);
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

    // Validate boolean parameters
    if (skipRoboticAutomation !== undefined && typeof skipRoboticAutomation !== 'boolean') {
      return {
        error: 'Invalid skipRoboticAutomation parameter. Must be a boolean value.'
      };
    }

    // Auto-fetch eTag if not provided
    let finalETag = eTag;
    let autoFetchedETag = false;
    
    if (!finalETag) {
      try {
        console.log(`Auto-fetching latest eTag for case action ${actionID} on case ${caseID}...`);
        const caseActionResponse = await this.pegaClient.getCaseAction(caseID.trim(), actionID.trim(), {
          viewType: 'form',  // getCaseAction only accepts 'form' or 'page', not 'none'
          excludeAdditionalActions: true
        });
        
        if (!caseActionResponse.success) {
          return {
            error: `Failed to auto-fetch eTag: ${caseActionResponse.error?.message || 'Unknown error'}`
          };
        }
        
        finalETag = caseActionResponse.eTag;
        autoFetchedETag = true;
        console.log(`Successfully auto-fetched eTag: ${finalETag}`);
        
        if (!finalETag) {
          return {
            error: 'Auto-fetch succeeded but no eTag was returned from get_case_action. This may indicate a server issue.'
          };
        }
      } catch (error) {
        return {
          error: `Failed to auto-fetch eTag: ${error.message}`
        };
      }
    }
    
    // Validate eTag format (should be a timestamp-like string)
    if (typeof finalETag !== 'string' || finalETag.trim().length === 0) {
      return {
        error: 'Invalid eTag parameter. Must be a non-empty string representing case save date time.'
      };
    }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Case Action Execution: ${actionID} on ${caseID}`,
        async () => {
          // Build options object for API call
          const options = {};
        
        if (content) options.content = content;
        if (pageInstructions) options.pageInstructions = pageInstructions;
        if (attachments) options.attachments = attachments;
        if (viewType) options.viewType = viewType;
        if (skipRoboticAutomation !== undefined) options.skipRoboticAutomation = skipRoboticAutomation;
        if (originChannel) options.originChannel = originChannel;

        // Add eTag to options
        options.eTag = finalETag.trim();

          return await this.pegaClient.performCaseAction(caseID.trim(), actionID.trim(), options);
        },
        {
          caseID,
          actionID,
          eTag: finalETag,
          autoFetchedETag,
          viewType,
          skipRoboticAutomation,
          hasContent: !!content,
          hasPageInstructions: !!pageInstructions,
          hasAttachments: !!attachments,
          sessionInfo
        }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Perform Case Action

**Unexpected Error**: ${error.message}

${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Override formatSuccessResponse to add case action specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const {
      caseID,
      actionID,
      eTag,
      autoFetchedETag,
      viewType,
      skipRoboticAutomation,
      hasContent,
      hasPageInstructions,
      hasAttachments,
      sessionInfo
    } = options;

    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }
    
    // Display action execution summary
    response += '### Action Execution Summary\n';
    response += `- **Case ID**: ${caseID}\n`;
    response += `- **Action**: ${actionID}\n`;
    if (autoFetchedETag) {
      response += `- **eTag**: ${eTag} (🔄 auto-fetched)\n`;
      response += '- ✅ Latest eTag automatically retrieved\n';
    } else {
      response += `- **eTag**: ${eTag} (provided manually)\n`;
    }
    if (hasContent) response += '- ✅ Case content updated\n';
    if (hasPageInstructions) response += '- ✅ Page instructions processed\n';
    if (hasAttachments) response += '- ✅ Attachments processed\n';
    if (skipRoboticAutomation) response += '- ⚠️ Robotic automation skipped\n';

    if (data.data) {
      // Display updated case information
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += '\n### Updated Case Information\n';
        response += `- **Case ID**: ${caseInfo.ID || caseID}\n`;
        response += `- **Business ID**: ${caseInfo.businessID || 'N/A'}\n`;
        response += `- **Case Type**: ${caseInfo.caseTypeName || 'N/A'}\n`;
        response += `- **Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stageLabel || caseInfo.stageID || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Last Updated**: ${caseInfo.lastUpdateTime || 'N/A'}\n`;
        response += `- **Updated By**: ${caseInfo.lastUpdatedBy || 'N/A'}\n`;

        // Display assignment information if available
        if (caseInfo.assignments && caseInfo.assignments.length > 0) {
          response += '\n### Current Assignments\n';
          caseInfo.assignments.forEach((assignment, index) => {
            response += `${index + 1}. **${assignment.name || 'Assignment'}**\n`;
            response += `   - Process: ${assignment.processName || assignment.processID || 'N/A'}\n`;
            response += `   - Assignee: ${assignment.assigneeInfo?.name || 'N/A'} (${assignment.assigneeInfo?.type || 'N/A'})\n`;
            response += `   - Urgency: ${assignment.urgency || 'N/A'}\n`;
            response += `   - Can Perform: ${assignment.canPerform || 'false'}\n`;
            if (assignment.instructions) {
              response += `   - Instructions: ${assignment.instructions}\n`;
            }
          });
        }

        // Display SLA information if available
        if (caseInfo.sla) {
          response += '\n### SLA Information\n';
          if (caseInfo.sla.goal) response += `- **Goal**: ${caseInfo.sla.goal}\n`;
          if (caseInfo.sla.deadline) response += `- **Deadline**: ${caseInfo.sla.deadline}\n`;
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

    // Display confirmation note if available
    if (data.data && data.data.confirmationNote) {
      response += '\n### Workflow Status\n';
      response += `**Confirmation**: ${data.data.confirmationNote}\n`;
    }

    // Display UI resources info based on viewType
    if (data.uiResources && viewType && viewType !== 'none') {
      response += '\n### UI Resources\n';
      response += `- **View Type**: ${viewType}\n`;
      response += '- UI metadata has been loaded for post-action view\n';
      
      if (data.uiResources.root) {
        response += `- **Root Component**: ${data.uiResources.root.type || 'Unknown'}\n`;
        if (data.uiResources.root.name) {
          response += `- **Component Name**: ${data.uiResources.root.name}\n`;
        }
      }

      if (viewType === 'form') {
        response += '- Form-specific UI metadata included\n';
      } else {
        response += '- Full page UI metadata included\n';
      }
    }

    // Display new eTag information for future operations
    if (data.eTag) {
      response += '\n### Future Operations\n';
      response += `- **New eTag**: ${data.eTag}\n`;
      response += '- This eTag should be used for subsequent operations on this case\n';
      response += '- The case state has been updated and committed to the database\n';
    }

    response += '\n### Operation Notes\n';
    if (autoFetchedETag) {
      response += '- 🔄 Latest eTag automatically fetched for optimistic locking\n';
    }
    response += '- ✅ Pre-processing actions executed successfully\n';
    response += '- ✅ Case data merged and validated\n';
    response += '- ✅ Optional action performed on case context\n';
    response += '- ✅ Post-processing actions completed\n';
    response += '- ✅ Case committed to database\n';
    
    if (skipRoboticAutomation) {
      response += '- ⚠️ Robotic automation was skipped as requested\n';
    }

    if (autoFetchedETag) {
      response += '\n**Auto-fetch Benefits**: No manual eTag management required - the tool automatically ensures proper optimistic locking.\n';
    }
    response += '\n**Next Steps**: Use the new eTag for any further operations on this case. Check confirmationNote for workflow guidance.\n';
    
    return response;
  }

  /**
   * Override formatErrorResponse to add case action specific error context
   */
  formatErrorResponse(operation, error, options = {}) {
    const { caseID, actionID, eTag } = options;
    
    let response = `## ❌ ${operation} Failed\n\n`;
    response += `*Error occurred at: ${new Date().toISOString()}*\n\n`;
    
    response += '### Operation Context\n';
    response += `- **Case ID**: ${caseID}\n`;
    response += `- **Action**: ${actionID}\n`;
    response += `- **eTag Used**: ${eTag}\n\n`;

    response += `### Error Details\n`;
    response += `- **Type**: ${error.type}\n`;
    response += `- **Message**: ${error.message}\n`;
    response += `- **Details**: ${error.details}\n`;

    if (error.status) {
      response += `- **HTTP Status**: ${error.status} ${error.statusText || ''}\n`;
    }

    // Provide specific guidance based on error type
    response += '\n### Troubleshooting Guidance\n';
    
    switch (error.type) {
      case 'CONFLICT':
        response += '**eTag Conflict (409)**:\n';
        response += '- The case has been modified by another user since your last read\n';
        response += '- **Solution**: Use get_case_action tool to retrieve the latest case state and eTag\n';
        response += '- Then retry the operation with the new eTag value\n';
        break;
        
      case 'PRECONDITION_FAILED':
        response += '**Invalid eTag (412)**:\n';
        response += '- The provided eTag format is invalid or corrupted\n';
        response += '- **Solution**: Use get_case_action tool to retrieve a valid eTag\n';
        response += '- Ensure eTag is copied exactly as returned from previous API calls\n';
        break;
        
      case 'VALIDATION_FAIL':
        response += '**Validation Error (422)**:\n';
        response += '- One or more field values failed validation rules\n';
        response += '- **Solution**: Check field values against case type constraints\n';
        response += '- Verify data types, required fields, and pick-list values\n';
        if (error.errorDetails) {
          response += '- **Field Errors**:\n';
          error.errorDetails.forEach(detail => {
            if (detail.erroneousInputOutputFieldInPage) {
              response += `  - ${detail.erroneousInputOutputFieldInPage}: ${detail.localizedValue}\n`;
            }
          });
        }
        break;
        
      case 'LOCKED':
        response += '**Case Locked (423)**:\n';
        response += '- The case is currently locked by another user\n';
        response += '- **Solution**: Wait for the other user to complete their work\n';
        response += '- Or use release_case_lock tool if you have appropriate permissions\n';
        break;
        
      case 'FAILED_DEPENDENCY':
        response += '**Dependency Failure (424)**:\n';
        response += '- Post-processing or robotic automation failed\n';
        response += '- **Solution**: Retry with skipRoboticAutomation=true to bypass automation\n';
        response += '- Or resolve the automation/dependency issue and retry\n';
        break;
        
      case 'NOT_FOUND':
        response += '**Case or Action Not Found (404)**:\n';
        response += '- Case ID or Action ID could not be found\n';
        response += '- **Solution**: Verify case ID format and action ID spelling\n';
        response += '- Use get_case tool to confirm case exists and get_case_action to verify action availability\n';
        break;
        
      case 'FORBIDDEN':
        response += '**Access Denied (403)**:\n';
        response += '- User lacks permission to perform this action\n';
        response += '- **Solution**: Contact administrator to verify access rights\n';
        response += '- Ensure user has appropriate role and privileges for this case type and action\n';
        break;
        
      case 'BAD_REQUEST':
        response += '**Invalid Request (400)**:\n';
        response += '- Request parameters or content are invalid\n';
        response += '- **Solution**: Verify all required parameters are provided correctly\n';
        response += '- Check content field names and data types match case type definition\n';
        break;
        
      default:
        response += '**General Error**:\n';
        response += '- Review error details above for specific guidance\n';
        response += '- **Solution**: Verify case ID, action ID, and eTag are correct\n';
        response += '- Use get_case_action tool to refresh case state if needed\n';
        break;
    }

    if (error.errorDetails && error.errorDetails.length > 0) {
      response += '\n### Detailed Error Information\n';
      error.errorDetails.forEach((detail, index) => {
        response += `${index + 1}. **${detail.message || 'Error'}**\n`;
        if (detail.localizedValue) {
          response += `   - Details: ${detail.localizedValue}\n`;
        }
        if (detail.erroneousInputOutputFieldInPage) {
          response += `   - Field: ${detail.erroneousInputOutputFieldInPage}\n`;
        }
        if (detail.erroneousInputOutputIdentifier) {
          response += `   - Context: ${detail.erroneousInputOutputIdentifier}\n`;
        }
      });
    }

    return response;
  }
}
