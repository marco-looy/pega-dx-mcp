#!/usr/bin/env node

/**
 * Strict JSON Schema Validation for MCP Tools
 * 
 * This script uses actual JSON Schema validation libraries to validate
 * all tool schemas with the same rigor as external MCP clients
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create JSON Schema validator with strict mode
const ajv = new Ajv({ 
  strict: true,
  allErrors: true,
  verbose: true
});
addFormats(ajv);

async function validateAllToolSchemas() {
  console.log('🔍 Running strict JSON Schema validation on all MCP tools...\n');
  
  const toolsDir = join(__dirname, '../src/tools');
  const errors = [];
  const warnings = [];
  let toolCount = 0;
  
  async function scanDirectory(dir, category = '') {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, entry.name);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        await validateToolFile(fullPath, category, entry.name);
      }
    }
  }
  
  async function validateToolFile(filePath, category, fileName) {
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Skip non-tool files
      if (!content.includes('static getDefinition()') || !content.includes('BaseTool')) {
        return;
      }
      
      toolCount++;
      console.log(`📋 Validating ${category}/${fileName}`);
      
      // Extract the tool definition by dynamically importing
      const module = await import('file://' + filePath);
      const toolClass = Object.values(module)[0];
      
      if (!toolClass || typeof toolClass.getDefinition !== 'function') {
        errors.push({
          file: `${category}/${fileName}`,
          error: 'Tool class does not have static getDefinition() method'
        });
        return;
      }
      
      const definition = toolClass.getDefinition();
      
      // Validate the tool definition structure
      if (!definition.name || !definition.description || !definition.inputSchema) {
        errors.push({
          file: `${category}/${fileName}`,
          error: 'Tool definition missing required fields: name, description, or inputSchema'
        });
        return;
      }
      
      // Validate the JSON Schema using AJV
      try {
        const isValid = ajv.validateSchema(definition.inputSchema);
        
        if (!isValid) {
          ajv.errors.forEach(error => {
            errors.push({
              file: `${category}/${fileName}`,
              error: `JSON Schema validation error: ${error.message}`,
              schemaPath: error.schemaPath,
              data: error.data
            });
          });
        }
      } catch (schemaError) {
        errors.push({
          file: `${category}/${fileName}`,
          error: `JSON Schema compilation error: ${schemaError.message}`,
          details: schemaError.stack
        });
      }
      
      // Additional specific checks for common MCP issues
      const specificIssues = checkSpecificMCPIssues(definition.inputSchema, `${category}/${fileName}`);
      errors.push(...specificIssues);
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}: ${error.message}`);
      errors.push({
        file: `${category}/${fileName}`,
        error: `Failed to process file: ${error.message}`
      });
    }
  }
  
  function checkSpecificMCPIssues(schema, fileName) {
    const issues = [];
    
    // Check for type + anyOf/oneOf conflicts at any level
    function checkSchema(obj, path = '') {
      if (typeof obj !== 'object' || obj === null) return;
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => checkSchema(item, `${path}[${index}]`));
        return;
      }
      
      // Check for type + anyOf/oneOf conflicts
      if (obj.hasOwnProperty('type') && (obj.hasOwnProperty('anyOf') || obj.hasOwnProperty('oneOf'))) {
        issues.push({
          file: fileName,
          error: `JSON Schema violation: "type" and "${obj.hasOwnProperty('anyOf') ? 'anyOf' : 'oneOf'}" cannot be both populated at the same level`,
          path: path || 'root'
        });
      }
      
      // Recursively check nested objects
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          checkSchema(obj[key], path ? `${path}.${key}` : key);
        }
      });
    }
    
    checkSchema(schema);
    return issues;
  }
  
  await scanDirectory(toolsDir);
  
  console.log(`\n📊 Strict Validation Summary:`);
  console.log(`   - ${toolCount} tools validated`);
  console.log(`   - ${errors.length} schema issues found`);
  console.log(`   - ${warnings.length} warnings found\n`);
  
  if (errors.length > 0) {
    console.log('❌ JSON Schema Issues Found:\n');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.file}${error.path ? ` (${error.path})` : ''}`);
      console.log(`   ${error.error}`);
      if (error.schemaPath) {
        console.log(`   Schema path: ${error.schemaPath}`);
      }
      if (error.data) {
        console.log(`   Data: ${JSON.stringify(error.data)}`);
      }
      console.log('');
    });
    process.exit(1);
  } else {
    console.log('✅ All tool schemas pass strict JSON Schema validation!\n');
    
    console.log('🔧 Validation Details:');
    console.log('   - All schemas compile without errors');
    console.log('   - No type + anyOf/oneOf conflicts detected');
    console.log('   - All required fields present');
    console.log('   - Compatible with strict MCP clients\n');
  }
}

// Run validation
validateAllToolSchemas().catch(error => {
  console.error('❌ Strict validation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
