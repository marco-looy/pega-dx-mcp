import { BaseTool } from '../../registry/base-tool.js';
import fs from 'fs';
import path from 'path';
import { lookup as lookupMimeType } from 'mime-types';

export class UploadAttachmentTool extends BaseTool {
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
      name: 'upload_attachment',
      description: 'Upload a file to Pega as a temporary attachment that can later be linked to cases. Creates a temporary attachment instance that auto-expires after 2 hours if not linked. Supports multiple input methods for cross-client compatibility.',
      inputSchema: {
        anyOf: [
          {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Path to file on local filesystem (preferred for desktop clients like Cline). Example: "/home/user/document.pdf" or "C:\\Users\\user\\file.txt"'
              },
              mimeType: {
                type: 'string',
                description: 'MIME type override (auto-detected from filename/content if not provided). Example: "application/pdf", "image/jpeg"'
              },
              appendUniqueIdToFileName: {
                type: 'boolean',
                description: 'Whether to append a unique identifier to the filename to prevent naming conflicts. Pega will add timestamp-based unique ID to filename.',
                default: true
              }
            },
            required: ['filePath']
          },
          {
            type: 'object',
            properties: {
              fileContent: {
                type: 'string',
                description: 'Base64-encoded file content (for web clients or when file system access is restricted). Use this when filePath is not available.'
              },
              fileName: {
                type: 'string',
                description: 'Original filename with extension (required when using fileContent or fileUrl). Example: "report.pdf", "image.jpg"'
              },
              mimeType: {
                type: 'string',
                description: 'MIME type override (auto-detected from filename/content if not provided). Example: "application/pdf", "image/jpeg"'
              },
              appendUniqueIdToFileName: {
                type: 'boolean',
                description: 'Whether to append a unique identifier to the filename to prevent naming conflicts. Pega will add timestamp-based unique ID to filename.',
                default: true
              }
            },
            required: ['fileContent', 'fileName']
          },
          {
            type: 'object',
            properties: {
              fileUrl: {
                type: 'string',
                description: 'URL to file that can be fetched (http://, https://, file://, data:// schemes). Alternative when direct file access is not possible.'
              },
              fileName: {
                type: 'string',
                description: 'Original filename with extension (required when using fileContent or fileUrl). Example: "report.pdf", "image.jpg"'
              },
              mimeType: {
                type: 'string',
                description: 'MIME type override (auto-detected from filename/content if not provided). Example: "application/pdf", "image/jpeg"'
              },
              appendUniqueIdToFileName: {
                type: 'boolean',
                description: 'Whether to append a unique identifier to the filename to prevent naming conflicts. Pega will add timestamp-based unique ID to filename.',
                default: true
              }
            },
            required: ['fileUrl', 'fileName']
          }
        ]
      }
    };
  }

  /**
   * Execute the upload attachment operation
   */
  async execute(params) {
    const { filePath, fileContent, fileUrl, fileName, mimeType, appendUniqueIdToFileName = true } = params;

    // Validate that exactly one input method is provided
    const inputMethods = [filePath, fileContent, fileUrl].filter(Boolean);
    if (inputMethods.length === 0) {
      return {
        error: 'No file input provided. Please specify one of: filePath, fileContent, or fileUrl.'
      };
    }
    if (inputMethods.length > 1) {
      return {
        error: 'Multiple file input methods provided. Please specify only one of: filePath, fileContent, or fileUrl.'
      };
    }

    // Validate fileName when using fileContent or fileUrl
    if ((fileContent || fileUrl) && (!fileName || typeof fileName !== 'string' || fileName.trim() === '')) {
      return {
        error: 'fileName parameter is required when using fileContent or fileUrl input methods.'
      };
    }

    // Validate appendUniqueIdToFileName type
    if (typeof appendUniqueIdToFileName !== 'boolean') {
      return {
        error: 'appendUniqueIdToFileName parameter must be a boolean value.'
      };
    }

    try {
      let fileBuffer, finalFileName, finalMimeType;

      // Process file input based on method provided
      if (filePath) {
        const result = await this.processFilePath(filePath);
        if (result.error) return result;
        fileBuffer = result.buffer;
        finalFileName = result.fileName;
        finalMimeType = result.mimeType;

      } else if (fileContent) {
        const result = await this.processFileContent(fileContent, fileName, mimeType);
        if (result.error) return result;
        fileBuffer = result.buffer;
        finalFileName = result.fileName;
        finalMimeType = result.mimeType;

      } else if (fileUrl) {
        const result = await this.processFileUrl(fileUrl, fileName, mimeType);
        if (result.error) return result;
        fileBuffer = result.buffer;
        finalFileName = result.fileName;
        finalMimeType = result.mimeType;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Upload Attachment: ${finalFileName}`,
        async () => await this.pegaClient.uploadAttachment(fileBuffer, {
          fileName: finalFileName,
          mimeType: finalMimeType,
          appendUniqueIdToFileName
        }),
        { 
          fileName: finalFileName,
          mimeType: finalMimeType,
          fileSize: fileBuffer.length,
          appendUniqueIdToFileName
        }
      );
    } catch (error) {
      return {
        error: `Unexpected error while uploading attachment: ${error.message}`
      };
    }
  }

  /**
   * Process file from filesystem path
   */
  async processFilePath(filePath) {
    try {
      // Validate path parameter
      if (typeof filePath !== 'string' || filePath.trim() === '') {
        return { error: 'Invalid filePath parameter. File path must be a non-empty string.' };
      }

      const cleanPath = filePath.trim();

      // Check if file exists
      if (!fs.existsSync(cleanPath)) {
        return { error: `File not found at path: ${cleanPath}` };
      }

      // Check if it's a file (not directory)
      const stats = fs.statSync(cleanPath);
      if (!stats.isFile()) {
        return { error: `Path does not point to a file: ${cleanPath}` };
      }

      // Check file permissions
      try {
        fs.accessSync(cleanPath, fs.constants.R_OK);
      } catch (accessError) {
        return { error: `File is not readable. Check file permissions: ${cleanPath}` };
      }

      // Read file content
      const buffer = fs.readFileSync(cleanPath);
      const fileName = path.basename(cleanPath);
      const mimeType = lookupMimeType(cleanPath) || 'application/octet-stream';

      return {
        buffer,
        fileName,
        mimeType
      };
    } catch (error) {
      return { error: `Error processing file path: ${error.message}` };
    }
  }

  /**
   * Process base64-encoded file content
   */
  async processFileContent(fileContent, fileName, mimeType) {
    try {
      // Validate fileContent parameter
      if (typeof fileContent !== 'string' || fileContent.trim() === '') {
        return { error: 'Invalid fileContent parameter. File content must be a non-empty base64-encoded string.' };
      }

      // Validate fileName parameter  
      if (typeof fileName !== 'string' || fileName.trim() === '') {
        return { error: 'Invalid fileName parameter. File name must be a non-empty string.' };
      }

      const cleanContent = fileContent.trim();
      const cleanFileName = fileName.trim();

      // Try to decode base64 content
      let buffer;
      try {
        buffer = Buffer.from(cleanContent, 'base64');
      } catch (decodeError) {
        return { error: 'Invalid base64 content. Please ensure fileContent is properly base64-encoded.' };
      }

      // Validate decoded content is not empty
      if (buffer.length === 0) {
        return { error: 'Decoded file content is empty. Please check the base64 encoding.' };
      }

      // Determine MIME type
      const finalMimeType = mimeType || lookupMimeType(cleanFileName) || 'application/octet-stream';

      return {
        buffer,
        fileName: cleanFileName,
        mimeType: finalMimeType
      };
    } catch (error) {
      return { error: `Error processing file content: ${error.message}` };
    }
  }

  /**
   * Process file from URL
   */
  async processFileUrl(fileUrl, fileName, mimeType) {
    try {
      // Validate fileUrl parameter
      if (typeof fileUrl !== 'string' || fileUrl.trim() === '') {
        return { error: 'Invalid fileUrl parameter. File URL must be a non-empty string.' };
      }

      // Validate fileName parameter
      if (typeof fileName !== 'string' || fileName.trim() === '') {
        return { error: 'Invalid fileName parameter. File name must be a non-empty string.' };
      }

      const cleanUrl = fileUrl.trim();
      const cleanFileName = fileName.trim();

      // Validate URL format
      let url;
      try {
        url = new URL(cleanUrl);
      } catch (urlError) {
        return { error: `Invalid URL format: ${cleanUrl}` };
      }

      // Support common schemes
      if (!['http:', 'https:', 'file:', 'data:'].includes(url.protocol)) {
        return { error: `Unsupported URL scheme: ${url.protocol}. Supported schemes: http, https, file, data` };
      }

      // Handle data URLs
      if (url.protocol === 'data:') {
        const match = cleanUrl.match(/^data:([^;]+)(;base64)?,(.+)$/);
        if (!match) {
          return { error: 'Invalid data URL format' };
        }
        
        const dataMimeType = match[1];
        const isBase64 = match[2] === ';base64';
        const data = match[3];
        
        const buffer = isBase64 ? Buffer.from(data, 'base64') : Buffer.from(decodeURIComponent(data));
        const finalMimeType = mimeType || dataMimeType || 'application/octet-stream';
        
        return {
          buffer,
          fileName: cleanFileName,
          mimeType: finalMimeType
        };
      }

      // Fetch from HTTP/HTTPS/file URLs
      const response = await fetch(cleanUrl);
      if (!response.ok) {
        return { error: `Failed to fetch file from URL: ${response.status} ${response.statusText}` };
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine MIME type
      const finalMimeType = mimeType || 
                           response.headers.get('content-type')?.split(';')[0] || 
                           lookupMimeType(cleanFileName) || 
                           'application/octet-stream';

      return {
        buffer,
        fileName: cleanFileName,
        mimeType: finalMimeType
      };
    } catch (error) {
      return { error: `Error processing file URL: ${error.message}` };
    }
  }

  /**
   * Override formatSuccessResponse to add upload attachment specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { fileName, mimeType, fileSize, appendUniqueIdToFileName } = options;
    
    let response = `## ${operation}\n\n`;
    
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    // Display temporary attachment ID prominently
    if (data.ID) {
      response += `### ✅ Temporary Attachment ID: ${data.ID}\n\n`;
      response += `**Important**: This temporary attachment will expire in 2 hours if not linked to a case.\n\n`;
    }

    // Display file information
    response += '### File Information\n';
    response += `- **File Name**: ${fileName}\n`;
    response += `- **MIME Type**: ${mimeType}\n`;
    response += `- **File Size**: ${this.formatFileSize(fileSize)}\n`;
    response += `- **Unique ID Appended**: ${appendUniqueIdToFileName ? 'Yes' : 'No'}\n`;

    // Display next steps
    response += '\n### Next Steps\n';
    response += '- Use `add_case_attachments` tool to link this attachment to a specific case\n';
    response += '- Or use the attachment ID in case creation with the `attachments` parameter\n';
    response += '- **Remember**: Unlinked attachments are automatically deleted after 2 hours\n';

    // Display usage example
    if (data.ID) {
      response += '\n### Usage Example\n';
      response += '```\n';
      response += `add_case_attachments(caseID="YOUR-CASE-ID", attachments=[{"type": "File", "category": "File", "ID": "${data.ID}"}])\n`;
      response += '```\n';
    }
    
    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(fileName, error) {
    let response = `## Error uploading file: ${fileName || 'Unknown'}\n\n`;
    
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
      case 'VIRUS_SCAN_FAIL':
        response += '\n**Suggestions**:\n';
        response += '- The file failed virus scanning and was rejected for security reasons\n';
        response += '- Scan the file with your local antivirus software\n';
        response += '- Ensure the file is from a trusted source\n';
        response += '- Contact your system administrator if you believe this is a false positive\n';
        break;
      case 'FILE_TOO_LARGE':
        response += '\n**Suggestions**:\n';
        response += '- The file exceeds the maximum allowed upload size\n';
        response += '- Check the pyMaxDragDropAttachSizeMB application setting in Pega\n';
        response += '- Compress the file or split it into smaller parts\n';
        response += '- Contact your system administrator to increase the file size limit\n';
        break;
      case 'STORAGE_ERROR':
        response += '\n**Suggestions**:\n';
        response += '- There was an issue with the external file storage system\n';
        response += '- Check CMIS or external storage configuration\n';
        response += '- Verify network connectivity to storage systems\n';
        response += '- Contact your system administrator for storage troubleshooting\n';
        break;
      case 'DATABASE_ERROR':
        response += '\n**Suggestions**:\n';
        response += '- There was an issue saving attachment metadata to the database\n';
        response += '- Check database connectivity and configuration\n';
        response += '- Verify sufficient database storage space\n';
        response += '- Contact your system administrator for database troubleshooting\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestions**:\n';
        response += '- Verify the file format is supported\n';
        response += '- Check that the file is not corrupted\n';
        response += '- Ensure proper file encoding (for base64 content)\n';
        response += '- Verify all required parameters are provided\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
    }

    if (error.errorDetails && error.errorDetails.length > 0) {
      response += '\n### Additional Error Details\n';
      error.errorDetails.forEach((detail, index) => {
        response += `${index + 1}. ${detail.localizedValue || detail.message}\n`;
      });
    }

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format file size in human-readable format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
