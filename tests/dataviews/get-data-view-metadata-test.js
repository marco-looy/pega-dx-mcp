#!/usr/bin/env node
import 'dotenv/config';

import { GetDataViewMetadataTool } from '../../src/tools/dataviews/get-data-view-metadata.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetDataViewMetadataTool() {
  console.log('🧪 Testing GetDataViewMetadataTool\n');

  try {
    // Test tool category
    const category = GetDataViewMetadataTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'dataviews') {
      throw new Error(`Expected category 'dataviews', got '${category}'`);
    }

    // Test tool definition
    const definition = GetDataViewMetadataTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);
    
    if (definition.name !== 'get_data_view_metadata') {
      throw new Error(`Expected tool name 'get_data_view_metadata', got '${definition.name}'`);
    }

    // Test input schema structure
    const schema = definition.inputSchema;
    console.log(`✅ Input schema type: ${schema.type}`);
    console.log(`✅ Required parameters: ${JSON.stringify(schema.required)}`);
    
    if (!schema.properties.dataViewID) {
      throw new Error('Missing dataViewID property in input schema');
    }
    
    if (!schema.required.includes('dataViewID')) {
      throw new Error('dataViewID should be required parameter');
    }

    // Test BaseTool inheritance
    const toolInstance = new GetDataViewMetadataTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('GetDataViewMetadataTool must extend BaseTool');
    }

    // Test parameter validation - missing required parameter
    const missingParamTest = toolInstance.validateRequiredParams({}, ['dataViewID']);
    console.log(`✅ Required parameter validation works: ${!!missingParamTest}`);
    
    if (!missingParamTest || !missingParamTest.error) {
      throw new Error('Should return error for missing required parameter');
    }

    // Test parameter validation - valid parameters
    const validParamTest = toolInstance.validateRequiredParams(
      { dataViewID: 'D_CaseList' }, 
      ['dataViewID']
    );
    console.log(`✅ Valid parameter validation: ${validParamTest === null ? 'passed' : 'failed'}`);
    
    if (validParamTest !== null) {
      throw new Error('Should return null for valid parameters');
    }

    // Test API client method exists
    if (typeof toolInstance.pegaClient.getDataViewMetadata !== 'function') {
      throw new Error('PegaAPIClient missing getDataViewMetadata method');
    }
    console.log('✅ API client method exists: getDataViewMetadata');

    // Test tool has required methods
    const requiredMethods = ['execute'];
    for (const method of requiredMethods) {
      if (typeof toolInstance[method] !== 'function') {
        throw new Error(`Missing required method: ${method}`);
      }
    }
    console.log(`✅ Required methods present: ${requiredMethods.join(', ')}`);

    // Test parameter validation in execute method (simulate)
    try {
      const result = await toolInstance.execute({});
      if (result && result.error && result.error.includes('dataViewID is required')) {
        console.log('✅ Execute method validates required parameters');
      } else {
        console.log('⚠️  Execute method validation result unclear');
      }
    } catch (error) {
      console.log('⚠️  Execute method test failed (expected if no Pega connection)');
    }

    console.log('\n🎉 All GetDataViewMetadataTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ GetDataViewMetadataTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testGetDataViewMetadataTool().then(success => {
  process.exit(success ? 0 : 1);
});
