import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class DeleteAttachmentTool extends BaseTool {
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
      name: 'delete_attachment',
      description: 'Remove the specified attachment from a case. The API validates user authentication and privileges to delete the attachment based on attachment category configuration. Users can delete attachments they uploaded or any attachment of categories they have delete privileges for. After successful deletion, the case history is updated. If an attachment is linked to multiple Link-Attachment objects, only the specific link is removed.',
      inputSchema: {
        type: 'object',
        properties: {
          attachmentID: {
            type: 'string',
            description: 'Full ID of the attachment to delete. Format example: "LINK-ATTACHMENT ONNS8O-TESTAPP-WORK B-2001!20211115T061748.900 GMT". This is the complete Link-Attachment instance pzInsKey that uniquely identifies the attachment in the Pega system. The attachment must exist and the user must have delete privileges for the attachment category.'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['attachmentID']
      }
    };
  }

  /**
   * Execute the delete attachment operation
   */
  async execute(params) {
    const { attachmentID } = params;

    let sessionInfo = null;
    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Basic parameter validation using base class
      const requiredValidation = this.validateRequiredParams(params, ['attachmentID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Additional comprehensive parameter validation
      const validationResult = this.validateParameters(attachmentID);
      if (!validationResult.valid) {
        return {
          error: validationResult.error
        };
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Delete Attachment: ${attachmentID}`,
        async () => await this.pegaClient.deleteAttachment(attachmentID),
        { attachmentID, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Delete Attachment\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Comprehensive parameter validation
   */
  validateParameters(attachmentID) {
    // Validate attachmentID
    if (!attachmentID || typeof attachmentID !== 'string' || attachmentID.trim() === '') {
      return {
        valid: false,
        error: 'Invalid attachmentID parameter. Attachment ID must be a non-empty string containing the full Link-Attachment instance handle (e.g., "LINK-ATTACHMENT ONNS8O-TESTAPP-WORK B-2001!20211115T061748.900 GMT").'
      };
    }

    // Basic format validation for Link-Attachment instance key
    if (!attachmentID.includes('LINK-ATTACHMENT')) {
      return {
        valid: false,
        error: 'Invalid attachmentID format. Expected Link-Attachment instance pzInsKey format (e.g., "LINK-ATTACHMENT ONNS8O-TESTAPP-WORK B-2001!20211115T061748.900 GMT").'
      };
    }

    return { valid: true };
  }

  /**
   * Override formatSuccessResponse for delete-specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { attachmentID, sessionInfo } = options;
    
    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }

    response += `### ✅ Attachment Successfully Deleted\n\n`;
    response += `**Attachment ID**: ${attachmentID}\n\n`;

    // Parse attachment info from ID if possible
    const attachmentInfo = this.parseAttachmentID(attachmentID);
    if (attachmentInfo.caseReference) {
      response += `**Case Reference**: ${attachmentInfo.caseReference}\n`;
    }
    if (attachmentInfo.timestamp) {
      response += `**Original Timestamp**: ${attachmentInfo.timestamp}\n`;
    }

    response += `\n### 📋 Operation Details\n`;
    response += `- The attachment has been permanently removed from the system\n`;
    response += `- Case history has been updated to reflect the deletion\n`;
    response += `- If the attachment was linked to multiple objects, only this specific link was removed\n`;
    response += `- Other users will no longer be able to access this attachment\n`;

    response += `\n### ⚠️ Important Notes\n`;
    response += `- **Permanent Action**: This deletion cannot be undone\n`;
    response += `- **Permission Required**: You had the necessary delete privileges for this attachment category\n`;
    response += `- **Audit Trail**: The deletion is recorded in the case history for compliance\n`;
    response += `- **Multi-Link Support**: If attached to multiple cases, only the specific link was removed\n`;

    response += `\n### 🔗 Related Operations\n`;
    response += `- Use \`get_case_attachments\` to verify the attachment is no longer listed\n`;
    response += `- Use \`get_attachment_categories\` to check delete permissions for other attachments\n`;
    response += `- Use \`upload_attachment\` and \`add_case_attachments\` to add new attachments\n`;
    response += `- Check case history to see the deletion audit entry\n`;

    response += `\n### 💡 Best Practices\n`;
    response += `- Always verify attachment details before deletion using \`get_attachment\`\n`;
    response += `- Consider downloading important attachments before deletion\n`;
    response += `- Review attachment category permissions regularly\n`;
    response += `- Use case comments to document why attachments were removed\n`;
    
    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(attachmentID, error) {
    let response = `## Error Deleting Attachment\n\n`;
    
    response += `**Attachment ID**: ${attachmentID}\n`;
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
        response += '- Check if your OAuth2 client has the necessary permissions for attachment operations\n';
        response += '- Ensure your user account has access to the Pega system\n';
        break;

      case 'FORBIDDEN':
        response += '\n**Solutions**:\n';
        response += '- **Check Delete Permissions**: Verify you have delete privileges for this attachment category\n';
        response += '- **Attachment Category Rules**: Contact your system administrator to review attachment category configuration\n';
        response += '- **Self-Upload Only**: You may only be able to delete attachments you uploaded yourself\n';
        response += '- **Case Access**: Ensure you have access to the case containing this attachment\n';
        response += '- **Role Permissions**: Verify your user role includes attachment delete privileges\n';
        response += '- Use \`get_attachment_categories\` to check your permissions for different attachment types\n';
        break;

      case 'NOT_FOUND':
        response += '\n**Solutions**:\n';
        response += '- **Verify Attachment ID**: Ensure the attachment ID is correct and complete\n';
        response += '- **Expected Format**: "LINK-ATTACHMENT ONNS8O-TESTAPP-WORK B-2001!20211115T061748.900 GMT"\n';
        response += '- **Already Deleted**: Check if the attachment was already deleted by another user\n';
        response += '- **Case Access**: Verify the case containing this attachment still exists and is accessible\n';
        response += '- **Copy Accuracy**: Ensure the attachment ID was copied correctly without truncation\n';
        response += '- Use \`get_case_attachments\` with the case ID to see currently available attachments\n';
        response += '- Check case history to see if the attachment was previously deleted\n';
        break;

      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Solutions**:\n';
        response += '- **Server Error**: This is a server-side error in the Pega system\n';
        response += '- **Retry**: Try the operation again after a brief delay\n';
        response += '- **System Administrator**: Contact your system administrator if the error persists\n';
        response += '- **Pega Logs**: Check Pega system logs for detailed error information\n';
        response += '- **Storage Issues**: May indicate attachment storage system problems\n';
        response += '- **Database Issues**: Could be related to database connectivity problems\n';
        break;

      case 'CONNECTION_ERROR':
        response += '\n**Solutions**:\n';
        response += '- **Network Connectivity**: Verify network connection to the Pega instance\n';
        response += '- **URL Verification**: Check if the Pega instance URL is correct and accessible\n';
        response += '- **Firewall Settings**: Verify firewall settings allow access to the attachment endpoint\n';
        response += '- **Temporary Issue**: Try the request again if it was a temporary network issue\n';
        response += '- **VPN Connection**: Ensure VPN connection is active if required\n';
        break;

      default:
        response += '\n**General Solutions**:\n';
        response += '- **Format Check**: Verify the attachment ID format matches the expected Link-Attachment instance key\n';
        response += '- **Permissions**: Ensure you have the necessary delete permissions for the attachment category\n';
        response += '- **Authentication**: Check that authentication credentials are properly configured\n';
        response += '- **Network**: Verify network connectivity to the Pega instance\n';
        response += '- **Support**: Contact your system administrator if the error persists\n';
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
    response += `- **Delete Permissions**: Controlled by attachment category configuration\n`;
    response += `- **Permission Types**: Self-delete only OR category-wide delete privileges\n`;
    response += `- **Multi-Link Support**: Single attachment may be linked to multiple objects\n`;
    response += `- **Audit Trail**: All deletion attempts are logged for security\n`;

    response += '\n### Permission Verification Steps\n';
    response += `1. Use \`get_attachment_categories\` to check your delete permissions\n`;
    response += `2. Verify the attachment category allows delete operations\n`;
    response += `3. Confirm you either uploaded the attachment OR have category-wide delete rights\n`;
    response += `4. Check with your system administrator if permissions seem incorrect\n`;

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Helper method to parse attachment ID information
   */
  parseAttachmentID(attachmentID) {
    const info = {};
    
    try {
      // Extract case reference (between LINK-ATTACHMENT and !)
      const caseMatch = attachmentID.match(/LINK-ATTACHMENT\s+([^!]+)/);
      if (caseMatch) {
        info.caseReference = caseMatch[1].trim();
      }
      
      // Extract timestamp (after !)
      const timestampMatch = attachmentID.match(/!(.+)$/);
      if (timestampMatch) {
        info.timestamp = timestampMatch[1].trim();
      }
    } catch (error) {
      // If parsing fails, return empty info
    }
    
    return info;
  }
}
