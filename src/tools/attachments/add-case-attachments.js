import { BaseTool } from '../../registry/base-tool.js';

export class AddCaseAttachmentsTool extends BaseTool {
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
      name: 'add_case_attachments',
      description: 'Attach files and/or URLs to a Pega case regardless of the context or stage of the case lifecycle. Can attach temporary uploaded files using their IDs (from upload_attachment tool), or add URL/link attachments directly. Supports multiple attachments in a single atomic operation - if any attachment fails, no attachments are added to the case.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to attach files/URLs to. Example: "OSIEO3-DOCSAPP-WORK T-561003". Must be a complete case identifier including spaces and special characters.'
          },
          attachments: {
            type: 'array',
            description: 'Array of attachment objects to add to the case. Can contain file attachments (using temporary attachment IDs from upload_attachment tool) and/or URL attachments. All attachments must be successfully processed or none will be attached (atomic operation).',
            items: {
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['File'],
                      description: 'Attachment type for file attachments. Must be "File".'
                    },
                    category: {
                      type: 'string',
                      enum: ['File'],
                      description: 'Attachment category for file attachments. Must be "File".'
                    },
                    ID: {
                      type: 'string',
                      description: 'Temporary attachment ID returned from upload_attachment tool. Example: "450b7275-8868-43ca-9827-bcfd9ec1b54b". Note: Temporary attachments expire after 2 hours if not linked to a case.'
                    }
                  },
                  required: ['type', 'category', 'ID'],
                  additionalProperties: false
                },
                {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['URL'],
                      description: 'Attachment type for URL/link attachments. Must be "URL".'
                    },
                    category: {
                      type: 'string',
                      enum: ['URL'],
                      description: 'Attachment category for URL/link attachments. Must be "URL".'
                    },
                    url: {
                      type: 'string',
                      description: 'URL/link to attach to the case. Example: "https://www.google.com". Must be a valid URL format.'
                    },
                    name: {
                      type: 'string',
                      description: 'Display name for the URL attachment. Example: "google". This will be shown as the attachment name in the case.'
                    }
                  },
                  required: ['type', 'category', 'url', 'name'],
                  additionalProperties: false
                }
              ]
            },
            minItems: 1,
            maxItems: 50
          }
        },
        required: ['caseID', 'attachments']
      }
    };
  }

  /**
   * Execute the add case attachments operation
   */
  async execute(params) {
    const { caseID, attachments } = params;

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'attachments']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Additional comprehensive parameter validation for complex logic
    const validationResult = this.validateParameters(caseID, attachments);
    if (!validationResult.valid) {
      return {
        error: validationResult.error
      };
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Add Attachments to Case: ${caseID}`,
      async () => await this.pegaClient.addCaseAttachments(caseID, attachments),
      { caseID, attachments }
    );
  }

  /**
   * Comprehensive parameter validation
   */
  validateParameters(caseID, attachments) {
    // Validate caseID
    if (!caseID || typeof caseID !== 'string' || caseID.trim() === '') {
      return {
        valid: false,
        error: 'Invalid caseID parameter. Case ID must be a non-empty string containing the full case handle.'
      };
    }

    // Validate attachments array
    if (!attachments || !Array.isArray(attachments)) {
      return {
        valid: false,
        error: 'Invalid attachments parameter. Attachments must be a non-empty array of attachment objects.'
      };
    }

    if (attachments.length === 0) {
      return {
        valid: false,
        error: 'Attachments array cannot be empty. Please provide at least one attachment to add to the case.'
      };
    }

    if (attachments.length > 50) {
      return {
        valid: false,
        error: 'Too many attachments provided. Maximum of 50 attachments can be added in a single operation.'
      };
    }

    // Validate each attachment object
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      const attachmentValidation = this.validateAttachmentObject(attachment, i);
      if (!attachmentValidation.valid) {
        return attachmentValidation;
      }
    }

    return { valid: true };
  }

  /**
   * Validate individual attachment object
   */
  validateAttachmentObject(attachment, index) {
    if (!attachment || typeof attachment !== 'object') {
      return {
        valid: false,
        error: `Invalid attachment at index ${index}. Each attachment must be an object with required properties.`
      };
    }

    const { type, category } = attachment;

    // Validate required type field
    if (!type || typeof type !== 'string') {
      return {
        valid: false,
        error: `Missing or invalid 'type' field in attachment at index ${index}. Type must be either "File" or "URL".`
      };
    }

    // Validate required category field
    if (!category || typeof category !== 'string') {
      return {
        valid: false,
        error: `Missing or invalid 'category' field in attachment at index ${index}. Category must match the type ("File" or "URL").`
      };
    }

    // Validate File attachment
    if (type === 'File') {
      if (category !== 'File') {
        return {
          valid: false,
          error: `Invalid category for File attachment at index ${index}. Category must be "File" when type is "File".`
        };
      }

      const { ID } = attachment;
      if (!ID || typeof ID !== 'string' || ID.trim() === '') {
        return {
          valid: false,
          error: `Missing or invalid 'ID' field in File attachment at index ${index}. ID must be a non-empty string containing the temporary attachment ID from upload_attachment tool.`
        };
      }

      // Check for unexpected properties
      const allowedProps = ['type', 'category', 'ID'];
      const extraProps = Object.keys(attachment).filter(prop => !allowedProps.includes(prop));
      if (extraProps.length > 0) {
        return {
          valid: false,
          error: `Unexpected properties in File attachment at index ${index}: ${extraProps.join(', ')}. File attachments only support: type, category, ID.`
        };
      }
    }
    // Validate URL attachment
    else if (type === 'URL') {
      if (category !== 'URL') {
        return {
          valid: false,
          error: `Invalid category for URL attachment at index ${index}. Category must be "URL" when type is "URL".`
        };
      }

      const { url, name } = attachment;
      
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return {
          valid: false,
          error: `Missing or invalid 'url' field in URL attachment at index ${index}. URL must be a non-empty string containing a valid URL.`
        };
      }

      // Basic URL format validation
      try {
        new URL(url.trim());
      } catch (urlError) {
        return {
          valid: false,
          error: `Invalid URL format in URL attachment at index ${index}: "${url}". Please provide a valid URL (e.g., "https://www.example.com").`
        };
      }

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return {
          valid: false,
          error: `Missing or invalid 'name' field in URL attachment at index ${index}. Name must be a non-empty string for the display name of the URL attachment.`
        };
      }

      // Check for unexpected properties
      const allowedProps = ['type', 'category', 'url', 'name'];
      const extraProps = Object.keys(attachment).filter(prop => !allowedProps.includes(prop));
      if (extraProps.length > 0) {
        return {
          valid: false,
          error: `Unexpected properties in URL attachment at index ${index}: ${extraProps.join(', ')}. URL attachments only support: type, category, url, name.`
        };
      }
    }
    // Invalid type
    else {
      return {
        valid: false,
        error: `Invalid attachment type "${type}" at index ${index}. Type must be either "File" or "URL".`
      };
    }

    return { valid: true };
  }

  /**
   * Override formatSuccessResponse to add case attachments specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID, attachments } = options;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    response += `Successfully attached ${attachments.length} ${attachments.length === 1 ? 'item' : 'items'} to the case.\n\n`;

    // Display attachment summary
    response += '### Attachment Summary\n';
    
    const fileAttachments = attachments.filter(att => att.type === 'File');
    const urlAttachments = attachments.filter(att => att.type === 'URL');
    
    if (fileAttachments.length > 0) {
      response += `- **Files Attached**: ${fileAttachments.length}\n`;
      fileAttachments.forEach((att, index) => {
        response += `  ${index + 1}. Temporary Attachment ID: ${att.ID}\n`;
      });
    }
    
    if (urlAttachments.length > 0) {
      response += `- **URLs Attached**: ${urlAttachments.length}\n`;
      urlAttachments.forEach((att, index) => {
        response += `  ${index + 1}. ${att.name}: ${att.url}\n`;
      });
    }

    // Display operation details
    response += '\n### Operation Details\n';
    response += '- **Atomic Operation**: All attachments were successfully processed\n';
    response += '- **Status**: All attachments are now permanently linked to the case\n';
    if (fileAttachments.length > 0) {
      response += '- **File Attachments**: Temporary attachments have been converted to permanent case attachments\n';
    }

    // Display next steps
    response += '\n### Next Steps\n';
    response += '- Use `get_case_attachments` tool to retrieve all attachments for this case\n';
    response += '- Use `get_case` tool to view the updated case with attachment information\n';
    response += '- Attachments are now available to all users with case access\n';
    
    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseID, attachments, error) {
    let response = `## Error Adding Attachments to Case\n\n`;
    
    response += `**Case ID**: ${caseID}\n`;
    response += `**Attempted Attachments**: ${attachments.length}\n`;
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
        response += '\n**Common Causes & Solutions**:\n';
        if (error.errorDetails && error.errorDetails.some(detail => detail.message === 'Error_File_Not_Found')) {
          response += '- **Temporary Attachment Not Found**: One or more temporary attachment IDs are invalid or have expired\n';
          response += '  - Temporary attachments expire after 2 hours if not linked to a case\n';
          response += '  - Use `upload_attachment` tool to create new temporary attachments\n';
          response += '  - Verify the attachment IDs are copied correctly from upload responses\n';
        } else {
          response += '- **Invalid Request Format**: Check that all attachment objects have required fields\n';
          response += '- **File Attachments**: Ensure type="File", category="File", and valid ID\n';
          response += '- **URL Attachments**: Ensure type="URL", category="URL", valid url, and name\n';
          response += '- **Mixed Attachments**: Verify each attachment follows its type-specific format\n';
        }
        break;

      case 'UNAUTHORIZED':
        response += '\n**Solution**: Authentication token may have expired. The system will attempt to refresh the token on the next request.\n';
        break;

      case 'FORBIDDEN':
        response += '\n**Solutions**:\n';
        response += '- Verify you have permission to update this case\n';
        response += '- Check if the case is in a stage that allows attachments\n';
        response += '- Contact your system administrator for case access permissions\n';
        break;

      case 'NOT_FOUND':
        response += '\n**Solutions**:\n';
        response += '- Verify the case ID is correct and includes the full case handle\n';
        response += '- Check if you have access to view/update this case\n';
        response += '- Ensure the case exists and is not deleted\n';
        response += '- Use `get_case` tool to verify case accessibility\n';
        break;

      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Solutions**:\n';
        response += '- This is a server-side error in the Pega system\n';
        response += '- Try the operation again after a brief delay\n';
        response += '- Contact your system administrator if the error persists\n';
        response += '- Check Pega system logs for detailed error information\n';
        break;

      case 'CONNECTION_ERROR':
        response += '\n**Solution**: Verify the Pega instance URL and network connectivity.\n';
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

    // Display attachment details that failed
    response += '\n### Attachment Details (Failed to Process)\n';
    attachments.forEach((att, index) => {
      if (att.type === 'File') {
        response += `${index + 1}. **File**: Temporary ID ${att.ID}\n`;
      } else if (att.type === 'URL') {
        response += `${index + 1}. **URL**: ${att.name} (${att.url})\n`;
      }
    });

    response += '\n**Important**: Due to atomic operation behavior, NO attachments were added to the case since at least one failed.\n';

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
