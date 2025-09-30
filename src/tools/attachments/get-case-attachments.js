import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class GetCaseAttachmentsTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'attachments';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_case_attachments',
      description: 'Get a comprehensive list of all attachments associated with a specific Pega case. Retrieves attachment metadata including file details, URLs, creation information, and available actions (download, edit, delete) for each attachment. Only attachments from categories selected in the Attachment Category rule are returned. Supports optional thumbnail retrieval for image attachments (gif, jpg, jpeg, png, and others) as base64 encoded strings.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve attachments from. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters. The case must exist and be accessible to the current user.'
          },
          includeThumbnails: {
            type: 'boolean',
            description: 'When set to true, thumbnails are added as part of the response as base64 encoded strings. Thumbnails are available for images of the following types: gif, jpg, jpeg, png, and others. Default: false. Note: Enabling thumbnails significantly increases response size.',
            default: false
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get case attachments operation
   */
  async execute(params) {
    const { caseID, includeThumbnails = false } = params;

    let sessionInfo = null;
    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Basic parameter validation using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Additional comprehensive parameter validation for complex logic
      const validationResult = this.validateParameters(caseID, includeThumbnails);
      if (!validationResult.valid) {
        return {
          error: validationResult.error
        };
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Case Attachments: ${caseID}`,
        async () => await this.pegaClient.getCaseAttachments(caseID, { includeThumbnails }),
        { caseID, includeThumbnails, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Case Attachments\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Comprehensive parameter validation
   */
  validateParameters(caseID, includeThumbnails) {
    // Validate caseID
    if (!caseID || typeof caseID !== 'string' || caseID.trim() === '') {
      return {
        valid: false,
        error: 'Invalid caseID parameter. Case ID must be a non-empty string containing the full case handle (e.g., "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008").'
      };
    }

    // Validate includeThumbnails (optional parameter)
    if (includeThumbnails !== undefined && typeof includeThumbnails !== 'boolean') {
      return {
        valid: false,
        error: 'Invalid includeThumbnails parameter. Must be a boolean value (true or false).'
      };
    }

    return { valid: true };
  }

  /**
   * Override formatSuccessResponse to add case attachments specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID, includeThumbnails, sessionInfo } = options;
    const { attachments = [] } = data;
    
    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }
    
    if (attachments.length === 0) {
      response += `No attachments found for this case.\n\n`;
      response += `### ℹ️ Note\n`;
      response += `- Only attachment categories selected in the Attachment Category rule are displayed\n`;
      response += `- Use \`add_case_attachments\` tool to add attachments to this case\n`;
      response += `- Use \`upload_attachment\` tool to prepare files for attachment\n`;
    } else {
      response += `Found **${attachments.length} ${attachments.length === 1 ? 'attachment' : 'attachments'}** associated with this case.\n\n`;
      
      // Group attachments by type for better organization
      const fileAttachments = attachments.filter(att => att.type === 'FILE');
      const urlAttachments = attachments.filter(att => att.type === 'URL');
      const emailAttachments = attachments.filter(att => att.type === 'EMAIL');
      const otherAttachments = attachments.filter(att => !['FILE', 'URL', 'EMAIL'].includes(att.type));

      response += `### 📎 Attachment Summary\n`;
      if (fileAttachments.length > 0) response += `- **Files**: ${fileAttachments.length}\n`;
      if (urlAttachments.length > 0) response += `- **URLs**: ${urlAttachments.length}\n`;
      if (emailAttachments.length > 0) response += `- **Emails**: ${emailAttachments.length}\n`;
      if (otherAttachments.length > 0) response += `- **Other**: ${otherAttachments.length}\n`;
      
      response += `\n### 📋 Detailed Attachment Information\n\n`;

      // Display each attachment with comprehensive details
      attachments.forEach((attachment, index) => {
        response += `#### ${index + 1}. ${attachment.name || 'Unnamed Attachment'}\n`;
        
        // Basic identification
        response += `- **ID**: \`${attachment.ID}\`\n`;
        response += `- **Type**: ${attachment.type} (${attachment.categoryName || attachment.category})\n`;
        
        // File-specific information
        if (attachment.fileName) {
          response += `- **File Name**: ${attachment.fileName}\n`;
        }
        if (attachment.extension) {
          response += `- **Extension**: .${attachment.extension}\n`;
        }
        if (attachment.mimeType) {
          response += `- **MIME Type**: ${attachment.mimeType}\n`;
        }
        
        // URL-specific information
        if (attachment.type === 'URL' && attachment.url) {
          response += `- **URL**: ${attachment.url}\n`;
        }
        
        // Creation information
        if (attachment.createdByName || attachment.createdBy) {
          response += `- **Created By**: ${attachment.createdByName || attachment.createdBy}\n`;
        }
        if (attachment.createTime) {
          const createDate = new Date(attachment.createTime);
          response += `- **Created**: ${createDate.toLocaleString()}\n`;
        }
        
        // Available actions from HATEOAS links
        if (attachment.links && Object.keys(attachment.links).length > 0) {
          const actions = Object.keys(attachment.links);
          response += `- **Available Actions**: ${actions.map(action => 
            action.charAt(0).toUpperCase() + action.slice(1)
          ).join(', ')}\n`;
        }
        
        // Thumbnail information
        if (includeThumbnails && attachment.thumbnail) {
          response += `- **Thumbnail**: ✅ Included (base64 encoded)\n`;
        } else if (includeThumbnails && attachment.type === 'FILE' && attachment.mimeType && 
                   attachment.mimeType.startsWith('image/')) {
          response += `- **Thumbnail**: ❌ Not available\n`;
        }
        
        response += `\n`;
      });

      // Display configuration information
      response += `### ⚙️ Configuration Details\n`;
      response += `- **Attachment Categories**: Only categories selected in Attachment Category rule are shown\n`;
      response += `- **Thumbnails**: ${includeThumbnails ? 'Enabled (base64 encoded)' : 'Disabled'}\n`;
      if (includeThumbnails) {
        const imageAttachments = attachments.filter(att => 
          att.mimeType && att.mimeType.startsWith('image/')
        );
        response += `- **Image Attachments**: ${imageAttachments.length} (eligible for thumbnails)\n`;
      }
    }

    // Display related operations
    response += `\n### 🔗 Related Operations\n`;
    response += `- Use \`add_case_attachments\` to add new attachments to this case\n`;
    response += `- Use \`upload_attachment\` to prepare files for attachment\n`;
    response += `- Use \`get_case\` to view complete case information\n`;
    if (attachments.length > 0) {
      response += `- Individual attachment operations (download, edit, delete) available via attachment links\n`;
    }
    
    return response;
  }
}
