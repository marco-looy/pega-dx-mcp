import { BaseTool } from '../../registry/base-tool.js';

export class RemoveCaseDocumentTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'documents';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'remove_case_document',
      description: 'Remove a document that is linked to a specific Pega case. This operation permanently removes the link between the document and the case. The document ID and case ID must both be valid and the user must have appropriate permissions to remove documents from the case.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) from which to remove the document. Must be a complete case identifier including spaces and special characters. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". The case must exist and be accessible to the current user.'
          },
          documentID: {
            type: 'string',
            description: 'Document ID to be removed from the case. This is the unique identifier that identifies the specific document in the Pega system. The document must exist, be linked to the specified case, and be accessible to the current user.'
          }
        },
        required: ['caseID', 'documentID']
      }
    };
  }

  /**
   * Execute the remove case document operation
   */
  async execute(params) {
    const { caseID, documentID } = params;

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'documentID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Additional comprehensive parameter validation
    const validationResult = this.validateParameters(caseID, documentID);
    if (!validationResult.valid) {
      return {
        error: validationResult.error
      };
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Remove Document from Case: ${documentID} from ${caseID}`,
      async () => await this.pegaClient.removeCaseDocument(caseID, documentID),
      { caseID, documentID }
    );
  }

  /**
   * Comprehensive parameter validation
   */
  validateParameters(caseID, documentID) {
    // Validate caseID
    if (!caseID || typeof caseID !== 'string' || caseID.trim() === '') {
      return {
        valid: false,
        error: 'Invalid caseID parameter. Case ID must be a non-empty string containing the full case handle (e.g., "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008").'
      };
    }

    // Validate documentID
    if (!documentID || typeof documentID !== 'string' || documentID.trim() === '') {
      return {
        valid: false,
        error: 'Invalid documentID parameter. Document ID must be a non-empty string containing the unique document identifier.'
      };
    }

    return { valid: true };
  }

  /**
   * Override formatSuccessResponse to add document removal specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID, documentID } = options;
    const content = data.data || data;
    const headers = data.headers || {};
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    response += `### ✅ Document Removal Successful\n`;
    response += `- **Case ID**: ${caseID}\n`;
    response += `- **Document ID**: ${documentID}\n`;
    response += `- **Status**: Document successfully removed from case\n`;
    
    // Check cache control header
    const cacheControl = headers['cache-control'] || headers['Cache-Control'] || '';
    if (cacheControl) {
      response += `- **Cache Control**: ${cacheControl}\n`;
    }

    response += `\n### 📋 Operation Details\n`;
    response += `- **Operation Type**: Document removal from case\n`;
    response += `- **Action**: DELETE /cases/{caseID}/documents/{documentID}\n`;
    response += `- **Result**: Document link to case permanently removed\n`;
    response += `- **Impact**: Document is no longer associated with the specified case\n`;

    // Display response headers if available
    if (Object.keys(headers).length > 0) {
      response += `\n### 📄 Response Headers\n`;
      Object.entries(headers).forEach(([key, value]) => {
        response += `- **${key}**: ${value}\n`;
      });
    }

    // Display related operations
    response += `\n### 🔗 Related Operations\n`;
    response += `- Use \`get_case\` to verify the document is no longer linked to the case\n`;
    response += `- Use \`get_document\` to verify the document still exists independently\n`;
    response += `- Use case management APIs to add new documents to cases if needed\n`;
    response += `- Check case audit trail for document removal history\n`;

    response += `\n### 💡 Important Notes\n`;
    response += `- **Document Status**: The document itself still exists in the system\n`;
    response += `- **Case Impact**: Only the link between document and case has been removed\n`;
    response += `- **Permissions**: This operation required document removal permissions\n`;
    response += `- **Audit Trail**: Document removal is typically logged in case history\n`;
    
    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(operation, error, options = {}) {
    const { caseID, documentID } = options;
    let response = `## Error Removing Document from Case\n\n`;
    
    response += `**Case ID**: ${caseID}\n`;
    response += `**Document ID**: ${documentID}\n`;
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
        response += '- Check if your OAuth2 client has the necessary permissions for document operations\n';
        break;

      case 'FORBIDDEN':
        response += '\n**Solutions**:\n';
        response += '- Verify you have permission to remove documents from this specific case\n';
        response += '- Check if your user role includes document management privileges\n';
        response += '- Ensure you have access to both the case and the document\n';
        response += '- Contact your system administrator for document removal permissions\n';
        break;

      case 'NOT_FOUND':
        response += '\n**Solutions**:\n';
        response += '- Verify the case ID is correct and the case exists\n';
        response += '- Verify the document ID is correct and the document exists\n';
        response += '- Check if the document is actually linked to the specified case\n';
        response += '- Ensure both IDs were copied correctly without truncation\n';
        response += '- Verify you have access to the system containing the case and document\n';
        break;

      case 'BAD_REQUEST':
        response += '\n**Solutions**:\n';
        response += '- Check that both case ID and document ID formats are valid\n';
        response += '- Ensure the case ID includes the complete case handle with spaces\n';
        response += '- Verify that the document ID contains only valid characters\n';
        response += '- Check for any special character encoding issues\n';
        response += '- Ensure all required parameters are provided correctly\n';
        break;

      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Solutions**:\n';
        response += '- This is a server-side error in the Pega system\n';
        response += '- Try the operation again after a brief delay\n';
        response += '- Contact your system administrator if the error persists\n';
        response += '- Check Pega system logs for detailed error information\n';
        response += '- Verify document-case relationship configuration\n';
        break;

      case 'CONNECTION_ERROR':
        response += '\n**Solutions**:\n';
        response += '- Verify network connectivity to the Pega instance\n';
        response += '- Check if the Pega instance URL is correct and accessible\n';
        response += '- Verify firewall settings allow access to the document endpoints\n';
        response += '- Try the request again if it was a temporary network issue\n';
        break;

      default:
        response += '\n**General Solutions**:\n';
        response += '- Verify both case ID and document ID are correct and accessible\n';
        response += '- Check network connectivity to the Pega instance\n';
        response += '- Ensure proper authentication credentials are configured\n';
        response += '- Verify document removal permissions for the case\n';
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
    response += `- **Operation**: DELETE /cases/{caseID}/documents/{documentID}\n`;
    response += `- **Case ID Format**: Must be complete case handle (e.g., "CASE-123 ABC-456")\n`;
    response += `- **Document ID Format**: Must be valid document identifier\n`;
    response += `- **Required Permissions**: Document removal and case access permissions\n`;
    response += `- **Prerequisites**: Document must be linked to the specified case\n`;
    response += `- **Impact**: This operation removes the document-case relationship\n`;

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
