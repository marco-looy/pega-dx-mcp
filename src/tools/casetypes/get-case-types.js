import { BaseTool } from '../../registry/base-tool.js';

export class GetCaseTypesTool extends BaseTool {
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
      name: 'get_case_types',
      description: 'Get list of case types that the user can create in the application',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  /**
   * Execute the get case types operation
   */
  async execute(params) {
    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      'Available Case Types',
      async () => await this.pegaClient.getCaseTypes(),
      {}
    );
  }

  /**
   * Override formatSuccessResponse to add case types specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    // Display application compatibility info
    if (data.applicationIsConstellationCompatible !== undefined) {
      response += `**Application Type**: ${data.applicationIsConstellationCompatible ? 'Constellation Compatible' : 'Legacy (Pre-8.5)'}\n\n`;
    }

    if (data.caseTypes && data.caseTypes.length > 0) {
      response += `### Case Types Available for Creation (${data.caseTypes.length})\n\n`;
      
      data.caseTypes.forEach((caseType, index) => {
        response += `#### ${index + 1}. ${caseType.name || 'Unnamed Case Type'}\n`;
        response += `- **ID**: ${caseType.ID}\n`;
        response += `- **Display Name**: ${caseType.name}\n`;
        
        // Display creation link info
        if (caseType.links && caseType.links.create) {
          const createLink = caseType.links.create;
          response += `- **Creation Method**: ${createLink.type || 'POST'} ${createLink.href || '/cases'}\n`;
          response += `- **Creation Title**: ${createLink.title || 'Create Case'}\n`;
          
          if (createLink.request_body && createLink.request_body.caseTypeID) {
            response += `- **Required Case Type ID**: ${createLink.request_body.caseTypeID}\n`;
          }
        }
        
        // Display starting processes for legacy case types
        if (caseType.startingProcesses && caseType.startingProcesses.length > 0) {
          response += `- **Starting Processes** (${caseType.startingProcesses.length}):\n`;
          caseType.startingProcesses.forEach((process, procIndex) => {
            response += `  ${procIndex + 1}. **${process.name}** (ID: ${process.ID})\n`;
            if (process.requiresFieldsToCreate !== undefined) {
              response += `     - Requires Fields: ${process.requiresFieldsToCreate ? 'Yes' : 'No'}\n`;
            }
          });
        }
        
        response += '\n';
      });
      
      // Summary section
      response += '### Summary\n';
      const constellationTypes = data.caseTypes.filter(ct => !ct.startingProcesses || ct.startingProcesses.length === 0);
      const legacyTypes = data.caseTypes.filter(ct => ct.startingProcesses && ct.startingProcesses.length > 0);
      
      response += `- **Total Case Types**: ${data.caseTypes.length}\n`;
      if (constellationTypes.length > 0) {
        response += `- **Constellation Case Types**: ${constellationTypes.length}\n`;
      }
      if (legacyTypes.length > 0) {
        response += `- **Legacy Case Types**: ${legacyTypes.length}\n`;
      }
      
      // Quick reference for case creation
      response += '\n### Quick Reference for Case Creation\n';
      response += 'Use these case type IDs when creating new cases:\n';
      data.caseTypes.forEach((caseType, index) => {
        response += `${index + 1}. **${caseType.name}**: \`${caseType.ID}\`\n`;
      });
      
    } else {
      response += '### No Case Types Available\n';
      response += 'No case types are currently available for creation in this application.\n';
      response += 'This may be due to:\n';
      response += '- No case types configured in the application\n';
      response += '- Current user lacks permissions to create cases\n';
      response += '- All case types have `canCreate` set to false in the application definition\n';
    }
    
    return response;
  }
}
