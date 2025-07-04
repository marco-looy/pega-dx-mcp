import { BaseTool } from '../../registry/base-tool.js';

export class GetAttachmentCategoriesTool extends BaseTool {
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
      name: 'get_attachment_categories',
      description: 'Retrieve the list of attachment categories available for a specific Pega case, filtered by attachment type (File or URL). Returns category metadata including user permissions (view, create, edit, delete) for each attachment category associated with the case type. The API uses the class name from the caseID to get attachment categories and filters them based on the type parameter. Only attachment categories configured in the Attachment Category rule are returned. Useful for understanding what attachment categories are available and what operations the current user can perform on each category.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve attachment categories for. Must be the complete case identifier including spaces and special characters. Example: "OSIEO3-DOCSAPP-WORK T-561003". The API uses the class name from this caseID to determine which attachment categories are associated with the case type.'
          },
          type: {
            type: 'string',
            enum: ['File', 'URL', 'file', 'url'],
            description: 'Filter for the attachment type to retrieve categories for. Case insensitive. "File" or "file" returns all attachment categories of type File. "URL" or "url" returns attachment categories of type URL. Default value is "File". The API returns attachment categories of either type File or type URL during a particular API call, not both simultaneously.',
            default: 'File'
          }
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get attachment categories operation
   */
  async execute(params) {
    const { caseID, type = 'File' } = params;

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Additional comprehensive parameter validation for complex logic
    const validationResult = this.validateParameters(caseID, type);
    if (!validationResult.valid) {
      return {
        error: validationResult.error
      };
    }

    // Normalize type parameter to handle case insensitivity
    const normalizedType = type.toLowerCase() === 'file' ? 'File' : 'URL';

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Attachment Categories: ${caseID} (${normalizedType})`,
      async () => await this.pegaClient.getCaseAttachmentCategories(caseID, { type: normalizedType }),
      { caseID, type: normalizedType }
    );
  }

  /**
   * Comprehensive parameter validation
   */
  validateParameters(caseID, type) {
    // Validate caseID
    if (!caseID || typeof caseID !== 'string' || caseID.trim() === '') {
      return {
        valid: false,
        error: 'Invalid caseID parameter. Case ID must be a non-empty string containing the full case handle (e.g., "OSIEO3-DOCSAPP-WORK T-561003").'
      };
    }

    // Validate type parameter (optional)
    if (type !== undefined) {
      if (typeof type !== 'string') {
        return {
          valid: false,
          error: 'Invalid type parameter. Must be a string value ("File" or "URL").'
        };
      }

      const normalizedType = type.toLowerCase();
      if (normalizedType !== 'file' && normalizedType !== 'url') {
        return {
          valid: false,
          error: 'Invalid type parameter. Only "File" and "URL" are supported (case insensitive). Provided value: "' + type + '".'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Override formatSuccessResponse to add attachment categories specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID, type } = options;
    const { attachment_categories = [] } = data;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    if (attachment_categories.length === 0) {
      response += `No ${type.toLowerCase()} attachment categories found for this case.\n\n`;
      response += `### ℹ️ Information\n`;
      response += `- Only attachment categories configured in the Attachment Category rule are returned\n`;
      response += `- The API uses the class name from the caseID to determine available categories\n`;
      response += `- Try with the other type filter: ${type === 'File' ? 'URL' : 'File'}\n`;
      response += `- Use \`get_case_attachments\` tool to see actual attachments for this case\n`;
    } else {
      response += `Found **${attachment_categories.length} ${type.toLowerCase()} attachment ${attachment_categories.length === 1 ? 'category' : 'categories'}** available for this case.\n\n`;
      
      response += `### 📋 Category Details and Permissions\n\n`;

      // Display each category with comprehensive permission details
      attachment_categories.forEach((category, index) => {
        response += `#### ${index + 1}. ${category.name}\n`;
        
        // Basic category information
        response += `- **Category ID**: \`${category.ID}\`\n`;
        response += `- **Category Name**: ${category.name}\n`;
        response += `- **Type**: ${type}\n`;
        
        // Permission matrix
        response += `- **Permissions**:\n`;
        response += `  - **View**: ${category.canView ? '✅ Allowed' : '❌ Denied'}\n`;
        response += `  - **Create**: ${category.canCreate ? '✅ Allowed' : '❌ Denied'}\n`;
        response += `  - **Edit**: ${category.canEdit ? '✅ Allowed' : '❌ Denied'}\n`;
        response += `  - **Delete Own**: ${category.canDeleteOwn ? '✅ Allowed' : '❌ Denied'}\n`;
        response += `  - **Delete All**: ${category.canDeleteAll ? '✅ Allowed' : '❌ Denied'}\n`;
        
        // Available operations summary
        const allowedOperations = [];
        if (category.canView) allowedOperations.push('View');
        if (category.canCreate) allowedOperations.push('Create');
        if (category.canEdit) allowedOperations.push('Edit');
        if (category.canDeleteOwn) allowedOperations.push('Delete Own');
        if (category.canDeleteAll) allowedOperations.push('Delete All');
        
        if (allowedOperations.length > 0) {
          response += `- **Available Operations**: ${allowedOperations.join(', ')}\n`;
        } else {
          response += `- **Available Operations**: ❌ No operations allowed\n`;
        }
        
        response += `\n`;
      });

      // Permission summary
      response += `### 📊 Permission Summary\n`;
      const viewCount = attachment_categories.filter(cat => cat.canView).length;
      const createCount = attachment_categories.filter(cat => cat.canCreate).length;
      const editCount = attachment_categories.filter(cat => cat.canEdit).length;
      const deleteOwnCount = attachment_categories.filter(cat => cat.canDeleteOwn).length;
      const deleteAllCount = attachment_categories.filter(cat => cat.canDeleteAll).length;
      
      response += `- **View Permission**: ${viewCount}/${attachment_categories.length} categories\n`;
      response += `- **Create Permission**: ${createCount}/${attachment_categories.length} categories\n`;
      response += `- **Edit Permission**: ${editCount}/${attachment_categories.length} categories\n`;
      response += `- **Delete Own Permission**: ${deleteOwnCount}/${attachment_categories.length} categories\n`;
      response += `- **Delete All Permission**: ${deleteAllCount}/${attachment_categories.length} categories\n`;
    }

    // Configuration and usage information
    response += `\n### ⚙️ Configuration Details\n`;
    response += `- **Category Source**: Attachment Category rule configuration for case type\n`;
    response += `- **Filter Applied**: ${type} attachment categories only\n`;
    response += `- **Case Class**: Determined from case ID "${caseID}"\n`;
    response += `- **API Behavior**: Returns either File or URL categories per request, not both\n`;

    // Display related operations
    response += `\n### 🔗 Related Operations\n`;
    response += `- Use \`get_case_attachments\` to view actual attachments for this case\n`;
    response += `- Use \`add_case_attachments\` to add attachments using these categories\n`;
    response += `- Use \`upload_attachment\` to prepare files before attaching to case\n`;
    response += `- Use \`get_case\` to view complete case information\n`;
    if (type === 'File') {
      response += `- Run again with \`type: "URL"\` to see URL attachment categories\n`;
    } else {
      response += `- Run again with \`type: "File"\` to see File attachment categories\n`;
    }
    
    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseID, error, type) {
    let response = `## Error Retrieving Attachment Categories\n\n`;
    
    response += `**Case ID**: ${caseID}\n`;
    response += `**Type Filter**: ${type}\n`;
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
        response += '\n**Solutions**:\n';
        response += '- Verify the type parameter is either "File" or "URL" (case insensitive)\n';
        response += `- Current type filter: "${type}"\n`;
        response += '- Check if the case ID format is correct and complete\n';
        response += '- Ensure you have access to view attachment categories for this case\n';
        if (error.details && error.details.includes('Invalid attachment type')) {
          response += '- The type parameter must be exactly "File" or "URL"\n';
          response += '- Other values like "Attachment" are not supported\n';
        }
        break;

      case 'UNAUTHORIZED':
        response += '\n**Solution**: Authentication token may have expired. The system will attempt to refresh the token on the next request.\n';
        break;

      case 'FORBIDDEN':
        response += '\n**Solutions**:\n';
        response += '- Verify you have permission to view this case and its attachment categories\n';
        response += '- Check if your user role includes attachment category viewing privileges\n';
        response += '- Contact your system administrator for case access permissions\n';
        response += '- Ensure the case is in a stage that allows attachment category viewing\n';
        break;

      case 'NOT_FOUND':
        response += '\n**Solutions**:\n';
        response += '- Verify the case ID is correct and includes the full case handle\n';
        response += `- Expected format: "OSIEO3-DOCSAPP-WORK T-XXXXX"\n`;
        response += '- Check if you have access to view this case\n';
        response += '- Ensure the case exists and is not deleted\n';
        response += '- Use `get_case` tool to verify case accessibility\n';
        response += '- Verify that attachment categories are configured for this case type\n';
        break;

      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Solutions**:\n';
        response += '- This is a server-side error in the Pega system\n';
        response += '- Try the operation again after a brief delay\n';
        response += '- Contact your system administrator if the error persists\n';
        response += '- Check Pega system logs for detailed error information\n';
        response += '- Verify attachment category rule configuration is correct\n';
        response += '- Check if the case type has proper attachment category setup\n';
        break;

      case 'CONNECTION_ERROR':
        response += '\n**Solution**: Verify the Pega instance URL and network connectivity.\n';
        break;

      default:
        response += '\n**General Solutions**:\n';
        response += '- Verify the case ID format matches your application structure\n';
        response += '- Check that the type parameter is "File" or "URL" (case insensitive)\n';
        response += '- Ensure attachment categories are configured for this case type\n';
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
    response += `- **Case ID Format**: Ensure full case handle format (e.g., "OSIEO3-DOCSAPP-WORK T-561003")\n`;
    response += `- **Type Parameter**: Must be exactly "File" or "URL" (case insensitive)\n`;
    response += `- **Attachment Categories**: Must be configured in Attachment Category rule for case type\n`;
    response += `- **User Permissions**: Attachment category viewing requires appropriate case access rights\n`;
    response += `- **API Behavior**: Returns either File or URL categories per request, not both\n`;

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
