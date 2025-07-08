import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { toolConfig } from '../config/tool-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configurable Tool Loader for MCP Tools
 * 
 * Enhanced version of ToolLoader that respects configuration settings
 * for selective tool loading based on:
 * - JSON configuration file
 * - Environment variables
 * - Category-level controls
 * - Individual tool controls
 */
export class ConfigurableToolLoader {
  constructor(toolsPath = resolve(__dirname, '../tools')) {
    this.toolsPath = toolsPath;
    this.loadedTools = new Map();
    this.categories = new Map();
    this.skippedTools = new Map();
    this.config = null;
  }

  /**
   * Discover and load tools based on configuration
   * @returns {Promise<Map>} Map of categories to tool classes
   */
  async discoverTools() {
    try {
      // Load configuration first
      this.config = await toolConfig.load();
      const globalSettings = toolConfig.getGlobalSettings();
      
      console.error(`🔧 Loading tools with configuration v${this.config.version}`);
      console.error(`📋 Environment: ${toolConfig.getEnvironment()}`);
      console.error(`⚙️  Global settings: loadAll=${globalSettings.loadAll}, defaultEnabled=${this.config.defaultEnabled}`);
      
      const categories = await this.scanCategories();
      
      for (const category of categories) {
        const tools = await this.loadCategoryTools(category);
        if (tools.length > 0) {
          this.categories.set(category, tools);
        }
      }
      
      this.logLoadingSummary();
      return this.categories;
    } catch (error) {
      console.error('❌ Error discovering tools:', error);
      throw new Error(`Failed to discover tools: ${error.message}`);
    }
  }

  /**
   * Scan for tool categories (subdirectories in tools/)
   * @returns {Promise<Array>} Array of category names
   */
  async scanCategories() {
    try {
      const entries = await fs.readdir(this.toolsPath, { withFileTypes: true });
      const categories = [];
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const categoryName = entry.name;
          
          // Check if category should be loaded
          if (toolConfig.isCategoryEnabled(categoryName)) {
            categories.push(categoryName);
            console.error(`✅ Category enabled: ${categoryName}`);
          } else {
            console.error(`⏭️  Category skipped: ${categoryName} (disabled in configuration)`);
          }
        }
      }
      
