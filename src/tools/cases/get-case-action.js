import { PegaAPIClient } from '../../api/pega-client.js';

export class GetCaseActionTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_case_action',
      description: 'Get detailed information about a case action, including view metadata and available actions',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (e.g.,ON6E5R-DIYRECIPE-WORK-RECIPECOLLECTION R-1008)'
          },
          actionID: {
            type: 'string',
            description: 'Flow action name of a case/stage action that the client requests'
          },
          viewType: {
            type: 'string',
            enum: ['form', 'page'],
            description: 'Type of view data to return. "form" returns only form UI metadata, "page" returns full case page UI metadata',
            default: 'page'
          },
          excludeAdditionalActions: {
            type: 'boolean',
            description: 'When true, excludes information on all actions performable on the case. Set to true if action information was already retrieved in a previous call',
            default: false
          }
        },
        required: ['caseID', 'actionID']
      }
    };
  }

  /**
   * Execute the get case action operation
   */
  async execute(params) {
    const { caseID, actionID, viewType, excludeAdditionalActions } = params;

    // Validate required parameters
    if (!caseID || typeof caseID !== 'string' || caseID.trim() === '') {
      return {
        error: 'Invalid caseID parameter. Case ID is required and must be a non-empty string.'
      };
    }

    if (!actionID || typeof actionID !== 'string' || actionID.trim() === '') {
      return {
        error: 'Invalid actionID parameter. Action ID is required and must be a non-empty string.'
      };
    }

    // Validate viewType if provided
    if (viewType && !['form', 'page'].includes(viewType)) {
      return {
        error: 'Invalid viewType parameter. Must be either "form" or "page".'
      };
    }

    // Validate excludeAdditionalActions if provided
    if (excludeAdditionalActions !== undefined && typeof excludeAdditionalActions !== 'boolean') {
      return {
        error: 'Invalid excludeAdditionalActions parameter. Must be a boolean value.'
      };
    }

    try {
      // Call Pega API to get case action details
      const result = await this.pegaClient.getCaseAction(caseID.trim(), actionID.trim(), {
        viewType,
        excludeAdditionalActions
      });

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(caseID, actionID, result.data, result.eTag, { viewType, excludeAdditionalActions })
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(caseID, actionID, result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving case action ${actionID} for case ${caseID}: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(caseID, actionID, data, eTag, options) {
    const { viewType, excludeAdditionalActions } = options;
    
    let response = `## Case Action Details: ${actionID}\n`;
    response += `**Case**: ${caseID}\n\n`;
    
    if (data.data) {
      // Display case information
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += '### Case Information\n';
        response += `- **Case ID**: ${caseInfo.ID || caseID}\n`;
        response += `- **Case Type**: ${caseInfo.caseTypeName || 'N/A'}\n`;
        response += `- **Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stage || 'N/A'}\n`;
        response += `- **Step**: ${caseInfo.step || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Last Updated**: ${caseInfo.lastUpdateTime || 'N/A'}\n`;

        // Display available actions if not excluded
        if (!excludeAdditionalActions && caseInfo.availableActions && caseInfo.availableActions.length > 0) {
          response += '\n### Available Actions\n';
          caseInfo.availableActions.forEach((action, index) => {
            response += `${index + 1}. **${action.name}** - ${action.displayName || action.name}\n`;
            if (action.type) {
              response += `   - Type: ${action.type}\n`;
            }
          });
        }

        // Display assignment actions if not excluded
        if (!excludeAdditionalActions && caseInfo.assignments && caseInfo.assignments.length > 0) {
          response += '\n### Assignment Actions\n';
          caseInfo.assignments.forEach((assignment, index) => {
            response += `${index + 1}. **Assignment**: ${assignment.name || 'N/A'}\n`;
            if (assignment.actions && assignment.actions.length > 0) {
              assignment.actions.forEach((action, actionIndex) => {
                response += `   - ${actionIndex + 1}. ${action.name} (${action.displayName || action.name})\n`;
              });
            }
          });
        }
      }
    }

    // Display UI resources info based on viewType
    if (data.uiResources) {
      response += '\n### UI Resources\n';
      response += `- **View Type**: ${viewType || 'page'}\n`;
      response += '- UI metadata has been loaded for action view\n';
      
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

    // Display eTag information for future updates
    if (eTag) {
      response += '\n### Update Information\n';
      response += `- **ETag**: ${eTag}\n`;
      response += '- This eTag can be used for subsequent PATCH operations on this action\n';
    }

    response += '\n### Action Execution Notes\n';
    response += '- Pre-processing actions have been executed\n';
    response += '- Case lock has been acquired if pessimistic locking is enabled\n';
    response += '- This action is ready for execution via perform_case_action tool\n';

    response += '\n---\n';
    response += `*Retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseID, actionID, error) {
    let response = `## Error retrieving case action: ${actionID}\n`;
    response += `**Case**: ${caseID}\n\n`;
    
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
        response += '\n**Suggestion**: Verify the case ID and action ID are correct. The case or action may not exist, or you may not have access to it.\n';
        response += '- Check if the case exists using the get_case tool\n';
        response += '- Verify the action name is spelled correctly\n';
        response += '- Ensure the action is available for the current case stage/step\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to access this case action.\n';
        response += '- Verify you have access to the case\n';
        response += '- Check if the action is allowed for your user role\n';
        response += '- Ensure the case is in the correct stage for this action\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: Check the case ID and action ID format and any additional parameters.\n';
        response += '- Ensure case ID is the full case handle (e.g., "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008")\n';
        response += '- Verify action ID matches an available case action name\n';
        response += '- Check viewType parameter is either "form" or "page"\n';
        break;
      case 'UNPROCESSABLE_ENTITY':
        response += '\n**Suggestion**: The action request contains invalid values. Check the action parameters and case state.\n';
        response += '- Verify the case is in the correct state for this action\n';
        response += '- Check if required fields are missing or invalid\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
    }

    if (error.errorDetails && error.errorDetails.length > 0) {
      response += '\n### Additional Error Details\n';
      error.errorDetails.forEach((detail, index) => {
        response += `${index + 1}. ${detail.localizedValue || detail.message}\n`;
      });
    }

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
