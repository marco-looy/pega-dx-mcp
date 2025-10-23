import { PegaV1Client } from './v1/client-v1.js';
import { PegaV2Client } from './v2/client-v2.js';
import { config } from '../config.js';

/**
 * Pega API Client Router
 *
 * Routes requests to version-specific API clients (V1 or V2) based on configuration.
 * Only ONE API version can be active at a time (version-exclusive architecture).
 *
 * Version Selection:
 * - Determined by PEGA_API_VERSION environment variable
 * - Supports session-based configuration override
 * - Default: v2 (Constellation DX API)
 *
 * Supported Versions:
 * - v1: Traditional DX API (Base URL: /api/v1/)
 *   - Features: getAllCases, updateCase, getAllAssignments
 *   - Limitations: No eTag support, no participants/followers/tags
 *
 * - v2: Constellation DX API (Base URL: /api/application/v2/)
 *   - Features: Full feature set with eTag, participants, followers, tags, etc.
 *   - Limitations: No getAllCases (use Data Views), no direct updateCase (use actions)
 *
 * @example
 * // Use default environment configuration
 * const client = new PegaClient();
 *
 * @example
 * // Use session-specific configuration
 * const sessionConfig = createSessionConfig({
 *   baseUrl: 'https://custom-pega.com',
 *   clientId: 'custom-client-id',
 *   clientSecret: 'custom-secret',
 *   apiVersion: 'v1'
 * });
 * const client = new PegaClient(sessionConfig);
 */
export class PegaClient {
  /**
   * Create router instance with version-specific client
   * @param {Object|null} sessionConfig - Optional session-specific configuration
   */
  constructor(sessionConfig = null) {
    // Use session config if provided, otherwise use environment config
    const clientConfig = sessionConfig || config;

    // Get API version from config
    const apiVersion = clientConfig.pega?.apiVersion || 'v2';

    // Create version-specific client
    if (apiVersion === 'v1') {
      this.client = new PegaV1Client(clientConfig);
      this.apiVersion = 'v1';
    } else if (apiVersion === 'v2') {
      this.client = new PegaV2Client(clientConfig);
      this.apiVersion = 'v2';
    } else {
      throw new Error(`Unsupported API version: ${apiVersion}. Supported versions: v1, v2`);
    }

    // Store configuration source for debugging
    this.configSource = sessionConfig ? 'session' : 'environment';

    console.log(`🔀 PegaClient router initialized: API ${this.apiVersion.toUpperCase()} (${this.configSource} config)`);
  }

  /**
   * Get current API version
   * @returns {string} API version ('v1' or 'v2')
   */
  getApiVersion() {
    return this.apiVersion;
  }

  /**
   * Check if a feature is available in the current API version
   * @param {string} feature - Feature name to check
   * @returns {boolean} True if feature is available
   */
  isFeatureAvailable(feature) {
    // V1-only features (not available in V2)
    const v1OnlyFeatures = [
      'getAllCases',      // V1: GET /cases, V2: Use Data Views
      'updateCase',       // V1: PUT /cases/{ID}, V2: Use case actions
      'getAllAssignments' // V1: GET /assignments, V2: Use Data Views
    ];

    // V2-only features (not available in V1)
    const v2OnlyFeatures = [
      'participants',         // Case participant management
      'followers',           // Case follower management
      'tags',                // Case tagging
      'relatedCases',        // Case relationships
      'stageNavigation',     // Stage-based navigation
      'bulkOperations',      // Bulk case operations
      'dataViewQuerying',    // Advanced data view queries
      'eTagSupport',         // Optimistic locking with eTags
      'uiMetadata'           // Separated UI resources
    ];

    if (this.apiVersion === 'v1') {
      // In V1, check if it's a V2-only feature
      return !v2OnlyFeatures.includes(feature);
    } else {
      // In V2, check if it's a V1-only feature
      return !v1OnlyFeatures.includes(feature);
    }
  }

