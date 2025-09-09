import { BaseTool } from '../../registry/base-tool.js';

export class RecalculateAssignmentFieldsTool extends BaseTool {
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
      name: 'recalculate_assignment_fields',
      description: 'Recalculate calculated fields & whens for the current assignment action form. If no eTag is provided, automatically fetches the latest eTag from the assignment for seamless operation. Executes field calculations and when conditions based on current form state and user input. Supports recalculating specific fields and when conditions, merging content updates, and applying page instructions during the calculation process. The API validates assignment and action IDs, processes calculation requests, and returns updated field values and states.',
      inputSchema: {
        type: 'object',
        properties: {
          assignmentID: {
            type: 'string',
            description: 'Full handle of an assignment. Example: ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW. This uniquely identifies the specific assignment instance where field recalculation will be performed.'
          },
          actionID: {
            type: 'string',
            description: 'Name of the assignment action - ID of the flow action rule. This corresponds to the Flow Action rule configured in the Pega application where field calculations are defined. Example: CompleteVerification, Approve, Reject.'
          },
          finalETag.trim(): {
            type: 'string',
            description: 'Optional eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. If not provided, the tool will automatically fetch the latest eTag from the assignment. For manual eTag management, provide the eTag from a previous assignment operation. Used for optimistic locking to prevent concurrent modification conflicts.'
          },
          calculations: {
            type: 'object',
            description: 'Required object containing fields and when conditions to recalculate. Must contain at least one of fields or whens arrays.',
            properties: {
              fields: {
                type: 'array',
                description: 'Array of field objects to recalculate. Each field object must contain name and context properties.',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Name of the field to recalculate. Must be a valid property reference within the assignment action view.'
                    },
                    context: {
                      type: 'string',
                      description: 'Context or page reference for the field calculation. Specifies the data context in which the field calculation should be performed.'
                    }
                  },
                  required: ['name', 'context'],
                  additionalProperties: false
                }
              },
              whens: {
                type: 'array',
                description: 'Array of when condition objects to recalculate. Each when object must contain name and context properties.',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Name of the when condition to recalculate. Must be a valid when rule reference accessible within the assignment action context.'
                    },
                    context: {
                      type: 'string',
                      description: 'Context or page reference for the when condition evaluation. Specifies the data context in which the when condition should be evaluated.'
                    }
                  },
                  required: ['name', 'context'],
                  additionalProperties: false
                }
              }
            },
            additionalProperties: false
          },
          content: {
            type: 'object',
            description: 'Optional map of scalar properties and embedded page properties to be merged into the case during the recalculation process. Field values provided here will be available for use in calculations. Only fields that are present in the assignment action\'s view can be effectively utilized in calculations.'
          },
          pageInstructions: {
            type: 'array',
            description: 'Optional list of page-related operations to be performed on embedded pages, page lists, or page group properties before recalculation. These operations allow manipulation of complex data structures that may affect calculation results. Each instruction specifies the operation type and target page structure.',
            items: {
              type: 'object'
            }
          }
        },
        required: ['assignmentID', 'actionID''calculations']
      }
    };
  }

  /**
   * Execute the recalculate assignment fields operation
   */
  async execute(params) {
    const { 
      assignmentID, 
      actionID, 
      eTag,
      calculations,
      content, 
      pageInstructions 
    } = params;

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['assignmentID', 'actionID''calculations']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate calculations object structure
    if (!calculations || typeof calculations !== 'object' || Array.isArray(calculations)) {
      return {
        error: 'Invalid calculations parameter. Must be an object containing fields and/or whens arrays.'
      };
    }

    // Validate that calculations contains at least fields or whens
    if (!calculations.fields && !calculations.whens) {
      return {
        error: 'Invalid calculations parameter. Must contain at least one of "fields" or "whens" arrays.'
      };
    }

    // Validate fields array if present
    if (calculations.fields !== undefined) {
      if (!Array.isArray(calculations.fields) || calculations.fields.length === 0) {
        return {
          error: 'Invalid calculations.fields parameter. Must be a non-empty array of field objects.'
        };
      }

      for (let i = 0; i < calculations.fields.length; i++) {
        const field = calculations.fields[i];
        if (!field || typeof field !== 'object' || Array.isArray(field)) {
          return {
            error: `Invalid field object at index ${i}. Each field must be an object with name and context properties.`
          };
        }
        if (!field.name || typeof field.name !== 'string' || field.name.trim() === '') {
          return {
            error: `Invalid field name at index ${i}. Field name must be a non-empty string.`
          };
        }
        if (!field.context || typeof field.context !== 'string' || field.context.trim() === '') {
          return {
            error: `Invalid field context at index ${i}. Field context must be a non-empty string.`
          };
        }
      }
    }

    // Validate whens array if present
    if (calculations.whens !== undefined) {
      if (!Array.isArray(calculations.whens) || calculations.whens.length === 0) {
        return {
          error: 'Invalid calculations.whens parameter. Must be a non-empty array of when objects.'
        };
      }

      for (let i = 0; i < calculations.whens.length; i++) {
        const when = calculations.whens[i];
        if (!when || typeof when !== 'object' || Array.isArray(when)) {
          return {
            error: `Invalid when object at index ${i}. Each when must be an object with name and context properties.`
          };
        }
        if (!when.name || typeof when.name !== 'string' || when.name.trim() === '') {
          return {
            error: `Invalid when name at index ${i}. When name must be a non-empty string.`
          };
        }
        if (!when.context || typeof when.context !== 'string' || when.context.trim() === '') {
          return {
            error: `Invalid when context at index ${i}. When context must be a non-empty string.`
          };
        }
      }
    }

    // Validate eTag parameter
    if (!eTag || typeof eTag !== 'string' || eTag.trim() === '') {
      return {
        error: 'Invalid finalETag.trim() parameter. Must be a non-empty string obtained from a previous assignment action request.'
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

    // Execute the API call with error handling
    // Auto-fetch eTag if not provided
    let finalETag = eTag;
    let autoFetchedETag = false;
    
    if (!finalETag) {
      try {
        console.log(`Auto-fetching latest eTag for assignment field recalculation on ${assignmentID}...`);
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


    // Prepare request options(
      `Recalculating fields and whens for assignment action ${actionID} on assignment ${assignmentID}`,
      async () => await this.pegaClient.recalculateAssignmentFields(
        assignmentID.trim(), 
        actionID.trim(), 
        eTag.trim(),
        calculations,
        {
          content,
          pageInstructions
        }
      ),
      {
        formatSuccessResponse: (data, eTag) => this.formatSuccessResponse(assignmentID, actionID, data, eTag, {
          calculations,
          content,
          pageInstructions
        }),
        formatErrorResponse: (error) => this.formatErrorResponse(assignmentID, actionID, error, {
          eTag,
          calculations,
          content,
          pageInstructions
        })
      }
    );
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(assignmentID, actionID, data, eTag, options) {
    const { calculations, content, pageInstructions } = options;
    
    let response = `## Assignment Field Recalculation Results: ${actionID}\n\n`;
    response += `**Assignment ID**: ${assignmentID}\n`;
    response += `**Action ID**: ${actionID}\n`;
    response += `**eTag Used**: ${eTag}\n\n`;
    
    // Display calculation request summary
    response += '### Calculation Request Summary\n';
    if (calculations.fields && calculations.fields.length > 0) {
      response += `- **Fields to Recalculate**: ${calculations.fields.length}\n`;
      response += `- **Field Names**: ${calculations.fields.map(f => f.name).join(', ')}\n`;
    }
    if (calculations.whens && calculations.whens.length > 0) {
      response += `- **When Conditions to Evaluate**: ${calculations.whens.length}\n`;
      response += `- **When Names**: ${calculations.whens.map(w => w.name).join(', ')}\n`;
    }
    if (content && Object.keys(content).length > 0) {
      response += `- **Content Properties Merged**: ${Object.keys(content).length}\n`;
    }
    if (pageInstructions && pageInstructions.length > 0) {
      response += `- **Page Instructions Applied**: ${pageInstructions.length}\n`;
    }

    if (data.data) {
      // Display case information if available  
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += '\n### Associated Case Information\n';
        response += `- **Case ID**: ${caseInfo.ID || caseInfo.businessID || 'N/A'}\n`;
        response += `- **Case Type**: ${caseInfo.caseTypeName || caseInfo.caseTypeID || 'N/A'}\n`;
        response += `- **Case Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stageLabel || caseInfo.stageID || 'N/A'}\n`;
        response += `- **Owner**: ${caseInfo.owner || caseInfo.createdBy || 'N/A'}\n`;

        // Display assignment context within case
        if (caseInfo.assignments && caseInfo.assignments.length > 0) {
          response += '\n### Current Assignments\n';
          caseInfo.assignments.forEach((assignment, index) => {
            response += `${index + 1}. **${assignment.name || assignment.ID}**\n`;
            response += `   - Assignment ID: ${assignment.ID}\n`;
            response += `   - Process: ${assignment.processName || assignment.processID || 'N/A'}\n`;
            response += `   - Assigned To: ${assignment.assigneeInfo?.name || assignment.assigneeInfo?.ID || 'N/A'}\n`;
            
            // Show actions for this assignment
            if (assignment.actions && assignment.actions.length > 0) {
              response += `   - Available Actions: ${assignment.actions.map(action => action.name || action.ID).join(', ')}\n`;
            }
          });
        }

        // Display updated case content after recalculation
        if (caseInfo.content && Object.keys(caseInfo.content).length > 0) {
          response += '\n### Updated Case Content\n';
          for (const [key, value] of Object.entries(caseInfo.content)) {
            if (key !== 'classID' && key !== 'summary_of_associated_lists__') {
              response += `- **${key}**: ${value}\n`;
            }
          }
        }
      }

      // Display field calculation results
      if (data.data.calculationResults) {
        response += '\n### Field Calculation Results\n';
        const calcResults = data.data.calculationResults;
        
        if (calcResults.fields && calcResults.fields.length > 0) {
          response += '**Calculated Fields:**\n';
          calcResults.fields.forEach((field, index) => {
            response += `${index + 1}. **${field.name}** (${field.context})\n`;
            response += `   - Previous Value: ${field.oldValue !== undefined ? field.oldValue : 'N/A'}\n`;
            response += `   - Calculated Value: ${field.newValue !== undefined ? field.newValue : 'N/A'}\n`;
            response += `   - Calculation Status: ${field.status || 'Success'}\n`;
            if (field.formula) {
              response += `   - Formula Used: ${field.formula}\n`;
            }
            if (field.error) {
              response += `   - Error: ${field.error}\n`;
            }
          });
        }

        if (calcResults.whens && calcResults.whens.length > 0) {
          response += '\n**When Condition Results:**\n';
          calcResults.whens.forEach((when, index) => {
            response += `${index + 1}. **${when.name}** (${when.context})\n`;
            response += `   - Previous Result: ${when.oldResult !== undefined ? when.oldResult : 'N/A'}\n`;
            response += `   - Current Result: ${when.newResult !== undefined ? when.newResult : 'N/A'}\n`;
            response += `   - Evaluation Status: ${when.status || 'Success'}\n`;
            if (when.condition) {
              response += `   - Condition: ${when.condition}\n`;
            }
            if (when.error) {
              response += `   - Error: ${when.error}\n`;
            }
          });
        }

        // Display summary statistics
        if (calcResults.summary) {
          response += '\n**Calculation Summary:**\n';
          response += `- **Total Fields Processed**: ${calcResults.summary.totalFields || 0}\n`;
          response += `- **Fields Successfully Calculated**: ${calcResults.summary.successfulFields || 0}\n`;
          response += `- **Field Calculation Errors**: ${calcResults.summary.fieldErrors || 0}\n`;
          response += `- **Total Whens Processed**: ${calcResults.summary.totalWhens || 0}\n`;
          response += `- **Whens Successfully Evaluated**: ${calcResults.summary.successfulWhens || 0}\n`;
          response += `- **When Evaluation Errors**: ${calcResults.summary.whenErrors || 0}\n`;
        }
      }

      // Display content merge results
      if (content && Object.keys(content).length > 0) {
        response += '\n### Content Merge Results\n';
        response += '- **User Content Applied**: Values merged into case before calculations\n';
        response += '- **Calculation Context**: User values available for field and when calculations\n';
        response += '- **Field Visibility**: Only visible fields in assignment action view used in calculations\n';
      }

      // Display page instruction results
      if (pageInstructions && pageInstructions.length > 0) {
        response += '\n### Page Instruction Results\n';
        response += `- **Instructions Processed**: ${pageInstructions.length}\n`;
        response += '- **Page Operations**: Embedded pages, page lists, and page groups updated before calculations\n';
        response += '- **Calculation Impact**: Updated page data available for field and when calculations\n';
      }
    }

    // Display UI resources information
    if (data.uiResources) {
      response += '\n### UI Resources Updated\n';
      response += '- **Form Metadata**: UI resources refreshed with recalculated field values and states\n';
      
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
        
        // Display calculated field states
        if (data.uiResources.resources.calculatedFields) {
          const calcFieldCount = Object.keys(data.uiResources.resources.calculatedFields).length;
          response += `- **Calculated Fields**: ${calcFieldCount}\n`;
        }
      }

      // Display field state changes from calculations
      if (data.uiResources.fieldStates) {
        response += '\n**Field State Changes from Calculations:**\n';
        const states = data.uiResources.fieldStates;
        if (states.valuesChanged && states.valuesChanged.length > 0) {
          response += `- **Values Changed**: ${states.valuesChanged.join(', ')}\n`;
        }
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

      // Display when condition UI impacts
      if (data.uiResources.whenResults) {
        response += '\n**When Condition UI Impacts:**\n';
        const whenResults = data.uiResources.whenResults;
        if (whenResults.fieldsAffected && whenResults.fieldsAffected.length > 0) {
          response += `- **Fields Affected by When Conditions**: ${whenResults.fieldsAffected.join(', ')}\n`;
        }
        if (whenResults.sectionsAffected && whenResults.sectionsAffected.length > 0) {
          response += `- **Sections Affected by When Conditions**: ${whenResults.sectionsAffected.join(', ')}\n`;
        }
      }
    }

    // Display execution sequence information
    response += '\n### Execution Sequence Completed\n';
    response += '1. ✅ Assignment and action validated\n';
    response += '2. ✅ finalETag.trim() verified for optimistic locking\n';
    response += '3. ✅ Case opened from database\n';
    
    if (content && Object.keys(content).length > 0) {
      response += '4. ✅ User content merged into case\n';
    }
    
    if (pageInstructions && pageInstructions.length > 0) {
      response += '5. ✅ Page instructions applied\n';
    }
    
    if (calculations.fields && calculations.fields.length > 0) {
      response += `6. ✅ Field calculations executed: ${calculations.fields.length} fields\n`;
    }
    
    if (calculations.whens && calculations.whens.length > 0) {
      response += `7. ✅ When conditions evaluated: ${calculations.whens.length} conditions\n`;
    }
    
    response += '8. ✅ UI field states updated\n';
    response += '9. ✅ Form metadata refreshed\n';

    // Display calculation limitations acknowledgment
    response += '\n### Calculation Limitations Acknowledged\n';
    response += '- **Field Scope**: Only fields present in the assignment action view can be calculated\n';
    response += '- **Context Requirements**: Field and when contexts must be valid for the current assignment\n';
    response += '- **Data Availability**: Calculations use current case data plus any merged content\n';
    response += '- **UI Updates**: Only visible and accessible fields will reflect calculation results in the UI\n';
    response += '- **Error Handling**: Individual field or when calculation errors do not stop other calculations\n';

    // Display new eTag if available for future operations
    if (data.eTag) {
      response += '\n### Operation Support\n';
      response += `- **New eTag Captured**: ${data.eTag}\n`;
      response += '- **Ready for Next Action**: Use new finalETag.trim() for subsequent assignment operations\n';
    }

    response += '\n---\n';
    response += `*Recalculation completed at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(assignmentID, actionID, error, options) {
    const { eTag, calculations, content, pageInstructions } = options;
    
    let response = `## Error recalculating assignment fields: ${actionID}\n\n`;
    
    response += `**Assignment ID**: ${assignmentID}\n`;
    response += `**Action ID**: ${actionID}\n`;
    response += `**eTag Used**: ${eTag}\n`;
    response += `**Error Type**: ${error.type}\n`;
    response += `**Message**: ${error.message}\n`;
    
    if (error.details) {
      response += `**Details**: ${error.details}\n`;
    }
    
    if (error.status) {
      response += `**HTTP Status**: ${error.status} ${error.statusText}\n`;
    }

    // Display calculation context for error diagnosis
    if (calculations) {
      response += '\n### Calculation Context\n';
      if (calculations.fields && calculations.fields.length > 0) {
        response += `- **Fields Requested**: ${calculations.fields.map(f => f.name).join(', ')}\n`;
      }
      if (calculations.whens && calculations.whens.length > 0) {
        response += `- **Whens Requested**: ${calculations.whens.map(w => w.name).join(', ')}\n`;
      }
    }

    // Add specific guidance based on error type
    switch (error.type) {
      case 'NOT_FOUND':
        response += '\n**Suggestion**: Verify both the assignment ID and action ID are correct. The assignment might not exist, might have been completed, or the specific action might not be available for this assignment. Also verify that the specified fields and when conditions exist and are accessible within the assignment action context.\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to recalculate fields for this assignment action. The assignment might be restricted to specific users or roles, or the fields/whens requested might not be accessible to your user context.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: Check the assignment ID format, action ID, and calculations structure. Assignment IDs should follow the pattern: ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW. Verify that:\n';
        response += '- The calculations object contains valid fields and/or whens arrays\n';
        response += '- Each field and when object has required name and context properties\n';
        response += '- Field and when names correspond to actual properties and rules in the system\n';
        response += '- Context values are valid for the assignment action scope\n';
        break;
      case 'VALIDATION_FAIL':
        response += '\n**Suggestion**: The calculation request failed validation. This could be due to:\n';
        response += '- Invalid field names or contexts in the calculations array\n';
        response += '- Field or when references that don\'t exist in the assignment action view\n';
        response += '- Content values that fail validation rules before calculations\n';
        response += '- Page instruction operations that fail before calculations can proceed\n';
        response += 'Review the field and when rule definitions and ensure they are properly configured for calculation.\n';
        break;
      case 'LOCKED':
        response += '\n**Suggestion**: This assignment is currently locked by another user. Wait for the lock to be released or contact the user who has the lock. With pessimistic locking, only one user can access the assignment at a time.\n';
        break;
      case 'CONFLICT':
        response += '\n**Suggestion**: The assignment state has changed since your last request (eTag mismatch). This could be due to:\n';
        response += '- Another user performing actions on the same assignment\n';
        response += '- Assignment state changes during calculation processing\n';
        response += '- Concurrent field updates from other operations\n';
        response += 'Retrieve the latest assignment action details to get the current eTag value before attempting recalculation.\n';
        break;
      case 'PRECONDITION_FAILED':
        response += '\n**Suggestion**: The eTag value provided does not match the current assignment state. Retrieve the latest assignment action details to get the current eTag value before attempting the recalculation operation.\n';
        break;
      case 'UNPROCESSABLE_ENTITY':
        response += '\n**Suggestion**: The calculation request could not be processed due to:\n';
        response += '- Field calculation errors (invalid formulas, missing dependencies)\n';
        response += '- When condition evaluation errors (invalid expressions, missing references)\n';
        response += '- Data type mismatches in calculation contexts\n';
        response += '- Circular dependencies between calculated fields\n';
        response += 'Review the calculation logic and ensure all dependencies are available and valid.\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Suggestion**: The Pega Infinity server encountered an internal error during calculation processing. This could be due to:\n';
        response += '- Field calculation rule execution failures\n';
        response += '- When condition rule evaluation errors\n';
        response += '- Data Transform or Activity execution issues during calculations\n';
        response += '- System resource limitations during complex calculations\n';
        response += 'Check the field and when rule configurations and try again. Contact support if the issue persists.\n';
        break;
      case 'FAILED_DEPENDENCY':
        response += '\n**Suggestion**: A required dependency failed during calculation processing. This could be due to:\n';
        response += '- Missing field calculation rules or when condition rules\n';
        response += '- Dependent properties or data sources being unavailable\n';
        response += '- Required activities or data transforms failing during calculation\n';
        response += '- External system dependencies being unavailable for calculations\n';
        response += 'Verify all calculation dependencies and configuration settings are correct.\n';
        break;
    }

    // Add calculation-specific context for errors
    if (error.type === 'VALIDATION_FAIL' || error.type === 'BAD_REQUEST' || error.type === 'UNPROCESSABLE_ENTITY') {
      response += '\n### Calculation Context for Errors\n';
      response += '- Only fields and whens accessible in the assignment action view can be calculated\n';
      response += '- Field and when names must correspond to actual property and rule definitions\n';
      response += '- Context values must be valid page references for the current assignment scope\n';
      response += '- Calculated fields may have dependencies on other fields that must be available\n';
      response += '- When conditions may reference properties that must exist in the calculation context\n';
      response += '- Complex calculations may require specific system configurations or external dependencies\n';
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
