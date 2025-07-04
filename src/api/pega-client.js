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
   * Delete a case (only works for cases in create stage)
   */
  async deleteCase(caseID) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}`;

    return await this.makeRequest(url, {
      method: 'DELETE',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get case type bulk action metadata
   * @param {string} caseTypeID - ID of the case type
   * @param {string} actionID - ID of the action
   * @returns {Promise<Object>} API response with action metadata
   */
  async getCaseTypeBulkAction(caseTypeID, actionID) {
    // URL encode both IDs to handle spaces and special characters
    const encodedCaseTypeID = encodeURIComponent(caseTypeID);
    const encodedActionID = encodeURIComponent(actionID);
    const url = `${this.baseUrl}/casetypes/${encodedCaseTypeID}/actions/${encodedActionID}`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get list of case types that the user can create
   * @returns {Promise<Object>} API response with case types list
   */
  async getCaseTypes() {
    const url = `${this.baseUrl}/casetypes`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get case view details by case ID and view ID
   * @param {string} caseID - Full case handle
   * @param {string} viewID - Name of the view
   * @returns {Promise<Object>} API response with view data and UI resources
   */
  async getCaseView(caseID, viewID) {
    // URL encode both the case ID and view ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedViewID = encodeURIComponent(viewID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/views/${encodedViewID}`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get case stages details by case ID
   * @param {string} caseID - Full case handle
   * @returns {Promise<Object>} API response with stages, processes, steps and visited status
   */
  async getCaseStages(caseID) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/stages`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get case action details by case ID and action ID
   * @param {string} caseID - Full case handle
   * @param {string} actionID - Flow action name
   * @param {Object} options - Optional parameters
   * @param {string} options.viewType - Type of view data to return ("form" or "page")
   * @param {boolean} options.excludeAdditionalActions - Whether to exclude additional action information
   * @returns {Promise<Object>} API response with action metadata and UI resources
   */
  async getCaseAction(caseID, actionID, options = {}) {
    const { viewType, excludeAdditionalActions } = options;
    
    // URL encode both the case ID and action ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedActionID = encodeURIComponent(actionID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/actions/${encodedActionID}`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
    }
    if (excludeAdditionalActions !== undefined) {
      queryParams.append('excludeAdditionalActions', excludeAdditionalActions.toString());
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
   * Perform case action by case ID and action ID
   * @param {string} caseID - Full case handle
   * @param {string} actionID - Flow action name
   * @param {Object} options - Optional parameters
   * @param {Object} options.content - Case content/form data to submit
   * @param {Array} options.pageInstructions - Page-related operations for embedded pages
   * @param {Array} options.attachments - Attachments to add to specific attachment fields
   * @param {string} options.eTag - ETag for optimistic locking (from previous GET request)
   * @param {string} options.viewType - Type of view data to return ("none", "form", or "page")
   * @param {string} options.pageName - Specific page name to return view metadata for
   * @returns {Promise<Object>} API response with updated case data
   */
  async performCaseAction(caseID, actionID, options = {}) {
    const { content, pageInstructions, attachments, eTag, viewType, pageName } = options;
    
    // URL encode both the case ID and action ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedActionID = encodeURIComponent(actionID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/actions/${encodedActionID}`;

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
    const requestBody = {};

    // Add optional parameters if provided
    if (content) {
      requestBody.content = content;
    }
    if (pageInstructions) {
      requestBody.pageInstructions = pageInstructions;
    }
    if (attachments) {
      requestBody.attachments = attachments;
    }

    // Prepare headers
    const headers = {
      'x-origin-channel': 'Web'
    };

    // Add ETag header for optimistic locking if provided
    if (eTag) {
      headers['If-Match'] = eTag;
    }

    return await this.makeRequest(url, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Get next assignment details using Get Next Work functionality
   * @param {Object} options - Optional parameters
   * @param {string} options.viewType - Type of view data to return ("form" or "page", default: "page")
   * @param {string} options.pageName - If provided, view metadata for specific page name will be returned (only used when viewType is "page")
   * @returns {Promise<Object>} API response with next assignment details or 404 if no assignments available
   */
  async getNextAssignment(options = {}) {
    const { viewType, pageName } = options;
    
    let url = `${this.baseUrl}/assignments/next`;

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
   * Get assignment details by assignment ID
   * @param {string} assignmentID - Full handle of an assignment (e.g., "ASSIGN-WORKLIST PBANK-LOAN-WORK V-76003!REVIEW_FLOW")
   * @param {Object} options - Optional parameters
   * @param {string} options.viewType - Type of view data to return ("form" or "page", default: "page")
   * @param {string} options.pageName - If provided, view metadata for specific page name will be returned (only used when viewType is "page")
   * @returns {Promise<Object>} API response with assignment details, instructions, and available actions
   */
  async getAssignment(assignmentID, options = {}) {
    const { viewType, pageName } = options;
    
    // URL encode the assignment ID to handle spaces and special characters
    const encodedAssignmentID = encodeURIComponent(assignmentID);
    let url = `${this.baseUrl}/assignments/${encodedAssignmentID}`;

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
   * Get assignment action details by assignment ID and action ID
   * @param {string} assignmentID - Full handle of an assignment (e.g., "ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-36004!APPROVAL_FLOW")
   * @param {string} actionID - Name of the action to retrieve - ID of the flow action rule (e.g., "Verify", "Approve")
   * @param {Object} options - Optional parameters
   * @param {string} options.viewType - Type of view data to return ("form" or "page", default: "page")
   * @param {boolean} options.excludeAdditionalActions - When true, excludes information on all actions performable on the case (default: false)
   * @returns {Promise<Object>} API response with assignment action details, UI metadata, and case context
   */
  async getAssignmentAction(assignmentID, actionID, options = {}) {
    const { viewType, excludeAdditionalActions } = options;
    
    // URL encode both the assignment ID and action ID to handle spaces and special characters
    const encodedAssignmentID = encodeURIComponent(assignmentID);
    const encodedActionID = encodeURIComponent(actionID);
    let url = `${this.baseUrl}/assignments/${encodedAssignmentID}/actions/${encodedActionID}`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
    }
    if (excludeAdditionalActions !== undefined) {
      queryParams.append('excludeAdditionalActions', excludeAdditionalActions.toString());
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
   * Perform bulk action on multiple cases
   * @param {string} actionID - ID of the case action to be performed on all specified cases
   * @param {Object} options - Options containing cases and other parameters
   * @param {Array} options.cases - Array of case objects with ID properties
   * @param {string} options.runningMode - Execution mode for Launchpad ("async")
   * @param {Object} options.content - Content to apply during action execution
   * @param {Array} options.pageInstructions - Page-related operations
   * @param {Array} options.attachments - Attachments to add
   * @returns {Promise<Object>} API response with bulk operation results
   */
  async performBulkAction(actionID, options = {}) {
    const { cases, runningMode, content, pageInstructions, attachments } = options;
    
    // URL encode the action ID to handle spaces and special characters
    const encodedActionID = encodeURIComponent(actionID);
    let url = `${this.baseUrl}/cases`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    queryParams.append('actionID', encodedActionID);
    
    if (runningMode) {
      queryParams.append('runningMode', runningMode);
    }
    
    url += `?${queryParams.toString()}`;

    // Build request body
    const requestBody = {
      cases
    };

    // Add optional parameters if provided
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
      method: 'PATCH',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Perform assignment action by assignment ID and action ID
   * @param {string} assignmentID - Full handle of the assignment (e.g., "ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-35005!APPROVAL_FLOW")
   * @param {string} actionID - Name of the assignment action to perform - ID of the flow action rule
   * @param {string} eTag - Required eTag unique value representing the most recent save date time of the case
   * @param {Object} options - Optional parameters
   * @param {Object} options.content - Map of scalar and embedded page values to be set to fields in the assignment action's view
   * @param {Array} options.pageInstructions - List of page-related operations to be performed on embedded pages, page lists, or page groups
   * @param {Array} options.attachments - List of attachments to be added to or deleted from specific attachment fields
   * @param {string} options.viewType - Type of view data to return ("none", "form", or "page", default: "none")
   * @param {string} options.originChannel - Origin channel identifier (e.g., "Web", "Mobile", "WebChat")
   * @returns {Promise<Object>} API response with case information, next assignment info or confirmation note, and optional UI resources
   */
  async performAssignmentAction(assignmentID, actionID, eTag, options = {}) {
    const { content, pageInstructions, attachments, viewType, originChannel } = options;
    
    // URL encode both the assignment ID and action ID to handle spaces and special characters
    const encodedAssignmentID = encodeURIComponent(assignmentID);
    const encodedActionID = encodeURIComponent(actionID);
    let url = `${this.baseUrl}/assignments/${encodedAssignmentID}/actions/${encodedActionID}`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    // Build request body
    const requestBody = {};

    // Add optional parameters if provided
    if (content) {
      requestBody.content = content;
    }
    if (pageInstructions) {
      requestBody.pageInstructions = pageInstructions;
    }
    if (attachments) {
      requestBody.attachments = attachments;
    }

    // Prepare headers
    const headers = {
      'if-match': eTag // Required eTag header for optimistic locking
    };

    // Add origin channel header if provided, otherwise default to Web
    if (originChannel) {
      headers['x-origin-channel'] = originChannel;
    } else {
      headers['x-origin-channel'] = 'Web';
    }

    return await this.makeRequest(url, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Make HTTP request to Pega API with authentication
   * @param {string} url - Full API URL
   * @param {Object} options - HTTP request options
   * @returns {Promise<Object>} Structured response with success/error information
   */
  async makeRequest(url, options = {}) {
    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      };

      // Make request
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleErrorResponse(response);
      }

      // Parse successful response
      const data = await response.json();
      const eTag = response.headers.get('etag');
      
      return {
        success: true,
        data,
        eTag,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to connect to Pega API',
          details: error.message,
          originalError: error
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

      case 409:
        errorResponse.error.type = 'CONFLICT';
        errorResponse.error.message = 'Conflict error';
        errorResponse.error.details = errorData.localizedValue || 'The assignment state has changed since your last request';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 412:
        errorResponse.error.type = 'PRECONDITION_FAILED';
        errorResponse.error.message = 'eTag mismatch';
        errorResponse.error.details = errorData.localizedValue || 'The provided eTag value does not match the current case state';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 422:
        errorResponse.error.type = 'VALIDATION_FAIL';
        errorResponse.error.message = 'Validation error';
        errorResponse.error.details = errorData.localizedValue || 'The submitted data failed validation rules';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 423:
        errorResponse.error.type = 'LOCKED';
        errorResponse.error.message = 'Assignment locked';
        errorResponse.error.details = errorData.localizedValue || 'The assignment is currently locked by another user';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 424:
        errorResponse.error.type = 'FAILED_DEPENDENCY';
        errorResponse.error.message = 'Dependency failure';
        errorResponse.error.details = errorData.localizedValue || 'A required dependency or pre-condition failed';
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