  /**
   * Throw error for unsupported features
   * @private
   * @param {string} feature - Feature name
   * @param {string} method - Method name
   */
  throwUnsupportedFeatureError(feature, method) {
    if (this.apiVersion === 'v1') {
      throw new Error(
        `${method}() is not available in Traditional DX API (V1). ` +
        `This is a V2-only feature (${feature}). ` +
        `Set PEGA_API_VERSION=v2 to use this feature.`
      );
    } else {
      throw new Error(
        `${method}() is not available in Constellation DX API (V2). ` +
        `This is a V1-only feature (${feature}). ` +
        `Set PEGA_API_VERSION=v1 to use this feature.`
      );
    }
  }

  // ========================================
  // CONNECTIVITY METHODS
  // ========================================

  /**
   * Test connectivity and authentication
   * @returns {Promise<Object>} Ping test results
   */
  async ping() {
    return this.client.ping();
  }

  // ========================================
  // CASE METHODS
  // ========================================

  /**
   * Get all cases created by authenticated user
   * V1 EXCLUSIVE - Use Data Views in V2
   * @returns {Promise<Object>} Cases array
   */
  async getAllCases() {
    if (!this.isFeatureAvailable('getAllCases')) {
      this.throwUnsupportedFeatureError('getAllCases', 'getAllCases');
    }
    return this.client.getAllCases();
  }

  /**
   * Create a new case
   * @param {Object} options - Case creation options
   * @returns {Promise<Object>} Created case information
   */
  async createCase(options) {
    return this.client.createCase(options);
  }

  /**
   * Get case by ID
   * @param {string} caseID - Case ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Case details
   */
  async getCase(caseID, options = {}) {
    return this.client.getCase(caseID, options);
  }

  /**
   * Update case
   * V1 EXCLUSIVE - Use case actions in V2
   * @param {string} caseID - Case ID
   * @param {Object} content - Updated content
   * @returns {Promise<Object>} Updated case details
   */
  async updateCase(caseID, content) {
    if (!this.isFeatureAvailable('updateCase')) {
      this.throwUnsupportedFeatureError('updateCase', 'updateCase');
    }
    return this.client.updateCase(caseID, content);
  }

  /**
   * Delete case (only works for cases in create stage)
   * @param {string} caseID - Case ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCase(caseID) {
    return this.client.deleteCase(caseID);
  }

  /**
   * Get case view details
   * @param {string} caseID - Case ID
   * @param {string} viewID - View ID
   * @returns {Promise<Object>} View details
   */
  async getCaseView(caseID, viewID) {
    return this.client.getCaseView(caseID, viewID);
  }

  /**
   * Get case stages
   * @param {string} caseID - Case ID
   * @returns {Promise<Object>} Stages information
   */
  async getCaseStages(caseID) {
    return this.client.getCaseStages(caseID);
  }

  /**
   * Get case descendants
   * @param {string} caseID - Case ID
   * @returns {Promise<Object>} Descendant cases
   */
  async getCaseDescendants(caseID) {
    return this.client.getCaseDescendants(caseID);
  }

  /**
   * Get case ancestors
   * @param {string} caseID - Case ID
   * @returns {Promise<Object>} Ancestor cases
   */
  async getCaseAncestors(caseID) {
    return this.client.getCaseAncestors(caseID);
  }

  /**
   * Get case action details
   * @param {string} caseID - Case ID
   * @param {string} actionID - Action ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Action details
   */
  async getCaseAction(caseID, actionID, options = {}) {
    return this.client.getCaseAction(caseID, actionID, options);
  }

  /**
   * Perform case action
   * @param {string} caseID - Case ID
   * @param {string} actionID - Action ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Action result
   */
  async performCaseAction(caseID, actionID, options = {}) {
    return this.client.performCaseAction(caseID, actionID, options);
  }

