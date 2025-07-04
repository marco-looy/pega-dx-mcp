import { PegaAPIClient } from '../api/pega-client.js';

/**
 * Abstract base class for all Pega DX MCP tools
 * Provides common patterns and enforces consistent interface
 */
export class BaseTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
  }

  /**
   * Get the category this tool belongs to (e.g., 'cases', 'assignments')
   * Must be implemented by subclasses
   */
  static getCategory() {
    throw new Error('getCategory() must be implemented by subclass');
  }

  /**
   * Get tool definition for MCP protocol
   * Must be implemented by subclasses
   */
  static getDefinition() {
    throw new Error('getDefinition() must be implemented by subclass');
  }

  /**
   * Execute the tool operation
   * Must be implemented by subclasses
   */
  async execute(params) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Validate required parameters
   * @param {Object} params - Parameters to validate
   * @param {Array} required - Array of required parameter names
   * @returns {Object|null} Error object if validation fails, null if valid
   */
  validateRequiredParams(params, required) {
    for (const param of required) {
      if (!params[param] || (typeof params[param] === 'string' && params[param].trim() === '')) {
        return {
          error: `Invalid ${param} parameter. ${param} is required and must be a non-empty string.`
        };
      }
    }
    return null;
  }

  /**
   * Validate enum parameters
   * @param {Object} params - Parameters to validate
   * @param {Object} enums - Object with param names as keys and valid values as arrays
   * @returns {Object|null} Error object if validation fails, null if valid
   */
  validateEnumParams(params, enums) {
    for (const [param, validValues] of Object.entries(enums)) {
      if (params[param] && !validValues.includes(params[param])) {
        return {
          error: `Invalid ${param} parameter. Must be one of: ${validValues.join(', ')}.`
        };
      }
    }
    return null;
  }

  /**
   * Format successful response for display
   * @param {string} operation - Operation description
   * @param {Object} data - Response data
   * @param {Object} options - Additional formatting options
   * @returns {string} Formatted response text
   */
  formatSuccessResponse(operation, data, options = {}) {
    let response = `## ${operation}\n\n`;
    
    // Add timestamp
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    // Add data if available
    if (data && typeof data === 'object') {
      response += this.formatDataSection(data);
    }
    
    return response;
  }

  /**
   * Format error response for display
   * @param {string} operation - Operation description
   * @param {Object} error - Error object
   * @returns {string} Formatted error response text
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
    response += this.getErrorGuidance(error.type);

    if (error.errorDetails && error.errorDetails.length > 0) {
      response += '\n### Additional Error Details\n';
      error.errorDetails.forEach((detail, index) => {
        response += `${index + 1}. ${detail.localizedValue || detail.message}\n`;
      });
    }

    response += `\n*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Get error-specific guidance messages
   * @param {string} errorType - Type of error
   * @returns {string} Guidance message
   */
  getErrorGuidance(errorType) {
    const guidanceMap = {
      'NOT_FOUND': '\n**Suggestion**: Verify the ID is correct and the resource exists in the system.\n',
      'FORBIDDEN': '\n**Suggestion**: Check if you have the necessary permissions to access this resource.\n',
      'UNAUTHORIZED': '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n',
      'BAD_REQUEST': '\n**Suggestion**: Check the parameters and their format.\n',
      'CONNECTION_ERROR': '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n',
      'INTERNAL_SERVER_ERROR': '\n**Suggestion**: The Pega Platform encountered an internal error. Please try again or contact support if the issue persists.\n'
    };

    return guidanceMap[errorType] || '\n**Suggestion**: Please check the parameters and try again.\n';
  }

  /**
   * Format data section for display
   * @param {Object} data - Data to format
   * @returns {string} Formatted data section
   */
  formatDataSection(data) {
    let section = '';
    
    if (data.data) {
      section += this.formatObjectAsKeyValue('Data', data.data);
    }
    
    if (data.uiResources) {
      section += '### UI Resources\n';
      section += '- UI metadata has been loaded\n';
      if (data.uiResources.root) {
        section += `- Root component: ${data.uiResources.root.type || 'Unknown'}\n`;
      }
      section += '\n';
    }
    
    if (data.etag) {
      section += '### Operation Support\n';
      section += `- eTag captured: ${data.etag}\n`;
      section += '- Ready for follow-up operations\n\n';
    }
    
    return section;
  }

  /**
   * Format object as key-value pairs
   * @param {string} title - Section title
   * @param {Object} obj - Object to format
   * @returns {string} Formatted section
   */
  formatObjectAsKeyValue(title, obj) {
    if (!obj || typeof obj !== 'object') return '';
    
    let section = `### ${title}\n`;
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          section += `- **${key}**: [Object]\n`;
        } else if (Array.isArray(value)) {
          section += `- **${key}**: [${value.length} items]\n`;
        } else {
          section += `- **${key}**: ${value}\n`;
        }
      }
    }
    
    section += '\n';
    return section;
  }

  /**
   * Create a standardized tool response
   * @param {boolean} success - Whether the operation was successful
   * @param {string} operation - Operation description
   * @param {Object} data - Response data or error object
   * @param {Object} options - Additional options
   * @returns {Object} MCP tool response object
   */
  createResponse(success, operation, data, options = {}) {
    if (success) {
      return {
        content: [
          {
            type: 'text',
            text: this.formatSuccessResponse(operation, data, options)
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: this.formatErrorResponse(operation, data)
          }
        ]
      };
    }
  }

  /**
   * Execute operation with standardized error handling
   * @param {string} operation - Operation description
   * @param {Function} apiCall - API call function
   * @param {Object} options - Additional options
   * @returns {Object} MCP tool response
   */
  async executeWithErrorHandling(operation, apiCall, options = {}) {
    try {
      const result = await apiCall();
      
      if (result.success) {
        return this.createResponse(true, operation, result.data, options);
      } else {
        return this.createResponse(false, operation, result.error);
      }
    } catch (error) {
      return {
        error: `Unexpected error during ${operation}: ${error.message}`
      };
    }
  }
}
