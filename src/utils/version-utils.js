/**
 * Version Detection and Validation Utilities
 * Provides helper functions for API version detection and feature availability checks
 */

import { config } from '../config.js';

/**
 * API Version Constants
 */
export const API_VERSION = {
  V1: 'v1',
  V2: 'v2'
};

/**
 * Get the current configured API version
 * @param {Object} [sessionConfig] - Optional session configuration to check
 * @returns {string} 'v1' or 'v2'
 */
export function getApiVersion(sessionConfig = null) {
  if (sessionConfig && sessionConfig.pega) {
    return sessionConfig.pega.apiVersion || API_VERSION.V2;
  }
  return config.pega.apiVersion || API_VERSION.V2;
}

/**
 * Check if the current API version is V1
 * @param {Object} [sessionConfig] - Optional session configuration to check
 * @returns {boolean} True if using V1 API
 */
export function isV1(sessionConfig = null) {
  return getApiVersion(sessionConfig) === API_VERSION.V1;
}

/**
 * Check if the current API version is V2
 * @param {Object} [sessionConfig] - Optional session configuration to check
 * @returns {boolean} True if using V2 API
 */
export function isV2(sessionConfig = null) {
  return getApiVersion(sessionConfig) === API_VERSION.V2;
}

/**
 * Validate that an API version string is valid
 * @param {string} version - Version string to validate
 * @returns {boolean} True if version is valid ('v1' or 'v2')
 */
export function isValidVersion(version) {
  if (!version || typeof version !== 'string') {
    return false;
  }
  const normalized = version.toLowerCase();
  return normalized === API_VERSION.V1 || normalized === API_VERSION.V2;
}

/**
 * Normalize an API version string to lowercase
 * @param {string} version - Version string to normalize
 * @param {string} [defaultVersion='v2'] - Default version if normalization fails
 * @returns {string} Normalized version string ('v1' or 'v2')
 */
export function normalizeVersion(version, defaultVersion = API_VERSION.V2) {
  if (!version || typeof version !== 'string') {
    return defaultVersion;
  }
  const normalized = version.toLowerCase();
  if (normalized !== API_VERSION.V1 && normalized !== API_VERSION.V2) {
    return defaultVersion;
  }
  return normalized;
}

/**
 * Feature availability based on API version
 * V2-exclusive features that are NOT available in V1
 */
const V2_EXCLUSIVE_FEATURES = {
  PARTICIPANTS: 'participants',
  FOLLOWERS: 'followers',
  TAGS: 'tags',
  RELATED_CASES: 'relatedCases',
  DOCUMENTS: 'documents',
  STAGE_NAVIGATION: 'stageNavigation',
  BULK_OPERATIONS: 'bulkOperations',
  NAVIGATION_STEPS: 'navigationSteps',
  ETAG_SUPPORT: 'etagSupport',
  HATEOAS: 'hateoas',
  UI_RESOURCES_SEPARATION: 'uiResourcesSeparation'
};

/**
 * V1-exclusive features that are NOT available in V2
 */
const V1_EXCLUSIVE_FEATURES = {
  GET_ALL_CASES: 'getAllCases',
  GET_ALL_ASSIGNMENTS: 'getAllAssignments',
  DIRECT_CASE_UPDATE: 'directCaseUpdate',
  CASE_PAGES: 'casePages'
};

/**
 * Check if a feature is available in the current API version
 * @param {string} feature - Feature name from V2_EXCLUSIVE_FEATURES or V1_EXCLUSIVE_FEATURES
 * @param {Object} [sessionConfig] - Optional session configuration to check
 * @returns {boolean} True if feature is available
 */
