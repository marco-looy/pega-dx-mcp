import { BaseTool } from '../../registry/base-tool.js';

export class BulkCasesPatchTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'cases';
  }

  /**
   * Get tool definition for MCP protocol
   * Implementation based on PATCH /api/application/v2/cases endpoint specification
   */
  static getDefinition() {
    return {
      name: 'bulk_cases_patch',
      description: 'Perform case action on multiple cases simultaneously using PATCH /api/application/v2/cases endpoint. In Infinity, actions are performed synchronously. In Launchpad, actions are performed asynchronously in the background. Only supports case-wide actions that update cases directly - assignment-level actions like Transfer and Adjust Assignment SLA are not supported.',
      inputSchema: {
        type: 'object',
        properties: {
          actionID: {
            type: 'string',
            description: 'ID of the case action to be performed on all specified cases (e.g., "pyUpdateCaseDetails"). This action must be a case-wide action that updates cases directly.'
          },
          cases: {
            type: 'array',
            description: 'Array of case objects to perform the action on. Each case object must contain an ID property with the full case handle. Cannot be empty.',
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
            description: 'Execution mode for Launchpad only. "async" schedules the action to be performed in the background rather than immediately. Not applicable for Infinity which always executes synchronously. Currently, only async runningMode is implemented in Launchpad.'
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
   * Execute the bulk cases patch operation
   * Implements exact validation and error scenarios from PATCH /api/application/v2/cases API specification
   */
  async execute(params) {
    const { actionID, cases, runningMode, content, pageInstructions, attachments } = params;

    // 1. Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['actionID', 'cases']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // 2. Validate actionID is not empty
    if (!actionID || typeof actionID !== 'string' || actionID.trim() === '') {
      return {
        error: 'Invalid actionID parameter. ActionID must be a non-empty string containing the case action ID.'
      };
    }

    // 3. Validate cases array (exact specification from WIP.md)
    if (!Array.isArray(cases)) {
      return {
        error: 'Cases missing from the request body or empty. Cases must be provided as a non-empty array.'
      };
    }

    if (cases.length === 0) {
      return {
        error: 'Cases missing from the request body or empty. At least one case must be provided for bulk processing.'
      };
    }

    // Validate each case object has required ID property
    for (let i = 0; i < cases.length; i++) {
      const caseObj = cases[i];
      if (!caseObj || typeof caseObj !== 'object') {
        return {
          error: `Invalid case object at index ${i}. Each case must be an object with an ID property containing the full case handle.`
        };
      }
      if (!caseObj.ID || typeof caseObj.ID !== 'string' || caseObj.ID.trim() === '') {
        return {
          error: `Cases missing from the request body or empty. Case at index ${i} does not contain the required ID property.`
        };
      }
    }

    // 4. Validate enum parameters - runningMode if provided
    if (runningMode !== undefined) {
      const enumValidation = this.validateEnumParams(params, {
        runningMode: ['async']
      });
      if (enumValidation) {
        return enumValidation;
      }
    }

    // 5. Validate optional complex parameters
    if (content !== undefined && (typeof content !== 'object' || Array.isArray(content))) {
      return {
        error: 'Invalid content parameter. Must be an object containing scalar properties and embedded page properties.'
      };
    }

    if (pageInstructions !== undefined && !Array.isArray(pageInstructions)) {
      return {
        error: 'Invalid pageInstructions parameter. Must be an array of page-related operations.'
      };
    }

    if (attachments !== undefined && !Array.isArray(attachments)) {
      return {
        error: 'Invalid attachments parameter. Must be an array of attachment objects.'
      };
    }

    // 6. Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Bulk Cases PATCH: ${actionID} on ${cases.length} cases`,
      async () => await this.pegaClient.patchCasesBulk(actionID.trim(), {
        cases,
        runningMode,
        content,
        pageInstructions,
        attachments
      }),
      { actionID, cases, runningMode, content, pageInstructions, attachments }
    );
  }

  /**
   * Override formatSuccessResponse to handle platform-specific responses (Infinity vs Launchpad)
   * Implements exact response formatting from PATCH /api/application/v2/cases specification
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { actionID, cases, runningMode, content, pageInstructions, attachments } = options;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    // Determine platform based on response structure and running mode
    const isLaunchpadAsync = runningMode === 'async' || (data && data.jobID);
    const isInfinitySync = data && (data.results || data.successCount !== undefined);
    
    if (isLaunchpadAsync) {
      response += '**Platform**: Pega Launchpad (Asynchronous Execution)\n\n';
      
      // Handle Launchpad 202 Accepted response
      if (data.jobID) {
        response += '### Execution Status\n';
        response += '- **Status**: 202 Accepted - Action has been scheduled for background execution\n';
        response += `- **Job ID**: ${data.jobID}\n`;
        response += '- **Execution Mode**: Asynchronous (background processing)\n';
        response += '- **Note**: As of Launchpad 4.3, there is no way to check the status of asynchronous bulk action processing\n\n';
      } else {
        response += '### Execution Status\n';
        response += '- **Status**: Action has been scheduled for asynchronous execution\n';
        response += '- **Execution Mode**: Background processing in Launchpad\n';
        response += '- **Note**: Processing will occur asynchronously - monitor individual cases for completion\n\n';
      }
      
    } else if (isInfinitySync) {
      response += '**Platform**: Pega Infinity (Synchronous Execution)\n\n';
      
      // Handle Infinity 207 Multistatus response
      response += '### Execution Results\n';
      if (data.successCount !== undefined) {
        response += `- **Successful**: ${data.successCount} cases\n`;
      }
      if (data.failureCount !== undefined) {
        response += `- **Failed**: ${data.failureCount} cases\n`;
      }
      response += `- **Total Processed**: ${cases.length} cases\n`;
      response += '- **Execution Mode**: Synchronous (immediate processing)\n\n';
      
      // Display individual case results if available
      if (data.results && Array.isArray(data.results)) {
        response += '### Individual Case Results\n';
        data.results.forEach((result, index) => {
          response += `${index + 1}. **${result.ID || result.BusinessID || 'Unknown'}**\n`;
          if (result.Name) {
            response += `   - Name: ${result.Name}\n`;
          }
          if (result.status) {
            response += `   - Status: HTTP ${result.status}\n`;
          }
          if (result.BusinessID && result.BusinessID !== result.ID) {
            response += `   - Business ID: ${result.BusinessID}\n`;
          }
        });
        response += '\n';
      }
      
    } else {
      response += '**Platform**: Pega Platform (Execution Mode Determined)\n\n';
      response += '### Execution Status\n';
      response += '- **Status**: Bulk action execution completed\n';
      response += `- **Cases Processed**: ${cases.length}\n`;
      response += '- **Execution Mode**: Platform-determined (sync/async based on configuration)\n\n';
    }

    // Display processed cases summary
    response += '### Cases Submitted for Processing\n';
    cases.forEach((caseObj, index) => {
      response += `${index + 1}. **${caseObj.ID}**\n`;
    });
    response += '\n';

    // Display action parameters if provided
    if (content && Object.keys(content).length > 0) {
      response += '### Content Applied\n';
      Object.entries(content).forEach(([key, value]) => {
        response += `- **${key}**: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
      });
      response += '\n';
    }

    if (pageInstructions && pageInstructions.length > 0) {
      response += '### Page Instructions Applied\n';
      response += `- **Count**: ${pageInstructions.length} page operation(s)\n`;
      response += '- Page-related operations processed for embedded pages, page lists, or page groups\n\n';
    }

    if (attachments && attachments.length > 0) {
      response += '### Attachments Applied\n';
      response += `- **Count**: ${attachments.length} attachment(s)\n`;
      response += '- Attachments added to specific attachment fields during action execution\n\n';
    }

    // Display important notes and limitations
    response += '### Important Implementation Notes\n';
    response += '- **API Endpoint**: `PATCH /api/application/v2/cases`\n';
    response += '- **Supported Actions**: Only case-wide actions that update cases directly\n';
    response += '- **Unsupported Actions**: Assignment-level actions (Transfer, Adjust Assignment SLA)\n';
    response += '- **Platform Behavior**:\n';
    response += '  - **Infinity**: Synchronous execution with immediate results\n';
    response += '  - **Launchpad**: Asynchronous execution with job scheduling\n';
    
    if (isLaunchpadAsync) {
      response += '- **Status Checking**: No mechanism available to check async processing status in Launchpad 4.3\n';
      response += '- **Monitoring**: Use individual case tools to verify action completion\n';
    }

    return response;
  }

  /**
   * Override formatErrorResponse to handle specific error codes from PATCH /api/application/v2/cases
   * Implements exact error handling from API specification
   */
  formatErrorResponse(operation, error, options = {}) {
    const { actionID, cases } = options;
    
    let response = `## Error: ${operation}\n\n`;
    
    response += `*Error occurred at: ${new Date().toISOString()}*\n\n`;
    
    // Handle specific error types from WIP.md specification
    switch (error.type) {
      case 'BAD_REQUEST':
        response += '### 400 Bad Request\n';
        if (error.details && error.details.includes('Cases missing')) {
          response += '**Issue**: Cases missing from the request body or empty\n';
          response += '**Cause**: The request body does not contain any cases to process, or the cases property is an empty list, or one or more elements of the cases list does not contain the ID property.\n\n';
          response += '**Resolution**:\n';
          response += '- Ensure the `cases` parameter is provided as a non-empty array\n';
          response += '- Verify each case object contains a valid `ID` property\n';
          response += '- Check that case IDs are full case handles (e.g., "ON6E5R-DIYRECIPE-WORK R-1008")\n';
        } else {
          response += '**Issue**: Invalid request parameters\n';
          response += `**Details**: ${error.details || 'One or more inputs are invalid'}\n\n`;
          response += '**Resolution**: Review the request parameters and ensure all required fields are properly formatted.\n';
        }
        break;
        
      case 'UNAUTHORIZED':
        response += '### 401 Unauthorized\n';
        response += '**Issue**: Authentication failed\n';
        response += '**Details**: Invalid token or expired\n\n';
        response += '**Resolution**:\n';
        response += '- Verify OAuth2 credentials are correctly configured\n';
        response += '- Check that the access token has not expired\n';
        response += '- Ensure the client has proper permissions for bulk case operations\n';
        break;
        
      case 'INTERNAL_SERVER_ERROR':
        response += '### 500 Internal Server Error\n';
        response += '**Issue**: Implementation resulted in an exception\n';
        response += `**Details**: ${error.details || 'An unhandled server exception occurred'}\n\n`;
        response += '**Resolution**:\n';
        response += '- Contact system administrator to review server logs\n';
        response += '- Verify Pega Platform configuration for bulk operations\n';
        response += '- Check if the specified action ID is valid and accessible\n';
        break;
        
      case 'NOT_IMPLEMENTED':
        response += '### 501 Not Implemented (Launchpad Only)\n';
        response += '**Issue**: No implementation for the sync runningMode currently present\n';
        response += '**Details**: The requestor did not specify the runningMode query parameter as async, or did not specify the runningMode parameter at all.\n\n';
        response += '**Resolution**:\n';
        response += '- For Pega Launchpad, include `runningMode: "async"` in the request\n';
        response += '- Currently, only asynchronous runningMode is implemented in Launchpad\n';
        response += '- Synchronous execution is only available in Pega Infinity\n';
        break;
        
      default:
        response += `### ${error.type || 'Unknown Error'}\n`;
        response += `**Issue**: ${error.message || 'An error occurred during bulk case processing'}\n`;
        response += `**Details**: ${error.details || 'No additional details available'}\n\n`;
        break;
    }

    // Add request context for debugging
    response += '### Request Context\n';
    response += `- **Action ID**: ${actionID || 'Not provided'}\n`;
    response += `- **Cases Count**: ${cases ? cases.length : 'Not provided'}\n`;
    
    if (cases && cases.length > 0) {
      response += '- **Case IDs**:\n';
      cases.slice(0, 5).forEach((caseObj, index) => {
        response += `  ${index + 1}. ${caseObj.ID || 'Invalid case object'}\n`;
      });
      if (cases.length > 5) {
        response += `  ... and ${cases.length - 5} more cases\n`;
      }
    }
    
    // Add troubleshooting guidance
    response += '\n### Troubleshooting Guide\n';
    response += '- **Verify Case IDs**: Ensure all case IDs are valid full case handles\n';
    response += '- **Check Action ID**: Confirm the action ID exists and is a case-wide action\n';
    response += '- **Platform Compatibility**: Verify the action is supported on your Pega platform version\n';
    response += '- **Permissions**: Ensure your user account has bulk operation permissions\n';
    response += '- **System Resources**: For large bulk operations, check system capacity\n';

    return response;
  }
}
