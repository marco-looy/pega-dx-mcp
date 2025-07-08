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
      'assignments': 'assignment_tools',
      'attachments': 'attachment_tools', 
      'cases': 'case_tools',
      'casetypes': 'casetype_tools',
      'dataviews': 'dataview_tools',
      'documents': 'document_tools',
      'followers': 'follower_tools',
      'participants': 'participant_tools',
      'related_cases': 'related_case_tools',
      'services': 'service_tools',
      'tags': 'tag_tools'
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
