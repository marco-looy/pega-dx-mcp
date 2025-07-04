import { PegaAPIClient } from '../../api/pega-client.js';

export class GetAttachmentCategoriesTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
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

    // Comprehensive parameter validation
    const validationResult = this.validateParameters(caseID, type);
    if (!validationResult.valid) {
      return {
        error: validationResult.error
      };
    }

    try {
      // Normalize type parameter to handle case insensitivity
      const normalizedType = type.toLowerCase() === 'file' ? 'File' : 'URL';

      // Call Pega API to get case attachment categories
      const result = await this.pegaClient.getCaseAttachmentCategories(caseID, { type: normalizedType });

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(caseID, result.data, normalizedType)
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(caseID, result.error, normalizedType)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving attachment categories: ${error.message}`
      };
    }
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
   * Format successful response for display
   */
  formatSuccessResponse(caseID, data, type) {
    const { attachment_categories = [] } = data;
    
    let response = `## Attachment Categories Retrieved Successfully\n\n`;

    // Display case and filter information
    response += `### ✅ Case: ${caseID}\n`;
    response += `### 🔍 Filter: ${type} attachment categories\n\n`;
    
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

    // Add detailed guidance about Attachment Category rule configuration
    response += `\n### 📖 Attachment Category Rule Configuration Guide\n`;
    response += `**How attachment categories are configured in Pega:**\n\n`;
    response += `1. **Attachment Category Rule Setup**:\n`;
    response += `   - Navigate to **App Studio > Data > Attachment Categories** in Pega Platform\n`;
    response += `   - Create or modify attachment category rules for your case type\n`;
    response += `   - Each category defines which attachment types (File/URL) are allowed\n`;
    response += `   - Categories must be explicitly associated with case types to appear in API results\n\n`;
    response += `2. **Category Configuration Properties**:\n`;
    response += `   - **Category Name**: Display name shown to users (e.g., "Documents", "Evidence")\n`;
    response += `   - **Category ID**: Unique identifier used internally (e.g., "DOC", "EVID")\n`;
    response += `   - **Attachment Type**: File or URL attachments allowed for this category\n`;
    response += `   - **User Permissions**: Control who can view, create, edit, and delete attachments\n\n`;
    response += `3. **Permission Configuration**:\n`;
    response += `   - **View Permission**: Controls visibility of attachments in this category\n`;
    response += `   - **Create Permission**: Allows users to add new attachments to this category\n`;
    response += `   - **Edit Permission**: Enables modification of attachment names and categories\n`;
    response += `   - **Delete Own**: Users can delete attachments they created\n`;
    response += `   - **Delete All**: Users can delete any attachments in this category\n\n`;
    response += `4. **Case Type Association**:\n`;
    response += `   - Attachment categories must be linked to specific case types\n`;
    response += `   - Only categories configured for the case type will appear in API results\n`;
    response += `   - The API uses the class name from the caseID to determine applicable categories\n`;
    response += `   - Categories not associated with the case type will not be returned\n\n`;
    response += `5. **Best Practice Recommendations**:\n`;
    response += `   - Create meaningful category names that reflect business purpose\n`;
    response += `   - Set appropriate permissions based on user roles and security requirements\n`;
    response += `   - Test category configuration with different user personas\n`;
    response += `   - Document category usage guidelines for business users\n`;
    response += `   - Consider separate categories for different attachment types (File vs URL)\n`;

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

    response += `\n---\n`;
    response += `*Attachment categories retrieved at: ${new Date().toISOString()}*`;

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
