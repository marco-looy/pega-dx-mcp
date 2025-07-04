#!/usr/bin/env node

import { UpdateDataRecordPartialTool } from '../../src/tools/dataviews/update-data-record-partial.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testUpdateDataRecordPartialTool() {
  console.log('🧪 Testing UpdateDataRecordPartialTool\n');

  try {
    // Test tool category
    const category = UpdateDataRecordPartialTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'dataviews') {
      throw new Error(`Expected category 'dataviews', got '${category}'`);
    }

    // Test tool definition
    const definition = UpdateDataRecordPartialTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    if (definition.name !== 'update_data_record_partial') {
      throw new Error(`Expected name 'update_data_record_partial', got '${definition.name}'`);
    }

    // Test BaseTool inheritance
    const toolInstance = new UpdateDataRecordPartialTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool must extend BaseTool');
    }

    // Test input schema structure
    const schema = definition.inputSchema;
    console.log('✅ Input schema validation:');
    
    // Check required properties
    const requiredProps = schema.required;
    console.log(`  - Required properties: ${requiredProps.join(', ')}`);
    if (!requiredProps.includes('dataViewID') || !requiredProps.includes('data')) {
      throw new Error('Missing required properties: dataViewID and data');
    }

    // Check optional properties exist
    const properties = schema.properties;
    if (!properties.eTag) {
      throw new Error('Missing optional property: eTag');
    }
    if (!properties.pageInstructions) {
      throw new Error('Missing optional property: pageInstructions');
    }
    console.log('  - Optional properties: eTag, pageInstructions');

    // Test parameter validation - missing required params
    const missingRequiredTest = toolInstance.validateRequiredParams({}, ['dataViewID', 'data']);
    console.log(`✅ Required validation works: ${!!missingRequiredTest?.error}`);
    if (!missingRequiredTest || !missingRequiredTest.error) {
      throw new Error('Required parameter validation should fail with missing params');
    }

    // Test parameter validation - valid params
    const validParams = {
      dataViewID: 'TestDataView',
      data: { name: 'Test', value: 123 }
    };
    const validTest = toolInstance.validateRequiredParams(validParams, ['dataViewID', 'data']);
    console.log(`✅ Valid params pass validation: ${!validTest}`);
    if (validTest) {
      throw new Error('Valid parameters should pass validation');
    }

    // Test description content
    if (!definition.description.includes('Partially update')) {
      throw new Error('Description should mention partial update');
    }
    if (!definition.description.includes('PEGA System of records')) {
      throw new Error('Description should mention PEGA System of records limitation');
    }
    console.log('✅ Description includes key information');

    // Test that method exists on tool instance
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('Tool must have execute method');
    }
    console.log('✅ Execute method exists');

    console.log('\n🎉 All UpdateDataRecordPartialTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ UpdateDataRecordPartialTool test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run the test
testUpdateDataRecordPartialTool().then(success => {
  process.exit(success ? 0 : 1);
});