export function isFeatureAvailable(feature, sessionConfig = null) {
  const version = getApiVersion(sessionConfig);

  // Check V2-exclusive features
  if (Object.values(V2_EXCLUSIVE_FEATURES).includes(feature)) {
    return version === API_VERSION.V2;
  }

  // Check V1-exclusive features
  if (Object.values(V1_EXCLUSIVE_FEATURES).includes(feature)) {
    return version === API_VERSION.V1;
  }

  // If feature is not exclusive to either version, it's available in both
  return true;
}

/**
 * Get list of unavailable features for the current API version
 * @param {Object} [sessionConfig] - Optional session configuration to check
 * @returns {string[]} Array of unavailable feature names
 */
export function getUnavailableFeatures(sessionConfig = null) {
  const version = getApiVersion(sessionConfig);

  if (version === API_VERSION.V1) {
    // When using V1, all V2-exclusive features are unavailable
    return Object.values(V2_EXCLUSIVE_FEATURES);
  } else {
    // When using V2, all V1-exclusive features are unavailable
    return Object.values(V1_EXCLUSIVE_FEATURES);
  }
}

/**
 * Build version-aware API base URL
 * @param {string} baseUrl - Pega base URL (without /prweb)
 * @param {string} version - API version ('v1' or 'v2')
 * @returns {string} Full API base URL
 */
export function buildApiBaseUrl(baseUrl, version) {
  const normalizedVersion = normalizeVersion(version);

  if (normalizedVersion === API_VERSION.V1) {
    return `${baseUrl}/prweb/api/v1`;
  }
  return `${baseUrl}/prweb/api/application/v2`;
}

/**
 * Get HTTP method for an operation based on API version
 * Some operations use different HTTP methods in V1 vs V2
 * @param {string} operation - Operation name
 * @param {Object} [sessionConfig] - Optional session configuration to check
 * @returns {string} HTTP method (GET, POST, PUT, PATCH, DELETE)
 */
export function getHttpMethodForOperation(operation, sessionConfig = null) {
  const version = getApiVersion(sessionConfig);

  // Operation-specific method mappings
  const methodMappings = {
    'submitAssignment': version === API_VERSION.V1 ? 'POST' : 'PATCH',
    'performCaseAction': version === API_VERSION.V1 ? 'POST' : 'PATCH',
    'updateCase': version === API_VERSION.V1 ? 'PUT' : 'PATCH',
    'refreshAction': version === API_VERSION.V1 ? 'PUT' : 'PATCH',
    'refreshCaseType': version === API_VERSION.V1 ? 'PUT' : 'PATCH'
  };

  return methodMappings[operation] || 'GET';
}

/**
 * Export feature constants for external use
 */
export const FEATURES = {
  ...V2_EXCLUSIVE_FEATURES,
  ...V1_EXCLUSIVE_FEATURES
};

/**
 * Get a human-readable version name
 * @param {Object} [sessionConfig] - Optional session configuration to check
 * @returns {string} Version name (e.g., "Traditional DX API (V1)" or "Constellation DX API (V2)")
 */
export function getVersionName(sessionConfig = null) {
  const version = getApiVersion(sessionConfig);

  if (version === API_VERSION.V1) {
    return 'Traditional DX API (V1)';
  }
  return 'Constellation DX API (V2)';
}

/**
 * Log version information for debugging
 * @param {Object} [sessionConfig] - Optional session configuration to check
 */
export function logVersionInfo(sessionConfig = null) {
  const version = getApiVersion(sessionConfig);
  const versionName = getVersionName(sessionConfig);
  const unavailableFeatures = getUnavailableFeatures(sessionConfig);

  console.log(`\n🔧 Pega API Version: ${versionName}`);
  console.log(`📊 API Base Path: ${version === API_VERSION.V1 ? '/prweb/api/v1' : '/prweb/api/application/v2'}`);

  if (unavailableFeatures.length > 0) {
    console.log(`⚠️  Unavailable Features (${unavailableFeatures.length}):`);
    unavailableFeatures.forEach(feature => {
      console.log(`   - ${feature}`);
    });
  }

  console.log('');
}
