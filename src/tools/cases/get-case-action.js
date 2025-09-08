import { BaseTool } from '../../registry/base-tool.js';

export class GetCaseActionTool extends BaseTool {
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

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'actionID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate enum parameters using base class
    const enumValidation = this.validateEnumParams(params, {
      viewType: ['form', 'page']
    });
    if (enumValidation) {
      return enumValidation;
    }

    // Validate excludeAdditionalActions if provided
    if (excludeAdditionalActions !== undefined && typeof excludeAdditionalActions !== 'boolean') {
      return {
        error: 'Invalid excludeAdditionalActions parameter. Must be a boolean value.'
      };
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Case Action Details: ${actionID} for ${caseID}`,
      async () => await this.pegaClient.getCaseAction(caseID.trim(), actionID.trim(), {
        viewType,
        excludeAdditionalActions
      }),
      { caseID, actionID, viewType, excludeAdditionalActions }
    );
  }

  /**
   * Override formatSuccessResponse to add case action specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID, viewType, excludeAdditionalActions } = options;
    
    // Extract eTag from the top-level response if available
    const responseETag = data.eTag;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
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

    // Display eTag information for future updates (check both response and data locations)
    const eTag = responseETag || (data.data && data.data.eTag) || data.etag;
    if (eTag) {
      response += '\n### Update Information\n';
      response += `- **ETag**: ${eTag}\n`;
      response += '- This eTag can be used for subsequent operations on this action\n';
    }

    response += '\n### Action Execution Notes\n';
    response += '- Pre-processing actions have been executed\n';
    response += '- Case lock has been acquired if pessimistic locking is enabled\n';
    response += '- This action is ready for execution via perform_case_action tool\n';
    
    return response;
  }
}
