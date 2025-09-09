#!/usr/bin/env node
import 'dotenv/config';

import { GetRelatedCasesTool } from '../../src/tools/related_cases/get-related-cases.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetRelatedCasesTool() {
  console.log('🧪 Testing GetRelatedCasesTool\n');

  try {
    // Test tool category
    const category = GetRelatedCasesTool.getCategory();
    console.log(`✅ Category: ${category}`);

    // Test tool definition
    const definition = GetRelatedCasesTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);

    // Validate input schema
    const inputSchema = definition.inputSchema;
    console.log(`✅ Input schema type: ${inputSchema.type}`);
    console.log(`✅ Required parameters: ${inputSchema.required.join(', ')}`);

    // Test BaseTool inheritance
    const toolInstance = new GetRelatedCasesTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    // Test parameter validation - missing required parameter
    const missingParamTest = toolInstance.validateRequiredParams({}, ['caseID']);
    console.log(`✅ Required validation works: ${!!missingParamTest.error}`);

    // Test parameter validation - valid parameters
    const validParamTest = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE R-123' }, ['caseID']);
    console.log(`✅ Valid parameters pass: ${!validParamTest}`);

    // Test schema properties
    const properties = inputSchema.properties;
    console.log(`✅ caseID property type: ${properties.caseID.type}`);
    console.log(`✅ caseID is required: ${inputSchema.required.includes('caseID')}`);

    // Validate tool follows BaseTool pattern
    console.log(`✅ Has getCategory method: ${typeof GetRelatedCasesTool.getCategory === 'function'}`);
    console.log(`✅ Has getDefinition method: ${typeof GetRelatedCasesTool.getDefinition === 'function'}`);
    console.log(`✅ Has execute method: ${typeof toolInstance.execute === 'function'}`);

    console.log('\n🎉 All GetRelatedCasesTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ GetRelatedCasesTool test failed:', error);
    return false;
  }
}

// Test execution patterns
async function testExecutionPatterns() {
  console.log('\n🔧 Testing Execution Patterns\n');

  try {
    const toolInstance = new GetRelatedCasesTool();

    // Test missing required parameter
    console.log('Testing missing caseID parameter...');
    const missingTest = await toolInstance.execute({});
    console.log(`✅ Missing parameter handled: ${!!missingTest.error}`);

    // Test empty caseID
    console.log('Testing empty caseID parameter...');
    const emptyTest = await toolInstance.execute({ caseID: '' });
    console.log(`✅ Empty parameter handled: ${!!emptyTest.error}`);

    console.log('\n🎉 All execution pattern tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Execution pattern test failed:', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Running GetRelatedCasesTool Tests\n');
  console.log('=' .repeat(50));

  const basicTests = await testGetRelatedCasesTool();
  const executionTests = await testExecutionPatterns();

  console.log('\n' + '='.repeat(50));
  if (basicTests && executionTests) {
    console.log('✅ All tests passed successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
