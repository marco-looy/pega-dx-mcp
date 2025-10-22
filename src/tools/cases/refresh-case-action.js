import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class RefreshCaseActionTool extends BaseTool {
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
      name: 'refresh_case_action',
      description: 'Refresh case action form data with updated values after property changes, execute Data Transforms, and handle table row operations in modals. If no eTag is provided, automatically fetches the latest eTag from the case action for seamless operation. Supports form refresh settings configured in Flow Action rules, generative AI form filling, and embedded list operations with comprehensive validation and preprocessing execution. The API validates case and action IDs, retrieves view data, and returns information about fields affected by the refresh action. Supports Pega Infinity \'25 features including table row operations in modals.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to perform refresh on. Format: {OrgID}-{AppName}-{CaseType} {CaseNumber}. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          actionID: {
            type: 'string',
            description: 'Name of the case action - ID of the flow action rule. This corresponds to the Flow Action rule configured in the Pega application where form refresh settings are defined. Example: "pyUpdateCaseDetails", "CompleteReview", "Approve".'
          },
          eTag: {
            type: 'string',
            description: 'Optional eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. If not provided, the tool will automatically fetch the latest eTag from the case action. For manual eTag management, provide the eTag from a previous case operation. Used for optimistic locking to prevent concurrent modification conflicts.'
          },
          refreshFor: {
            type: 'string',
            description: 'Name of the property which, when changed, triggers refresh after executing the Data Transform configured under form refresh settings of the flow action. When provided, the corresponding Data Transform is executed to provide updated default values. Replaces the deprecated pyRefreshData Data Transform approach. Only change property events are supported in form refresh settings.'
          },
          fillFormWithAI: {
            type: 'boolean',
            description: 'Boolean value indicating whether to fill form with sample values using generative AI. This parameter works in conjunction with the EnableGenerativeAI toggle. When EnableGenerativeAI is turned on and fillFormWithAI=true, the system will attempt to generate appropriate form values using AI. Default: false.'
          },
          operation: {
            type: 'string',
            enum: ['showRow', 'submitRow'],
            description: 'String value indicating table row operation type for embedded list properties using modals (Pega Infinity \'25+ feature). "showRow" is used when a row is being added or edited in a modal, triggering preprocessing of the interestPageActionID Action. "submitRow" is used when a row is being submitted, triggering validation and post-processing of the interestPageActionID Action. Only supported for table row operations in modals.'
          },
          content: {
            type: 'object',
            description: 'Map of scalar properties and embedded page properties to be merged into the case during the refresh operation. Field values provided here will overwrite any settings made from preprocessing Data Transforms. Only fields that are present in the case action\'s view and are editable can be effectively updated. Non-visible fields cannot be set and updates to them may be lost in subsequent operations.'
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
            description: 'Optional list of page-related operations for embedded pages, page lists, or page groups. Required for setting embedded page references.'
          },
          contextData: {
            type: 'boolean',
            description: 'Boolean value to fetch contextData or full view response. When true, returns only context data for improved performance. When false or not provided, returns the full view response including UI metadata. Default: false.'
          },
          interestPage: {
            type: 'string',
            description: 'Target page specification for table row operations on embedded list properties. Example: ".OrderItems(1)" to target the first item in the OrderItems page list. This parameter is required when operation parameter is specified. Used with interestPageActionID to identify the specific embedded page and action for modal-based table operations.'
          },
          interestPageActionID: {
            type: 'string',
            description: 'Action ID for the embedded list operation Action rule. Example: "EmbeddedAction". This specifies the Flow Action rule that defines the preprocessing, validation, and post-processing logic for the table row operation. Required when operation parameter is specified. Only fields present in this Action\'s view can be modified during pre/post-processing.'
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
   * Execute the refresh case action operation
   */
  async execute(params) {
    const {
      caseID,
      actionID,
      eTag,
      refreshFor,
      fillFormWithAI = false,
      operation,
      content,
      pageInstructions,
      contextData = false,
      interestPage,
      interestPageActionID,
      originChannel
    } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'actionID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate enum parameters using base class
    const enumValidation = this.validateEnumParams(params, {
      operation: ['showRow', 'submitRow']
    });
    if (enumValidation) {
      return enumValidation;
    }

    // Additional custom validation for complex business rules
    if (refreshFor !== undefined && (typeof refreshFor !== 'string' || refreshFor.trim() === '')) {
      return {
        error: 'Invalid refreshFor parameter. When provided, it must be a non-empty string representing the property name that triggers the refresh.'
      };
    }

    if (fillFormWithAI !== undefined && typeof fillFormWithAI !== 'boolean') {
      return {
        error: 'Invalid fillFormWithAI parameter. Must be a boolean value (true or false).'
      };
    }

    if (contextData !== undefined && typeof contextData !== 'boolean') {
      return {
        error: 'Invalid contextData parameter. Must be a boolean value (true or false).'
      };
    }

    // Conditional parameter validation for table row operations
    if (operation) {
      if (!interestPage || typeof interestPage !== 'string' || interestPage.trim() === '') {
        return {
          error: 'Invalid interestPage parameter. When operation is specified, interestPage is required and must be a non-empty string. Example: ".OrderItems(1)"'
        };
      }

      if (!interestPageActionID || typeof interestPageActionID !== 'string' || interestPageActionID.trim() === '') {
        return {
          error: 'Invalid interestPageActionID parameter. When operation is specified, interestPageActionID is required and must be a non-empty string representing the embedded Action rule ID.'
        };
      }
    }

    // Auto-fetch eTag if not provided
    let finalETag = eTag;
    let autoFetchedETag = false;
    
    if (!finalETag) {
      try {
        console.log(`Auto-fetching latest eTag for case action refresh on ${caseID}...`);
        const caseActionResponse = await this.pegaClient.getCaseAction(caseID.trim(), actionID.trim(), {
          viewType: 'form',  // Use form view for eTag retrieval
          excludeAdditionalActions: true
        });
        
        if (!caseActionResponse || !caseActionResponse.success) {
          const errorMsg = `Failed to auto-fetch eTag: ${caseActionResponse?.error?.message || 'Unknown error'}`;
          return {
            error: errorMsg
          };
        }
        
        finalETag = caseActionResponse.eTag;
        autoFetchedETag = true;
        console.log(`Successfully auto-fetched eTag: ${finalETag}`);
        
        if (!finalETag) {
          const errorMsg = 'Auto-fetch succeeded but no eTag was returned from get_case_action. This may indicate a server issue.';
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

    // Validate content parameter
    if (content !== undefined && (typeof content !== 'object' || Array.isArray(content))) {
      return {
        error: 'Invalid content parameter. Must be an object containing property name-value pairs.'
      };
    }

    // Validate pageInstructions parameter
    if (pageInstructions !== undefined && !Array.isArray(pageInstructions)) {
      return {
        error: 'Invalid pageInstructions parameter. Must be an array of page instruction objects.'
      };
    }

    // Validate originChannel parameter
    if (originChannel !== undefined && (typeof originChannel !== 'string' || originChannel.trim() === '')) {
      return {
        error: 'Invalid originChannel parameter. Must be a non-empty string.'
      };
    }

      // Execute the API call directly and handle custom formatting
      const apiResult = await this.pegaClient.refreshCaseAction(
        caseID.trim(),
        actionID.trim(),
        finalETag.trim(),
        {
          refreshFor: refreshFor?.trim(),
          fillFormWithAI,
          operation,
          content,
          pageInstructions,
          contextData,
          interestPage: interestPage?.trim(),
          interestPageActionID: interestPageActionID?.trim(),
          originChannel
        }
      );

      if (apiResult.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(caseID, actionID, apiResult.data, apiResult.eTag, {
                refreshFor,
                fillFormWithAI,
                operation,
                content,
                pageInstructions,
                contextData,
                interestPage,
                interestPageActionID,
                originChannel,
                sessionInfo
              })
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(caseID, actionID, apiResult.error, {
                eTag: finalETag,
                refreshFor,
                fillFormWithAI,
                operation,
                interestPage,
                interestPageActionID,
                contextData,
                originChannel
              })
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Refresh Case Action\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(caseID, actionID, data, eTag, options) {
    const { refreshFor, fillFormWithAI, operation, content, pageInstructions, contextData, interestPage, interestPageActionID, originChannel, sessionInfo } = options;

    let response = `## Case Action Refresh Results: ${actionID}\n\n`;
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }

    response += `**Case ID**: ${caseID}\n`;
    response += `**Action ID**: ${actionID}\n`;
    response += `**eTag Used**: ${eTag}\n`;
    response += `**Response Type**: ${contextData ? 'Context Data Only' : 'Full View Response'}\n`;
    if (originChannel) response += `**Origin Channel**: ${originChannel}\n`;
    response += `**Refresh Operation**: ${operation || 'Basic form refresh'}\n\n`;
    
    // Display refresh operation details
    response += '### Refresh Operation Details\n';
    if (refreshFor) {
      response += `- **Property Refreshed**: ${refreshFor}\n`;
      response += '- **Data Transform Executed**: Form refresh settings Data Transform\n';
    }
    if (fillFormWithAI) {
      response += '- **Generative AI**: Form filled with AI-generated sample values\n';
    }
    if (operation) {
      response += `- **Table Row Operation**: ${operation}\n`;
      response += `- **Target Page**: ${interestPage}\n`;
      response += `- **Embedded Action**: ${interestPageActionID}\n`;
    }
    response += '- **pyRefreshData Transform**: Executed after specific transforms\n';
    response += '- **Field Conditions**: Required, Disabled, and Visibility conditions evaluated\n';

    if (data.data) {
      // Display case information if available  
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += '\n### Associated Case Information\n';
        response += `- **Case ID**: ${caseInfo.ID || caseInfo.businessID || 'N/A'}\n`;
        response += `- **Case Type**: ${caseInfo.caseTypeName || caseInfo.caseTypeID || 'N/A'}\n`;
        response += `- **Case Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stageLabel || caseInfo.stageID || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Owner**: ${caseInfo.owner || caseInfo.createdBy || 'N/A'}\n`;
        response += `- **Last Updated**: ${caseInfo.lastUpdateTime || 'N/A'}\n`;

        // Display current assignments within case
        if (caseInfo.assignments && caseInfo.assignments.length > 0) {
          response += '\n### Current Case Assignments\n';
          caseInfo.assignments.forEach((assignment, index) => {
            response += `${index + 1}. **${assignment.name || assignment.ID}**\n`;
            response += `   - Assignment ID: ${assignment.ID}\n`;
            response += `   - Process: ${assignment.processName || assignment.processID || 'N/A'}\n`;
            response += `   - Assigned To: ${assignment.assigneeInfo?.name || assignment.assigneeInfo?.ID || 'N/A'}\n`;
            response += `   - Instructions: ${assignment.instructions || 'N/A'}\n`;
            
            // Show actions for this assignment
            if (assignment.actions && assignment.actions.length > 0) {
              response += `   - Available Actions: ${assignment.actions.map(action => action.name || action.ID).join(', ')}\n`;
            }
          });
        }

        // Display updated case content after refresh
        if (caseInfo.content && Object.keys(caseInfo.content).length > 0) {
          response += '\n### Updated Case Content\n';
          for (const [key, value] of Object.entries(caseInfo.content)) {
            if (key !== 'classID' && key !== 'summary_of_associated_lists__') {
              response += `- **${key}**: ${value}\n`;
            }
          }
        }
      }

      // Display refresh-specific results
      if (data.data.refreshResults) {
        response += '\n### Form Refresh Results\n';
        const refreshResults = data.data.refreshResults;
        
        if (refreshResults.updatedFields && refreshResults.updatedFields.length > 0) {
          response += '**Fields Updated by Refresh:**\n';
          refreshResults.updatedFields.forEach((field, index) => {
            response += `${index + 1}. **${field.name}**: ${field.oldValue || 'N/A'} → ${field.newValue || 'N/A'}\n`;
            if (field.source) {
              response += `   - Updated by: ${field.source}\n`;
            }
          });
        }

        if (refreshResults.validationResults) {
          response += '\n**Field Validation Results:**\n';
          const validation = refreshResults.validationResults;
          if (validation.required) {
            response += `- Required fields: ${validation.required.join(', ')}\n`;
          }
          if (validation.disabled) {
            response += `- Disabled fields: ${validation.disabled.join(', ')}\n`;
          }
          if (validation.visible) {
            response += `- Visible fields: ${validation.visible.join(', ')}\n`;
          }
        }

        if (refreshResults.aiResults && fillFormWithAI) {
          response += '\n**Generative AI Results:**\n';
          response += `- AI Form Filling: ${refreshResults.aiResults.success ? 'Successful' : 'Failed'}\n`;
          if (refreshResults.aiResults.fieldsGenerated) {
            response += `- Fields Generated: ${refreshResults.aiResults.fieldsGenerated.join(', ')}\n`;
          }
          if (refreshResults.aiResults.message) {
            response += `- AI Message: ${refreshResults.aiResults.message}\n`;
          }
        }
      }

      // Display table row operation results
      if (operation && data.data.tableRowResults) {
        response += '\n### Table Row Operation Results\n';
        const rowResults = data.data.tableRowResults;
        response += `- **Operation**: ${operation}\n`;
        response += `- **Target Page**: ${interestPage}\n`;
        response += `- **Embedded Action**: ${interestPageActionID}\n`;
        
        if (operation === 'showRow') {
          response += '- **Preprocessing**: Executed for embedded action\n';
          response += '- **Row Validation**: Completed\n';
        } else if (operation === 'submitRow') {
          response += '- **Row Validation**: Completed\n';
          response += '- **Post-processing**: Executed for embedded action\n';
        }

        if (rowResults.validationErrors && rowResults.validationErrors.length > 0) {
          response += '\n**Row Validation Errors:**\n';
          rowResults.validationErrors.forEach((error, index) => {
            response += `${index + 1}. ${error.field}: ${error.message}\n`;
          });
        }

        if (rowResults.updatedFields && rowResults.updatedFields.length > 0) {
          response += '\n**Row Fields Updated:**\n';
          rowResults.updatedFields.forEach((field, index) => {
            response += `${index + 1}. **${field.name}**: ${field.value}\n`;
          });
        }
      }

      // Display content merge results
      if (content && Object.keys(content).length > 0) {
        response += '\n### Content Merge Results\n';
        response += '- **User Content Applied**: Values merged into case\n';
        response += '- **Override Priority**: User values take precedence over Data Transform values\n';
        response += '- **Field Visibility**: Only editable and visible fields effectively updated\n';
      }

      // Display page instruction results
      if (pageInstructions && pageInstructions.length > 0) {
        response += '\n### Page Instruction Results\n';
        response += `- **Instructions Processed**: ${pageInstructions.length}\n`;
        response += '- **Page Operations**: Embedded pages, page lists, and page groups updated\n';
        response += '- **Scope**: Only pages included in case action view modified\n';
      }
    }

    // Display UI resources information (only if not contextData mode)
    if (!contextData && data.uiResources) {
      response += '\n### UI Resources Updated\n';
      response += '- **Form Metadata**: UI resources refreshed with updated field states\n';
      
      if (data.uiResources.root) {
        response += `- **Root Component**: ${data.uiResources.root.type || 'Form'}\n`;
        if (data.uiResources.root.config?.name) {
          response += `- **View Name**: ${data.uiResources.root.config.name}\n`;
        }
      }
      
      if (data.uiResources.resources) {
        // Display updated fields
        if (data.uiResources.resources.fields) {
          const fieldCount = Object.keys(data.uiResources.resources.fields).length;
          response += `- **Form Fields Available**: ${fieldCount}\n`;
          const fieldNames = Object.keys(data.uiResources.resources.fields).slice(0, 10);
          if (fieldNames.length > 0) {
            response += `- **Key Fields**: ${fieldNames.join(', ')}\n`;
            if (Object.keys(data.uiResources.resources.fields).length > 10) {
              response += `- **(and ${Object.keys(data.uiResources.resources.fields).length - 10} more...)*\n`;
            }
          }
        }
        
        // Display available views after refresh
        if (data.uiResources.resources.views) {
          const viewCount = Object.keys(data.uiResources.resources.views).length;
          response += `- **Available Views**: ${viewCount}\n`;
        }
      }

      // Display field state changes
      if (data.uiResources.fieldStates) {
        response += '\n**Field State Changes:**\n';
        const states = data.uiResources.fieldStates;
        if (states.required && states.required.length > 0) {
          response += `- **Now Required**: ${states.required.join(', ')}\n`;
        }
        if (states.disabled && states.disabled.length > 0) {
          response += `- **Now Disabled**: ${states.disabled.join(', ')}\n`;
        }
        if (states.visible && states.visible.length > 0) {
          response += `- **Now Visible**: ${states.visible.join(', ')}\n`;
        }
        if (states.hidden && states.hidden.length > 0) {
          response += `- **Now Hidden**: ${states.hidden.join(', ')}\n`;
        }
      }
    } else if (contextData && data.uiResources?.context_data) {
      response += '\n### Context Data Retrieved\n';
      response += '- **Performance Mode**: Context data only (improved response time)\n';
      response += '- **Data Structure**: Optimized for client-side processing\n';
      const contextKeys = Object.keys(data.uiResources.context_data).length;
      response += `- **Context Elements**: ${contextKeys} data elements available\n`;
    }

    // Display execution sequence information
    response += '\n### Execution Sequence Completed\n';
    response += '1. ✅ Case and action validated\n';
    response += '2. ✅ eTag verified for optimistic locking\n';
    response += '3. ✅ Case opened from database\n';
    response += '4. ✅ Flow Action preprocessing executed (Data Transform + Activity)\n';
    response += '5. ✅ Request body and page instructions merged into case\n';
    
    if (refreshFor) {
      response += `6. ✅ Refresh Data Transform executed for property: ${refreshFor}\n`;
      response += '7. ✅ pyRefreshData Data Transform executed\n';
    } else {
      response += '6. ✅ pyRefreshData Data Transform executed\n';
    }
    
    if (operation === 'showRow') {
      response += `8. ✅ Embedded Action preprocessing executed: ${interestPageActionID}\n`;
      response += `9. ✅ Interest page row validated: ${interestPage}\n`;
    } else if (operation === 'submitRow') {
      response += `8. ✅ Interest page row validated: ${interestPage}\n`;
      response += `9. ✅ Embedded Action validation and post-processing: ${interestPageActionID}\n`;
    }
    
    response += '✅ Required, Disabled, and Visibility conditions evaluated\n';

    // Display data limitations acknowledgment
    response += '\n### Data Limitations Acknowledged\n';
    response += '- **Field Updates**: Only visible and editable fields in the view can be effectively updated\n';
    response += '- **Non-visible Fields**: Cannot be set; updates may be lost in subsequent operations\n';
    response += '- **Form Refresh**: Only change property events supported\n';
    if (operation) {
      response += '- **Table Operations**: Pre/post-processing only supported for modal-based operations\n';
      response += '- **Page Lists**: Cannot be added/updated/deleted from Data Transform\n';
    }
    if (contextData) {
      response += '- **Context Data Mode**: UI metadata not included for performance optimization\n';
    }

    // Display new eTag if available for future operations
    if (data.eTag) {
      response += '\n### Operation Support\n';
      response += `- **New eTag Captured**: ${data.eTag}\n`;
      response += '- **Ready for Next Action**: Use new eTag for subsequent case operations\n';
    }

    response += '\n---\n';
    response += `*Refresh completed at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseID, actionID, error, options) {
    const { eTag, refreshFor, fillFormWithAI, operation, interestPage, interestPageActionID, contextData, originChannel } = options;
    
    let response = `## Error refreshing case action: ${actionID}\n\n`;
    
    response += `**Case ID**: ${caseID}\n`;
    response += `**Action ID**: ${actionID}\n`;
    response += `**eTag Used**: ${eTag}\n`;
    response += `**Operation Type**: ${operation || 'Basic form refresh'}\n`;
    if (originChannel) response += `**Origin Channel**: ${originChannel}\n`;
    response += `**Error Type**: ${error.type}\n`;
    response += `**Message**: ${error.message}\n`;
    
    if (error.details) {
      response += `**Details**: ${error.details}\n`;
    }
    
    if (error.status) {
      response += `**HTTP Status**: ${error.status} ${error.statusText}\n`;
    }

    // Display operation context for error diagnosis
    if (refreshFor || fillFormWithAI || operation || contextData) {
      response += '\n### Operation Context\n';
      if (refreshFor) {
        response += `- **Refresh Property**: ${refreshFor}\n`;
      }
      if (fillFormWithAI) {
        response += '- **AI Form Filling**: Enabled\n';
      }
      if (operation) {
        response += `- **Table Operation**: ${operation}\n`;
        response += `- **Interest Page**: ${interestPage}\n`;
        response += `- **Embedded Action**: ${interestPageActionID}\n`;
      }
      if (contextData) {
        response += '- **Response Mode**: Context data only\n';
      }
    }

    // Add specific guidance based on error type
    switch (error.type) {
      case 'NOT_FOUND':
        response += '\n**Suggestion**: Verify both the case ID and action ID are correct. The case might not exist, might be closed, or the specific action might not be available for this case. For table row operations, ensure the interestPageActionID corresponds to a valid embedded Action rule.\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to refresh this case action. The case might be restricted to specific users or roles, or form refresh settings might not be configured for this Flow Action rule. For generative AI operations, verify the EnableGenerativeAI toggle is enabled.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: Check the case ID format and action ID. Case IDs should follow the pattern: {OrgID}-{AppName}-{CaseType} {CaseNumber}. Verify form refresh settings are properly configured in the Flow Action rule. For table operations, ensure interestPage format is correct (e.g., ".OrderItems(1)").\n';
        break;
      case 'VALIDATION_FAIL':
        response += '\n**Suggestion**: The submitted data failed validation rules. This could be due to:\n';
        response += '- Required fields missing from the content\n';
        response += '- Field values violating business rules or data validation\n';
        response += '- Table row validation failures for embedded list operations\n';
        response += '- Data Transform execution errors during preprocessing\n';
        response += 'Review the field requirements and business rules for this case action.\n';
        break;
      case 'LOCKED':
        response += '\n**Suggestion**: This case is currently locked by another user. Wait for the lock to be released or contact the user who has the lock. With pessimistic locking, only one user can access the case at a time.\n';
        break;
      case 'CONFLICT':
        response += '\n**Suggestion**: The case state has changed since your last request (eTag mismatch). This could be due to:\n';
        response += '- Another user performing actions on the same case\n';
        response += '- Case state changes during form refresh processing\n';
        response += '- Concurrent table row operations on embedded lists\n';
        response += 'Retrieve the latest case action details to get the current eTag value before attempting refresh.\n';
        break;
      case 'PRECONDITION_FAILED':
        response += '\n**Suggestion**: The eTag value provided does not match the current case state. Retrieve the latest case action details to get the current eTag value before attempting the refresh operation.\n';
        break;
      case 'UNPROCESSABLE_ENTITY':
        response += '\n**Suggestion**: The refresh request could not be processed due to:\n';
        response += '- Data Transform execution failures in form refresh settings\n';
        response += '- Field validation errors during refresh processing\n';
        response += '- Table row validation failures for embedded operations\n';
        response += '- Circular dependencies in refresh logic\n';
        response += 'Review the refresh configuration and field dependencies.\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Suggestion**: The Pega Infinity server encountered an internal error during refresh processing. This could be due to:\n';
        response += '- Data Transform execution failures in form refresh settings\n';
        response += '- Preprocessing or post-processing errors for embedded actions\n';
        response += '- Generative AI service failures when fillFormWithAI=true\n';
        response += '- Table row operation processing errors\n';
        response += 'Check the Flow Action rule configuration and try again. Contact support if the issue persists.\n';
        break;
      case 'FAILED_DEPENDENCY':
        response += '\n**Suggestion**: A required dependency failed during refresh processing. This could be due to:\n';
        response += '- Missing or invalid form refresh settings in the Flow Action rule\n';
        response += '- Embedded Action rule not found for table row operations\n';
        response += '- Required Data Transform rules missing or having execution errors\n';
        response += '- EnableGenerativeAI toggle not properly configured for AI operations\n';
        response += 'Verify all dependencies and configuration settings are correct.\n';
        break;
      case 'SERVICE_UNAVAILABLE':
        response += '\n**Suggestion**: AI suggestions retrieval failure occurred. This is specific to generative AI form filling operations. Check:\n';
        response += '- EnableGenerativeAI toggle is properly configured\n';
        response += '- AI service connectivity and availability\n';
        response += '- AI model configuration and permissions\n';
        response += 'Retry the operation or disable AI form filling if the issue persists.\n';
        break;
      case 'LOOP_DETECTED':
        response += '\n**Suggestion**: Infinite loop detected during refresh processing. This could be due to:\n';
        response += '- Circular dependencies in Data Transform refresh logic\n';
        response += '- Recursive field refresh triggers causing endless loops\n';
        response += '- Table row operations causing recursive refresh cycles\n';
        response += 'Review the refresh configuration to eliminate circular dependencies and recursive operations.\n';
        break;
    }

    // Add data limitation context for errors
    if (error.type === 'VALIDATION_FAIL' || error.type === 'BAD_REQUEST') {
      response += '\n### Data Limitations Context\n';
      response += '- Only fields present in the case action view and marked as editable can be updated\n';
      response += '- Non-visible fields cannot be set and updates may be lost\n';
      response += '- Form refresh settings only support change property events in Constellation\n';
      if (operation) {
        response += '- Table row operations are only supported for embedded lists using modals\n';
        response += '- Page List properties cannot be added/updated/deleted from Data Transform\n';
        response += '- Pre/post-processing for embedded lists requires modal-based operations\n';
      }
      if (fillFormWithAI) {
        response += '- Generative AI form filling requires both EnableGenerativeAI toggle and fillFormWithAI=true\n';
      }
      if (contextData) {
        response += '- Context data mode provides performance optimization but excludes UI metadata\n';
      }
    }

    if (error.errorDetails && error.errorDetails.length > 0) {
      response += '\n### Additional Error Details\n';
      error.errorDetails.forEach((detail, index) => {
        response += `${index + 1}. ${detail.localizedValue || detail.message}\n`;
        if (detail.erroneousInputOutputFieldInPage) {
          response += `   - Field: ${detail.erroneousInputOutputFieldInPage}\n`;
        }
        if (detail.erroneousInputOutputIdentifier) {
          response += `   - Identifier: ${detail.erroneousInputOutputIdentifier}\n`;
        }
      });
    }

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
