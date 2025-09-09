#!/usr/bin/env node
import 'dotenv/config';

import { GetParticipantRolesTool } from '../../src/tools/participants/get-participant-roles.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetParticipantRolesTool() {
  console.log('🧪 Testing GetParticipantRolesTool\n');

  try {
    // Test tool category
    const category = GetParticipantRolesTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'participants') {
      throw new Error(`Expected category 'participants', got '${category}'`);
    }

    // Test tool definition
    const definition = GetParticipantRolesTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);
    
    if (definition.name !== 'get_participant_roles') {
      throw new Error(`Expected tool name 'get_participant_roles', got '${definition.name}'`);
    }

    // Verify required parameter
    const requiredParams = definition.inputSchema.required;
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    if (!requiredParams.includes('caseID')) {
      throw new Error('Missing required parameter: caseID');
    }

    // Test BaseTool inheritance
    const toolInstance = new GetParticipantRolesTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool does not extend BaseTool');
    }

    // Test parameter validation - missing required parameter
    const requiredTest = toolInstance.validateRequiredParams({}, ['caseID']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);
    
    if (!requiredTest.error) {
      throw new Error('Required parameter validation should fail for missing caseID');
    }

    // Test parameter validation - with required parameter
    const validTest = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE R-123' }, ['caseID']);
    console.log(`✅ Valid parameters pass: ${!validTest}`);
    
    if (validTest) {
      throw new Error('Valid parameters should not return an error');
    }

    // Test schema structure
    const schema = definition.inputSchema;
    console.log(`✅ Schema type: ${schema.type}`);
    console.log(`✅ Has caseID property: ${!!schema.properties.caseID}`);
    
    if (schema.type !== 'object') {
      throw new Error(`Expected schema type 'object', got '${schema.type}'`);
    }
    
    if (!schema.properties.caseID) {
      throw new Error('Missing caseID property in schema');
    }

    // Verify caseID parameter configuration
    const caseIDParam = schema.properties.caseID;
    console.log(`✅ caseID type: ${caseIDParam.type}`);
    console.log(`✅ caseID has description: ${!!caseIDParam.description}`);
    
    if (caseIDParam.type !== 'string') {
      throw new Error(`Expected caseID type 'string', got '${caseIDParam.type}'`);
    }

    console.log('\n🎉 All GetParticipantRolesTool tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Tool category verification');
    console.log('   ✅ Tool definition structure');
    console.log('   ✅ BaseTool inheritance');
    console.log('   ✅ Parameter validation');
    console.log('   ✅ Schema validation');
    console.log('   ✅ Required parameter enforcement');
    
    return true;
  } catch (error) {
    console.error('❌ GetParticipantRolesTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testGetParticipantRolesTool().then(success => {
  process.exit(success ? 0 : 1);
});
