import { BaseTool } from '../../registry/base-tool.js';

export class GetDocumentTool extends BaseTool {
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
      name: 'get_document',
      description: 'Get contents of a document as base64 encoded string. Downloads document content based on the documentID parameter. The API validates the documentID and checks if the user has access to view the document before returning the base64 encoded content.',
      inputSchema: {
        type: 'object',
        properties: {
          documentID: {
            type: 'string',
            description: 'Document ID to retrieve content for. This is the unique identifier that identifies the specific document in the Pega system. The document must exist and be accessible to the current user.'
          }
        },
        required: ['documentID']
      }
    };
  }

  /**
   * Execute the get document operation
   */
  async execute(params) {
    const { documentID } = params;

    // Basic parameter validation using base class
    const requiredValidation = this.validateRequiredParams(params, ['documentID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Additional comprehensive parameter validation
    const validationResult = this.validateParameters(documentID);
    if (!validationResult.valid) {
      return {
        error: validationResult.error
      };
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Document Content: ${documentID}`,
      async () => await this.pegaClient.getDocumentContent(documentID),
      { documentID }
    );
  }

  /**
   * Comprehensive parameter validation
   */
  validateParameters(documentID) {
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
   * Override formatSuccessResponse to add document content specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { documentID } = options;
    const content = data.data || data;
    const headers = data.headers || {};
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Determine content type from headers
    const contentType = headers['content-type'] || headers['Content-Type'] || 'unknown';
    const contentDisposition = headers['content-disposition'] || headers['Content-Disposition'] || '';
    const contentEncoding = headers['content-transfer-encoding'] || headers['Content-Transfer-Encoding'] || '';
    const cacheControl = headers['cache-control'] || headers['Cache-Control'] || '';

    // Parse filename from Content-Disposition header
    let fileName = 'Unknown';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        fileName = filenameMatch[1];
      }
    }

    response += `### 📄 Document Information\n`;
    response += `- **Document ID**: ${documentID}\n`;
    response += `- **File Name**: ${fileName}\n`;
    response += `- **Content Type**: ${contentType}\n`;
    if (contentEncoding) {
      response += `- **Content Encoding**: ${contentEncoding}\n`;
    }
    if (cacheControl) {
      response += `- **Cache Control**: ${cacheControl}\n`;
    }
    response += `- **Content Disposition**: ${contentDisposition || 'Not specified'}\n`;

    // Document content - Base64 encoded
    response += `\n### 📎 Document Content\n`;
    response += `**Type**: Base64 encoded document\n`;
    response += `**Size**: ${content ? Math.round((content.length * 3) / 4) : 0} bytes (estimated from base64)\n\n`;
    
    if (content && content.length > 0) {
      // Show first few characters for verification
      const preview = content.substring(0, 100);
      response += `**Base64 Content Preview** (first 100 characters):\n`;
      response += `\`\`\`\n${preview}${content.length > 100 ? '...' : ''}\n\`\`\`\n\n`;
      
      response += `**Full Base64 Content**:\n`;
      response += `\`\`\`base64\n${content}\n\`\`\`\n\n`;
      
      response += `### 💡 Usage Notes\n`;
      response += `- The content above is base64 encoded and can be decoded to retrieve the original document\n`;
      response += `- Use appropriate tools or applications to decode and save the document\n`;
      response += `- The estimated file size is calculated from the base64 string length\n`;
      response += `- Save the content to a file with the appropriate extension based on the content type\n`;
    } else {
      response += `**Content**: Empty or not available\n\n`;
    }

    // Display response headers
    if (Object.keys(headers).length > 0) {
      response += `### 📋 Response Headers\n`;
      Object.entries(headers).forEach(([key, value]) => {
        response += `- **${key}**: ${value}\n`;
      });
    }

    // Display related operations
    response += `\n### 🔗 Related Operations\n`;
    response += `- Use document management APIs to upload or modify documents\n`;
    response += `- Check case-related document operations for document-case relationships\n`;
    response += `- Verify document access permissions if retrieval fails\n`;
    
    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(documentID, error) {
    let response = `## Error Retrieving Document Content\n\n`;
    
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
        response += '- Check if your OAuth2 client has the necessary permissions for document access\n';
        break;

      case 'FORBIDDEN':
        response += '\n**Solutions**:\n';
        response += '- Verify you have permission to access this specific document\n';
        response += '- Check if your user role includes document viewing privileges\n';
        response += '- Ensure the document belongs to content you can access\n';
        response += '- Contact your system administrator for document access permissions\n';
        break;

      case 'NOT_FOUND':
        response += '\n**Solutions**:\n';
        response += '- Verify the document ID is correct and complete\n';
        response += '- Check if the document still exists and has not been deleted\n';
        response += '- Ensure you have access to the system containing this document\n';
        response += '- Verify the document ID was copied correctly without truncation\n';
        break;

      case 'BAD_REQUEST':
        response += '\n**Solutions**:\n';
        response += '- Check that the document ID format is valid\n';
        response += '- Ensure the document ID contains only valid characters\n';
        response += '- Verify that all required parameters are provided\n';
        response += '- Check for any special character encoding issues\n';
        break;

      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Solutions**:\n';
        response += '- This is a server-side error in the Pega system\n';
        response += '- Try the operation again after a brief delay\n';
        response += '- Contact your system administrator if the error persists\n';
        response += '- Check Pega system logs for detailed error information\n';
        response += '- Verify document storage and retrieval configuration\n';
        break;

      case 'CONNECTION_ERROR':
        response += '\n**Solutions**:\n';
        response += '- Verify network connectivity to the Pega instance\n';
        response += '- Check if the Pega instance URL is correct and accessible\n';
        response += '- Verify firewall settings allow access to the document endpoint\n';
        response += '- Try the request again if it was a temporary network issue\n';
        break;

      default:
        response += '\n**General Solutions**:\n';
        response += '- Verify the document ID is correct and accessible\n';
        response += '- Check network connectivity to the Pega instance\n';
        response += '- Ensure proper authentication credentials are configured\n';
        response += '- Verify document access permissions\n';
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
    response += `- **Document ID**: Must be a valid document identifier in the Pega system\n`;
    response += `- **Required Permissions**: Document viewing and system access permissions\n`;
    response += `- **Content Format**: System returns documents as base64 encoded strings\n`;
    response += `- **Access Control**: Document access is controlled by system permissions\n`;

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
