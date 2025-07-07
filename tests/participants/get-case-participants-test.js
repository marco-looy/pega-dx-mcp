#!/usr/bin/env node

import { GetCaseParticipantsTool } from '../../src/tools/participants/get-case-participants.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetCaseParticipantsTool() {
  console.log('🧪 Testing GetCaseParticipantsTool\n');

  try {
    // Test tool category
    const category = GetCaseParticipantsTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'participants') {
      throw new Error(`Expected category 'participants', got '${category}'`);
    }

    // Test tool definition
    const definition = GetCaseParticipantsTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description length: ${definition.description.length} chars`);
    
    if (definition.name !== 'get_case_participants') {
      throw new Error(`Expected name 'get_case_participants', got '${definition.name}'`);
    }

    // Verify required schema properties
    if (!definition.inputSchema || !definition.inputSchema.properties) {
      throw new Error('Missing inputSchema or properties');
    }

    const { caseID } = definition.inputSchema.properties;
    if (!caseID || caseID.type !== 'string') {
      throw new Error('Missing or invalid caseID property in schema');
    }

    console.log('✅ Input schema validation passed');

    // Test BaseTool inheritance
    const toolInstance = new GetCaseParticipantsTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool does not extend BaseTool');
    }

    // Test parameter validation - missing required parameter
    const missingParamTest = toolInstance.validateRequiredParams({}, ['caseID']);
    console.log(`✅ Required parameter validation works: ${!!missingParamTest.error}`);
    
    if (!missingParamTest || !missingParamTest.error) {
      throw new Error('Required parameter validation should fail for missing caseID');
    }

    // Test parameter validation - valid parameters
    const validParamTest = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE-123' }, ['caseID']);
    console.log(`✅ Valid parameter test passed: ${validParamTest === null}`);
    
    if (validParamTest !== null) {
      throw new Error('Valid parameter validation should return null');
    }

    // Test parameter validation - empty string
    const emptyStringTest = toolInstance.validateRequiredParams({ caseID: '' }, ['caseID']);
    console.log(`✅ Empty string validation works: ${!!emptyStringTest.error}`);
    
    if (!emptyStringTest || !emptyStringTest.error) {
      throw new Error('Empty string validation should fail');
    }

    // Test parameter validation - whitespace only
    const whitespaceTest = toolInstance.validateRequiredParams({ caseID: '   ' }, ['caseID']);
    console.log(`✅ Whitespace validation works: ${!!whitespaceTest.error}`);
    
    if (!whitespaceTest || !whitespaceTest.error) {
      throw new Error('Whitespace-only validation should fail');
    }

    console.log('\n🎉 All GetCaseParticipantsTool tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ GetCaseParticipantsTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testGetCaseParticipantsTool().then(success => {
  process.exit(success ? 0 : 1);
});