  /**
   * Get case view calculated fields
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} viewID - View ID
   * @param {Object} calculations - Calculations object
   * @returns {Promise<Object>} Calculated field results
   */
  async getCaseViewCalculatedFields(caseID, viewID, calculations) {
    if (!this.isFeatureAvailable('uiMetadata')) {
      this.throwUnsupportedFeatureError('uiMetadata', 'getCaseViewCalculatedFields');
    }
    return this.client.getCaseViewCalculatedFields(caseID, viewID, calculations);
  }

  /**
   * Recalculate case action fields
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} actionID - Action ID
   * @param {string} eTag - ETag for optimistic locking
   * @param {Object} calculations - Calculations object
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Recalculation results
   */
  async recalculateCaseActionFields(caseID, actionID, eTag, calculations, options = {}) {
    if (!this.isFeatureAvailable('eTagSupport')) {
      this.throwUnsupportedFeatureError('eTagSupport', 'recalculateCaseActionFields');
    }
    return this.client.recalculateCaseActionFields(caseID, actionID, eTag, calculations, options);
  }

  /**
   * Refresh case action
   * @param {string} caseID - Case ID
   * @param {string} actionID - Action ID
   * @param {string} eTag - ETag for optimistic locking (V2 only)
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Refresh results
   */
  async refreshCaseAction(caseID, actionID, eTag, options = {}) {
    return this.client.refreshCaseAction(caseID, actionID, eTag, options);
  }

  /**
   * Release case lock
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Release result
   */
  async releaseCaseLock(caseID, options = {}) {
    if (!this.isFeatureAvailable('eTagSupport')) {
      this.throwUnsupportedFeatureError('eTagSupport', 'releaseCaseLock');
    }
    return this.client.releaseCaseLock(caseID, options);
  }

  /**
   * Change to next stage
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} eTag - ETag for optimistic locking
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Stage navigation result
   */
  async changeToNextStage(caseID, eTag, options = {}) {
    if (!this.isFeatureAvailable('stageNavigation')) {
      this.throwUnsupportedFeatureError('stageNavigation', 'changeToNextStage');
    }
    return this.client.changeToNextStage(caseID, eTag, options);
  }

  /**
   * Change to specific stage
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} stageID - Stage ID
   * @param {string} eTag - ETag for optimistic locking
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Stage navigation result
   */
  async changeToStage(caseID, stageID, eTag, options = {}) {
    if (!this.isFeatureAvailable('stageNavigation')) {
      this.throwUnsupportedFeatureError('stageNavigation', 'changeToStage');
    }
    return this.client.changeToStage(caseID, stageID, eTag, options);
  }

  /**
   * Add optional process
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} processID - Process ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Process addition result
   */
  async addOptionalProcess(caseID, processID, options = {}) {
    if (!this.isFeatureAvailable('stageNavigation')) {
      this.throwUnsupportedFeatureError('stageNavigation', 'addOptionalProcess');
    }
    return this.client.addOptionalProcess(caseID, processID, options);
  }

  // ========================================
  // CASE TYPE METHODS
  // ========================================

  /**
   * Get list of case types
   * @returns {Promise<Object>} Case types list
   */
  async getCaseTypes() {
    return this.client.getCaseTypes();
  }

  /**
   * Get case type action
   * @param {string} caseTypeID - Case type ID
   * @param {string} actionID - Action ID
   * @returns {Promise<Object>} Action details
   */
  async getCaseTypeAction(caseTypeID, actionID) {
    return this.client.getCaseTypeAction(caseTypeID, actionID);
  }

  /**
   * Get case type bulk action
   * V2 ONLY
   * @param {string} caseTypeID - Case type ID
   * @param {string} actionID - Action ID
   * @returns {Promise<Object>} Bulk action details
   */
  async getCaseTypeBulkAction(caseTypeID, actionID) {
    if (!this.isFeatureAvailable('bulkOperations')) {
      this.throwUnsupportedFeatureError('bulkOperations', 'getCaseTypeBulkAction');
    }
    return this.client.getCaseTypeBulkAction(caseTypeID, actionID);
  }

  // ========================================
  // ASSIGNMENT METHODS
  // ========================================

