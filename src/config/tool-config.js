import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Tool Configuration Manager
 * 
 * Handles loading and processing of tool configuration with:
 * - JSON configuration file
 * - Environment variable overrides
 * - Category and tool-level control
 * - Environment-specific settings
 */
export class ToolConfig {
  constructor(configPath = null) {
    this.configPath = configPath || resolve(__dirname, 'enabled-tools.json');
    this.config = null;
    this.processedConfig = null;
  }

  /**
   * Load and process configuration
   * @returns {Promise<Object>} Processed configuration
   */
  async load() {
    if (this.processedConfig) {
      return this.processedConfig;
    }

    try {
      // Load base configuration
      const configData = await readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
      
      // Process configuration with environment overrides
      this.processedConfig = this.processConfiguration(this.config);
      
      return this.processedConfig;
    } catch (error) {
      console.error(`❌ Failed to load tool configuration from ${this.configPath}:`, error.message);
      
      // Return default configuration if file load fails
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Process configuration with environment overrides
   * @param {Object} baseConfig - Base configuration from JSON
   * @returns {Object} Processed configuration
   */
  processConfiguration(baseConfig) {
    // Start with base configuration
    let config = JSON.parse(JSON.stringify(baseConfig)); // Deep clone
    
    // Apply environment-specific settings
    const environment = this.getEnvironment();
    if (config.environment && config.environment[environment]) {
      config = this.mergeConfigurations(config, config.environment[environment]);
    }
    
    // Apply environment variable overrides
    config = this.applyEnvironmentVariables(config);
    
    // Validate and normalize configuration
    config = this.validateAndNormalize(config);
    
    return config;
  }

  /**
   * Get current environment from NODE_ENV or default to 'development'
   * @returns {string} Environment name
   */
  getEnvironment() {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Apply environment variable overrides
   * @param {Object} config - Configuration to modify
   * @returns {Object} Modified configuration
   */
  applyEnvironmentVariables(config) {
    // Global overrides
    if (process.env.PEGA_MCP_LOAD_ALL !== undefined) {
      config.globalSettings.loadAll = process.env.PEGA_MCP_LOAD_ALL === 'true';
    }
    
    if (process.env.PEGA_MCP_DEFAULT_ENABLED !== undefined) {
      config.defaultEnabled = process.env.PEGA_MCP_DEFAULT_ENABLED === 'true';
    }
    
    if (process.env.PEGA_MCP_LOG_LEVEL) {
      config.globalSettings.logLevel = process.env.PEGA_MCP_LOG_LEVEL;
    }
    
    // Category overrides: PEGA_MCP_CATEGORY_<NAME>=true/false
    Object.keys(process.env).forEach(key => {
      const categoryMatch = key.match(/^PEGA_MCP_CATEGORY_(.+)$/);
      if (categoryMatch) {
        const categoryName = categoryMatch[1].toLowerCase();
        const enabled = process.env[key] === 'true';
        
        if (config.categories[categoryName]) {
          config.categories[categoryName].enabled = enabled;
        }
      }
    });
    
    // Tool overrides: PEGA_MCP_TOOL_<NAME>=true/false
    Object.keys(process.env).forEach(key => {
      const toolMatch = key.match(/^PEGA_MCP_TOOL_(.+)$/);
      if (toolMatch) {
        const toolName = toolMatch[1].toLowerCase();
        const enabled = process.env[key] === 'true';
        
        if (!config.tools[toolName]) {
          config.tools[toolName] = {};
        }
        config.tools[toolName].enabled = enabled;
      }
    });
    
    // Enabled/disabled tool lists: PEGA_MCP_ENABLED_TOOLS=tool1,tool2,tool3
    if (process.env.PEGA_MCP_ENABLED_TOOLS) {
      const enabledTools = process.env.PEGA_MCP_ENABLED_TOOLS.split(',').map(t => t.trim());
      enabledTools.forEach(toolName => {
        if (!config.tools[toolName]) {
          config.tools[toolName] = {};
        }
        config.tools[toolName].enabled = true;
      });
    }
    
    if (process.env.PEGA_MCP_DISABLED_TOOLS) {
      const disabledTools = process.env.PEGA_MCP_DISABLED_TOOLS.split(',').map(t => t.trim());
      disabledTools.forEach(toolName => {
        if (!config.tools[toolName]) {
          config.tools[toolName] = {};
        }
        config.tools[toolName].enabled = false;
      });
    }
    
    return config;
  }

  /**
   * Validate and normalize configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validated configuration
   */
  validateAndNormalize(config) {
    // Ensure required fields exist
    if (!config.version) {
      config.version = '1.0.0';
    }
    
    if (!config.globalSettings) {
      config.globalSettings = {};
    }
    
    if (!config.categories) {
      config.categories = {};
    }
    
    if (!config.tools) {
      config.tools = {};
    }
    
    // Normalize boolean values
    if (typeof config.defaultEnabled !== 'boolean') {
      config.defaultEnabled = true;
    }
    
    if (typeof config.globalSettings.loadAll !== 'boolean') {
      config.globalSettings.loadAll = false;
    }
    
    if (typeof config.globalSettings.strictValidation !== 'boolean') {
      config.globalSettings.strictValidation = true;
    }
    
    // Validate log level
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(config.globalSettings.logLevel)) {
      config.globalSettings.logLevel = 'info';
    }
    
    return config;
  }

  /**
   * Merge two configuration objects (deep merge)
   * @param {Object} base - Base configuration
   * @param {Object} override - Override configuration
   * @returns {Object} Merged configuration
   */
  mergeConfigurations(base, override) {
    const result = JSON.parse(JSON.stringify(base)); // Deep clone
    
    function mergeDeep(target, source) {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) {
            target[key] = {};
          }
          mergeDeep(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    
    mergeDeep(result, override);
    return result;
  }

  /**
   * Get default configuration if file loading fails
   * @returns {Object} Default configuration
   */
  getDefaultConfiguration() {
    return {
      version: '1.0.0',
      description: 'Default configuration - all tools enabled',
      defaultEnabled: true,
      globalSettings: {
        loadAll: true,
        strictValidation: true,
        logLevel: 'info'
      },
      categories: {},
      tools: {}
    };
  }

  /**
   * Check if a tool should be loaded
   * @param {string} toolName - Name of the tool
   * @param {string} category - Category the tool belongs to
   * @returns {boolean} Whether the tool should be loaded
   */
  isToolEnabled(toolName, category) {
    if (!this.processedConfig) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    const config = this.processedConfig;
    
    // If loadAll is true, load everything
    if (config.globalSettings.loadAll) {
      return true;
    }
    
    // Check tool-specific override first (highest priority)
    if (config.tools[toolName] && typeof config.tools[toolName].enabled === 'boolean') {
      return config.tools[toolName].enabled;
    }
    
    // Check category setting
    if (config.categories[category] && typeof config.categories[category].enabled === 'boolean') {
      return config.categories[category].enabled;
    }
    
    // Fall back to default setting
    return config.defaultEnabled;
  }

  /**
   * Check if a category should be loaded
   * @param {string} category - Category name
   * @returns {boolean} Whether the category should be loaded
   */
  isCategoryEnabled(category) {
    if (!this.processedConfig) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    const config = this.processedConfig;
    
    // If loadAll is true, load everything
    if (config.globalSettings.loadAll) {
      return true;
    }
    
    // Check category setting
    if (config.categories[category] && typeof config.categories[category].enabled === 'boolean') {
      return config.categories[category].enabled;
    }
    
    // Fall back to default setting
    return config.defaultEnabled;
  }

  /**
   * Get tool configuration for a specific tool
   * @param {string} toolName - Name of the tool
   * @returns {Object|null} Tool configuration or null if not found
   */
  getToolConfig(toolName) {
    if (!this.processedConfig) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    return this.processedConfig.tools[toolName] || null;
  }

  /**
   * Get category configuration
   * @param {string} category - Category name
   * @returns {Object|null} Category configuration or null if not found
   */
  getCategoryConfig(category) {
    if (!this.processedConfig) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    return this.processedConfig.categories[category] || null;
  }

  /**
   * Get global settings
   * @returns {Object} Global settings
   */
  getGlobalSettings() {
    if (!this.processedConfig) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    return this.processedConfig.globalSettings;
  }

  /**
   * Generate configuration summary
   * @returns {Object} Configuration summary
   */
  getSummary() {
    if (!this.processedConfig) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    const config = this.processedConfig;
    const summary = {
      version: config.version,
      environment: this.getEnvironment(),
      globalSettings: config.globalSettings,
      categories: {
        total: Object.keys(config.categories).length,
        enabled: Object.values(config.categories).filter(cat => cat.enabled !== false).length,
        disabled: Object.values(config.categories).filter(cat => cat.enabled === false).length
      },
      tools: {
        total: Object.keys(config.tools).length,
        enabled: Object.values(config.tools).filter(tool => tool.enabled === true).length,
        disabled: Object.values(config.tools).filter(tool => tool.enabled === false).length
      }
    };
    
    return summary;
  }

  /**
   * Reload configuration from file
   * @returns {Promise<Object>} Reloaded configuration
   */
  async reload() {
    this.config = null;
    this.processedConfig = null;
    return await this.load();
  }
}

/**
 * Singleton instance for global use
 */
export const toolConfig = new ToolConfig();
