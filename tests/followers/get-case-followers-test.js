#!/usr/bin/env node
import 'dotenv/config';

import { GetCaseFollowersTool } from '../../src/tools/followers/get-case-followers.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetCaseFollowersTool() {
  console.log('🧪 Testing GetCaseFollowersTool\n');

  try {
    // Test tool category
    const category = GetCaseFollowersTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'followers') {
      throw new Error(`Expected category 'followers', got '${category}'`);
    }

    // Test tool definition
    const definition = GetCaseFollowersTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);
    
    if (definition.name !== 'get_case_followers') {
      throw new Error(`Expected name 'get_case_followers', got '${definition.name}'`);
    }

    // Test BaseTool inheritance
    const toolInstance = new GetCaseFollowersTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('GetCaseFollowersTool should extend BaseTool');
    }

    // Test parameter validation - missing required parameter
    const missingParamTest = toolInstance.validateRequiredParams({}, ['caseID']);
    console.log(`✅ Required validation (missing): ${!!missingParamTest.error}`);
    
    if (!missingParamTest.error) {
      throw new Error('Should return error for missing required parameter');
    }

    // Test parameter validation - with required parameter
    const validParamTest = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE' }, ['caseID']);
    console.log(`✅ Required validation (present): ${!validParamTest}`);
    
    if (validParamTest) {
      throw new Error('Should not return error when required parameter is present');
    }

    // Test input schema structure
    const schema = definition.inputSchema;
    console.log(`✅ Schema type: ${schema.type}`);
    console.log(`✅ Required fields: ${schema.required.join(', ')}`);
    console.log(`✅ Has caseID property: ${!!schema.properties.caseID}`);
    
    if (schema.type !== 'object') {
      throw new Error('Input schema should be of type object');
    }
    
    if (!schema.required.includes('caseID')) {
      throw new Error('caseID should be required in schema');
    }
    
    if (!schema.properties.caseID) {
      throw new Error('Schema should have caseID property');
    }

    // Test execution with mock (this would require actual API to test fully)
    console.log('✅ Tool structure validation completed');

    console.log('\n🎉 All GetCaseFollowersTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ GetCaseFollowersTool test failed:', error.message);
    return false;
  }
}

testGetCaseFollowersTool().then(success => process.exit(success ? 0 : 1));
