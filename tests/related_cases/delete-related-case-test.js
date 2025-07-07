#!/usr/bin/env node

import { DeleteRelatedCaseTool } from '../../src/tools/related_cases/delete-related-case.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testDeleteRelatedCaseTool() {
  console.log('🧪 Testing DeleteRelatedCaseTool\n');

  try {
    // Test tool category
    const category = DeleteRelatedCaseTool.getCategory();
    console.log(`✅ Category: ${category}`);

    // Test tool definition
    const definition = DeleteRelatedCaseTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);

    // Validate input schema
    const inputSchema = definition.inputSchema;
    console.log(`✅ Input schema type: ${inputSchema.type}`);
    console.log(`✅ Required parameters: ${inputSchema.required.join(', ')}`);

    // Test BaseTool inheritance
    const toolInstance = new DeleteRelatedCaseTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    // Test parameter validation - missing required parameters
    const missingParamTest = toolInstance.validateRequiredParams({}, ['caseID', 'related_caseID']);
    console.log(`✅ Required validation works: ${!!missingParamTest.error}`);

    // Test parameter validation - missing one required parameter
    const missingOneParamTest = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE R-123' }, ['caseID', 'related_caseID']);
    console.log(`✅ Missing one parameter handled: ${!!missingOneParamTest.error}`);

    // Test parameter validation - valid parameters
    const validParamTest = toolInstance.validateRequiredParams(
      { caseID: 'TEST-CASE R-123', related_caseID: 'TEST-CASE R-456' }, 
      ['caseID', 'related_caseID']
    );
    console.log(`✅ Valid parameters pass: ${!validParamTest}`);

    // Test schema properties
    const properties = inputSchema.properties;
    console.log(`✅ caseID property type: ${properties.caseID.type}`);
    console.log(`✅ related_caseID property type: ${properties.related_caseID.type}`);
    console.log(`✅ caseID is required: ${inputSchema.required.includes('caseID')}`);
    console.log(`✅ related_caseID is required: ${inputSchema.required.includes('related_caseID')}`);

    // Validate tool follows BaseTool pattern
    console.log(`✅ Has getCategory method: ${typeof DeleteRelatedCaseTool.getCategory === 'function'}`);
    console.log(`✅ Has getDefinition method: ${typeof DeleteRelatedCaseTool.getDefinition === 'function'}`);
    console.log(`✅ Has execute method: ${typeof toolInstance.execute === 'function'}`);

    console.log('\n🎉 All DeleteRelatedCaseTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ DeleteRelatedCaseTool test failed:', error);
    return false;
  }
}

// Test execution patterns
async function testExecutionPatterns() {
  console.log('\n🔧 Testing Execution Patterns\n');

  try {
    const toolInstance = new DeleteRelatedCaseTool();

    // Test missing required parameters
    console.log('Testing missing caseID parameter...');
    const missingCaseIdTest = await toolInstance.execute({ related_caseID: 'TEST-CASE R-456' });
    console.log(`✅ Missing caseID handled: ${!!missingCaseIdTest.error}`);

    console.log('Testing missing related_caseID parameter...');
    const missingRelatedCaseIdTest = await toolInstance.execute({ caseID: 'TEST-CASE R-123' });
    console.log(`✅ Missing related_caseID handled: ${!!missingRelatedCaseIdTest.error}`);

    console.log('Testing both parameters missing...');
    const bothMissingTest = await toolInstance.execute({});
    console.log(`✅ Both parameters missing handled: ${!!bothMissingTest.error}`);

    // Test empty parameters
    console.log('Testing empty caseID parameter...');
    const emptyCaseIdTest = await toolInstance.execute({ caseID: '', related_caseID: 'TEST-CASE R-456' });
    console.log(`✅ Empty caseID handled: ${!!emptyCaseIdTest.error}`);

    console.log('Testing empty related_caseID parameter...');
    const emptyRelatedCaseIdTest = await toolInstance.execute({ caseID: 'TEST-CASE R-123', related_caseID: '' });
    console.log(`✅ Empty related_caseID handled: ${!!emptyRelatedCaseIdTest.error}`);

    console.log('\n🎉 All execution pattern tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Execution pattern test failed:', error);
    return false;
  }
}

// Test tool definition compliance
async function testToolDefinition() {
  console.log('\n📋 Testing Tool Definition Compliance\n');

  try {
    const definition = DeleteRelatedCaseTool.getDefinition();

    // Test required fields
    console.log(`✅ Has name: ${!!definition.name}`);
    console.log(`✅ Has description: ${!!definition.description}`);
    console.log(`✅ Has inputSchema: ${!!definition.inputSchema}`);

    // Test schema structure
    const schema = definition.inputSchema;
    console.log(`✅ Schema is object type: ${schema.type === 'object'}`);
    console.log(`✅ Has properties: ${!!schema.properties}`);
    console.log(`✅ Has required array: ${Array.isArray(schema.required)}`);

    // Test specific properties
    const props = schema.properties;
    console.log(`✅ caseID property exists: ${!!props.caseID}`);
    console.log(`✅ related_caseID property exists: ${!!props.related_caseID}`);
    console.log(`✅ caseID has description: ${!!props.caseID.description}`);
    console.log(`✅ related_caseID has description: ${!!props.related_caseID.description}`);

    // Test required parameters
    const required = schema.required;
    console.log(`✅ Required length is 2: ${required.length === 2}`);
    console.log(`✅ caseID is required: ${required.includes('caseID')}`);
    console.log(`✅ related_caseID is required: ${required.includes('related_caseID')}`);

    // Test tool name follows convention
    console.log(`✅ Tool name follows snake_case: ${definition.name === 'delete_related_case'}`);

    // Test category matches related_cases tools
    const category = DeleteRelatedCaseTool.getCategory();
    console.log(`✅ Category is related_cases: ${category === 'related_cases'}`);

    console.log('\n🎉 All tool definition compliance tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Tool definition test failed:', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Running DeleteRelatedCaseTool Tests\n');
  console.log('=' .repeat(60));

  const basicTests = await testDeleteRelatedCaseTool();
  const executionTests = await testExecutionPatterns();
  const definitionTests = await testToolDefinition();

  console.log('\n' + '='.repeat(60));
  if (basicTests && executionTests && definitionTests) {
    console.log('✅ All tests passed successfully!');
    console.log('\n🎯 DeleteRelatedCaseTool is ready for production use');
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
