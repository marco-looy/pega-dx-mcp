import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class UpdateAttachmentTool extends BaseTool {
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
      name: 'update_attachment',
      description: 'Updates the name and category of an existing attachment for a given attachmentID. The API only updates the title and category of an existing attachment. It does not update the filename and URL. The system verifies user access to the attachment category before allowing the update.',
      inputSchema: {
        type: 'object',
        properties: {
          attachmentID: {
            type: 'string',
            description: 'Full ID of the Attachment, Link-Attachment instance pzInsKey (attachment ID) to update. Format example: "LINK-ATTACHMENT OSIEO3-TESTAPP03-WORK T-672011!20240104T100246.978 GMT". This is the complete instance handle key that uniquely identifies the attachment in the Pega system. The attachment must exist and be accessible to the current user.'
          },
          name: {
            type: 'string',
            description: 'New name of the attachment. This will be the display name shown for the attachment in the case. Must be a non-empty string.'
          },
          category: {
            type: 'string',
            description: 'New attachment category. Must be a valid attachment category that exists in the system and that the user has edit permissions for. The category determines the attachment type and associated permissions.'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['attachmentID', 'name', 'category']
      }
    };
  }

  /**
   * Execute the update attachment operation
   */
  async execute(params) {
    const { attachmentID, name, category } = params;

    let sessionInfo = null;
    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Basic parameter validation using base class
      const requiredValidation = this.validateRequiredParams(params, ['attachmentID', 'name', 'category']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Additional comprehensive parameter validation
      const validationResult = this.validateParameters(attachmentID, name, category);
      if (!validationResult.valid) {
        return validationResult;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Attachment Update: ${attachmentID}`,
        async () => await this.pegaClient.updateAttachment(attachmentID, { name, category }),
        { attachmentID, name, category, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Attachment Update\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Comprehensive parameter validation
   */
  validateParameters(attachmentID, name, category) {
    // Validate attachmentID
    if (!attachmentID || typeof attachmentID !== 'string' || attachmentID.trim() === '') {
      return {
        content: [
          {
            type: 'text',
            text: `## Parameter Validation Error\n\n**Error**: Invalid attachmentID parameter.\n\n**Details**: Attachment ID must be a non-empty string containing the full Link-Attachment instance handle (e.g., "LINK-ATTACHMENT OSIEO3-TESTAPP03-WORK T-672011!20240104T100246.978 GMT").\n\n**Solution**: Please provide a valid attachmentID value and try again.`
          }
        ]
      };
    }

    // Basic format validation for Link-Attachment instance key
    if (!attachmentID.includes('LINK-ATTACHMENT')) {
      return {
        content: [
          {
            type: 'text',
            text: `## Parameter Validation Error\n\n**Error**: Invalid attachmentID format.\n\n**Details**: Expected Link-Attachment instance pzInsKey format (e.g., "LINK-ATTACHMENT OSIEO3-TESTAPP03-WORK T-672011!20240104T100246.978 GMT").\n\n**Solution**: Please provide a valid Link-Attachment instance handle and try again.`
          }
        ]
      };
    }

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return {
        content: [
          {
            type: 'text',
            text: `## Parameter Validation Error\n\n**Error**: Invalid name parameter.\n\n**Details**: Name must be a non-empty string that will be used as the display name for the attachment.\n\n**Solution**: Please provide a valid name value and try again.`
          }
        ]
      };
    }

    // Validate category
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return {
        content: [
          {
            type: 'text',
            text: `## Parameter Validation Error\n\n**Error**: Invalid category parameter.\n\n**Details**: Category must be a non-empty string that corresponds to a valid attachment category in the system.\n\n**Solution**: Please provide a valid category value and try again.`
          }
        ]
      };
    }

    return { valid: true };
  }

  /**
   * Override formatSuccessResponse to add attachment update specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { attachmentID, name, category, sessionInfo } = options;
    const responseData = data.data || data;
    
    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }

    // Display update information
    response += `### ✅ Attachment Updated Successfully\n`;
    response += `- **Attachment ID**: ${attachmentID}\n`;
    response += `- **New Name**: ${name}\n`;
    response += `- **New Category**: ${category}\n`;
    
    // Display API response message if available
    if (responseData.message) {
      response += `- **Server Response**: ${responseData.message}\n`;
    }

    response += `\n### 📋 Update Details\n`;
    response += `- **Operation**: Attachment metadata update\n`;
    response += `- **Updated Fields**: Name and Category only\n`;
    response += `- **Unchanged Fields**: Filename, URL, and file content remain unmodified\n`;
    response += `- **Permissions**: User has verified edit access to the attachment category\n`;

    // Add context about what was updated
    response += `\n### 💡 Update Summary\n`;
    response += `The attachment's display name and category have been successfully updated in the Pega system. `;
    response += `This update only affects the metadata associated with the attachment - the actual file content, `;
    response += `filename, and URL (if applicable) remain unchanged. The attachment will now appear with the `;
    response += `new name "${name}" and be categorized under "${category}" in case attachment lists.\n`;

    // Display related operations
    response += `\n### 🔗 Related Operations\n`;
    response += `- Use \`get_attachment\` to retrieve the updated attachment content and verify changes\n`;
    response += `- Use \`get_case_attachments\` to view all attachments for the case with updated metadata\n`;
    response += `- Use \`get_attachment_categories\` to verify available categories and permissions\n`;
    response += `- Use \`delete_attachment\` if the attachment is no longer needed\n`;
    
    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(operation, error) {
    let response = `## Error: ${operation}\n\n`;
    
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
        response += '\n**Solutions**:\n';
        response += '- Authentication token may have expired - the system will attempt to refresh the token automatically\n';
        response += '- Verify your credentials are correctly configured in the MCP server\n';
        response += '- Check if your OAuth2 client has the necessary permissions for attachment modification\n';
        break;

      case 'FORBIDDEN':
        response += '\n**Solutions**:\n';
        response += '- Verify you have edit permissions for this specific attachment\n';
        response += '- Check if your user role includes attachment editing privileges\n';
        response += '- Ensure you have edit access to the specified attachment category\n';
        response += '- Verify the attachment belongs to a case you can modify\n';
        response += '- Contact your system administrator for attachment edit permissions\n';
        response += '- Use `get_attachment_categories` to check available categories and permissions\n';
        break;

      case 'NOT_FOUND':
        response += '\n**Solutions**:\n';
        response += '- Verify the attachment ID is correct and complete\n';
        response += '- Expected format: "LINK-ATTACHMENT OSIEO3-TESTAPP03-WORK T-XXXXX!YYYYMMDDTHHMISS.sss GMT"\n';
        response += '- Check if the attachment still exists and has not been deleted\n';
        response += '- Ensure you have access to the case containing this attachment\n';
        response += '- Use `get_case_attachments` to verify available attachments for the case\n';
        response += '- Verify the attachment ID was copied correctly without truncation\n';
        break;

      case 'BAD_REQUEST':
        response += '\n**Solutions**:\n';
        response += '- Verify the attachment ID format is correct (Link-Attachment instance key)\n';
        response += '- Check that the name parameter is a non-empty string\n';
        response += '- Ensure the category parameter matches an existing attachment category\n';
        response += '- Verify the category name is spelled correctly and exists in the system\n';
        response += '- Use `get_attachment_categories` to get valid category names\n';
        response += '- Check that all required parameters (attachmentID, name, category) are provided\n';
        break;

      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Solutions**:\n';
        response += '- This is a server-side error in the Pega system\n';
        response += '- Try the operation again after a brief delay\n';
        response += '- Contact your system administrator if the error persists\n';
        response += '- Check Pega system logs for detailed error information\n';
        response += '- Verify attachment storage and access configuration\n';
        response += '- Ensure the attachment record is not corrupted or locked\n';
        break;

      case 'CONNECTION_ERROR':
        response += '\n**Solutions**:\n';
        response += '- Verify network connectivity to the Pega instance\n';
        response += '- Check if the Pega instance URL is correct and accessible\n';
        response += '- Verify firewall settings allow access to the attachment endpoint\n';
        response += '- Try the request again if it was a temporary network issue\n';
        break;

      default:
        response += '\n**General Solutions**:\n';
        response += '- Verify the attachment ID format matches the expected Link-Attachment instance key\n';
        response += '- Check network connectivity to the Pega instance\n';
        response += '- Ensure proper authentication credentials are configured\n';
        response += '- Verify attachment edit permissions and category access\n';
        response += '- Check that the attachment category exists and is accessible\n';
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
    response += `- **Attachment ID Format**: Must be complete Link-Attachment instance pzInsKey\n`;
    response += `- **Required Permissions**: Attachment editing, case access, and category edit permissions\n`;
    response += `- **Update Scope**: Only name and category can be updated (filename/URL unchanged)\n`;
    response += `- **Category Validation**: Category must exist and be accessible to the user\n`;
    response += `- **Access Control**: Update access is controlled by case permissions and attachment categories\n`;

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
