import { BaseTool } from '../../registry/base-tool.js';

export class GetCaseTypeActionTool extends BaseTool {
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
      name: 'get_case_type_action',
      description: 'Get detailed information about a case action, including view metadata and available actions',
      inputSchema: {
        type: 'object',
        properties: {
          caseTypeID: {
            type: 'string',
            description: 'ID of the case type for which the case action metadata is being retrieved, for example: Bug'
          },
          actionID: {
            type: 'string',
            description: 'Flow action name of a case/stage action that the client requests'
          }
        },
        required: ['caseTypeID', 'actionID']
      }
    };
  }

  /**
   * Execute the get case type action operation
   */
  async execute(params) {
    const { caseTypeID, actionID } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseTypeID', 'actionID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Case Type Action Metadata: ${caseTypeID} - ${actionID}`,
      async () => await this.pegaClient.getCaseTypeAction(caseTypeID.trim(), actionID.trim()),
      { caseTypeID, actionID }
    );
  }

  /**
   * Override formatSuccessResponse to add case type action specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseTypeID, actionID } = options;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    // Basic action information
    response += '### Action Information\n';
    response += `- **Case Type**: ${caseTypeID}\n`;
    response += `- **Action ID**: ${actionID}\n\n`;
    
    // Case info content
    if (data.data && data.data.caseInfo && data.data.caseInfo.content) {
      response += '### Case Content Structure\n';
      const content = data.data.caseInfo.content;
      
      if (Object.keys(content).length > 0) {
        // Display top-level content keys
        const contentKeys = Object.keys(content);
        response += `- **Available Fields**: ${contentKeys.length}\n`;
        response += `- **Main Sections**: ${contentKeys.slice(0, 10).join(', ')}`;
        if (contentKeys.length > 10) {
          response += ` (and ${contentKeys.length - 10} more)`;
        }
        response += '\n\n';
        
        // Show class information if available
        if (content.classID) {
          response += `- **Primary Class**: ${content.classID}\n`;
        }
      } else {
        response += '- No content metadata available\n\n';
      }
    }

    // UI Resources - this is the rich metadata section
    if (data.uiResources) {
      response += '### UI Resources\n';
      
      // Root component information
      if (data.uiResources.root) {
        response += '#### Root View Configuration\n';
        const root = data.uiResources.root;
        if (root.config && root.config.name) {
          response += `- **View Name**: ${root.config.name}\n`;
        }
        if (root.type) {
          response += `- **Component Type**: ${root.type}\n`;
        }
        response += '\n';
      }
      
      // Available resources
      if (data.uiResources.resources) {
        const resources = data.uiResources.resources;
        
        // Views information
        if (resources.views) {
          const viewCount = Object.keys(resources.views).length;
          response += `#### Available Views (${viewCount})\n`;
          
          const viewNames = Object.keys(resources.views).slice(0, 8);
          viewNames.forEach(viewName => {
            const viewData = resources.views[viewName];
            if (Array.isArray(viewData) && viewData.length > 0) {
              const view = viewData[0];
              response += `- **${viewName}**: ${view.type || 'View'}`;
              if (view.config && view.config.label) {
                response += ` ("${view.config.label}")`;
              }
              response += '\n';
            }
          });
          
          if (Object.keys(resources.views).length > 8) {
            response += `- *(and ${Object.keys(resources.views).length - 8} more views)*\n`;
          }
          response += '\n';
        }
        
        // Fields information
        if (resources.fields) {
          const fieldCount = Object.keys(resources.fields).length;
          response += `#### Available Fields (${fieldCount})\n`;
          
          const fieldNames = Object.keys(resources.fields).slice(0, 10);
          fieldNames.forEach(fieldName => {
            const fieldData = resources.fields[fieldName];
            if (Array.isArray(fieldData) && fieldData.length > 0) {
              const field = fieldData[0];
              response += `- **${fieldName}**: ${field.type || 'Unknown'}`;
              if (field.label) {
                response += ` ("${field.label}")`;
              }
              response += '\n';
            }
          });
          
          if (Object.keys(resources.fields).length > 10) {
            response += `- *(and ${Object.keys(resources.fields).length - 10} more fields)*\n`;
          }
          response += '\n';
        }
        
        // Components information
        if (resources.components) {
          response += `#### UI Components\n`;
          response += `- **Available Components**: ${resources.components.length}\n`;
          response += `- **Component Types**: ${resources.components.join(', ')}\n\n`;
        }
        
        // Data pages information
        if (resources.datapages) {
          const datapageCount = Object.keys(resources.datapages).length;
          response += `#### Data Sources (${datapageCount})\n`;
          
          Object.keys(resources.datapages).slice(0, 5).forEach(dpName => {
            const dp = resources.datapages[dpName];
            response += `- **${dpName}**: ${dp.mode || 'unknown'} mode`;
            if (dp.classID) {
              response += ` (${dp.classID})`;
            }
            response += '\n';
          });
          
          if (Object.keys(resources.datapages).length > 5) {
            response += `- *(and ${Object.keys(resources.datapages).length - 5} more data sources)*\n`;
          }
          response += '\n';
        }
      }
      
      // Action buttons if available
      if (data.uiResources.actionButtons) {
        response += '#### Available Actions\n';
        const buttons = data.uiResources.actionButtons;
        
        if (buttons.main && buttons.main.length > 0) {
          response += '**Primary Actions**:\n';
          buttons.main.forEach(btn => {
            response += `- ${btn.name} (${btn.actionID})\n`;
          });
        }
        
        if (buttons.secondary && buttons.secondary.length > 0) {
          response += '**Secondary Actions**:\n';
          buttons.secondary.forEach(btn => {
            response += `- ${btn.name} (${btn.actionID})\n`;
          });
        }
        response += '\n';
      }
    }
    
    // Context data if available
    if (data.uiResources && data.uiResources.context_data) {
      response += '### Context Information\n';
      response += '- Context data available for form initialization\n';
      if (data.uiResources.context_data.caseInfo) {
        response += '- Case context properly configured\n';
      }
      response += '\n';
    }
    
    return response;
  }
}
