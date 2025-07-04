import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Dynamic tool loader for discovering and loading MCP tools
 * Scans directories and automatically registers tools by category
 */
export class ToolLoader {
  constructor(toolsPath = resolve(__dirname, '../tools')) {
    this.toolsPath = toolsPath;
    this.loadedTools = new Map();
    this.categories = new Map();
  }

  /**
   * Discover all tools in the tools directory
   * @returns {Promise<Map>} Map of categories to tool classes
   */
  async discoverTools() {
    try {
      const categories = await this.scanCategories();
      
      for (const category of categories) {
        const tools = await this.loadCategoryTools(category);
        this.categories.set(category, tools);
      }
      
      return this.categories;
    } catch (error) {
      console.error('Error discovering tools:', error);
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
          categories.push(entry.name);
        }
      }
      
      return categories.sort();
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`Tools directory not found: ${this.toolsPath}`);
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
    
    try {
      const files = await fs.readdir(categoryPath);
      const jsFiles = files.filter(file => file.endsWith('.js'));
      
      for (const file of jsFiles) {
        try {
          const tool = await this.loadToolFile(categoryPath, file, category);
          if (tool) {
            tools.push(tool);
          }
        } catch (error) {
          console.warn(`Failed to load tool ${file} in category ${category}:`, error.message);
          // Continue loading other tools even if one fails
        }
      }
      
      return tools.sort((a, b) => a.constructor.name.localeCompare(b.constructor.name));
    } catch (error) {
      console.warn(`Failed to read category directory ${category}:`, error.message);
      return [];
    }
  }

  /**
   * Load a single tool file
   * @param {string} categoryPath - Path to category directory
   * @param {string} filename - Tool filename
   * @param {string} category - Category name
   * @returns {Promise<Object|null>} Tool instance or null if invalid
   */
  async loadToolFile(categoryPath, filename, category) {
    const filePath = resolve(categoryPath, filename);
    const fileUrl = pathToFileURL(filePath).href;
    
    try {
      const module = await import(fileUrl);
      
      // Find the tool class in the module
      const ToolClass = this.findToolClass(module);
      if (!ToolClass) {
        console.warn(`No valid tool class found in ${filename}`);
        return null;
      }
      
      // Validate tool class
      if (!this.validateToolClass(ToolClass, category, filename)) {
        return null;
      }
      
      // Create and register tool instance
      const toolInstance = new ToolClass();
      const toolName = ToolClass.getDefinition().name;
      
      this.loadedTools.set(toolName, {
        instance: toolInstance,
        class: ToolClass,
        category: category,
        filename: filename
      });
      
      return toolInstance;
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
   * @returns {boolean} Whether tool is valid
   */
  validateToolClass(ToolClass, category, filename) {
    try {
      // Check for required static methods
      if (typeof ToolClass.getDefinition !== 'function') {
        console.warn(`Tool ${filename}: Missing getDefinition() static method`);
        return false;
      }
      
      if (typeof ToolClass.getCategory === 'function') {
        const toolCategory = ToolClass.getCategory();
        if (toolCategory !== category) {
          console.warn(`Tool ${filename}: Category mismatch. Expected '${category}', got '${toolCategory}'`);
          return false;
        }
      }
      
      // Check for required instance methods
      if (typeof ToolClass.prototype.execute !== 'function') {
        console.warn(`Tool ${filename}: Missing execute() method`);
        return false;
      }
      
      // Validate tool definition
      const definition = ToolClass.getDefinition();
      if (!definition || !definition.name || !definition.description) {
        console.warn(`Tool ${filename}: Invalid tool definition`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn(`Tool ${filename}: Validation error - ${error.message}`);
      return false;
    }
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
        console.warn(`Failed to get definition for tool ${toolName}:`, error.message);
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
      toolsByCategory: {}
    };
    
    for (const [category, tools] of this.categories) {
      stats.toolsByCategory[category] = tools.length;
    }
    
    return stats;
  }

  /**
   * Reload all tools (useful for development)
   * @returns {Promise<Map>} Updated categories map
   */
  async reload() {
    this.loadedTools.clear();
    this.categories.clear();
    return await this.discoverTools();
  }
}

/**
 * Singleton instance for global use
 */
export const toolLoader = new ToolLoader();
