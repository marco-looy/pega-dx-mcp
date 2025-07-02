import { PegaAPIClient } from '../../api/pega-client.js';

export class GetCaseTypesTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
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
    try {
      // Call Pega API to get case types list
      const result = await this.pegaClient.getCaseTypes();

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(result.data)
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving case types: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(data) {
    let response = `## Available Case Types\n\n`;
    
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

    response += '\n---\n';
    response += `*Retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(error) {
    let response = `## Error retrieving case types\n\n`;
    
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
        response += '\n**Suggestion**: The case types endpoint may not be available. Verify the Pega instance URL and API version.\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to access case types in this application.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestion**: There may be an issue with the API request format. Check the Pega instance configuration.\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Suggestion**: There may be an issue with the Pega instance. Check the server logs or contact your administrator.\n';
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
