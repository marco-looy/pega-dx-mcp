import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class PerformBulkActionTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'cases';
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
          attachments: {
            type: 'array',
            description: 'A list of attachments to be added to specific attachment fields during action execution.',
            items: {
              type: 'object'
            }
          },
          sessionCredentials: getSessionCredentialsSchema()
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
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

    // 1. Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['actionID', 'cases']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // 2. Validate cases array (complex custom validation)
    if (!Array.isArray(cases) || cases.length === 0) {
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

    // 3. Validate enum parameters using base class
    const enumValidation = this.validateEnumParams(params, {
      runningMode: ['async']
    });
    if (enumValidation) {
      return enumValidation;
    }

    // 4. Validate optional complex parameters
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

      // 5. Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Bulk Action: ${actionID} on ${cases.length} cases`,
        async () => await this.pegaClient.performBulkAction(actionID.trim(), {
          cases,
          runningMode,
          content,
          pageInstructions,
          attachments
        }),
        { actionID, cases, runningMode, content, pageInstructions, attachments, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Perform Bulk Action\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Override formatSuccessResponse to add bulk action specific formatting
   * IMPORTANT: Include ALL data fields and formatting specified by user
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { actionID, cases, runningMode, content, pageInstructions, attachments, sessionInfo } = options;

    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }
    
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

    return response;
  }
}
