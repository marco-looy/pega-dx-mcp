#!/usr/bin/env node

import { CreateCaseParticipantTool } from '../../src/tools/participants/create-case-participant.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testCreateCaseParticipantTool() {
  console.log('🧪 Testing CreateCaseParticipantTool\n');

  try {
    // Test tool category
    const category = CreateCaseParticipantTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'participants') {
      throw new Error(`Expected category 'participants', got '${category}'`);
    }

    // Test tool definition
    const definition = CreateCaseParticipantTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description length: ${definition.description.length} chars`);
    
    if (definition.name !== 'create_case_participant') {
      throw new Error(`Expected name 'create_case_participant', got '${definition.name}'`);
    }

    // Verify required schema properties
    if (!definition.inputSchema || !definition.inputSchema.properties) {
      throw new Error('Missing inputSchema or properties');
    }

    const { caseID, eTag, content, participantRoleID, viewType, pageInstructions } = definition.inputSchema.properties;
    
    // Check required parameters
    if (!caseID || caseID.type !== 'string') {
      throw new Error('Missing or invalid caseID property in schema');
    }
    
    if (!eTag || eTag.type !== 'string') {
      throw new Error('Missing or invalid eTag property in schema');
    }
    
    if (!content || content.type !== 'object') {
      throw new Error('Missing or invalid content property in schema');
    }
    
    if (!participantRoleID || participantRoleID.type !== 'string') {
      throw new Error('Missing or invalid participantRoleID property in schema');
    }

    // Check optional parameters
    if (!viewType || !viewType.enum || !viewType.enum.includes('form') || !viewType.enum.includes('none')) {
      throw new Error('Missing or invalid viewType enum in schema');
    }

    if (!pageInstructions || pageInstructions.type !== 'array') {
      throw new Error('Missing or invalid pageInstructions property in schema');
    }

    // Check required array
    const required = definition.inputSchema.required;
    if (!required || !Array.isArray(required)) {
      throw new Error('Missing required array in schema');
    }
    
    const expectedRequired = ['caseID', 'eTag', 'content', 'participantRoleID'];
    for (const param of expectedRequired) {
      if (!required.includes(param)) {
        throw new Error(`Missing required parameter '${param}' in schema`);
      }
    }

    console.log('✅ Input schema validation passed');

    // Test BaseTool inheritance
    const toolInstance = new CreateCaseParticipantTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool does not extend BaseTool');
    }

    // Test parameter validation - missing required parameters
    const missingParamTest1 = toolInstance.validateRequiredParams({}, ['caseID', 'eTag', 'content', 'participantRoleID']);
    console.log(`✅ Required parameter validation works: ${!!missingParamTest1.error}`);
    
    if (!missingParamTest1 || !missingParamTest1.error) {
      throw new Error('Required parameter validation should fail for missing parameters');
    }

    // Test parameter validation - missing some required parameters
    const missingParamTest2 = toolInstance.validateRequiredParams(
      { caseID: 'TEST-CASE-123', eTag: 'test-etag' }, 
      ['caseID', 'eTag', 'content', 'participantRoleID']
    );
    console.log(`✅ Partial required parameter validation works: ${!!missingParamTest2.error}`);
    
    if (!missingParamTest2 || !missingParamTest2.error) {
      throw new Error('Required parameter validation should fail for missing content and participantRoleID');
    }

    // Test parameter validation - valid parameters
    const validParams = {
      caseID: 'TEST-CASE-123',
      eTag: 'test-etag-value',
      content: { pyFirstName: 'John', pyLastName: 'Doe' },
      participantRoleID: 'ROLE-123'
    };
    const validParamTest = toolInstance.validateRequiredParams(validParams, ['caseID', 'eTag', 'content', 'participantRoleID']);
    console.log(`✅ Valid parameter test passed: ${validParamTest === null}`);
    
    if (validParamTest !== null) {
      throw new Error('Valid parameter validation should return null');
    }

    // Test enum validation - valid viewType
    const validEnumTest = toolInstance.validateEnumParams({ viewType: 'form' }, { viewType: ['form', 'none'] });
    console.log(`✅ Valid enum validation passed: ${validEnumTest === null}`);
    
    if (validEnumTest !== null) {
      throw new Error('Valid enum validation should return null');
    }

    // Test enum validation - invalid viewType
    const invalidEnumTest = toolInstance.validateEnumParams({ viewType: 'invalid' }, { viewType: ['form', 'none'] });
    console.log(`✅ Invalid enum validation works: ${!!invalidEnumTest.error}`);
    
    if (!invalidEnumTest || !invalidEnumTest.error) {
      throw new Error('Invalid enum validation should fail');
    }

    // Test parameter validation - empty string parameters
    const emptyStringTest = toolInstance.validateRequiredParams(
      { caseID: '', eTag: 'test-etag', content: {}, participantRoleID: 'ROLE-123' }, 
      ['caseID', 'eTag', 'content', 'participantRoleID']
    );
    console.log(`✅ Empty string validation works: ${!!emptyStringTest.error}`);
    
    if (!emptyStringTest || !emptyStringTest.error) {
      throw new Error('Empty string validation should fail');
    }

    // Test parameter validation - whitespace only
    const whitespaceTest = toolInstance.validateRequiredParams(
      { caseID: '   ', eTag: 'test-etag', content: {}, participantRoleID: 'ROLE-123' }, 
      ['caseID', 'eTag', 'content', 'participantRoleID']
    );
    console.log(`✅ Whitespace validation works: ${!!whitespaceTest.error}`);
    
    if (!whitespaceTest || !whitespaceTest.error) {
      throw new Error('Whitespace-only validation should fail');
    }

    console.log('\n🎉 All CreateCaseParticipantTool tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ CreateCaseParticipantTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testCreateCaseParticipantTool().then(success => {
  process.exit(success ? 0 : 1);
});
