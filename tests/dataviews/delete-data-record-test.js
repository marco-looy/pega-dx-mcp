#!/usr/bin/env node
import 'dotenv/config';

import { DeleteDataRecordTool } from '../../src/tools/dataviews/delete-data-record.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testDeleteDataRecordTool() {
  console.log('🧪 Testing DeleteDataRecordTool\n');

  try {
    // Test tool category
    const category = DeleteDataRecordTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'dataviews') {
      throw new Error(`Expected category 'dataviews', got '${category}'`);
    }

    // Test tool definition
    const definition = DeleteDataRecordTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    if (definition.name !== 'delete_data_record') {
      throw new Error(`Expected name 'delete_data_record', got '${definition.name}'`);
    }

    // Validate definition structure
    if (!definition.description) {
      throw new Error('Tool definition missing description');
    }
    if (!definition.inputSchema) {
      throw new Error('Tool definition missing inputSchema');
    }
    if (!definition.inputSchema.properties) {
      throw new Error('Tool definition missing properties');
    }
    if (!definition.inputSchema.required || !Array.isArray(definition.inputSchema.required)) {
      throw new Error('Tool definition missing or invalid required array');
    }

    // Test required parameters
    const requiredParams = definition.inputSchema.required;
    const expectedRequired = ['dataViewID', 'dataViewParameters'];
    if (JSON.stringify(requiredParams.sort()) !== JSON.stringify(expectedRequired.sort())) {
      throw new Error(`Expected required params ${expectedRequired}, got ${requiredParams}`);
    }
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);

    // Test parameter properties
    const properties = definition.inputSchema.properties;
    if (!properties.dataViewID || properties.dataViewID.type !== 'string') {
      throw new Error('dataViewID parameter missing or invalid');
    }
    if (!properties.dataViewParameters || properties.dataViewParameters.type !== 'string') {
      throw new Error('dataViewParameters parameter missing or invalid');
    }
    console.log('✅ Parameter properties validated');

    // Test BaseTool inheritance
    const toolInstance = new DeleteDataRecordTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool does not extend BaseTool');
    }

    // Test parameter validation - missing required parameters
    const missingDataViewIDTest = toolInstance.validateRequiredParams({}, ['dataViewID']);
    if (!missingDataViewIDTest || !missingDataViewIDTest.error) {
      throw new Error('Should have validation error for missing dataViewID');
    }
    console.log('✅ Required parameter validation working');

    const missingDataViewParametersTest = toolInstance.validateRequiredParams({ dataViewID: 'TestDataView' }, ['dataViewID', 'dataViewParameters']);
    if (!missingDataViewParametersTest || !missingDataViewParametersTest.error) {
      throw new Error('Should have validation error for missing dataViewParameters');
    }
    console.log('✅ Multiple required parameter validation working');

    // Test parameter validation - empty string parameters
    const emptyDataViewIDTest = toolInstance.validateRequiredParams({ dataViewID: '', dataViewParameters: 'test=123' }, ['dataViewID', 'dataViewParameters']);
    if (!emptyDataViewIDTest || !emptyDataViewIDTest.error) {
      throw new Error('Should have validation error for empty dataViewID');
    }
    console.log('✅ Empty string parameter validation working');

    // Test parameter validation - valid parameters
    const validParamsTest = toolInstance.validateRequiredParams({ 
      dataViewID: 'D_CustomerList', 
      dataViewParameters: 'CustomerID=12345' 
    }, ['dataViewID', 'dataViewParameters']);
    if (validParamsTest !== null) {
      throw new Error('Should not have validation error for valid parameters');
    }
    console.log('✅ Valid parameter validation working');

    // Test tool instance methods
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('Tool missing execute method');
    }
    console.log('✅ Execute method present');

    // Test tool static methods
    if (typeof DeleteDataRecordTool.getCategory !== 'function') {
      throw new Error('Tool missing static getCategory method');
    }
    if (typeof DeleteDataRecordTool.getDefinition !== 'function') {
      throw new Error('Tool missing static getDefinition method');
    }
    console.log('✅ Static methods present');

    console.log('\n🎉 All DeleteDataRecordTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ DeleteDataRecordTool test failed:', error.message);
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDeleteDataRecordTool().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testDeleteDataRecordTool };
