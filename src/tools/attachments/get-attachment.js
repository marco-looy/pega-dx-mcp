import { PegaAPIClient } from '../../api/pega-client.js';

export class GetAttachmentTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_attachment',
      description: 'Get the attachment content based on the attachmentID. Returns different content types: Base64 data for file type attachments, URL for URL type attachments, and HTML data for correspondence type attachments. The API validates the attachmentID and checks if the user has access to view the attachment before returning the content.',
      inputSchema: {
        type: 'object',
        properties: {
          attachmentID: {
            type: 'string',
            description: 'Link-Attachment instance pzInsKey (attachment ID) to retrieve content for. Format example: "LINK-ATTACHMENT MYCO-PAC-WORK E-47009!20231016T062800.275 GMT". This is the complete instance handle key that uniquely identifies the attachment in the Pega system. The attachment must exist and be accessible to the current user.'
          }
        },
        required: ['attachmentID']
      }
    };
  }

  /**
   * Execute the get attachment operation
   */
  async execute(params) {
    const { attachmentID } = params;

    // Comprehensive parameter validation
    const validationResult = this.validateParameters(attachmentID);
    if (!validationResult.valid) {
      return {
        error: validationResult.error
      };
    }

    try {
      // Call Pega API to get attachment content
      const result = await this.pegaClient.getAttachmentContent(attachmentID);

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(attachmentID, result.data, result.headers)
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(attachmentID, result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving attachment content: ${error.message}`
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
        error: 'Invalid attachmentID parameter. Attachment ID must be a non-empty string containing the full Link-Attachment instance handle (e.g., "LINK-ATTACHMENT MYCO-PAC-WORK E-47009!20231016T062800.275 GMT").'
      };
    }

    // Basic format validation for Link-Attachment instance key
    if (!attachmentID.includes('LINK-ATTACHMENT')) {
      return {
        valid: false,
        error: 'Invalid attachmentID format. Expected Link-Attachment instance pzInsKey format (e.g., "LINK-ATTACHMENT MYCO-PAC-WORK E-47009!20231016T062800.275 GMT").'
      };
    }

    return { valid: true };
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(attachmentID, content, headers) {
    let response = `## Attachment Content Retrieved Successfully\n\n`;

    // Display attachment information
    response += `### ✅ Attachment ID: ${attachmentID}\n\n`;

    // Determine content type from headers
    const contentType = headers['content-type'] || headers['Content-Type'] || 'unknown';
    const contentDisposition = headers['content-disposition'] || headers['Content-Disposition'] || '';
    const contentEncoding = headers['content-transfer-encoding'] || headers['Content-Transfer-Encoding'] || '';

    // Parse filename from Content-Disposition header
    let fileName = 'Unknown';
    let previewType = '';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        fileName = filenameMatch[1];
      }
      const previewMatch = contentDisposition.match(/preview-type="([^"]+)"/);
      if (previewMatch) {
        previewType = previewMatch[1];
      }
    }

    response += `### 📄 Content Information\n`;
    response += `- **File Name**: ${fileName}\n`;
    response += `- **Content Type**: ${contentType}\n`;
    if (previewType) {
      response += `- **Preview Type**: ${previewType}\n`;
    }
    if (contentEncoding) {
      response += `- **Content Encoding**: ${contentEncoding}\n`;
    }
    response += `- **Content Disposition**: ${contentDisposition || 'Not specified'}\n`;

    // Determine attachment type and format content accordingly
    if (contentEncoding === 'base64' || (typeof content === 'string' && this.isBase64(content))) {
      // File attachment - Base64 content
      response += `\n### 📎 File Attachment Content\n`;
      response += `**Type**: File (Base64 encoded)\n`;
      response += `**Size**: ${content ? Math.round((content.length * 3) / 4) : 0} bytes (estimated from base64)\n\n`;
      
      if (content && content.length > 0) {
        // Show first few characters for verification
        const preview = content.substring(0, 100);
        response += `**Base64 Content Preview** (first 100 characters):\n`;
        response += `\`\`\`\n${preview}${content.length > 100 ? '...' : ''}\n\`\`\`\n\n`;
        
        response += `**Full Base64 Content**:\n`;
        response += `\`\`\`base64\n${content}\n\`\`\`\n\n`;
        
        response += `### 💡 Usage Notes\n`;
        response += `- The content above is base64 encoded and can be decoded to retrieve the original file\n`;
        response += `- Use appropriate tools or applications to decode and save the file\n`;
        response += `- The estimated file size is calculated from the base64 string length\n`;
      } else {
        response += `**Content**: Empty or not available\n\n`;
      }

    } else if (this.isValidUrl(content)) {
      // URL attachment
      response += `\n### 🔗 URL Attachment Content\n`;
      response += `**Type**: URL Link\n`;
      response += `**URL**: ${content}\n\n`;
      
      response += `### 💡 Usage Notes\n`;
      response += `- This is a URL-type attachment pointing to an external resource\n`;
      response += `- Click or copy the URL to access the linked content\n`;
      response += `- Verify the URL is accessible and safe before visiting\n`;

    } else if (this.isHtmlContent(content)) {
      // Correspondence attachment - HTML content
      response += `\n### 📧 Correspondence Attachment Content\n`;
      response += `**Type**: Correspondence (HTML)\n\n`;
      
      // Parse and display email information from HTML
      const emailInfo = this.parseEmailInfo(content);
      
      if (emailInfo.sent) response += `**Sent**: ${emailInfo.sent}\n`;
      if (emailInfo.from) response += `**From**: ${emailInfo.from}\n`;
      if (emailInfo.to) response += `**To**: ${emailInfo.to}\n`;
      if (emailInfo.subject) response += `**Subject**: ${emailInfo.subject}\n`;
      
      response += `\n**HTML Content**:\n`;
      response += `\`\`\`html\n${content}\n\`\`\`\n\n`;
      
      response += `### 💡 Usage Notes\n`;
      response += `- This is correspondence (email) content in HTML format\n`;
      response += `- The HTML contains structured email information and body content\n`;
      response += `- Use HTML rendering tools to view the formatted content\n`;

    } else {
      // Unknown or plain text content
      response += `\n### 📄 Text/Other Content\n`;
      response += `**Type**: Plain text or other format\n`;
      response += `**Content Length**: ${content ? content.length : 0} characters\n\n`;
      
      if (content && content.length > 0) {
        if (content.length <= 1000) {
          response += `**Content**:\n\`\`\`\n${content}\n\`\`\`\n\n`;
        } else {
          const preview = content.substring(0, 500);
          response += `**Content Preview** (first 500 characters):\n`;
          response += `\`\`\`\n${preview}...\n\`\`\`\n\n`;
          response += `**Full Content**:\n\`\`\`\n${content}\n\`\`\`\n\n`;
        }
      } else {
        response += `**Content**: Empty or not available\n\n`;
      }
    }

    // Display response headers
    response += `### 📋 Response Headers\n`;
    Object.entries(headers).forEach(([key, value]) => {
      response += `- **${key}**: ${value}\n`;
    });

    // Display related operations
    response += `\n### 🔗 Related Operations\n`;
    response += `- Use \`get_case_attachments\` to view all attachments for a case\n`;
    response += `- Use \`upload_attachment\` to prepare new files for attachment\n`;
    response += `- Use \`add_case_attachments\` to attach files to cases\n`;
    response += `- Check attachment category rules for available attachment types\n`;

    response += `\n---\n`;
    response += `*Content retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(attachmentID, error) {
    let response = `## Error Retrieving Attachment Content\n\n`;
    
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
        response += '- Check if your OAuth2 client has the necessary permissions for attachment access\n';
        break;

      case 'FORBIDDEN':
        response += '\n**Solutions**:\n';
        response += '- Verify you have permission to access this specific attachment\n';
        response += '- Check if your user role includes attachment viewing privileges\n';
        response += '- Ensure the attachment belongs to a case you can access\n';
        response += '- Contact your system administrator for attachment access permissions\n';
        response += '- Verify the attachment category allows your user role to view content\n';
        break;

      case 'NOT_FOUND':
        response += '\n**Solutions**:\n';
        response += '- Verify the attachment ID is correct and complete\n';
        response += '- Expected format: "LINK-ATTACHMENT MYCO-PAC-WORK E-XXXXX!YYYYMMDDTHHMISS.sss GMT"\n';
        response += '- Check if the attachment still exists and has not been deleted\n';
        response += '- Ensure you have access to the case containing this attachment\n';
        response += '- Use `get_case_attachments` to verify available attachments for the case\n';
        response += '- Verify the attachment ID was copied correctly without truncation\n';
        break;

      case 'INTERNAL_SERVER_ERROR':
        response += '\n**Solutions**:\n';
        response += '- This is a server-side error in the Pega system\n';
        response += '- Try the operation again after a brief delay\n';
        response += '- Contact your system administrator if the error persists\n';
        response += '- Check Pega system logs for detailed error information\n';
        response += '- Verify attachment storage and retrieval configuration\n';
        response += '- Ensure attachment content is not corrupted or inaccessible\n';
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
        response += '- Verify attachment access permissions and case accessibility\n';
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
    response += `- **Required Permissions**: Attachment viewing, case access, and category permissions\n`;
    response += `- **Content Types**: System supports file (base64), URL, and correspondence attachments\n`;
    response += `- **Access Control**: Attachment access is controlled by case permissions and attachment categories\n`;

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Helper method to check if content is base64 encoded
   */
  isBase64(str) {
    if (!str || typeof str !== 'string') return false;
    
    // Basic base64 pattern check
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    
    // Remove whitespace and check pattern
    const cleanStr = str.replace(/\s/g, '');
    
    // Must be multiple of 4 characters and match base64 pattern
    return cleanStr.length % 4 === 0 && base64Pattern.test(cleanStr) && cleanStr.length > 0;
  }

  /**
   * Helper method to check if content is a valid URL
   */
  isValidUrl(str) {
    if (!str || typeof str !== 'string') return false;
    
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper method to check if content is HTML
   */
  isHtmlContent(str) {
    if (!str || typeof str !== 'string') return false;
    
    // Check for common HTML patterns
    return str.includes('<') && str.includes('>') && 
           (str.includes('<div') || str.includes('<table') || str.includes('<p') || str.includes('<html'));
  }

  /**
   * Helper method to parse email information from HTML content
   */
  parseEmailInfo(htmlContent) {
    const emailInfo = {};
    
    try {
      // Extract sent date/time
      const sentMatch = htmlContent.match(/Sent:\s*<\/td>\s*<td[^>]*>([^<]+)/i);
      if (sentMatch) emailInfo.sent = sentMatch[1].trim();
      
      // Extract from address
      const fromMatch = htmlContent.match(/From:\s*<\/td>\s*<td[^>]*>([^<]+)/i);
      if (fromMatch) emailInfo.from = fromMatch[1].trim();
      
      // Extract to address
      const toMatch = htmlContent.match(/To:\s*<\/td>\s*<td[^>]*>([^<]+)/i);
      if (toMatch) emailInfo.to = toMatch[1].trim();
      
      // Extract subject
      const subjectMatch = htmlContent.match(/Subject:\s*<\/td>\s*<td[^>]*>([^<]+)/i);
      if (subjectMatch) emailInfo.subject = subjectMatch[1].trim();
      
    } catch (error) {
      // If parsing fails, return empty info
    }
    
    return emailInfo;
  }
}
