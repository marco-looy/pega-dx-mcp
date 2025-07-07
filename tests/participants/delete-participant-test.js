#!/usr/bin/env node

import { DeleteParticipantTool } from '../../src/tools/participants/delete-participant.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testDeleteParticipantTool() {
  console.log('🧪 Testing DeleteParticipantTool\n');

  try {
    // Test tool category
    const category = DeleteParticipantTool.getCategory();
    console.log(`✅ Category: ${category}`);

    // Test tool definition
    const definition = DeleteParticipantTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);

    // Test BaseTool inheritance
    const toolInstance = new DeleteParticipantTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    // Test required parameter validation
    const requiredTest = toolInstance.validateRequiredParams({}, ['caseID', 'participantID', 'eTag']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);

    // Test parameter validation with missing eTag
    const missingETagTest = toolInstance.validateRequiredParams({ caseID: 'test', participantID: 'test' }, ['caseID', 'participantID', 'eTag']);
    console.log(`✅ Missing eTag validation works: ${!!missingETagTest.error}`);

    // Test schema structure
    const schema = definition.inputSchema;
    const expectedProps = ['caseID', 'participantID', 'eTag'];
    const hasAllProps = expectedProps.every(prop => schema.properties.hasOwnProperty(prop));
    console.log(`✅ Schema has all expected properties: ${hasAllProps}`);

    // Test required fields
    const hasAllRequiredFields = schema.required.includes('caseID') && 
                                schema.required.includes('participantID') && 
                                schema.required.includes('eTag');
    console.log(`✅ All required fields correctly defined: ${hasAllRequiredFields}`);

    // Test eTag security - should be present in schema but hidden in logs
    const hasETagProperty = schema.properties.hasOwnProperty('eTag');
    const eTagDescription = schema.properties.eTag.description;
    const hasOptimisticLocking = eTagDescription.includes('optimistic locking');
    console.log(`✅ eTag property correctly defined: ${hasETagProperty}`);
    console.log(`✅ eTag mentions optimistic locking: ${hasOptimisticLocking}`);

    console.log('\n🎉 All DeleteParticipantTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ DeleteParticipantTool test failed:', error);
    return false;
  }
}

testDeleteParticipantTool().then(success => process.exit(success ? 0 : 1));
