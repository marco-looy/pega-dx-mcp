import { PegaAPIClient } from '../../api/pega-client.js';

export class PerformBulkActionTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
  }

  /**
   * Get tool definition for MCP protocol
   * IMPORTANT: This definition captures ALL details provided by the user about bulk case actions
   */
  static getDefinition() {
    return {
      name: 'perform_bulk_action',
      description: 'Perform case action on multiple cases simultaneously (bulk operation). Executes the specified action on all cases provided in the request. In Infinity, actions are performed synchronously. In Launchpad, actions are performed asynchronously in the background. NOTE: Only supports case-wide actions that update cases directly - assignment-level actions like Transfer and Adjust Assignment SLA are not supported.',
      inputSchema: {
        type: 'object',
        properties: {
          actionID: {
            type: 'string',
            description: 'ID of the case action to be performed on all specified cases (e.g., "pyUpdateCaseDetails"). This action must be a case-wide action that updates cases directly.'
          },
          cases: {
            type: 'array',
            description: 'Array of case objects to perform the action on. Each case object must contain an ID property with the full case handle.',
            items: {
              type: 'object',
              properties: {
                ID: {
                  type: 'string',
                  description: 'Full case handle (e.g., "ON6E5R-DIYRECIPE-WORK-RECIPECOLLECTION R-1008")'
                }
              },
              required: ['ID']
            },
            minItems: 1
          },
          runningMode: {
            type: 'string',
            enum: ['async'],
            description: 'Execution mode for Launchpad only. "async" schedules the action to be performed in the background rather than immediately. Not applicable for Infinity which always executes synchronously. Note: As of Launchpad 4.3, there is no way to check the status of asynchronous bulk action processing.'
          },
          content: {
            type: 'object',
            description: 'A map of scalar properties and embedded page properties to be set during action execution. Same format as single case action content.'
          },
          pageInstructions: {
            type: 'array',
            description: 'A list of page-related operations to be performed on embedded pages, page lists, or page group properties during action execution.',
            items: {
              type: 'object'
            }
          },
          attachments: {
            type: 'array',
            description: 'A list of attachments to be added to specific attachment fields during action execution.',
            items: {
              type: 'object'
            }
          }
        },
        required: ['actionID', 'cases']
      }
    };
  }

  /**
   * Execute the bulk action operation
   * IMPORTANT: Implement ALL validation rules and error scenarios for bulk operations
   */
  async execute(params) {
    const { actionID, cases, runningMode, content, pageInstructions, attachments } = params;

    // 1. COMPREHENSIVE Parameter validation - implement ALL rules
    
    // Validate actionID
    if (!actionID || typeof actionID !== 'string' || actionID.trim() === '') {
      return {
        error: 'Invalid actionID parameter. Action ID is required and must be a non-empty string (e.g., "pyUpdateCaseDetails").'
      };
    }

    // Validate cases array
    if (!cases || !Array.isArray(cases) || cases.length === 0) {
      return {
        error: 'Invalid cases parameter. Cases must be a non-empty array of case objects.'
      };
    }

    // Validate each case object
    for (let i = 0; i < cases.length; i++) {
      const caseObj = cases[i];
      if (!caseObj || typeof caseObj !== 'object') {
        return {
          error: `Invalid case object at index ${i}. Each case must be an object with an ID property.`
        };
      }
      if (!caseObj.ID || typeof caseObj.ID !== 'string' || caseObj.ID.trim() === '') {
        return {
          error: `Invalid case ID at index ${i}. Each case must have a non-empty ID property with the full case handle.`
        };
      }
    }

    // Validate runningMode if provided
    if (runningMode && runningMode !== 'async') {
      return {
        error: 'Invalid runningMode parameter. Must be "async" for Launchpad asynchronous execution, or omit for default behavior.'
      };
    }

    // Validate content if provided
    if (content !== undefined && (typeof content !== 'object' || Array.isArray(content))) {
      return {
        error: 'Invalid content parameter. Must be an object containing scalar properties and embedded page properties.'
      };
    }

    // Validate pageInstructions if provided
    if (pageInstructions !== undefined && !Array.isArray(pageInstructions)) {
      return {
        error: 'Invalid pageInstructions parameter. Must be an array of page-related operations.'
      };
    }

    // Validate attachments if provided
    if (attachments !== undefined && !Array.isArray(attachments)) {
      return {
        error: 'Invalid attachments parameter. Must be an array of attachment objects.'
      };
    }

    try {
      // 2. API call via pegaClient with ALL user-specified options
      const result = await this.pegaClient.performBulkAction(actionID.trim(), {
        cases,
        runningMode,
        content,
        pageInstructions,
        attachments
      });

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(actionID, cases, result.data, { runningMode, content, pageInstructions, attachments })
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(actionID, cases, result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while performing bulk action ${actionID} on ${cases.length} cases: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   * IMPORTANT: Include ALL data fields and formatting specified by user
   */
  formatSuccessResponse(actionID, cases, data, options) {
    const { runningMode, content, pageInstructions, attachments } = options;
    
    let response = `## Bulk Action Executed: ${actionID}\n`;
    response += `**Cases Processed**: ${cases.length}\n`;
    response += `**Execution Mode**: ${runningMode === 'async' ? 'Asynchronous (Launchpad)' : 'Synchronous (Infinity)'}\n\n`;
    
    // Display execution summary
    response += '### Execution Summary\n';
    if (runningMode === 'async') {
      response += '- **Status**: Action has been scheduled for background execution\n';
      response += '- **Note**: In Launchpad, bulk actions run asynchronously. As of Launchpad 4.3, there is no way to check the processing status\n';
      response += '- **Timeline**: The action will be performed on all cases in the background\n';
    } else {
      response += '- **Status**: Action has been executed synchronously on all cases\n';
      response += '- **Timeline**: All cases have been processed immediately\n';
    }

    // Display processed cases
    response += '\n### Processed Cases\n';
    cases.forEach((caseObj, index) => {
      response += `${index + 1}. **${caseObj.ID}**\n`;
    });

    // Display action parameters if provided
    if (content && Object.keys(content).length > 0) {
      response += '\n### Content Applied\n';
      Object.entries(content).forEach(([key, value]) => {
        response += `- **${key}**: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
      });
    }

    if (pageInstructions && pageInstructions.length > 0) {
      response += '\n### Page Instructions Applied\n';
      response += `- **Count**: ${pageInstructions.length} page operation(s)\n`;
      response += '- Page-related operations have been processed for embedded pages, page lists, or page groups\n';
    }

    if (attachments && attachments.length > 0) {
      response += '\n### Attachments Applied\n';
      response += `- **Count**: ${attachments.length} attachment(s)\n`;
      response += '- Attachments have been added to specific attachment fields\n';
    }

    // Display business logic information
    response += '\n### Important Notes\n';
    response += '- This bulk action only supports case-wide actions that update cases directly\n';
    response += '- Assignment-level actions (Transfer, Adjust Assignment SLA) are not supported via bulk operations\n';
    response += '- Each case was retrieved from storage and the action was executed on them individually\n';
    
    if (runningMode === 'async') {
      response += '- For asynchronous execution, there is currently no status checking mechanism available\n';
      response += '- Monitor individual cases using get_case tool to verify action completion\n';
    }

    // Display response data if available
    if (data && typeof data === 'object') {
      if (data.results && Array.isArray(data.results)) {
        response += '\n### Processing Results\n';
        data.results.forEach((result, index) => {
          response += `- **Case ${index + 1}**: ${result.status || 'Processed'}\n`;
          if (result.message) {
            response += `  - ${result.message}\n`;
          }
        });
      }
      
      if (data.summary) {
        response += '\n### Summary Statistics\n';
        response += `- **Total Cases**: ${data.summary.total || cases.length}\n`;
        response += `- **Successful**: ${data.summary.successful || 'N/A'}\n`;
        response += `- **Failed**: ${data.summary.failed || 'N/A'}\n`;
      }
    }

    response += '\n---\n';
    response += `*Bulk action executed at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display  
   * IMPORTANT: Include ALL error scenarios and guidance provided by user
   */
  formatErrorResponse(actionID, cases, error) {
    let response = `## Error performing bulk action: ${actionID}\n`;
    response += `**Target Cases**: ${cases.length} cases\n\n`;
    
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
        response += '\n**Suggestion**: Verify the action ID and case IDs are correct. One or more cases or the action may not exist, or you may not have access.\n';
        response += '- Check if all cases exist using the get_case tool\n';
        response += '- Verify the action name is spelled correctly\n';
        response += '- Ensure the action is available for bulk execution\n';
        response += '- Confirm the action is case-wide (not assignment-level)\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions for bulk action execution.\n';
        response += '- Verify you have access to all specified cases\n';
        response += '- Check if the bulk action is allowed for your user role\n';
        response += '- Ensure all cases are in the correct stage for this action\n';
        response += '- Confirm bulk operations are enabled in your Pega instance\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        response += '- Token refresh will be attempted automatically\n';
        response += '- If the issue persists, verify OAuth2 configuration\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: Check the action ID, case IDs, and request parameters.\n';
        response += '- Ensure actionID is a valid case action name\n';
        response += '- Verify all case IDs are full case handles (e.g., "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008")\n';
        response += '- Check that content, pageInstructions, and attachments are properly formatted\n';
        response += '- Ensure runningMode is "async" if specified (Launchpad only)\n';
        break;
      case 'UNPROCESSABLE_ENTITY':
        response += '\n**Suggestion**: The bulk action request contains invalid values or violates business rules.\n';
        response += '- Verify all cases are in the correct state for this action\n';
        response += '- Check if required fields are missing or contain invalid values\n';
        response += '- Ensure the action supports bulk execution mode\n';
        response += '- Confirm the action is case-wide (not assignment-level)\n';
        break;
      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Suggestion**: A server error occurred during bulk processing.\n';
        response += '- Try executing the action individually on each case\n';
        response += '- Reduce the number of cases in the bulk operation\n';
        response += '- Check with your Pega administrator for server-side issues\n';
        response += '- Consider using smaller batch sizes for large bulk operations\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        response += '- Check network connection to Pega instance\n';
        response += '- Verify the API base URL is correct\n';
        response += '- Ensure Pega instance is accessible and running\n';
        break;
    }

    // Display case information for debugging
    response += '\n### Case Information\n';
    cases.forEach((caseObj, index) => {
      response += `${index + 1}. **${caseObj.ID}**\n`;
    });

    if (error.errorDetails && error.errorDetails.length > 0) {
      response += '\n### Additional Error Details\n';
      error.errorDetails.forEach((detail, index) => {
        response += `${index + 1}. ${detail.localizedValue || detail.message}\n`;
      });
    }

    response += '\n### Bulk Action Limitations\n';
    response += '- Only case-wide actions that update cases directly are supported\n';
    response += '- Assignment-level actions (Transfer, Adjust Assignment SLA) require individual case processing\n';
    response += '- Some actions may not be available for bulk execution due to business logic constraints\n';

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