  /**
   * Get all assignments
   * V1 EXCLUSIVE - Use Data Views in V2
   * @returns {Promise<Object>} Assignments array
   */
  async getAllAssignments() {
    if (!this.isFeatureAvailable('getAllAssignments')) {
      this.throwUnsupportedFeatureError('getAllAssignments', 'getAllAssignments');
    }
    return this.client.getAllAssignments();
  }

  /**
   * Get next assignment
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Next assignment details
   */
  async getNextAssignment(options = {}) {
    return this.client.getNextAssignment(options);
  }

  /**
   * Get assignment by ID
   * @param {string} assignmentID - Assignment ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Assignment details
   */
  async getAssignment(assignmentID, options = {}) {
    return this.client.getAssignment(assignmentID, options);
  }

  /**
   * Get assignment action
   * @param {string} assignmentID - Assignment ID
   * @param {string} actionID - Action ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Action details
   */
  async getAssignmentAction(assignmentID, actionID, options = {}) {
    return this.client.getAssignmentAction(assignmentID, actionID, options);
  }

  /**
   * Perform assignment action
   * @param {string} assignmentID - Assignment ID
   * @param {string} actionID - Action ID
   * @param {string} eTag - ETag for optimistic locking (V2 only)
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Action result
   */
  async performAssignmentAction(assignmentID, actionID, eTag, options = {}) {
    return this.client.performAssignmentAction(assignmentID, actionID, eTag, options);
  }

  /**
   * Refresh assignment action
   * @param {string} assignmentID - Assignment ID
   * @param {string} actionID - Action ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Refresh results
   */
  async refreshAssignmentAction(assignmentID, actionID, options = {}) {
    return this.client.refreshAssignmentAction(assignmentID, actionID, options);
  }

  /**
   * Save assignment action
   * V2 ONLY
   * @param {string} assignmentID - Assignment ID
   * @param {string} actionID - Action ID
   * @param {string} eTag - ETag for optimistic locking
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Save result
   */
  async saveAssignmentAction(assignmentID, actionID, eTag, options = {}) {
    if (!this.isFeatureAvailable('eTagSupport')) {
      this.throwUnsupportedFeatureError('eTagSupport', 'saveAssignmentAction');
    }
    return this.client.saveAssignmentAction(assignmentID, actionID, eTag, options);
  }

  /**
   * Navigate assignment to previous step
   * V2 ONLY
   * @param {string} assignmentID - Assignment ID
   * @param {string} eTag - ETag for optimistic locking
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Navigation result
   */
  async navigateAssignmentPrevious(assignmentID, eTag, options = {}) {
    if (!this.isFeatureAvailable('eTagSupport')) {
      this.throwUnsupportedFeatureError('eTagSupport', 'navigateAssignmentPrevious');
    }
    return this.client.navigateAssignmentPrevious(assignmentID, eTag, options);
  }

  /**
   * Jump to assignment step
   * V2 ONLY
   * @param {string} assignmentID - Assignment ID
   * @param {string} stepID - Step ID
   * @param {string} eTag - ETag for optimistic locking
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Navigation result
   */
  async jumpToAssignmentStep(assignmentID, stepID, eTag, options = {}) {
    if (!this.isFeatureAvailable('eTagSupport')) {
      this.throwUnsupportedFeatureError('eTagSupport', 'jumpToAssignmentStep');
    }
    return this.client.jumpToAssignmentStep(assignmentID, stepID, eTag, options);
  }

  /**
   * Recalculate assignment fields
   * V2 ONLY
   * @param {string} assignmentID - Assignment ID
   * @param {string} actionID - Action ID
   * @param {string} eTag - ETag for optimistic locking
   * @param {Object} calculations - Calculations object
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Recalculation results
   */
  async recalculateAssignmentFields(assignmentID, actionID, eTag, calculations, options = {}) {
    if (!this.isFeatureAvailable('eTagSupport')) {
      this.throwUnsupportedFeatureError('eTagSupport', 'recalculateAssignmentFields');
    }
    return this.client.recalculateAssignmentFields(assignmentID, actionID, eTag, calculations, options);
  }