      return categories.sort();
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`⚠️  Tools directory not found: ${this.toolsPath}`);
        return [];
      }
      throw error;
    }
  }

  /**
   * Load all tools from a specific category directory
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of tool class instances
   */
  async loadCategoryTools(category) {
    const categoryPath = resolve(this.toolsPath, category);
    const tools = [];
    const skippedInCategory = [];
    
    try {
      const files = await fs.readdir(categoryPath);
      const jsFiles = files.filter(file => file.endsWith('.js'));
      
      console.error(`🔍 Scanning category: ${category} (${jsFiles.length} files)`);
      
      for (const file of jsFiles) {
        try {
          const result = await this.loadToolFile(categoryPath, file, category);
          if (result.loaded) {
            tools.push(result.tool);
            console.error(`   ✅ Loaded: ${result.toolName}`);
          } else {
            skippedInCategory.push({
              file,
              toolName: result.toolName,
              reason: result.reason
            });
            console.error(`   ⏭️  Skipped: ${result.toolName} (${result.reason})`);
          }
        } catch (error) {
          console.warn(`   ❌ Failed to load ${file}: ${error.message}`);
          skippedInCategory.push({
            file,
            toolName: file.replace('.js', ''),
            reason: `Load error: ${error.message}`
          });
        }
      }
      
      // Store skipped tools for reporting
      if (skippedInCategory.length > 0) {
        this.skippedTools.set(category, skippedInCategory);
      }
      
      return tools.sort((a, b) => a.constructor.name.localeCompare(b.constructor.name));
    } catch (error) {
      console.warn(`❌ Failed to read category directory ${category}: ${error.message}`);
      return [];
    }
  }

  /**
   * Load a single tool file with configuration checking
   * @param {string} categoryPath - Path to category directory
   * @param {string} filename - Tool filename
   * @param {string} category - Category name
   * @returns {Promise<Object>} Load result with tool instance or skip reason
   */
  async loadToolFile(categoryPath, filename, category) {
    const filePath = resolve(categoryPath, filename);
    const fileUrl = pathToFileURL(filePath).href;
    
    try {
      const module = await import(fileUrl);
      
      // Find the tool class in the module
      const ToolClass = this.findToolClass(module);
      if (!ToolClass) {
        return {
          loaded: false,
          toolName: filename.replace('.js', ''),
          reason: 'No valid tool class found'
        };
      }
      
      // Validate tool class
      const validationResult = this.validateToolClass(ToolClass, category, filename);
      if (!validationResult.valid) {
        return {
          loaded: false,
          toolName: filename.replace('.js', ''),
          reason: validationResult.reason
        };
      }
      
      // Get tool name from definition
      const toolName = ToolClass.getDefinition().name;
      
      // Check if tool should be loaded based on configuration
      if (!toolConfig.isToolEnabled(toolName, category)) {
        return {
          loaded: false,
          toolName: toolName,
          reason: 'disabled in configuration'
        };
      }
      
      // Create and register tool instance
      const toolInstance = new ToolClass();
      
      this.loadedTools.set(toolName, {
        instance: toolInstance,
        class: ToolClass,
        category: category,
        filename: filename
      });
      
      return {
        loaded: true,
        tool: toolInstance,
        toolName: toolName
      };
    } catch (error) {
      throw new Error(`Failed to import ${filename}: ${error.message}`);
    }
  }

  /**
   * Find the tool class in a module
   * @param {Object} module - Imported module
   * @returns {Function|null} Tool class or null if not found
   */
  findToolClass(module) {
    // Look for exported classes that have the required methods
    for (const [name, exported] of Object.entries(module)) {
      if (typeof exported === 'function' && 
          typeof exported.getDefinition === 'function' &&
          exported.prototype &&
          typeof exported.prototype.execute === 'function') {
        return exported;
      }
    }
    return null;
  }

  /**
   * Validate that a tool class meets requirements
   * @param {Function} ToolClass - Tool class to validate
   * @param {string} category - Expected category
   * @param {string} filename - Filename for error reporting
   * @returns {Object} Validation result
   */
  validateToolClass(ToolClass, category, filename) {
    try {
      // Check for required static methods
      if (typeof ToolClass.getDefinition !== 'function') {
        return {
          valid: false,
          reason: 'Missing getDefinition() static method'
        };
      }
      
      if (typeof ToolClass.getCategory === 'function') {
        const toolCategory = ToolClass.getCategory();
        if (toolCategory !== category) {
          return {
            valid: false,
            reason: `Category mismatch. Expected '${category}', got '${toolCategory}'`
          };
        }
      }
      
      // Check for required instance methods
      if (typeof ToolClass.prototype.execute !== 'function') {
        return {
          valid: false,
          reason: 'Missing execute() method'
        };
      }
      
      // Validate tool definition
      const definition = ToolClass.getDefinition();
      if (!definition || !definition.name || !definition.description) {
        return {
          valid: false,
          reason: 'Invalid tool definition'
        };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Validation error - ${error.message}`
      };
    }
  }

  /**
   * Log comprehensive loading summary
   */
  logLoadingSummary() {
    const stats = this.getStats();
    const configSummary = toolConfig.getSummary();
    
    console.error(`\n📊 Tool Loading Summary:`);
    console.error(`   🔧 Configuration: v${configSummary.version} (${configSummary.environment})`);
    console.error(`   📂 Categories: ${stats.categories} loaded, ${this.skippedTools.size} skipped`);
    console.error(`   🔨 Tools: ${stats.totalTools} loaded, ${stats.totalSkipped} skipped`);
    
    if (stats.totalTools > 0) {
      console.error(`\n✅ Loaded Tools by Category:`);
      for (const [category, count] of Object.entries(stats.toolsByCategory)) {
        console.error(`   - ${category}: ${count} tools`);
      }
    }
    
    if (stats.totalSkipped > 0) {
      console.error(`\n⏭️  Skipped Tools:`);
      for (const [category, skipped] of this.skippedTools) {
        console.error(`   - ${category}:`);
        for (const skip of skipped) {
          console.error(`     • ${skip.toolName}: ${skip.reason}`);
        }
      }
    }
    
    console.error('');
  }

  /**
   * Get all loaded tools
   * @returns {Map} Map of tool names to tool info
   */
  getLoadedTools() {
    return this.loadedTools;
  }

  /**
   * Get tools by category
   * @param {string} category - Category name
   * @returns {Array} Array of tool instances
   */
  getToolsByCategory(category) {
    return this.categories.get(category) || [];
  }

  /**
   * Get all tool definitions for MCP protocol
   * @returns {Array} Array of tool definitions
   */
  getAllDefinitions() {
    const definitions = [];
    
    for (const [toolName, toolInfo] of this.loadedTools) {
      try {
        const definition = toolInfo.class.getDefinition();
        definitions.push(definition);
      } catch (error) {
        console.warn(`⚠️  Failed to get definition for tool ${toolName}: ${error.message}`);
      }
    }
    
    return definitions.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get tool instance by name
   * @param {string} toolName - Name of the tool
   * @returns {Object|null} Tool instance or null if not found
   */
  getToolByName(toolName) {
    const toolInfo = this.loadedTools.get(toolName);
    return toolInfo ? toolInfo.instance : null;
  }

  /**
   * Get loading statistics
   * @returns {Object} Loading statistics
   */
  getStats() {
    const stats = {
      totalTools: this.loadedTools.size,
      categories: this.categories.size,
      totalSkipped: 0,
      toolsByCategory: {}
    };
    
    // Count tools by category
    for (const [category, tools] of this.categories) {
      stats.toolsByCategory[category] = tools.length;
    }
    
    // Count skipped tools
    for (const [category, skipped] of this.skippedTools) {
      stats.totalSkipped += skipped.length;
    }
    
    return stats;
  }

  /**
   * Get configuration information
   * @returns {Object} Configuration summary
   */
  getConfigurationInfo() {
    return {
      configPath: toolConfig.configPath,
      summary: toolConfig.getSummary(),
      environment: toolConfig.getEnvironment()
    };
  }

  /**
   * Reload configuration and tools
   * @returns {Promise<Map>} Updated categories map
   */
  async reload() {
    console.error('🔄 Reloading configurable tool loader...');
    
    // Clear current state
    this.loadedTools.clear();
    this.categories.clear();
    this.skippedTools.clear();
    
    // Reload configuration
    await toolConfig.reload();
    
    // Rediscover tools
    return await this.discoverTools();
  }

  /**
   * Check if a specific tool is loaded
   * @param {string} toolName - Name of the tool
   * @returns {boolean} Whether the tool is loaded
   */
  isToolLoaded(toolName) {
    return this.loadedTools.has(toolName);
  }

  /**
   * Get list of all loaded tool names
   * @returns {Array} Array of tool names
   */
  getLoadedToolNames() {
    return Array.from(this.loadedTools.keys()).sort();
  }

  /**
   * Get list of all skipped tool names with reasons
   * @returns {Array} Array of skipped tool information
   */
  getSkippedTools() {
    const skipped = [];
    for (const [category, tools] of this.skippedTools) {
      for (const tool of tools) {
        skipped.push({
          category,
          toolName: tool.toolName,
          reason: tool.reason
        });
      }
    }
    return skipped;
  }
}

/**
 * Singleton instance for global use
 */
export const configurableToolLoader = new ConfigurableToolLoader();
