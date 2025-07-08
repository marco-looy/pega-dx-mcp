/**
 * Simplified Tool Configuration Manager
 * 
 * Single source of truth using only environment variables from MCP client.
 * All tools enabled by default - set to 'false' to disable.
 * Environment variables are passed directly from MCP client configuration.
 */
export class ToolConfig {
  constructor() {
    this.categoryMap = {
      'assignments': 'PEGA_ASSIGNMENT_TOOLS',
      'attachments': 'PEGA_ATTACHMENT_TOOLS', 
      'cases': 'PEGA_CASE_TOOLS',
      'casetypes': 'PEGA_CASETYPE_TOOLS',
      'dataviews': 'PEGA_DATAVIEW_TOOLS',
      'documents': 'PEGA_DOCUMENT_TOOLS',
      'followers': 'PEGA_FOLLOWER_TOOLS',
      'participants': 'PEGA_PARTICIPANT_TOOLS',
      'related_cases': 'PEGA_RELATED_CASE_TOOLS',
      'services': 'PEGA_SERVICE_TOOLS',
      'tags': 'PEGA_TAG_TOOLS'
    };
    
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  /**
   * Check if a tool category should be loaded
   * @param {string} category - Category name (e.g., 'cases', 'assignments')
   * @returns {boolean} Whether the category should be loaded
   */
  isCategoryEnabled(category) {
    const envVar = this.categoryMap[category];
    if (!envVar) {
      console.warn(`⚠️  Unknown category: ${category}`);
      return true; // Default to enabled for unknown categories
    }
    
    const value = process.env[envVar];
    
    // Default to enabled (true) unless explicitly set to 'false'
    return value !== 'false';
  }

  /**
   * Check if a specific tool should be loaded
   * @param {string} toolName - Name of the tool
   * @param {string} category - Category the tool belongs to
   * @returns {boolean} Whether the tool should be loaded
   */
  isToolEnabled(toolName, category) {
    // Check for tool-specific override first
    const toolOverride = process.env[`${toolName}_enabled`];
    if (toolOverride !== undefined) {
      return toolOverride !== 'false';
    }
    
    // Fall back to category setting
    return this.isCategoryEnabled(category);
  }

  /**
   * Get log level for the application
   * @returns {string} Log level
   */
  getLogLevel() {
    return this.logLevel;
  }

  /**
   * Get environment name
   * @returns {string} Environment name
   */
  getEnvironment() {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Get all category settings
   * @returns {Object} Object with category names and their enabled status
   */
  getAllCategorySettings() {
    const settings = {};
    
    for (const [category, envVar] of Object.entries(this.categoryMap)) {
      settings[category] = {
        envVar: envVar,
        enabled: this.isCategoryEnabled(category),
        value: process.env[envVar] || 'not set (default: true)'
      };
    }
    
    return settings;
  }

  /**
   * Generate configuration summary for logging
   * @returns {Object} Configuration summary
   */
  getSummary() {
    const categories = this.getAllCategorySettings();
    const enabledCount = Object.values(categories).filter(cat => cat.enabled).length;
    const disabledCount = Object.keys(categories).length - enabledCount;
    
    return {
      environment: this.getEnvironment(),
      logLevel: this.getLogLevel(),
      categories: {
        total: Object.keys(categories).length,
        enabled: enabledCount,
        disabled: disabledCount
      },
      settings: categories
    };
  }

  /**
   * Log configuration summary
   */
  logSummary() {
    const summary = this.getSummary();
    
    console.error(`🔧 Simple Tool Configuration:`);
    console.error(`   Environment: ${summary.environment}`);
    console.error(`   Log Level: ${summary.logLevel}`);
    console.error(`   Categories: ${summary.categories.enabled}/${summary.categories.total} enabled`);
    
    if (summary.categories.disabled > 0) {
      console.error(`   Disabled categories:`);
      for (const [category, config] of Object.entries(summary.settings)) {
        if (!config.enabled) {
          console.error(`     - ${category} (${config.envVar}=${config.value})`);
        }
      }
    }
  }

  // Legacy method compatibility - no longer loads from file
  async load() {
    return this.getSummary();
  }

  // Legacy method compatibility - no configuration to reload
  async reload() {
    return this.getSummary();
  }
}

/**
 * Singleton instance for global use
 */
export const toolConfig = new ToolConfig();
