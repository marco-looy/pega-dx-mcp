import { BaseApiClient } from '../base-api-client.js';

/**
 * Traditional DX API (V1) Client
 *
 * Implements Pega's Traditional DX API (V1) with transformation to V2-like response structure
 * for consistency across the MCP server.
 *
 * Key V1 Characteristics:
 * - Base URL: /api/v1/
 * - Flat JSON response structures
 * - No eTag support (no optimistic locking)
 * - Different error response formats
 * - No UI metadata separation
 * - Limited to basic CRUD operations
 *
 * V1-Exclusive Features:
 * - GET /cases - Get all cases for authenticated user
 * - PUT /cases/{ID} - Direct case update
 * - GET /assignments - Get all assignments
 * - PUT /casetypes/{ID}/refresh - Refresh case type metadata
 *
 * @extends BaseApiClient
 */
export class PegaV1Client extends BaseApiClient {
  /**
   * Get API version identifier
   * @returns {string} 'v1'
   */
  getApiVersion() {
    return 'v1';
  }

  /**
   * Get base URL for V1 API
   * @returns {string} Base URL ending with /api/v1
   */
  getApiBaseUrl() {
    return `${this.config.pega.baseUrl}/prweb/api/v1`;
  }

  /**
   * Handle V1-specific error responses
   *
   * V1 Error Format:
   * {
   *   "pxObjClass": "Pega-API-CaseManagement",
   *   "errors": [
   *     {
   *       "ID": "Pega_API_019",
   *       "message": "Insufficient privilege",
   *       "pxObjClass": "Pega-API-Error"
   *     }
   *   ]
   * }
   *
   * @param {Response} response - HTTP response object
   * @returns {Promise<Object>} Structured error response
   */
  async handleErrorResponse(response) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // Can't read body twice - use status text as fallback
      errorData = { message: response.statusText || 'Unknown error' };
    }

    const errorResponse = {
      success: false,
      error: {
        status: response.status,
        statusText: response.statusText,
        apiVersion: 'v1'
      }
    };

    // V1 uses an errors array
    if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      const primaryError = errorData.errors[0];
      errorResponse.error.type = this.mapV1ErrorType(response.status, primaryError.ID);
      errorResponse.error.message = this.mapV1ErrorMessage(response.status);
      errorResponse.error.details = primaryError.message || 'Unknown error';
      errorResponse.error.errorCode = primaryError.ID;
      errorResponse.error.errorClass = errorData.pxObjClass;
      errorResponse.error.errors = errorData.errors;
    } else {
      // Fallback for non-standard error format
      errorResponse.error.type = 'HTTP_ERROR';
      errorResponse.error.message = `HTTP ${response.status} error`;
      errorResponse.error.details = errorData.message || response.statusText;
    }

    return errorResponse;
  }

  /**
   * Map V1 error code to error type
   * @private
   */
  mapV1ErrorType(statusCode, errorCode) {
    // Common error code mappings
    const errorCodeMap = {
      'Pega_API_001': 'BAD_REQUEST',
      'Pega_API_002': 'BAD_REQUEST',
      'Pega_API_003': 'NOT_FOUND',
      'Pega_API_019': 'FORBIDDEN',
      'Pega_API_020': 'NOT_FOUND',
      'Pega_API_023': 'NOT_FOUND'
    };

    if (errorCode && errorCodeMap[errorCode]) {
      return errorCodeMap[errorCode];
    }

    // Fallback to status code mapping
    const statusMap = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      500: 'INTERNAL_SERVER_ERROR'
    };

    return statusMap[statusCode] || 'HTTP_ERROR';
  }

  /**
   * Map V1 status code to user-friendly message
   * @private
   */
  mapV1ErrorMessage(statusCode) {
    const messageMap = {
      400: 'Invalid request parameters',
      401: 'Authentication failed',
      403: 'Access denied - insufficient privileges',
      404: 'Resource not found',
      409: 'Conflict error',
      500: 'Internal server error'
    };

    return messageMap[statusCode] || `HTTP ${statusCode} error`;
  }

  /**
   * Transform V1 case response to V2-like structure
   *
   * Extracts system properties and content to match V2's separated structure
   *
   * @param {Object} v1Case - V1 case response
   * @returns {Object} V2-like case response
   */
  transformCaseResponse(v1Case) {
    // System properties that go into caseInfo
    const systemProps = ['ID', 'status', 'urgency', 'stage', 'caseTypeID',
                         'parentCaseID', 'createTime', 'lastUpdateTime',
                         'createdBy', 'lastUpdatedBy', 'name'];

    const caseInfo = {};
    const content = {};

    // Separate system properties from content
    for (const [key, value] of Object.entries(v1Case)) {
      if (systemProps.includes(key)) {
        caseInfo[key] = value;
        // Convert urgency string to number if present
        if (key === 'urgency' && typeof value === 'string') {
          caseInfo[key] = parseInt(value) || 0;
        }
      } else if (!this.isSystemProperty(key)) {
        // Only include non-system properties in content
        content[key] = value;
      }
    }

    // Add content to caseInfo
    caseInfo.content = content;

    // Add assignments and actions if present
    if (v1Case.assignments) {
      caseInfo.assignments = v1Case.assignments;
    }
    if (v1Case.actions) {
      caseInfo.availableActions = v1Case.actions;
    }

    return {
      data: {
        caseInfo
      },
      eTag: null, // V1 doesn't support eTags
      uiResources: null // V1 doesn't separate UI resources
    };
  }

  /**
   * Transform V1 assignment response to V2-like structure
   *
   * @param {Object} v1Assignment - V1 assignment response
   * @returns {Object} V2-like assignment response
   */
  transformAssignmentResponse(v1Assignment) {
    const assignmentInfo = {
      ID: v1Assignment.ID,
      name: v1Assignment.name,
      type: v1Assignment.type,
      caseID: v1Assignment.caseID,
      instructions: v1Assignment.instructions
    };

    // Add actions if present
    if (v1Assignment.actions) {
      assignmentInfo.actions = v1Assignment.actions;
    }

    return {
      data: {
        assignmentInfo,
        caseInfo: v1Assignment.case ? {
          ID: v1Assignment.case.ID,
          status: v1Assignment.case.status
        } : null
      },
      eTag: null,
      uiResources: null
    };
  }

  // ========================================
  // CASES ENDPOINTS
  // ========================================

  /**
   * Get all cases created by authenticated user
   * V1 EXCLUSIVE - Not available in V2 (use Data Views instead)
   *
   * Note: Number of cases returned is controlled by pyMaxRecords DSS (default 500)
   *
   * @returns {Promise<Object>} Response with cases array
   * @throws {Error} If user lacks pxGetCases privilege
   *
   * @example
   * const result = await client.getAllCases();
   * console.log(result.data.cases.length);
   */
  async getAllCases() {
    const url = `${this.getApiBaseUrl()}/cases`;

    const response = await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });

    if (!response.success) {
      return response;
    }

    // Transform response for consistency
    return {
      success: true,
      data: {
        cases: response.data.cases.map(c => ({
          ID: c.ID,
          parentCaseID: c.parentCaseID,
          caseTypeID: c.caseTypeID,
          name: c.name,
          stage: c.stage,
          status: c.status,
          urgency: parseInt(c.urgency) || 0,
          createTime: c.createTime,
          createdBy: c.createdBy,
          lastUpdateTime: c.lastUpdateTime,
          lastUpdatedBy: c.lastUpdatedBy
        }))
      },
      metadata: {
        count: response.data.cases.length,
        maxRecords: 500, // From pyMaxRecords DSS
        apiVersion: 'v1'
      }
    };
  }

  /**
   * Create a new case
   *
   * @param {Object} options - Case creation options
   * @param {string} options.caseTypeID - Case type ID (required)
   * @param {string} [options.processID='pyStartCase'] - Process ID (V1 specific, default: pyStartCase)
   * @param {Object} [options.content={}] - Case content/data
   * @param {string} [options.parentCaseID] - Parent case ID for child cases
   * @returns {Promise<Object>} Response with created case ID and next assignment ID
   *
   * @example
   * const result = await client.createCase({
   *   caseTypeID: 'MyCo-PAC-Work-ExpenseReport',
   *   content: {
   *     EmployeeName: 'John Doe',
   *     ExpenseAmount: '500.00'
   *   }
   * });
   */
  async createCase(options = {}) {
    const { caseTypeID, processID = 'pyStartCase', content = {}, parentCaseID } = options;

    if (!caseTypeID) {
      return {
        success: false,
        error: {
          type: 'BAD_REQUEST',
          message: 'caseTypeID is required',
          details: 'caseTypeID parameter must be provided'
        }
      };
    }

    const url = `${this.getApiBaseUrl()}/cases`;

    const requestBody = {
      caseTypeID,
      processID,
      content
    };

    if (parentCaseID) {
      requestBody.parentCaseID = parentCaseID;
    }

    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'x-origin-channel': 'Web'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.success) {
      return response;
    }

    // Transform to V2-like structure
    return {
      success: true,
      data: {
        caseInfo: {
          ID: response.data.ID,
          nextAssignmentID: response.data.nextAssignmentID
        }
      },
      metadata: {
        apiVersion: 'v1'
      }
    };
  }

  /**
   * Get case by ID
   *
   * @param {string} caseID - Case ID
   * @param {Object} options - Optional parameters (unused in V1, kept for compatibility)
   * @returns {Promise<Object>} Case details in V2-like structure
   *
   * @example
   * const result = await client.getCase('MYCO-PAC-WORK E-26');
   */
  async getCase(caseID, options = {}) {
    const encodedID = this.encodeParam(caseID);
    const url = `${this.getApiBaseUrl()}/cases/${encodedID}`;

    const response = await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });

    if (!response.success) {
      return response;
    }

    // Transform to V2-like structure
    const transformed = this.transformCaseResponse(response.data);

    return {
      success: true,
      ...transformed,
      eTag: response.eTag || null  // Preserve eTag from response header
    };
  }

  /**
   * Update case
   * V1 EXCLUSIVE - V2 uses case actions instead
   *
   * Performs case-wide local action or stage-wide local action on the case.
   * If actionID is not specified, pyUpdateCaseDetails is performed by default.
   * If eTag is not provided, automatically fetches latest eTag from case.
   *
   * @param {string} caseID - Case ID
   * @param {Object} options - Update options
   * @param {Object} options.content - Updated content properties
   * @param {string} [options.actionID] - Optional action ID (defaults to pyUpdateCaseDetails)
   * @param {string} [options.eTag] - Optional eTag for optimistic locking. If not provided, automatically fetches latest eTag.
   * @param {Array} [options.pageInstructions] - Optional page-related operations
   * @param {Array} [options.attachments] - Optional attachments to add
   * @returns {Promise<Object>} Success response (204 No Content)
   *
   * @example
   * // Simple update (eTag auto-fetched)
   * const result = await client.updateCase('MYCO-PAC-WORK E-26', {
   *   content: {
   *     ExpenseAmount: '600.00',
   *     Status: 'Approved'
   *   }
   * });
   *
   * @example
   * // Update with manual eTag
   * const result = await client.updateCase('MYCO-PAC-WORK E-26', {
   *   content: { ExpenseAmount: '750.00' },
   *   eTag: '20250116T120000.000 GMT'
   * });
   *
   * @example
   * // Update with specific action
   * const result = await client.updateCase('MYCO-PAC-WORK E-26', {
   *   content: { Status: 'Approved' },
   *   actionID: 'ApproveCase'
   * });
   */
  async updateCase(caseID, options = {}) {
    const { content = {}, actionID, eTag, pageInstructions = [], attachments = [] } = options;

    // Auto-fetch eTag if not provided (V1 API requires eTag for updates)
    let finalETag = eTag;
    let autoFetchedETag = false;

    if (!finalETag) {
      console.log(`Auto-fetching latest eTag for case ${caseID}...`);
      const caseResponse = await this.getCase(caseID);

      if (!caseResponse.success) {
        return {
          success: false,
          error: {
            type: 'AUTO_FETCH_FAILED',
            message: 'Failed to auto-fetch eTag',
            details: caseResponse.error?.message || 'Could not retrieve case to obtain eTag',
            originalError: caseResponse.error
          }
        };
      }

      finalETag = caseResponse.eTag;
      autoFetchedETag = true;

      if (!finalETag) {
        return {
          success: false,
          error: {
            type: 'ETAG_MISSING',
            message: 'eTag required for case update',
            details: 'Auto-fetch succeeded but no eTag was returned from getCase. This may indicate a server issue.'
          }
        };
      }

      console.log(`Successfully auto-fetched eTag: ${finalETag}`);
    }

    const encodedID = this.encodeParam(caseID);
    let url = `${this.getApiBaseUrl()}/cases/${encodedID}`;

    // Add actionID as query parameter if provided
    if (actionID) {
      url += `?actionID=${encodeURIComponent(actionID)}`;
    }

    // Build request body
    const requestBody = {
      content
    };

    // Add pageInstructions if provided
    if (pageInstructions.length > 0) {
      requestBody.pageInstructions = pageInstructions;
    }

    // Add attachments if provided
    if (attachments.length > 0) {
      requestBody.attachments = attachments;
    }

    // Build headers with required eTag
    const headers = {
      'x-origin-channel': 'Web',
      'if-match': finalETag
    }

    const response = await this.makeRequest(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.success) {
      return response;
    }

    // PUT /cases/{ID} returns 204 No Content
    // Response data might be empty, so handle that case
    if (response.status === 204 || !response.data) {
      return {
        success: true,
        data: {
          message: 'Case updated successfully',
          caseID: caseID
        },
        eTag: response.eTag || null,  // New eTag from response header
        metadata: {
          statusCode: 204,
          apiVersion: 'v1',
          autoFetchedETag
        }
      };
    }

    // If response has data, transform it
    const transformed = this.transformCaseResponse(response.data);

    return {
      success: true,
      ...transformed,
      eTag: response.eTag || null,  // New eTag from response header
      metadata: {
        apiVersion: 'v1',
        autoFetchedETag
      }
    };
  }

  // ========================================
  // CASE TYPES ENDPOINTS
  // ========================================

  /**
   * Get list of case types that the user can create
   *
   * @returns {Promise<Object>} API response with case types list
   */
  async getCaseTypes() {
    const url = `${this.getApiBaseUrl()}/casetypes`;

    return await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'x-origin-channel': 'Web'
      }
    });
  }

  // ========================================
  // DATA ENDPOINTS
  // ========================================

  /**
   * Get list of available data objects
   * Note: V1 may not have this endpoint - providing stub for tool compatibility
   *
   * @param {Object} options - Optional parameters
   * @param {string} options.type - Data object type filter ("data" or "case")
   * @returns {Promise<Object>} API response with data objects list
   */
  async getDataObjects(options = {}) {
    // V1 may not support this endpoint - return error for now
    // TODO: Check if V1 has equivalent endpoint
    return {
      success: false,
      error: {
        type: 'NOT_SUPPORTED',
        message: 'getDataObjects is not supported in V1 API',
        details: 'This feature is only available in Constellation DX API (V2). V1 API does not provide data object introspection.'
      }
    };
  }

  /**
   * Get data view metadata by data view ID
   * Note: V1 may not have this endpoint - providing stub for tool compatibility
   *
   * @param {string} dataViewID - ID of the data view to retrieve metadata for
   * @returns {Promise<Object>} API response with data view metadata
   */
  async getDataViewMetadata(dataViewID) {
    // V1 may not support this endpoint - return error for now
    // TODO: Check if V1 has equivalent endpoint
    return {
      success: false,
      error: {
        type: 'NOT_SUPPORTED',
        message: 'getDataViewMetadata is not supported in V1 API',
        details: 'This feature is only available in Constellation DX API (V2). V1 API does not provide data view metadata introspection.'
      }
    };
  }

  // Additional V1 methods will be added as Stage 5 progresses
  // This provides a solid foundation for Stage 4 completion

  /**
   * Test connectivity with V1-specific ping
   * @override
   * @returns {Promise<Object>} Ping test results with V1 API info
   */
  async ping() {
    const result = await super.ping();

    // Add V1-specific notes
    if (result.success) {
      result.data.v1Notes = {
        features: [
          'GET /cases - List all cases',
          'PUT /cases/{ID} - Direct case update',
          'No eTag support',
          'Flat response structure'
        ],
        limitations: [
          'No participants support',
          'No followers support',
          'No tags support',
          'No stage navigation',
          'Maximum 500 cases per GET /cases'
        ]
      };
    }

    return result;
  }
}
