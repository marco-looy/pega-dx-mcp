import { PegaAPIClient } from '../../api/pega-client.js';

export class GetCaseAttachmentsTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
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
          }
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

    // Comprehensive parameter validation
    const validationResult = this.validateParameters(caseID, includeThumbnails);
    if (!validationResult.valid) {
      return {
        error: validationResult.error
      };
    }

    try {
      // Call Pega API to get case attachments
      const result = await this.pegaClient.getCaseAttachments(caseID, { includeThumbnails });

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(caseID, result.data, includeThumbnails)
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(caseID, result.error, includeThumbnails)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving case attachments: ${error.message}`
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
   * Format successful response for display
   */
  formatSuccessResponse(caseID, data, includeThumbnails) {
    const { attachments = [] } = data;
    
    let response = `## Case Attachments Retrieved Successfully\n\n`;

    // Display case information
    response += `### ✅ Case: ${caseID}\n\n`;
    
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

    response += `\n---\n`;
    response += `*Attachments retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseID, error, includeThumbnails) {
    let response = `## Error Retrieving Case Attachments\n\n`;
    
    response += `**Case ID**: ${caseID}\n`;
    response += `**Thumbnails Requested**: ${includeThumbnails ? 'Yes' : 'No'}\n`;
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
      case 'UNAUTHORIZED':
        response += '\n**Solution**: Authentication token may have expired. The system will attempt to refresh the token on the next request.\n';
        break;

      case 'FORBIDDEN':
        response += '\n**Solutions**:\n';
        response += '- Verify you have permission to view this case and its attachments\n';
        response += '- Check if your user role includes attachment viewing privileges\n';
        response += '- Contact your system administrator for case access permissions\n';
        response += '- Ensure the case is in a stage that allows attachment viewing\n';
        break;

      case 'NOT_FOUND':
        response += '\n**Solutions**:\n';
        response += '- Verify the case ID is correct and includes the full case handle\n';
        response += `- Expected format: "ON6E5R-DIYRecipe-Work-RecipeCollection R-XXXX"\n`;
        response += '- Check if you have access to view this case\n';
        response += '- Ensure the case exists and is not deleted\n';
        response += '- Use `get_case` tool to verify case accessibility\n';
        break;

      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Solutions**:\n';
        response += '- This is a server-side error in the Pega system\n';
        response += '- Try the operation again after a brief delay\n';
        response += '- Contact your system administrator if the error persists\n';
        response += '- Check Pega system logs for detailed error information\n';
        response += '- Verify attachment category configuration is correct\n';
        break;

      case 'CONNECTION_ERROR':
        response += '\n**Solution**: Verify the Pega instance URL and network connectivity.\n';
        break;

      default:
        response += '\n**General Solutions**:\n';
        response += '- Verify the case ID format matches your application structure\n';
        response += '- Check network connectivity to the Pega instance\n';
        response += '- Ensure proper authentication credentials are configured\n';
        response += '- Contact your system administrator if the error persists\n';
        break;
    }

    // Display detailed error information if available
    if (error.errorDetails && error.errorDetails.length > 0) {
      response += '\n### Detailed Error Information\n';
      error.errorDetails.forEach((detail, index) => {
        response += `${index + 1}. **${detail.message || 'Error'}**: ${detail.localizedValue || detail.message}\n`;
        if (detail.messageParameters && detail.messageParameters.length > 0) {
          response += `   - Parameters: ${detail.messageParameters.join(', ')}\n`;
        }
      });
    }

    // Display troubleshooting context
    response += '\n### Troubleshooting Context\n';
    response += `- **Case ID Format**: Ensure full case handle format (e.g., "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008")\n`;
    response += `- **Attachment Categories**: Only configured categories in Attachment Category rule are accessible\n`;
    response += `- **User Permissions**: Attachment viewing requires appropriate case and attachment access rights\n`;
    if (includeThumbnails) {
      response += `- **Thumbnail Feature**: Thumbnails require additional processing and may impact performance\n`;
    }

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
