import { config } from '../config.js';
import { OAuth2Client } from '../auth/oauth2-client.js';
import FormData from 'form-data';

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
   * Get case type action metadata with rich UI resources
   * @param {string} caseTypeID - ID of the case type for which the case action metadata is being retrieved
   * @param {string} actionID - Flow action name of a case/stage action that the client requests
   * @returns {Promise<Object>} API response with detailed action metadata, UI resources, and form configuration
   */
  async getCaseTypeAction(caseTypeID, actionID) {
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
   * Get case descendants - loops through all child cases recursively descending from the specific one
   * @param {string} caseID - Full case handle to retrieve descendants from
   * @returns {Promise<Object>} API response with child cases hierarchy including assignments and actions for each
   */
  async getCaseDescendants(caseID) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/descendants`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get case ancestors - retrieves ancestor hierarchy case list for the case ID passed in
   * @param {string} caseID - Full case handle to retrieve ancestors from
   * @returns {Promise<Object>} API response with ancestor cases hierarchy including ID, name, and HATEOAS links
   */
  async getCaseAncestors(caseID) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/ancestors`;

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
   * PATCH bulk cases operation - alternative implementation for bulk_cases_patch tool
   * @param {string} actionID - ID of the case action to be performed on all specified cases
   * @param {Object} options - Options containing cases and other parameters
   * @param {Array} options.cases - Array of case objects with ID properties (required)
   * @param {string} options.runningMode - Execution mode for Launchpad ("async" only)
   * @param {Object} options.content - Content to apply during action execution
   * @param {Array} options.pageInstructions - Page-related operations
   * @param {Array} options.attachments - Attachments to add
   * @returns {Promise<Object>} API response with platform-specific results (207 Multistatus for Infinity, 202 Accepted for Launchpad)
   */
  async patchCasesBulk(actionID, options = {}) {
    const { cases, runningMode, content, pageInstructions, attachments } = options;
    
    // URL encode the action ID to handle spaces and special characters
    const encodedActionID = encodeURIComponent(actionID);
    let url = `${this.baseUrl}/cases`;

    // Add query parameters - actionID is required
    const queryParams = new URLSearchParams();
    queryParams.append('actionID', encodedActionID);
    
    // Add runningMode if provided (Launchpad only)
    if (runningMode) {
      queryParams.append('runningMode', runningMode);
    }
    
    url += `?${queryParams.toString()}`;

    // Build request body - cases is required
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

    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-origin-channel': 'Web'
      };

      // Make PATCH request
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestBody),
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses with specific error handling for bulk operations
      if (!response.ok) {
        return await this.handleBulkCasesErrorResponse(response);
      }

      // Parse successful response
      const data = await response.json();
      
      return {
        success: true,
        data,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to connect to Pega API for bulk cases operation',
          details: error.message,
          originalError: error
        }
      };
    }
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
   * Refresh assignment action form data and execute Data Transforms
   * @param {string} assignmentID - Full handle of the assignment (e.g., "ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW")
   * @param {string} actionID - Name of the assignment action - ID of the flow action rule
   * @param {Object} options - Optional parameters
   * @param {string} [options.refreshFor] - Property name that triggers refresh after executing Data Transform
   * @param {boolean} [options.fillFormWithAI=false] - Boolean to enable generative AI form filling
   * @param {string} [options.operation] - Table row operation type ("showRow" or "submitRow")
   * @param {string} [options.interestPage] - Target page for table row operations (e.g., ".OrderItems(1)")
   * @param {string} [options.interestPageActionID] - Action ID for embedded list operations
   * @param {Object} [options.content] - Property values to merge into case during refresh
   * @param {Array} [options.pageInstructions] - Page-related operations for embedded pages
   * @param {string} [options.eTag] - ETag value for optimistic locking (recommended to get from previous assignment action call)
   * @returns {Promise<Object>} API response with refreshed form data, updated field states, and UI resources
   */
  async refreshAssignmentAction(assignmentID, actionID, options = {}) {
    const { 
      refreshFor, 
      fillFormWithAI, 
      operation, 
      interestPage, 
      interestPageActionID, 
      content, 
      pageInstructions,
      eTag 
    } = options;
    
    // URL encode both the assignment ID and action ID to handle spaces and special characters
    const encodedAssignmentID = encodeURIComponent(assignmentID);
    const encodedActionID = encodeURIComponent(actionID);
    let url = `${this.baseUrl}/assignments/${encodedAssignmentID}/actions/${encodedActionID}/refresh`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (refreshFor) {
      queryParams.append('refreshFor', refreshFor);
    }
    if (fillFormWithAI !== undefined) {
      queryParams.append('fillFormWithAI', fillFormWithAI.toString());
    }
    if (operation) {
      queryParams.append('operation', operation);
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    // Build request body
    const requestBody = {};

    // Add optional parameters if provided
    if (content && Object.keys(content).length > 0) {
      requestBody.content = content;
    }
    if (pageInstructions && pageInstructions.length > 0) {
      requestBody.pageInstructions = pageInstructions;
    }
    
    // Add table row operation parameters for Pega Infinity '25 features
    if (operation && interestPage) {
      requestBody.interestPage = interestPage;
    }
    if (operation && interestPageActionID) {
      requestBody.interestPageActionID = interestPageActionID;
    }

    // Prepare headers - Note: This endpoint typically requires if-match header with eTag
    // However, for refresh operations, eTag might not always be required depending on configuration
    const headers = {
      'x-origin-channel': 'Web'
    };

    return await this.makeRequest(url, {
      method: 'PATCH',
      headers: headers,
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
    });
  }

  /**
   * Save assignment action form data without executing the action
   * @param {string} assignmentID - Full handle of the assignment (e.g., "ASSIGN-WORKLIST PBANK-LOAN-WORK V-76003!REVIEW_FLOW")
   * @param {string} actionID - Name of the assignment action - ID of the flow action rule
   * @param {string} eTag - Required eTag unique value representing the most recent save date time of the case
   * @param {Object} options - Optional parameters
   * @param {Object} options.content - Map of scalar and embedded page properties containing form data to be saved
   * @param {Array} options.pageInstructions - List of page-related operations for embedded pages, page lists, or page groups
   * @param {Array} options.attachments - List of attachments to be added to specific attachment fields
   * @param {string} options.originChannel - Origin channel identifier (e.g., "Web", "Mobile", "WebChat")
   * @returns {Promise<Object>} API response with save confirmation and case information
   */
  async saveAssignmentAction(assignmentID, actionID, eTag, options = {}) {
    const { content, pageInstructions, attachments, originChannel } = options;
    
    // URL encode both the assignment ID and action ID to handle spaces and special characters
    const encodedAssignmentID = encodeURIComponent(assignmentID);
    const encodedActionID = encodeURIComponent(actionID);
    const url = `${this.baseUrl}/assignments/${encodedAssignmentID}/actions/${encodedActionID}/save`;

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
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
    });
  }

  /**
   * Get case attachments by case ID
   * @param {string} caseID - Full case handle to retrieve attachments from
   * @param {Object} options - Optional parameters
   * @param {boolean} options.includeThumbnails - When set to true, thumbnails are added as base64 encoded strings
   * @returns {Promise<Object>} API response with attachments list and metadata
   */
  async getCaseAttachments(caseID, options = {}) {
    const { includeThumbnails } = options;
    
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/attachments`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (includeThumbnails !== undefined) {
      queryParams.append('includeThumbnails', includeThumbnails.toString());
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
   * Add attachments to a case (POST /cases/{caseID}/attachments)
   * @param {string} caseID - Full case handle to attach files/URLs to
   * @param {Array} attachments - Array of attachment objects (files and/or URLs)
   * @returns {Promise<Object>} API response with success/error information
   */
  async addCaseAttachments(caseID, attachments) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/attachments`;

    // Build request body with attachments array
    const requestBody = {
      attachments
    };

    return await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Get attachment categories for a case by case ID
   * @param {string} caseID - Full case handle to retrieve attachment categories for
   * @param {Object} options - Optional parameters
   * @param {string} options.type - Filter for attachment type: "File" or "URL" (case insensitive, default: "File")
   * @returns {Promise<Object>} API response with attachment categories list and permissions
   */
  async getCaseAttachmentCategories(caseID, options = {}) {
    const { type } = options;
    
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/attachment_categories`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (type) {
      queryParams.append('type', type);
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
   * Get attachment content by attachment ID
   * @param {string} attachmentID - Link-Attachment instance pzInsKey (attachment ID)
   * @returns {Promise<Object>} API response with attachment content and headers
   */
  async getAttachmentContent(attachmentID) {
    // URL encode the attachment ID to handle spaces and special characters
    const encodedAttachmentID = encodeURIComponent(attachmentID);
    const url = `${this.baseUrl}/attachments/${encodedAttachmentID}`;

    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*', // Accept any content type since we get different types (base64, URL, HTML)
        'x-origin-channel': 'Web'
      };

      // Make request
      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleAttachmentContentErrorResponse(response);
      }

      // Get response headers for content type detection
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Get content as text (works for base64, URL, and HTML)
      const content = await response.text();
      
      return {
        success: true,
        data: content,
        headers: responseHeaders,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to retrieve attachment content from Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Delete an attachment by attachment ID
   * @param {string} attachmentID - Link-Attachment instance pzInsKey (attachment ID)
   * @returns {Promise<Object>} API response with success/error information
   */
  async deleteAttachment(attachmentID) {
    // URL encode the attachment ID to handle spaces and special characters
    const encodedAttachmentID = encodeURIComponent(attachmentID);
    const url = `${this.baseUrl}/attachments/${encodedAttachmentID}`;

    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-origin-channel': 'Web'
      };

      // Make DELETE request
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleAttachmentDeleteErrorResponse(response);
      }

      // Successful deletion - API returns no content (200 with empty body)
      return {
        success: true,
        data: {}, // Empty response body for successful deletion
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to delete attachment from Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Update attachment name and category by attachment ID
   * @param {string} attachmentID - Link-Attachment instance pzInsKey (attachment ID)
   * @param {Object} updateData - Update data
   * @param {string} updateData.name - New name of the attachment
   * @param {string} updateData.category - New attachment category
   * @returns {Promise<Object>} API response with success/error information
   */
  async updateAttachment(attachmentID, updateData) {
    const { name, category } = updateData;
    
    // URL encode the attachment ID to handle spaces and special characters
    const encodedAttachmentID = encodeURIComponent(attachmentID);
    const url = `${this.baseUrl}/attachments/${encodedAttachmentID}`;

    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-origin-channel': 'Web'
      };

      // Build request body
      const requestBody = {
        name,
        category
      };

      // Make PATCH request
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestBody),
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleAttachmentUpdateErrorResponse(response);
      }

      // Successful update - API returns success message
      const responseText = await response.text();
      
      return {
        success: true,
        data: { message: responseText }, // Wrap the success message
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to update attachment in Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Upload a file as temporary attachment to Pega
   * @param {Buffer} fileBuffer - File content as Buffer
   * @param {Object} options - Upload options
   * @param {string} options.fileName - Original filename with extension
   * @param {string} options.mimeType - MIME type of the file
   * @param {boolean} options.appendUniqueIdToFileName - Whether to append unique ID to filename
   * @returns {Promise<Object>} API response with temporary attachment ID
   */
  async uploadAttachment(fileBuffer, options = {}) {
    const { fileName, mimeType, appendUniqueIdToFileName = true } = options;
    
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add form fields as specified in Pega API documentation
      formData.append('appendUniqueIdToFileName', appendUniqueIdToFileName.toString());
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType,
        knownLength: fileBuffer.length
      });

      const url = `${this.baseUrl}/attachments/upload`;

      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers for multipart form data
      // Note: Do not set Content-Type header manually - FormData will set it with boundary
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-origin-channel': 'Web',
        ...formData.getHeaders() // This adds the correct Content-Type with boundary
      };

      // Make the multipart form data request
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleAttachmentErrorResponse(response);
      }

      // Parse successful response
      const data = await response.json();
      
      return {
        success: true,
        data,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to upload attachment to Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Get data view metadata by data view ID
   * @param {string} dataViewID - ID of the data view to retrieve metadata for
   * @returns {Promise<Object>} API response with data view metadata including parameters and queryable fields
   */
  async getDataViewMetadata(dataViewID) {
    // URL encode the data view ID to handle spaces and special characters
    const encodedDataViewID = encodeURIComponent(dataViewID);
    const url = `${this.baseUrl}/data_views/${encodedDataViewID}/metadata`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get list of available data objects
   * @param {Object} options - Optional parameters
   * @param {string} options.type - Data object type filter ("data" or "case")
   * @returns {Promise<Object>} API response with data objects list
   */
  async getDataObjects(options = {}) {
    const { type } = options;
    
    let url = `${this.baseUrl}/data_objects`;

    // Add query parameter if provided
    const queryParams = new URLSearchParams();
    if (type) {
      queryParams.append('type', type);
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
   * Fully update an existing data record
   * @param {string} dataViewID - ID of savable Data Page
   * @param {Object} data - Data object containing properties to update
   * @returns {Promise<Object>} API response with updated data record
   */
  async updateDataRecordFull(dataViewID, data) {
    // URL encode the data view ID to handle spaces and special characters
    const encodedDataViewID = encodeURIComponent(dataViewID);
    const url = `${this.baseUrl}/data/${encodedDataViewID}`;

    // Build request body
    const requestBody = { data };

    return await this.makeRequest(url, {
      method: 'PUT',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Partially update an existing data record
   * @param {string} dataViewID - ID of savable Data Page
   * @param {Object} data - Data object containing properties to update
   * @param {Object} options - Optional parameters
   * @param {string} options.eTag - eTag unique value for optimistic locking
   * @param {Array} options.pageInstructions - Page-related operations for embedded pages
   * @returns {Promise<Object>} API response with updated data record
   */
  async updateDataRecordPartial(dataViewID, data, options = {}) {
    const { eTag, pageInstructions } = options;
    
    // URL encode the data view ID to handle spaces and special characters
    const encodedDataViewID = encodeURIComponent(dataViewID);
    const url = `${this.baseUrl}/data/${encodedDataViewID}`;

    // Build request body
    const requestBody = { data };
    
    // Add optional pageInstructions if provided
    if (pageInstructions) {
      requestBody.pageInstructions = pageInstructions;
    }

    // Prepare headers
    const headers = {
      'x-origin-channel': 'Web'
    };

    // Add eTag header for optimistic locking if provided
    if (eTag) {
      headers['if-match'] = eTag;
    }

    return await this.makeRequest(url, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Delete a data record
   * @param {string} dataViewID - ID of savable Data Page
   * @param {string} dataViewParameters - Primary key(s) as input to uniquely identify the data record to delete
   * @returns {Promise<Object>} API response with deletion result
   */
  async deleteDataRecord(dataViewID, dataViewParameters) {
    // URL encode the data view ID to handle spaces and special characters
    const encodedDataViewID = encodeURIComponent(dataViewID);
    // URL encode the data view parameters to handle special characters
    const encodedDataViewParameters = encodeURIComponent(dataViewParameters);
    const url = `${this.baseUrl}/data/${encodedDataViewID}?dataViewParameters=${encodedDataViewParameters}`;

    return await this.makeRequest(url, {
      method: 'DELETE',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get list data view with advanced querying capabilities
   * @param {string} dataViewID - ID of the data view to retrieve data from
   * @param {Object} requestBody - Request body containing query parameters, paging, etc.
   * @param {Object} requestBody.dataViewParameters - Optional parameters for the data view
   * @param {Object} requestBody.query - Optional query object for filtering, sorting, aggregation
   * @param {Array} requestBody.query.select - Array of field objects to select
   * @param {Array} requestBody.query.sortBy - Array of sorting configurations
   * @param {Object} requestBody.query.filter - Complex filtering conditions
   * @param {Object} requestBody.query.aggregations - Aggregation definitions
   * @param {boolean} requestBody.query.distinctResultsOnly - Return only distinct results
   * @param {Object} requestBody.paging - Pagination configuration
   * @param {boolean} requestBody.useExtendedTimeout - Use extended 45-second timeout
   * @returns {Promise<Object>} API response with data view results
   */
  async getListDataView(dataViewID, requestBody = {}) {
    // URL encode the data view ID to handle spaces and special characters
    const encodedDataViewID = encodeURIComponent(dataViewID);
    const url = `${this.baseUrl}/data_views/${encodedDataViewID}`;

    return await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Get data view count with advanced querying capabilities
   * @param {string} dataViewID - ID of the data view to count results for
   * @param {Object} requestBody - Request body containing query parameters, paging, etc.
   * @param {Object} requestBody.dataViewParameters - Optional parameters for the data view
   * @param {Object} requestBody.query - Optional query object for filtering, aggregation, and field selection
   * @param {Array} requestBody.query.select - Array of field, aggregation, or calculation objects
   * @param {Object} requestBody.query.filter - Complex filtering conditions
   * @param {Object} requestBody.query.aggregations - Aggregation definitions
   * @param {Object} requestBody.query.calculations - Calculation definitions
   * @param {boolean} requestBody.query.distinctResultsOnly - Count only distinct results
   * @param {Object} requestBody.paging - Pagination configuration that affects count calculation
   * @returns {Promise<Object>} API response with count results (resultCount, totalCount, hasMoreResults, fetchDateTime)
   */
  async getDataViewCount(dataViewID, requestBody = {}) {
    // URL encode the data view ID to handle spaces and special characters
    const encodedDataViewID = encodeURIComponent(dataViewID);
    const url = `${this.baseUrl}/data_views/${encodedDataViewID}/count`;

    return await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Change case to next stage in primary stage sequence
   * @param {string} caseID - Full case handle
   * @param {string} eTag - eTag unique value for optimistic locking (required)
   * @param {Object} options - Optional parameters
   * @param {string} options.viewType - Type of view data to return ("none", "form", "page")
   * @param {boolean} options.cleanupProcesses - Whether to cleanup processes of previous stage
   * @returns {Promise<Object>} API response with stage navigation results
   */
  async changeToNextStage(caseID, eTag, options = {}) {
    const { viewType, cleanupProcesses } = options;
    
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/stages/next`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
    }
    if (cleanupProcesses !== undefined) {
      queryParams.append('cleanupProcesses', cleanupProcesses.toString());
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    // Prepare headers - if-match is required for this operation
    const headers = {
      'if-match': eTag, // Required eTag header for optimistic locking
      'x-origin-channel': 'Web'
    };

    return await this.makeRequest(url, {
      method: 'POST',
      headers: headers
      // No request body for this endpoint
    });
  }

  /**
   * Change case to specified stage by stage ID
   * @param {string} caseID - Full case handle
   * @param {string} stageID - Stage ID to navigate to (e.g., "PRIM1", "ALT1")
   * @param {string} eTag - eTag unique value for optimistic locking (required)
   * @param {Object} options - Optional parameters
   * @param {string} options.viewType - Type of view data to return ("none", "form", "page")
   * @param {boolean} options.cleanupProcesses - Whether to cleanup processes of previous stage
   * @returns {Promise<Object>} API response with stage navigation results
   */
  async changeToStage(caseID, stageID, eTag, options = {}) {
    const { viewType, cleanupProcesses } = options;
    
    // URL encode both the case ID and stage ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedStageID = encodeURIComponent(stageID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/stages/${encodedStageID}`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
    }
    if (cleanupProcesses !== undefined) {
      queryParams.append('cleanupProcesses', cleanupProcesses.toString());
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    // Prepare headers - if-match is required for this operation
    const headers = {
      'if-match': eTag, // Required eTag header for optimistic locking
      'x-origin-channel': 'Web'
    };

    return await this.makeRequest(url, {
      method: 'PUT',
      headers: headers
      // No request body for this endpoint
    });
  }

  /**
   * Get related cases for a specific case
   * @param {string} caseID - Full case handle to retrieve related cases for
   * @returns {Promise<Object>} API response with related cases list and metadata
   */
  async getRelatedCases(caseID) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/related_cases`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Create relationships between cases
   * @param {string} caseID - Primary case ID to relate other cases to
   * @param {Array} cases - Array of case objects with ID properties to relate
   * @returns {Promise<Object>} API response with multi-status results (207 status)
   */
  async relateCases(caseID, cases) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/related_cases`;

    // Build request body
    const requestBody = {
      cases
    };

    return await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Delete a related case relationship
   * @param {string} caseID - Primary case ID from which to remove the related case
   * @param {string} relatedCaseID - Related case ID to be removed from the primary case
   * @returns {Promise<Object>} API response with deletion result
   */
  async deleteRelatedCase(caseID, relatedCaseID) {
    // URL encode both case IDs to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedRelatedCaseID = encodeURIComponent(relatedCaseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/related_cases/${encodedRelatedCaseID}`;

    return await this.makeRequest(url, {
      method: 'DELETE',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get document content by document ID
   * @param {string} documentID - Document ID to retrieve content for
   * @returns {Promise<Object>} API response with base64 encoded document content and headers
   */
  async getDocumentContent(documentID) {
    // URL encode the document ID to handle spaces and special characters
    const encodedDocumentID = encodeURIComponent(documentID);
    const url = `${this.baseUrl}/documents/${encodedDocumentID}`;

    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/plain', // Document API returns base64 content as text/plain
        'x-origin-channel': 'Web'
      };

      // Make request
      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleDocumentErrorResponse(response);
      }

      // Get response headers for content metadata
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Get content as text (base64 encoded)
      const content = await response.text();
      
      return {
        success: true,
        data: content,
        headers: responseHeaders,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to retrieve document content from Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Remove a document from a case
   * @param {string} caseID - Full case handle from which to remove the document
   * @param {string} documentID - Document ID to be removed from the case
   * @returns {Promise<Object>} API response with success/error information
   */
  async removeCaseDocument(caseID, documentID) {
    // URL encode both the case ID and document ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedDocumentID = encodeURIComponent(documentID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/documents/${encodedDocumentID}`;

    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-origin-channel': 'Web'
      };

      // Make DELETE request
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleRemoveCaseDocumentErrorResponse(response);
      }

      // Get response headers (especially cache-control)
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Successful deletion - API returns 200 with cache-control header
      return {
        success: true,
        data: {}, // Empty response body for successful deletion
        headers: responseHeaders,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to remove document from case via Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Get case followers by case ID
   * @param {string} caseID - Full case handle to retrieve followers for
   * @returns {Promise<Object>} API response with followers list and metadata
   */
  async getCaseFollowers(caseID) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/followers`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Add followers to a case
   * @param {string} caseID - Full case handle to add followers to
   * @param {Array} users - Array of user objects with ID properties
   * @returns {Promise<Object>} API response with multi-status information (207)
   */
  async addCaseFollowers(caseID, users) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/followers`;

    // Build request body with users array as per OpenAPI spec
    const requestBody = {
      users
    };

    return await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Delete a follower from a case
   * @param {string} caseID - Full case handle to remove follower from
   * @param {string} followerID - User ID of the follower to remove
   * @returns {Promise<Object>} API response with success/error information
   */
  async deleteCaseFollower(caseID, followerID) {
    // URL encode both the case ID and follower ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedFollowerID = encodeURIComponent(followerID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/followers/${encodedFollowerID}`;

    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-origin-channel': 'Web'
      };

      // Make DELETE request
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleFollowerDeleteErrorResponse(response);
      }

      // Get response headers (especially cache-control)
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Successful deletion - API returns 200 with cache-control header
      return {
        success: true,
        data: {}, // Empty response body for successful deletion
        headers: responseHeaders,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to delete follower from case via Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Get participant roles for a case by case ID
   * @param {string} caseID - Full case handle to retrieve participant roles for
   * @returns {Promise<Object>} API response with participant roles list and metadata
   */
  async getParticipantRoles(caseID) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/participant_roles`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Get participant role details by case ID and participant role ID
   * @param {string} caseID - Full case handle to retrieve participant role details from
   * @param {string} participantRoleID - Participant role ID to get details for
   * @param {Object} options - Optional parameters
   * @param {string} options.viewType - Type of view data to return ("form" or "none", default: "form")
   * @returns {Promise<Object>} API response with participant role details and metadata
   */
  async getParticipantRoleDetails(caseID, participantRoleID, options = {}) {
    const { viewType } = options;
    
    // URL encode both the case ID and participant role ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedParticipantRoleID = encodeURIComponent(participantRoleID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/participant_roles/${encodedParticipantRoleID}`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
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
   * Get case participants by case ID
   * @param {string} caseID - Full case handle to retrieve participants from
   * @returns {Promise<Object>} API response with participants list and metadata
   */
  async getCaseParticipants(caseID) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/participants`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Create participant in case
   * @param {string} caseID - Full case handle to add participant to
   * @param {Object} options - Creation options
   * @param {string} options.eTag - Required eTag for optimistic locking
   * @param {Object} options.content - Participant data object
   * @param {string} options.participantRoleID - Role ID to assign
   * @param {string} options.viewType - View type ("form" or "none")
   * @param {Array} options.pageInstructions - Optional page instructions
   * @returns {Promise<Object>} API response with created participant details
   */
  async createCaseParticipant(caseID, options = {}) {
    const { eTag, content, participantRoleID, viewType, pageInstructions } = options;
    
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/participants`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    // Build request body
    const requestBody = {
      content,
      participantRoleID
    };

    // Add optional parameters if provided
    if (pageInstructions) {
      requestBody.pageInstructions = pageInstructions;
    }

    // Prepare headers
    const headers = {
      'if-match': eTag, // Required header for optimistic locking
      'x-origin-channel': 'Web'
    };

    return await this.makeRequest(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Get participant details by case ID and participant ID
   * @param {string} caseID - Full case handle to retrieve participant from
   * @param {string} participantID - Participant ID to get details for
   * @param {Object} options - Optional parameters
   * @param {string} options.viewType - Type of view data to return ("form" or "none", default: "form")
   * @returns {Promise<Object>} API response with participant details and metadata
   */
  async getParticipant(caseID, participantID, options = {}) {
    const { viewType } = options;
    
    // URL encode both the case ID and participant ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedParticipantID = encodeURIComponent(participantID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/participants/${encodedParticipantID}`;

    // Add query parameters if provided
    const queryParams = new URLSearchParams();
    if (viewType) {
      queryParams.append('viewType', viewType);
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
   * Delete a participant from a case
   * @param {string} caseID - Full case handle to remove participant from
   * @param {string} participantID - Participant ID to remove
   * @param {string} eTag - Required eTag unique value for optimistic locking
   * @returns {Promise<Object>} API response with success/error information
   */
  async deleteParticipant(caseID, participantID, eTag) {
    // URL encode both the case ID and participant ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedParticipantID = encodeURIComponent(participantID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/participants/${encodedParticipantID}`;

    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'if-match': eTag, // Required eTag header for optimistic locking
        'x-origin-channel': 'Web'
      };

      // Make DELETE request
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleParticipantDeleteErrorResponse(response);
      }

      // Get response headers (especially etag)
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Successful deletion - API returns 200 with etag header
      return {
        success: true,
        data: {}, // Empty response body for successful deletion
        headers: responseHeaders,
        eTag: response.headers.get('etag'), // Capture new eTag
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to delete participant from case via Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Update participant details by case ID and participant ID
   * @param {string} caseID - Full case handle containing the participant
   * @param {string} participantID - Participant ID to update
   * @param {string} eTag - Required eTag unique value for optimistic locking
   * @param {Object} options - Optional parameters
   * @param {Object} options.content - Participant data object with properties to update
   * @param {Array} options.pageInstructions - Page-related operations for embedded pages
   * @param {string} options.viewType - Type of view data to return ("form" or "none", default: "form")
   * @returns {Promise<Object>} API response with updated participant details
   */
  async updateParticipant(caseID, participantID, eTag, options = {}) {
    const { content, pageInstructions, viewType } = options;
    
    // URL encode both the case ID and participant ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedParticipantID = encodeURIComponent(participantID);
    let url = `${this.baseUrl}/cases/${encodedCaseID}/participants/${encodedParticipantID}`;

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

    // Prepare headers
    const headers = {
      'if-match': eTag, // Required eTag header for optimistic locking
      'x-origin-channel': 'Web'
    };

    return await this.makeRequest(url, {
      method: 'PATCH',
      headers: headers,
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
    });
  }


  /**
   * Get case tags by case ID
   * @param {string} caseID - Full case handle to retrieve tags from
   * @returns {Promise<Object>} API response with tags list
   */
  async getCaseTags(caseID) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/tags`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  /**
   * Add multiple tags to a case
   * @param {string} caseID - Full case handle to add tags to
   * @param {Array} tags - Array of tag objects with Name properties
   * @returns {Promise<Object>} API response with multi-status results (207)
   */
  async addCaseTags(caseID, tags) {
    // URL encode the case ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/tags`;

    // Build request body with tags array as per OpenAPI spec
    const requestBody = {
      tags
    };

    return await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Delete a specific tag from a case
   * @param {string} caseID - Full case handle to delete tag from
   * @param {string} tagID - Tag ID to be deleted from the case
   * @returns {Promise<Object>} API response with success/error information
   */
  async deleteCaseTag(caseID, tagID) {
    // URL encode both the case ID and tag ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedTagID = encodeURIComponent(tagID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/tags/${encodedTagID}`;

    try {
      // Get OAuth2 token
      const token = await this.oauth2Client.getAccessToken();
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'x-origin-channel': 'Web'
      };

      // Make DELETE request
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        timeout: config.pega.requestTimeout || 30000
      });

      // Handle non-2xx responses
      if (!response.ok) {
        return await this.handleTagDeleteErrorResponse(response);
      }

      // Get response headers (especially cache-control)
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Successful deletion - API returns 200 with string response
      const responseText = await response.text();
      
      return {
        success: true,
        data: { message: responseText }, // Wrap the response text
        headers: responseHeaders,
        status: response.status,
        statusText: response.statusText
      };

    } catch (error) {
      // Handle network and other errors
      return {
        success: false,
        error: {
          type: 'CONNECTION_ERROR',
          message: 'Failed to delete tag from case via Pega API',
          details: error.message,
          originalError: error
        }
      };
    }
  }

  /**
   * Navigate assignment to previous step in screen flow or multi-step form
   * @param {string} assignmentID - Full handle of assignment (e.g., "ASSIGN-WORKLIST PBANK-LOAN-WORK V-76003!REVIEW_FLOW")
   * @param {string} eTag - Required eTag for optimistic locking from previous assignment API call
   * @param {Object} options - Optional parameters
   * @param {Object} options.content - Property values to set during navigation
   * @param {Array} options.pageInstructions - Page operations for embedded pages, page lists, or page groups
   * @param {Array} options.attachments - Attachments to add/delete during navigation
   * @param {string} options.viewType - UI resources type ("none", "form", "page", default: "none")
   * @returns {Promise<Object>} API response with previous step details and navigation context including breadcrumb information
   */
  async navigateAssignmentPrevious(assignmentID, eTag, options = {}) {
    const { content, pageInstructions, attachments, viewType } = options;
    
    // URL encode assignment ID to handle spaces and special characters
    const encodedAssignmentID = encodeURIComponent(assignmentID);
    let url = `${this.baseUrl}/assignments/${encodedAssignmentID}/navigation_steps/previous`;

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
    if (content) requestBody.content = content;
    if (pageInstructions) requestBody.pageInstructions = pageInstructions;  
    if (attachments) requestBody.attachments = attachments;

    // Prepare headers - if-match is required for this operation
    const headers = {
      'if-match': eTag, // Required header for optimistic locking
      'x-origin-channel': 'Web' // Default origin channel
    };

    return await this.makeRequest(url, {
      method: 'PATCH',
      headers: headers,
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
    });
  }

  /**
   * Jump to a specific step within an assignment's navigation flow
   * @param {string} assignmentID - Full handle of assignment (e.g., "ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW")
   * @param {string} stepID - Navigation step path to jump to (e.g., "SubProcessSF1_ASSIGNMENT66", "ProcessStep_123")
   * @param {string} eTag - Required eTag for optimistic locking from previous assignment API call
   * @param {Object} options - Optional parameters
   * @param {Object} options.content - Property values to set during navigation to the specified step
   * @param {Array} options.pageInstructions - Page operations for embedded pages, page lists, or page groups
   * @param {Array} options.attachments - Attachments to add/delete during step navigation
   * @param {string} options.viewType - UI resources type ("none", "form", "page", default: "form")
   * @returns {Promise<Object>} API response with step details and navigation context including breadcrumb information
   */
  async jumpToAssignmentStep(assignmentID, stepID, eTag, options = {}) {
    const { content, pageInstructions, attachments, viewType } = options;
    
    // URL encode both assignment ID and step ID to handle spaces and special characters
    const encodedAssignmentID = encodeURIComponent(assignmentID);
    const encodedStepID = encodeURIComponent(stepID);
    let url = `${this.baseUrl}/assignments/${encodedAssignmentID}/navigation_steps/${encodedStepID}`;

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
    if (content) requestBody.content = content;
    if (pageInstructions) requestBody.pageInstructions = pageInstructions;
    if (attachments) requestBody.attachments = attachments;

    // Prepare headers - if-match is required for this operation
    const headers = {
      'if-match': eTag, // Required header for optimistic locking
      'x-origin-channel': 'Web' // Default origin channel
    };

    return await this.makeRequest(url, {
      method: 'PATCH',
      headers: headers,
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
    });
  }

  /**
   * Recalculate calculated fields & whens for the current assignment action form
   * @param {string} assignmentID - Full handle of assignment (e.g., "ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW")
   * @param {string} actionID - Name of the assignment action - ID of the flow action rule
   * @param {string} eTag - Required eTag unique value representing the most recent save date time of the case
   * @param {Object} calculations - Required object containing fields and when conditions to recalculate
   * @param {Array} calculations.fields - Array of field objects with name and context properties to recalculate
   * @param {Array} calculations.whens - Array of when condition objects with name and context properties to evaluate
   * @param {Object} options - Optional parameters
   * @param {Object} options.content - Property values to merge into case during recalculation process
   * @param {Array} options.pageInstructions - Page operations for embedded pages, page lists, or page groups before recalculation
   * @returns {Promise<Object>} API response with recalculated field values, when condition results, and updated UI resources
   */
  async recalculateAssignmentFields(assignmentID, actionID, eTag, calculations, options = {}) {
    const { content, pageInstructions } = options;
    
    // URL encode both assignment ID and action ID to handle spaces and special characters
    const encodedAssignmentID = encodeURIComponent(assignmentID);
    const encodedActionID = encodeURIComponent(actionID);
    const url = `${this.baseUrl}/assignments/${encodedAssignmentID}/actions/${encodedActionID}/recalculate`;

    // Build request body - calculations is required
    const requestBody = {
      calculations
    };

    // Add optional parameters if provided
    if (content) {
      requestBody.content = content;
    }
    if (pageInstructions) {
      requestBody.pageInstructions = pageInstructions;
    }

    // Prepare headers - if-match is required for this operation
    const headers = {
      'if-match': eTag, // Required eTag header for optimistic locking
      'x-origin-channel': 'Web' // Default origin channel
    };

    return await this.makeRequest(url, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
  }

  /**
   * Recalculate calculated fields & whens for case action form
   * @param {string} caseID - Full case handle
   * @param {string} actionID - Case action ID  
   * @param {string} eTag - Required eTag for optimistic locking
   * @param {Object} calculations - Required calculations object with fields/whens arrays
   * @param {Object} options - Optional parameters (content, pageInstructions, originChannel)
   * @returns {Promise<Object>} API response with recalculated values and UI updates
   */
  async recalculateCaseActionFields(caseID, actionID, eTag, calculations, options = {}) {
    const { content, pageInstructions, originChannel } = options;
    
    // URL encode both case ID and action ID to handle spaces and special characters
    const encodedCaseID = encodeURIComponent(caseID);
    const encodedActionID = encodeURIComponent(actionID);
    const url = `${this.baseUrl}/cases/${encodedCaseID}/actions/${encodedActionID}/recalculate`;

    // Build request body - calculations is required
    const requestBody = {
      calculations
    };

    // Add optional parameters if provided
    if (content) {
      requestBody.content = content;
    }
    if (pageInstructions) {
      requestBody.pageInstructions = pageInstructions;
    }

    // Prepare headers - if-match is required for this operation
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

  /**
   * Handle error responses from attachment content retrieval API
   * @param {Response} response - HTTP response object  
   * @returns {Promise<Object>} Structured error response for attachment content
   */
  async handleAttachmentContentErrorResponse(response) {
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
      case 401:
        errorResponse.error.type = 'UNAUTHORIZED';
        errorResponse.error.message = 'Authentication failed';
        errorResponse.error.details = errorData.errors?.[0]?.message || 'Invalid or expired token';
        // Clear token cache on 401 to force refresh on next request
        this.oauth2Client.clearTokenCache();
        break;

      case 403:
        errorResponse.error.type = 'FORBIDDEN';
        errorResponse.error.message = 'Access denied to attachment';
        errorResponse.error.details = errorData.localizedValue || 'User is not allowed to access this attachment';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 404:
        errorResponse.error.type = 'NOT_FOUND';
        errorResponse.error.message = 'Attachment not found';
        errorResponse.error.details = errorData.localizedValue || 'The attachment cannot be found or is not available';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Internal server error retrieving attachment';
        errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server while retrieving attachment content';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error retrieving attachment content`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }

  /**
   * Handle error responses from attachment delete API
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response for attachment deletion
   */
  async handleAttachmentDeleteErrorResponse(response) {
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
      case 401:
        errorResponse.error.type = 'UNAUTHORIZED';
        errorResponse.error.message = 'Authentication failed';
        errorResponse.error.details = errorData.errors?.[0]?.message || 'Invalid or expired token';
        // Clear token cache on 401 to force refresh on next request
        this.oauth2Client.clearTokenCache();
        break;

      case 403:
        errorResponse.error.type = 'FORBIDDEN';
        errorResponse.error.message = 'Insufficient delete permissions';
        errorResponse.error.details = errorData.localizedValue || 'User is not allowed to delete this attachment';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 404:
        errorResponse.error.type = 'NOT_FOUND';
        errorResponse.error.message = 'Attachment not found';
        errorResponse.error.details = errorData.localizedValue || 'The attachment cannot be found or has already been deleted';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Internal server error during attachment deletion';
        errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server while deleting the attachment';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error deleting attachment`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }

  /**
   * Handle error responses from attachment upload API
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response
   */
  async handleAttachmentErrorResponse(response) {
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
        // Check for specific attachment error types based on error message
        if (errorData.errorDetails && errorData.errorDetails.length > 0) {
          const errorDetail = errorData.errorDetails[0];
          
          if (errorDetail.message === 'Error_Virus_Scan_Fail') {
            errorResponse.error.type = 'VIRUS_SCAN_FAIL';
            errorResponse.error.message = 'File failed virus scan';
            errorResponse.error.details = errorDetail.localizedValue || 'Malicious file encountered';
          } else if (errorDetail.message === 'Error_Too_Large_To_Upload') {
            errorResponse.error.type = 'FILE_TOO_LARGE';
            errorResponse.error.message = 'File size exceeds limit';
            errorResponse.error.details = errorDetail.localizedValue || 'File size should not exceed the configured limit';
          } else {
            errorResponse.error.type = 'BAD_REQUEST';
            errorResponse.error.message = 'Invalid file upload request';
            errorResponse.error.details = errorDetail.localizedValue || errorData.localizedValue || 'One or more inputs are invalid';
          }
        } else {
          errorResponse.error.type = 'BAD_REQUEST';
          errorResponse.error.message = 'Invalid file upload request';
          errorResponse.error.details = errorData.localizedValue || 'One or more inputs are invalid';
        }
        
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

      case 500:
        // Check for specific storage/database error types
        if (errorData.errorDetails && errorData.errorDetails.length > 0) {
          const errorDetail = errorData.errorDetails[0];
          
          if (errorDetail.localizedValue && errorDetail.localizedValue.includes('storage configuration')) {
            errorResponse.error.type = 'STORAGE_ERROR';
            errorResponse.error.message = 'External storage system error';
            errorResponse.error.details = errorDetail.localizedValue || "Couldn't upload file. Check storage configuration.";
          } else if (errorDetail.localizedValue && errorDetail.localizedValue.includes('DB configuration')) {
            errorResponse.error.type = 'DATABASE_ERROR';
            errorResponse.error.message = 'Database connection error';
            errorResponse.error.details = errorDetail.localizedValue || "Couldn't upload file. Check DB configuration.";
          } else {
            errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
            errorResponse.error.message = 'Internal server error during file upload';
            errorResponse.error.details = errorDetail.localizedValue || 'An error occurred while processing the file upload';
          }
        } else {
          errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
          errorResponse.error.message = 'Internal server error during file upload';
          errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server during file upload';
        }
        
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        // For other status codes, fall back to generic error handling
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error during file upload`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }

  /**
   * Handle error responses from attachment update API
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response for attachment update
   */
  async handleAttachmentUpdateErrorResponse(response) {
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
        errorResponse.error.message = 'Invalid attachment update request';
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
        errorResponse.error.message = 'Insufficient edit permissions';
        errorResponse.error.details = errorData.localizedValue || 'User is not allowed to edit this attachment or attachment category';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 404:
        errorResponse.error.type = 'NOT_FOUND';
        errorResponse.error.message = 'Attachment not found';
        errorResponse.error.details = errorData.localizedValue || 'The attachment cannot be found or the case is not accessible';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Internal server error during attachment update';
        errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server while updating the attachment';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error updating attachment`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }

  /**
   * Handle error responses from document content retrieval API
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response for document content
   */
  async handleDocumentErrorResponse(response) {
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
        errorResponse.error.message = 'Invalid document request';
        errorResponse.error.details = errorData.localizedValue || 'Invalid document ID or request parameters';
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
        errorResponse.error.message = 'Access denied to document';
        errorResponse.error.details = errorData.localizedValue || 'User is not allowed to access this document';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 404:
        errorResponse.error.type = 'NOT_FOUND';
        errorResponse.error.message = 'Document not found';
        errorResponse.error.details = errorData.localizedValue || 'The document cannot be found or is not available';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 424:
        errorResponse.error.type = 'FAILED_DEPENDENCY';
        errorResponse.error.message = 'Document dependency failure';
        errorResponse.error.details = errorData.localizedValue || 'A required dependency or pre-condition failed for document retrieval';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Internal server error retrieving document';
        errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server while retrieving document content';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error retrieving document content`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }

  /**
   * Handle error responses specific to bulk cases PATCH operations
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response for bulk cases operations
   */
  async handleBulkCasesErrorResponse(response) {
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
        errorResponse.error.message = 'Cases missing from the request body or empty';
        errorResponse.error.details = errorData.localizedValue || 'The request body does not contain any cases to process - there is no cases property, the cases property is an empty list, or one or more elements of the cases list does not contain the ID property.';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 401:
        errorResponse.error.type = 'UNAUTHORIZED';
        errorResponse.error.message = 'Authentication failed';
        errorResponse.error.details = errorData.errors?.[0]?.message || 'Invalid token or expired';
        // Clear token cache on 401 to force refresh on next request
        this.oauth2Client.clearTokenCache();
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Implementation resulted in an exception';
        errorResponse.error.details = errorData.localizedValue || 'An unhandled server exception occurs, for example, when unexpectedly failed to publish an event to asynchronously process in Launchpad.';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 501:
        errorResponse.error.type = 'NOT_IMPLEMENTED';
        errorResponse.error.message = 'No implementation for the sync runningMode currently present';
        errorResponse.error.details = errorData.localizedValue || 'The requestor does not specify the runningMode query parameter as async, or if they don\'t specify the runningMode query parameter at all. Currently, only the async runningMode is implemented. This response only applies to Pega Launchpad.';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        // Fall back to generic error handling for other status codes
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error during bulk cases operation`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }

  /**
   * Handle error responses from remove case document API
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response for document removal from case
   */
  async handleRemoveCaseDocumentErrorResponse(response) {
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
        errorResponse.error.message = 'Invalid document removal request';
        errorResponse.error.details = errorData.localizedValue || 'Invalid case ID or document ID parameters';
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
        errorResponse.error.message = 'Insufficient permissions to remove document';
        errorResponse.error.details = errorData.localizedValue || 'User is not allowed to remove documents from this case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 404:
        errorResponse.error.type = 'NOT_FOUND';
        errorResponse.error.message = 'Case or document not found';
        errorResponse.error.details = errorData.localizedValue || 'The case or document cannot be found, or the document is not linked to the specified case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Internal server error during document removal';
        errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server while removing the document from the case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error removing document from case`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }

  /**
   * Handle error responses from follower delete API
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response for follower deletion
   */
  async handleFollowerDeleteErrorResponse(response) {
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
      case 401:
        errorResponse.error.type = 'UNAUTHORIZED';
        errorResponse.error.message = 'Authentication failed';
        errorResponse.error.details = errorData.errors?.[0]?.message || 'Invalid or expired token';
        // Clear token cache on 401 to force refresh on next request
        this.oauth2Client.clearTokenCache();
        break;

      case 403:
        errorResponse.error.type = 'FORBIDDEN';
        errorResponse.error.message = 'No access to remove follower';
        errorResponse.error.details = errorData.localizedValue || 'User is not allowed to remove followers from this case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 404:
        errorResponse.error.type = 'NOT_FOUND';
        errorResponse.error.message = 'Case or follower not found';
        errorResponse.error.details = errorData.localizedValue || 'The case or follower cannot be found, or the user is not following this case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 409:
        errorResponse.error.type = 'CONFLICT';
        errorResponse.error.message = 'Conflict removing follower';
        errorResponse.error.details = errorData.localizedValue || 'A conflict occurred while removing the follower from the case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Internal server error during follower removal';
        errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server while removing the follower from the case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error removing follower from case`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }

  /**
   * Handle error responses from participant delete API
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response for participant deletion
   */
  async handleParticipantDeleteErrorResponse(response) {
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
        errorResponse.error.message = 'Invalid participant deletion request';
        errorResponse.error.details = errorData.localizedValue || 'Invalid case ID or participant ID parameters';
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
        errorResponse.error.message = 'No access to remove participant';
        errorResponse.error.details = errorData.localizedValue || 'User is not allowed to remove participants from this case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 404:
        errorResponse.error.type = 'NOT_FOUND';
        errorResponse.error.message = 'Case or participant not found';
        errorResponse.error.details = errorData.localizedValue || 'The case or participant cannot be found, or the participant is not associated with this case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 409:
        errorResponse.error.type = 'CONFLICT';
        errorResponse.error.message = 'Conflict removing participant';
        errorResponse.error.details = errorData.localizedValue || 'A conflict occurred while removing the participant from the case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 412:
        errorResponse.error.type = 'PRECONDITION_FAILED';
        errorResponse.error.message = 'eTag mismatch for participant deletion';
        errorResponse.error.details = errorData.localizedValue || 'The provided eTag value does not match the current participant state';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 423:
        errorResponse.error.type = 'LOCKED';
        errorResponse.error.message = 'Participant locked';
        errorResponse.error.details = errorData.localizedValue || 'The participant is currently locked and cannot be deleted';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Internal server error during participant removal';
        errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server while removing the participant from the case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error removing participant from case`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }

  /**
   * Handle error responses from tag delete API
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response for tag deletion
   */
  async handleTagDeleteErrorResponse(response) {
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
        errorResponse.error.message = 'Invalid tag deletion request';
        errorResponse.error.details = errorData.localizedValue || 'Invalid case ID or tag ID parameters';
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
        errorResponse.error.message = 'No access to remove tag';
        errorResponse.error.details = errorData.localizedValue || 'User is not allowed to remove tags from this case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 404:
        errorResponse.error.type = 'NOT_FOUND';
        errorResponse.error.message = 'Case or tag not found';
        errorResponse.error.details = errorData.localizedValue || 'The case or tag cannot be found, or the tag is not associated with this case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      case 500:
        errorResponse.error.type = 'INTERNAL_SERVER_ERROR';
        errorResponse.error.message = 'Internal server error during tag removal';
        errorResponse.error.details = errorData.localizedValue || 'An error occurred on the server while removing the tag from the case';
        if (errorData.errorDetails) {
          errorResponse.error.errorDetails = errorData.errorDetails;
        }
        break;

      default:
        errorResponse.error.type = 'HTTP_ERROR';
        errorResponse.error.message = `HTTP ${response.status} error removing tag from case`;
        errorResponse.error.details = errorData.message || errorData.localizedValue || response.statusText;
        break;
    }

    return errorResponse;
  }
}
