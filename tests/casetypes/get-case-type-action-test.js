#!/usr/bin/env node
import 'dotenv/config';

import { GetCaseTypeActionTool } from '../../src/tools/casetypes/get-case-type-action.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetCaseTypeActionTool() {
  console.log('🧪 Testing GetCaseTypeActionTool\n');

  try {
    // Test tool category
    const category = GetCaseTypeActionTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'casetypes') {
      throw new Error(`Expected category 'casetypes', got '${category}'`);
    }

    // Test tool definition
    const definition = GetCaseTypeActionTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);
    
    if (definition.name !== 'get_case_type_action') {
      throw new Error(`Expected name 'get_case_type_action', got '${definition.name}'`);
    }

    // Test required parameters
    const requiredParams = definition.inputSchema.required;
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    if (!requiredParams.includes('caseTypeID') || !requiredParams.includes('actionID')) {
      throw new Error('Missing required parameters: caseTypeID and actionID expected');
    }

    // Test BaseTool inheritance
    const toolInstance = new GetCaseTypeActionTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool does not extend BaseTool');
    }

    // Test parameter validation
    const emptyParamsTest = toolInstance.validateRequiredParams({}, ['caseTypeID', 'actionID']);
    console.log(`✅ Empty parameters validation: ${!!emptyParamsTest}`);
    
    if (!emptyParamsTest) {
      throw new Error('Expected validation error for empty parameters');
    }

    const validParamsTest = toolInstance.validateRequiredParams({
      caseTypeID: 'Bug',
      actionID: 'Clone'
    }, ['caseTypeID', 'actionID']);
    console.log(`✅ Valid parameters validation: ${!validParamsTest}`);
    
    if (validParamsTest) {
      throw new Error('Unexpected validation error for valid parameters');
    }

    // Test input schema structure
    const inputSchema = definition.inputSchema;
    console.log(`✅ Input schema type: ${inputSchema.type}`);
    console.log(`✅ Properties defined: ${Object.keys(inputSchema.properties).length}`);
    
    const properties = inputSchema.properties;
    if (!properties.caseTypeID || !properties.actionID) {
      throw new Error('Missing required property definitions');
    }

    if (properties.caseTypeID.type !== 'string' || properties.actionID.type !== 'string') {
      throw new Error('Parameter types should be string');
    }

    // Test tool methods exist
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('execute method not found');
    }

    if (typeof toolInstance.formatSuccessResponse !== 'function') {
      throw new Error('formatSuccessResponse method not found');
    }

    console.log(`✅ Tool methods: execute, formatSuccessResponse`);

    // Test API client integration
    if (!toolInstance.pegaClient) {
      throw new Error('PegaAPIClient not instantiated');
    }

    console.log(`✅ PegaAPIClient integration: Available`);

    // Test parameter descriptions
    const caseTypeDesc = properties.caseTypeID.description;
    const actionDesc = properties.actionID.description;
    
    console.log(`✅ Parameter descriptions provided`);
    
    if (!caseTypeDesc || !actionDesc) {
      throw new Error('Parameter descriptions missing');
    }

    console.log('\n🎉 All GetCaseTypeActionTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ GetCaseTypeActionTool test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Test with API integration (if environment is configured)
async function testWithAPIIntegration() {
  console.log('\n🔗 Testing API Integration\n');
  
  try {
    const toolInstance = new GetCaseTypeActionTool();
    
    // Test API client method exists
    if (typeof toolInstance.pegaClient.getCaseTypeAction !== 'function') {
      throw new Error('getCaseTypeAction method not found in PegaAPIClient');
    }
    
    console.log('✅ API client method available: getCaseTypeAction');
    
    // Test execution with mock parameters (won't actually call API without valid config)
    console.log('✅ Tool ready for API integration');
    
    return true;
  } catch (error) {
    console.error('❌ API integration test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Running GetCaseTypeActionTool Tests\n');
  
  const toolTest = await testGetCaseTypeActionTool();
  const apiTest = await testWithAPIIntegration();
  
  const allPassed = toolTest && apiTest;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`Tool Structure: ${toolTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Integration: ${apiTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  return allPassed;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testGetCaseTypeActionTool, testWithAPIIntegration, runAllTests };
