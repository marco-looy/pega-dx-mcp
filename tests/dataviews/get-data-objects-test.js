#!/usr/bin/env node

import { GetDataObjectsTool } from '../../src/tools/dataviews/get-data-objects.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetDataObjectsTool() {
  console.log('🧪 Testing GetDataObjectsTool\n');

  try {
    // Test tool category
    const category = GetDataObjectsTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'dataviews') {
      throw new Error(`Expected category 'dataviews', got '${category}'`);
    }

    // Test tool definition
    const definition = GetDataObjectsTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    
    if (definition.name !== 'get_data_objects') {
      throw new Error(`Expected name 'get_data_objects', got '${definition.name}'`);
    }

    // Check that it has the correct input schema
    if (!definition.inputSchema || !definition.inputSchema.properties) {
      throw new Error('Missing inputSchema or properties');
    }

    // Verify optional type parameter with enum values
    const typeProperty = definition.inputSchema.properties.type;
    if (!typeProperty || !typeProperty.enum || !typeProperty.enum.includes('data') || !typeProperty.enum.includes('case')) {
      throw new Error('Missing or incorrect type parameter enum values');
    }

    // Verify no required parameters
    const required = definition.inputSchema.required || [];
    if (required.length !== 0) {
      throw new Error(`Expected no required parameters, got: ${required}`);
    }

    console.log('✅ Tool definition schema valid');

    // Test BaseTool inheritance
    const toolInstance = new GetDataObjectsTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool does not extend BaseTool');
    }

    // Test parameter validation - valid enum values
    const validDataValidation = toolInstance.validateEnumParams({ type: 'data' }, { type: ['data', 'case'] });
    if (validDataValidation) {
      throw new Error('Valid enum parameter "data" failed validation');
    }

    const validCaseValidation = toolInstance.validateEnumParams({ type: 'case' }, { type: ['data', 'case'] });
    if (validCaseValidation) {
      throw new Error('Valid enum parameter "case" failed validation');
    }

    console.log('✅ Valid enum parameter validation passed');

    // Test parameter validation - invalid enum value
    const invalidValidation = toolInstance.validateEnumParams({ type: 'invalid' }, { type: ['data', 'case'] });
    if (!invalidValidation || !invalidValidation.error) {
      throw new Error('Invalid enum parameter should have failed validation');
    }

    console.log('✅ Invalid enum parameter validation correctly failed');

    // Test parameter validation - no parameters (should pass)
    const emptyValidation = toolInstance.validateEnumParams({}, { type: ['data', 'case'] });
    if (emptyValidation) {
      throw new Error('Empty parameters should not fail enum validation');
    }

    console.log('✅ Empty parameters validation passed');

    // Test tool execution interface (without making actual API calls)
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('Tool does not have execute method');
    }

    console.log('✅ Tool has execute method');

    // Verify the tool has access to pegaClient
    if (!toolInstance.pegaClient) {
      throw new Error('Tool does not have pegaClient access');
    }

    console.log('✅ Tool has pegaClient access');

    console.log('\n🎉 All GetDataObjectsTool tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ GetDataObjectsTool test failed:', error.message);
    return false;
  }
}

// Run the test
testGetDataObjectsTool().then(success => {
  process.exit(success ? 0 : 1);
});
