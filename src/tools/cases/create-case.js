import { BaseTool } from '../../registry/base-tool.js';

export class CreateCaseTool extends BaseTool {
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

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseTypeID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate enum parameters using base class
    const enumValidation = this.validateEnumParams(params, {
      viewType: ['none', 'form', 'page']
    });
    if (enumValidation) {
      return enumValidation;
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

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Case Creation: ${caseTypeID}`,
      async () => await this.pegaClient.createCase({
        caseTypeID: caseTypeID.trim(),
        parentCaseID: parentCaseID?.trim(),
        content,
        pageInstructions,
        attachments,
        viewType,
        pageName
      }),
      { caseTypeID, viewType, pageName }
    );
  }

  /**
   * Override formatSuccessResponse to add case-specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseTypeID, viewType } = options;
    
    let response = `## ${operation}\n\n`;
    
    // Add timestamp
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    // Display case ID prominently
    if (data.ID) {
      response += `### ✅ New Case ID: ${data.ID}\n\n`;
    }

    // Display eTag for future updates  
    if (data.etag) {
      response += `**eTag**: ${data.etag}\n`;
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

    // Add base class UI resources handling
    if (data.uiResources) {
      response += '\n### UI Resources\n';
      response += '- UI metadata has been loaded\n';
      if (data.uiResources.root) {
        response += `- Root component: ${data.uiResources.root.type || 'Unknown'}\n`;
      }
      response += '\n';
    }
    
    return response;
  }
}