  // ========================================
  // BULK OPERATIONS (V2 ONLY)
  // ========================================

  /**
   * Perform bulk action on multiple cases
   * V2 ONLY
   * @param {string} actionID - Action ID
   * @param {Object} options - Options with cases array
   * @returns {Promise<Object>} Bulk operation results
   */
  async performBulkAction(actionID, options = {}) {
    if (!this.isFeatureAvailable('bulkOperations')) {
      this.throwUnsupportedFeatureError('bulkOperations', 'performBulkAction');
    }
    return this.client.performBulkAction(actionID, options);
  }

  /**
   * PATCH bulk cases operation
   * V2 ONLY
   * @param {string} actionID - Action ID
   * @param {Object} options - Options with cases array
   * @returns {Promise<Object>} Bulk operation results
   */
  async patchCasesBulk(actionID, options = {}) {
    if (!this.isFeatureAvailable('bulkOperations')) {
      this.throwUnsupportedFeatureError('bulkOperations', 'patchCasesBulk');
    }
    return this.client.patchCasesBulk(actionID, options);
  }

  // ========================================
  // ATTACHMENT METHODS
  // ========================================

  /**
   * Get case attachments
   * @param {string} caseID - Case ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Attachments list
   */
  async getCaseAttachments(caseID, options = {}) {
    return this.client.getCaseAttachments(caseID, options);
  }

  /**
   * Add case attachments
   * @param {string} caseID - Case ID
   * @param {Array} attachments - Attachments array
   * @returns {Promise<Object>} Addition result
   */
  async addCaseAttachments(caseID, attachments) {
    return this.client.addCaseAttachments(caseID, attachments);
  }

  /**
   * Get attachment categories
   * @param {string} caseID - Case ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Categories list
   */
  async getCaseAttachmentCategories(caseID, options = {}) {
    return this.client.getCaseAttachmentCategories(caseID, options);
  }

  /**
   * Get attachment content
   * @param {string} attachmentID - Attachment ID
   * @returns {Promise<Object>} Attachment content
   */
  async getAttachmentContent(attachmentID) {
    return this.client.getAttachmentContent(attachmentID);
  }

  /**
   * Delete attachment
   * @param {string} attachmentID - Attachment ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAttachment(attachmentID) {
    return this.client.deleteAttachment(attachmentID);
  }

  /**
   * Update attachment
   * @param {string} attachmentID - Attachment ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Update result
   */
  async updateAttachment(attachmentID, updateData) {
    return this.client.updateAttachment(attachmentID, updateData);
  }

  /**
   * Upload attachment
   * @param {Buffer} fileBuffer - File buffer
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadAttachment(fileBuffer, options = {}) {
    return this.client.uploadAttachment(fileBuffer, options);
  }

  // ========================================
  // DATA VIEW METHODS
  // ========================================

  /**
   * Get data view metadata
   * @param {string} dataViewID - Data view ID
   * @returns {Promise<Object>} Metadata
   */
  async getDataViewMetadata(dataViewID) {
    return this.client.getDataViewMetadata(dataViewID);
  }

  /**
   * Get data objects
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Data objects list
   */
  async getDataObjects(options = {}) {
    return this.client.getDataObjects(options);
  }

  /**
   * Update data record (full)
   * @param {string} dataViewID - Data view ID
   * @param {Object} data - Data object
   * @returns {Promise<Object>} Update result
   */
  async updateDataRecordFull(dataViewID, data) {
    return this.client.updateDataRecordFull(dataViewID, data);
  }

  /**
   * Update data record (partial)
   * @param {string} dataViewID - Data view ID
   * @param {Object} data - Data object
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Update result
   */
  async updateDataRecordPartial(dataViewID, data, options = {}) {
    return this.client.updateDataRecordPartial(dataViewID, data, options);
  }

