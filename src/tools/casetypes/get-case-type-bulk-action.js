import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class GetCaseTypeBulkActionTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'casetypes';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_case_type_bulk_action',
      description: 'Get bulk action metadata for a specific case type and action ID',
      inputSchema: {
        type: 'object',
        properties: {
          caseTypeID: {
            type: 'string',
            description: 'ID of the case type for which the case action metadata is being retrieved (e.g., "Bug")'
          },
          actionID: {
            type: 'string',
            description: 'ID of the action for which the metadata is being retrieved (e.g., "Clone")'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseTypeID', 'actionID']
      }
    };
  }

  /**
   * Execute the get case type bulk action operation
   */
  async execute(params) {
    const { caseTypeID, actionID } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseTypeID', 'actionID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Case Type Bulk Action: ${caseTypeID} - ${actionID}`,
        async () => await this.pegaClient.getCaseTypeBulkAction(caseTypeID.trim(), actionID.trim()),
        { caseTypeID, actionID, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Get Case Type Bulk Action\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Override formatSuccessResponse to add case type bulk action specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseTypeID, actionID, sessionInfo } = options;

    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }
    
    if (data.data) {
      response += '### Action Metadata\n';
      
      // Display case info content if available
      if (data.data.caseInfo && data.data.caseInfo.content) {
        response += '#### Case Type Fields\n';
        const content = data.data.caseInfo.content;
        
        if (Object.keys(content).length > 0) {
          for (const [key, value] of Object.entries(content)) {
            if (typeof value === 'object' && value !== null) {
              response += `- **${key}**: ${JSON.stringify(value, null, 2)}\n`;
            } else {
              response += `- **${key}**: ${value}\n`;
            }
          }
        } else {
          response += '- No specific field metadata available\n';
        }
      }
    }

    // Display UI resources if available
    if (data.uiResources) {
      response += '\n### UI Resources\n';
      
      if (data.uiResources.root) {
        response += '#### Root Component\n';
        response += `- **Type**: ${data.uiResources.root.type || 'N/A'}\n`;
        response += `- **Name**: ${data.uiResources.root.name || 'N/A'}\n`;
        
        if (data.uiResources.root.children && data.uiResources.root.children.length > 0) {
          response += `- **Child Components**: ${data.uiResources.root.children.length}\n`;
        }
      }
      
      if (data.uiResources.resources) {
        response += '\n#### Available Resources\n';
        const resourceCount = Object.keys(data.uiResources.resources).length;
        response += `- **Total Resources**: ${resourceCount}\n`;
        
        // Show a few resource types if available
        const resourceTypes = Object.keys(data.uiResources.resources).slice(0, 5);
        if (resourceTypes.length > 0) {
          response += '- **Resource Types**: ';
          response += resourceTypes.join(', ');
          if (resourceCount > 5) {
            response += ` (and ${resourceCount - 5} more)`;
          }
          response += '\n';
        }
      }
    }

    // Display action details if available in the response
    if (data.actionMetadata) {
      response += '\n### Action Details\n';
      response += `- **Action ID**: ${actionID}\n`;
      response += `- **Case Type ID**: ${caseTypeID}\n`;
      
      if (data.actionMetadata.label) {
        response += `- **Label**: ${data.actionMetadata.label}\n`;
      }
      
      if (data.actionMetadata.tooltip) {
        response += `- **Tooltip**: ${data.actionMetadata.tooltip}\n`;
      }
      
      if (data.actionMetadata.enabled !== undefined) {
        response += `- **Enabled**: ${data.actionMetadata.enabled}\n`;
      }
    }
    
    return response;
  }
}
