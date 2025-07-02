import { PegaAPIClient } from '../../api/pega-client.js';

export class CreateCaseTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'create_case',
      description: 'Create a new Pega case with specified case type and optional content',
      inputSchema: {
        type: 'object',
        properties: {
          caseTypeID: {
            type: 'string',
            description: 'The class of the case being created (required)'
          },
          parentCaseID: {
            type: 'string',
            description: 'The ID of the case serving as the parent case (optional)'
          },
          content: {
            type: 'object',
            description: 'A map of scalar properties and embedded page properties to be set upon case creation (optional)'
          },
          pageInstructions: {
            type: 'array',
            description: 'A list of page-related operations to be performed on embedded pages, page lists, or page group properties (optional)'
          },
          attachments: {
            type: 'array',
            description: 'A list of attachments to be added to specific attachment fields (optional)'
          },
          viewType: {
            type: 'string',
            enum: ['none', 'form', 'page'],
            description: 'Type of view data to return. "none" returns no UI resources, "form" returns form UI metadata, "page" returns full page UI metadata',
            default: 'none'
          },
          pageName: {
            type: 'string',
            description: 'If provided, view metadata for specific page name will be returned (only used when viewType is "page")'
          }
        },
        required: ['caseTypeID']
      }
    };
  }

  /**
   * Execute the create case operation
   */
  async execute(params) {
    const { caseTypeID, parentCaseID, content, pageInstructions, attachments, viewType, pageName } = params;

    // Validate required parameters
    if (!caseTypeID || typeof caseTypeID !== 'string' || caseTypeID.trim() === '') {
      return {
        error: 'Invalid caseTypeID parameter. Case type ID is required and must be a non-empty string.'
      };
    }

    // Validate viewType if provided
    if (viewType && !['none', 'form', 'page'].includes(viewType)) {
      return {
        error: 'Invalid viewType parameter. Must be one of: "none", "form", or "page".'
      };
    }

    // Validate pageName usage
    if (pageName && viewType !== 'page') {
      return {
        error: 'pageName parameter can only be used when viewType is set to "page".'
      };
    }

    // Validate parentCaseID format if provided
    if (parentCaseID && (typeof parentCaseID !== 'string' || parentCaseID.trim() === '')) {
      return {
        error: 'Invalid parentCaseID parameter. Parent case ID must be a non-empty string if provided.'
      };
    }

    try {
      // Call Pega API to create the case
      const result = await this.pegaClient.createCase({
        caseTypeID: caseTypeID.trim(),
        parentCaseID: parentCaseID?.trim(),
        content,
        pageInstructions,
        attachments,
        viewType,
        pageName
      });

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(result.data, result.eTag, { viewType, pageName })
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(caseTypeID, result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while creating case of type ${caseTypeID}: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(data, eTag, options) {
    const { viewType } = options;
    
    let response = `## Case Created Successfully\n\n`;
    
    // Display case ID prominently
    if (data.ID) {
      response += `### ✅ New Case ID: ${data.ID}\n\n`;
    }

    // Display eTag for future updates
    if (eTag) {
      response += `**eTag**: ${eTag}\n`;
      response += `*Save this eTag for future case updates*\n\n`;
    }
    
    // Display case information
    if (data.data) {
      response += '### Case Information\n';
      
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += `- **Case Type**: ${caseInfo.caseTypeName || 'N/A'}\n`;
        response += `- **Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stage || 'N/A'}\n`;
        response += `- **Step**: ${caseInfo.step || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Created**: ${caseInfo.createTime || 'N/A'}\n`;
        response += `- **Created By**: ${caseInfo.createOpName || 'N/A'}\n`;

        // Display content if available
        if (caseInfo.content && Object.keys(caseInfo.content).length > 0) {
          response += '\n### Case Content\n';
          for (const [key, value] of Object.entries(caseInfo.content)) {
            response += `- **${key}**: ${value}\n`;
          }
        }
      }
    }

    // Display next assignment information
    if (data.nextAssignmentInfo) {
      response += '\n### Next Assignment\n';
      const assignment = data.nextAssignmentInfo;
      response += `- **Assignment ID**: ${assignment.ID || 'N/A'}\n`;
      response += `- **Name**: ${assignment.name || 'N/A'}\n`;
      response += `- **Type**: ${assignment.type || 'N/A'}\n`;
      response += `- **Actions**: ${assignment.actions?.join(', ') || 'N/A'}\n`;
    } else if (data.confirmationNote) {
      response += '\n### Confirmation\n';
      response += `${data.confirmationNote}\n`;
    }

    // Display UI resources info if viewType is not 'none'
    if (viewType !== 'none' && data.uiResources) {
      response += '\n### UI Resources\n';
      response += `- UI metadata loaded for ${viewType} view\n`;
      if (data.uiResources.root) {
        response += `- Root component: ${data.uiResources.root.type || 'Unknown'}\n`;
      }
    }

    response += '\n---\n';
    response += `*Case created at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseTypeID, error) {
    let response = `## Error creating case of type: ${caseTypeID}\n\n`;
    
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
      case 'BAD_REQUEST':
        response += '\n**Suggestions**:\n';
        response += '- Verify the caseTypeID is correct and exists in your Pega application\n';
        response += '- Check if all required fields are included in the content object\n';
        response += '- Ensure fields in content are defined in the AllowedStartingFields data transform\n';
        response += '- Verify parentCaseID format if provided (use full case handle)\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to create cases of this type.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'UNPROCESSABLE_ENTITY':
        response += '\n**Suggestions**:\n';
        response += '- Check that all field values in content match their expected data types\n';
        response += '- Verify picklist values are from the allowed list\n';
        response += '- Ensure page/page list assignments are correctly structured\n';
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