  /**
   * Delete data record
   * @param {string} dataViewID - Data view ID
   * @param {string} dataViewParameters - Parameters
   * @returns {Promise<Object>} Deletion result
   */
  async deleteDataRecord(dataViewID, dataViewParameters) {
    return this.client.deleteDataRecord(dataViewID, dataViewParameters);
  }

  /**
   * Get list data view
   * @param {string} dataViewID - Data view ID
   * @param {Object} requestBody - Request body
   * @returns {Promise<Object>} Data view results
   */
  async getListDataView(dataViewID, requestBody = {}) {
    return this.client.getListDataView(dataViewID, requestBody);
  }

  /**
   * Get data view count
   * V2 ONLY (advanced querying)
   * @param {string} dataViewID - Data view ID
   * @param {Object} requestBody - Request body
   * @returns {Promise<Object>} Count results
   */
  async getDataViewCount(dataViewID, requestBody = {}) {
    if (!this.isFeatureAvailable('dataViewQuerying')) {
      this.throwUnsupportedFeatureError('dataViewQuerying', 'getDataViewCount');
    }
    return this.client.getDataViewCount(dataViewID, requestBody);
  }

  // ========================================
  // DOCUMENT METHODS
  // ========================================

  /**
   * Get document content
   * @param {string} documentID - Document ID
   * @returns {Promise<Object>} Document content
   */
  async getDocumentContent(documentID) {
    return this.client.getDocumentContent(documentID);
  }

  /**
   * Remove case document
   * @param {string} caseID - Case ID
   * @param {string} documentID - Document ID
   * @returns {Promise<Object>} Removal result
   */
  async removeCaseDocument(caseID, documentID) {
    return this.client.removeCaseDocument(caseID, documentID);
  }

  // ========================================
  // FOLLOWER METHODS (V2 ONLY)
  // ========================================

  /**
   * Get case followers
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @returns {Promise<Object>} Followers list
   */
  async getCaseFollowers(caseID) {
    if (!this.isFeatureAvailable('followers')) {
      this.throwUnsupportedFeatureError('followers', 'getCaseFollowers');
    }
    return this.client.getCaseFollowers(caseID);
  }

  /**
   * Add case followers
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {Array} users - Users array
   * @returns {Promise<Object>} Addition result
   */
  async addCaseFollowers(caseID, users) {
    if (!this.isFeatureAvailable('followers')) {
      this.throwUnsupportedFeatureError('followers', 'addCaseFollowers');
    }
    return this.client.addCaseFollowers(caseID, users);
  }

  /**
   * Delete case follower
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} followerID - Follower ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCaseFollower(caseID, followerID) {
    if (!this.isFeatureAvailable('followers')) {
      this.throwUnsupportedFeatureError('followers', 'deleteCaseFollower');
    }
    return this.client.deleteCaseFollower(caseID, followerID);
  }

  // ========================================
  // PARTICIPANT METHODS (V2 ONLY)
  // ========================================

  /**
   * Get participant roles
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @returns {Promise<Object>} Roles list
   */
  async getParticipantRoles(caseID) {
    if (!this.isFeatureAvailable('participants')) {
      this.throwUnsupportedFeatureError('participants', 'getParticipantRoles');
    }
    return this.client.getParticipantRoles(caseID);
  }

  /**
   * Get participant role details
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} participantRoleID - Participant role ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Role details
   */
  async getParticipantRoleDetails(caseID, participantRoleID, options = {}) {
    if (!this.isFeatureAvailable('participants')) {
      this.throwUnsupportedFeatureError('participants', 'getParticipantRoleDetails');
    }
    return this.client.getParticipantRoleDetails(caseID, participantRoleID, options);
  }

  /**
   * Get case participants
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @returns {Promise<Object>} Participants list
   */
  async getCaseParticipants(caseID) {
    if (!this.isFeatureAvailable('participants')) {
      this.throwUnsupportedFeatureError('participants', 'getCaseParticipants');
    }
    return this.client.getCaseParticipants(caseID);
  }

