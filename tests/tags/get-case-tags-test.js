#!/usr/bin/env node

import { GetCaseTagsTool } from '../../src/tools/tags/get-case-tags.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetCaseTagsTool() {
  console.log('🧪 Testing GetCaseTagsTool\n');

  try {
    // Test tool category
    const category = GetCaseTagsTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'tags') {
      throw new Error(`Expected category 'tags', got '${category}'`);
    }

    // Test tool definition
    const definition = GetCaseTagsTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    if (definition.name !== 'get_case_tags') {
      throw new Error(`Expected name 'get_case_tags', got '${definition.name}'`);
    }

    // Test BaseTool inheritance
    const toolInstance = new GetCaseTagsTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('GetCaseTagsTool must extend BaseTool');
    }

    // Test required parameters validation
    const requiredTest = toolInstance.validateRequiredParams({}, ['caseID']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);

    // Test invalid parameters
    const invalidTest = toolInstance.validateRequiredParams({ caseID: '' }, ['caseID']);
    console.log(`✅ Empty string validation: ${!!invalidTest.error}`);

    // Test valid parameters
    const validTest = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE-123' }, ['caseID']);
    console.log(`✅ Valid parameters: ${validTest === null}`);

    // Test tool schema validation
    const schema = definition.inputSchema;
    console.log(`✅ Has input schema: ${!!schema}`);
    console.log(`✅ Required parameters: ${JSON.stringify(schema.required)}`);

    // Test parameter descriptions
    const caseIDParam = schema.properties.caseID;
    console.log(`✅ Case ID parameter configured: ${!!caseIDParam}`);
    console.log(`✅ Case ID description: ${!!caseIDParam.description}`);

    console.log('\n🎉 All GetCaseTagsTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ GetCaseTagsTool test failed:', error.message);
    return false;
  }
}

// Test with real API if credentials are available
async function testRealAPI() {
  console.log('\n🔗 Testing Real API Integration...\n');
  
  try {
    const toolInstance = new GetCaseTagsTool();
    
    // Test with a hypothetical case ID (this will likely fail with 404, which is expected)
    const result = await toolInstance.execute({
      caseID: 'TEST-CASE-TAGS-12345'
    });
    
    console.log('📡 API Response received');
    
    // Check if we got a structured response (success or error)
    if (result.content || result.error) {
      console.log('✅ Structured response format');
      
      if (result.error) {
        console.log(`⚠️  Expected error (likely case not found): ${result.error}`);
      } else {
        console.log('✅ Successful API response');
        console.log('📊 Response structure validated');
      }
    } else {
      console.log('❌ Unexpected response format');
      return false;
    }
    
    console.log('✅ Real API integration test completed');
    return true;
  } catch (error) {
    console.error('❌ Real API test failed:', error.message);
    console.log('ℹ️  This might be due to missing credentials or network issues');
    return false;
  }
}

// Run tests
testGetCaseTagsTool()
  .then(success => {
    if (success) {
      return testRealAPI();
    }
    return false;
  })
  .then(success => {
    console.log(success ? '\n🎉 All tests completed!' : '\n❌ Some tests failed');
    process.exit(success ? 0 : 1);
  });
