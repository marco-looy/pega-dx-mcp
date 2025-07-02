import { config } from '../config.js';
import { OAuth2Client } from '../auth/oauth2-client.js';

export class PegaAPIClient {
  constructor() {
    this.oauth2Client = new OAuth2Client();
    this.baseUrl = config.pega.apiBaseUrl;
  }

  /**
   * Get case details by case ID
   */
  async getCase(caseID, options = {}) {
    const { viewType, pageName } = options;
    
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
    }
    if (pageName) {
      queryParams.append('pageName', pageName);
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Create a new case
   */
  async createCase(options = {}) {
    const { caseTypeID, parentCaseID, content, pageInstructions, attachments, viewType, pageName } = options;
    
    let url = `${this.baseUrl}/cases`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
    }
    if (pageName) {
      queryParams.append('pageName', pageName);
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    // Build request body
    const requestBody = {
      caseTypeID
    };

    // Add optional parameters if provided
    if (parentCaseID) {
      requestBody.parentCaseID = parentCaseID;
    }
    if (content) {
      requestBody.content = content;
    }
    if (pageInstructions) {
      requestBody.pageInstructions = pageInstructions;
    }
    if (attachments) {
      requestBody.attachments = attachments;
    }

    return await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Make an authenticated HTTP request to Pega API
   */
  async makeRequest(url, options = {}) {
    try {
      // Get access token
      const accessToken = await this.oauth2Client.getAccessToken();

      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Make the request
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: config.server.requestTimeout
      });

      // Handle different response scenarios
      if (response.ok) {
        const data = await response.json();
        const result = {
          success: true,
          data: data
        };
        
        // Capture eTag header if present (needed for case updates)
        const eTag = response.headers.get('etag');
        if (eTag) {
          result.eTag = eTag;
        }
        
        return result;
      } else {
        // Handle error responses
        return await this.handleErrorResponse(response);
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error: {
            type: 'CONNECTION_ERROR',
            message: `Failed to connect to Pega API: ${url}`,
            details: error.message
          }
        };
      }
      
      return {
        success: false,
        error: {
          type: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          details: error.message
        }
      };
    }
  }

  /**
   * Handle error responses from Pega API
   */
  async handleErrorResponse(response) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: await response.text() };
    }

    const errorResponse = {
      success: false,
      error: {
        status: response.status,
        statusText: response.statusText
      }
    };

    switch (response.status) {
      case 400:
        errorResponse.error.type = 'BAD_REQUEST';
        errorResponse.error.message = 'Invalid request parameters';
        errorResponse.error.details = errorData.localizedValue || 'One or more inputs are invalid';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 401:
        errorResponse.error.type = 'UNAUTHORIZED';
        errorResponse.error.message = 'Authentication failed';
        errorResponse.error.details = errorData.errors?.[0]?.message || 'Invalid or expired token';
        // Clear token cache on 401 to force refresh on next request
        this.oauth2Client.clearTokenCache();
        break;

      case 403:
        errorResponse.error.type = 'FORBIDDEN';
        errorResponse.error.message = 'Access denied';
        errorResponse.error.details = errorData.localizedValue || 'User is not allowed to access or update the resource';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 404:
        errorResponse.error.type = 'NOT_FOUND';
        errorResponse.error.message = 'Case not found';
        errorResponse.error.details = errorData.localizedValue || 'The case cannot be found';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 422:
        errorResponse.error.type = 'UNPROCESSABLE_ENTITY';
        errorResponse.error.message = 'Unprocessable entity';
        errorResponse.error.details = errorData.localizedValue || 'The request content contains invalid values for the specified fields';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Internal server error';
        errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error`;
        errorResponse.error.details = errorData.message || response.statusText;
        break;
    }

    return errorResponse;
  }
}