  /**
   * Create case participant
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Creation result
   */
  async createCaseParticipant(caseID, options = {}) {
    if (!this.isFeatureAvailable('participants')) {
      this.throwUnsupportedFeatureError('participants', 'createCaseParticipant');
    }
    return this.client.createCaseParticipant(caseID, options);
  }

  /**
   * Get participant
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} participantID - Participant ID
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Participant details
   */
  async getParticipant(caseID, participantID, options = {}) {
    if (!this.isFeatureAvailable('participants')) {
      this.throwUnsupportedFeatureError('participants', 'getParticipant');
    }
    return this.client.getParticipant(caseID, participantID, options);
  }

  /**
   * Delete participant
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} participantID - Participant ID
   * @param {string} eTag - ETag for optimistic locking
   * @returns {Promise<Object>} Deletion result
   */
  async deleteParticipant(caseID, participantID, eTag) {
    if (!this.isFeatureAvailable('participants')) {
      this.throwUnsupportedFeatureError('participants', 'deleteParticipant');
    }
    return this.client.deleteParticipant(caseID, participantID, eTag);
  }

  /**
   * Update participant
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} participantID - Participant ID
   * @param {string} eTag - ETag for optimistic locking
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} Update result
   */
  async updateParticipant(caseID, participantID, eTag, options = {}) {
    if (!this.isFeatureAvailable('participants')) {
      this.throwUnsupportedFeatureError('participants', 'updateParticipant');
    }
    return this.client.updateParticipant(caseID, participantID, eTag, options);
  }

  // ========================================
  // TAG METHODS (V2 ONLY)
  // ========================================

  /**
   * Get case tags
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @returns {Promise<Object>} Tags list
   */
  async getCaseTags(caseID) {
    if (!this.isFeatureAvailable('tags')) {
      this.throwUnsupportedFeatureError('tags', 'getCaseTags');
    }
    return this.client.getCaseTags(caseID);
  }

  /**
   * Add case tags
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {Array} tags - Tags array
   * @returns {Promise<Object>} Addition result
   */
  async addCaseTags(caseID, tags) {
    if (!this.isFeatureAvailable('tags')) {
      this.throwUnsupportedFeatureError('tags', 'addCaseTags');
    }
    return this.client.addCaseTags(caseID, tags);
  }

  /**
   * Delete case tag
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @param {string} tagID - Tag ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCaseTag(caseID, tagID) {
    if (!this.isFeatureAvailable('tags')) {
      this.throwUnsupportedFeatureError('tags', 'deleteCaseTag');
    }
    return this.client.deleteCaseTag(caseID, tagID);
  }

  // ========================================
  // RELATED CASES METHODS (V2 ONLY)
  // ========================================

  /**
   * Get related cases
   * V2 ONLY
   * @param {string} caseID - Case ID
   * @returns {Promise<Object>} Related cases list
   */
  async getRelatedCases(caseID) {
    if (!this.isFeatureAvailable('relatedCases')) {
      this.throwUnsupportedFeatureError('relatedCases', 'getRelatedCases');
    }
    return this.client.getRelatedCases(caseID);
  }

  /**
   * Relate cases
   * V2 ONLY
   * @param {string} caseID - Primary case ID
   * @param {Array} cases - Cases array to relate
   * @returns {Promise<Object>} Relation result
   */
  async relateCases(caseID, cases) {
    if (!this.isFeatureAvailable('relatedCases')) {
      this.throwUnsupportedFeatureError('relatedCases', 'relateCases');
    }
    return this.client.relateCases(caseID, cases);
  }

  /**
   * Delete related case
   * V2 ONLY
   * @param {string} caseID - Primary case ID
   * @param {string} relatedCaseID - Related case ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteRelatedCase(caseID, relatedCaseID) {
    if (!this.isFeatureAvailable('relatedCases')) {
      this.throwUnsupportedFeatureError('relatedCases', 'deleteRelatedCase');
    }
    return this.client.deleteRelatedCase(caseID, relatedCaseID);
  }
}
