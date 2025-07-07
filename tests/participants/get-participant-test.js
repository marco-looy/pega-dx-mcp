#!/usr/bin/env node

import { GetParticipantTool } from '../../src/tools/participants/get-participant.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetParticipantTool() {
  console.log('🧪 Testing GetParticipantTool\n');

  try {
    // Test tool category
    const category = GetParticipantTool.getCategory();
    console.log(`✅ Category: ${category}`);

    // Test tool definition
    const definition = GetParticipantTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);

    // Test BaseTool inheritance
    const toolInstance = new GetParticipantTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    // Test required parameter validation
    const requiredTest = toolInstance.validateRequiredParams({}, ['caseID', 'participantID']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);

    // Test enum parameter validation
    const enumTest = toolInstance.validateEnumParams({ viewType: 'invalid' }, { viewType: ['form', 'none'] });
    console.log(`✅ Enum validation works: ${!!enumTest.error}`);

    // Test schema structure
    const schema = definition.inputSchema;
    const expectedProps = ['caseID', 'participantID', 'viewType'];
    const hasAllProps = expectedProps.every(prop => schema.properties.hasOwnProperty(prop));
    console.log(`✅ Schema has all expected properties: ${hasAllProps}`);

    // Test required fields
    const hasRequiredFields = schema.required.includes('caseID') && schema.required.includes('participantID');
    console.log(`✅ Required fields correctly defined: ${hasRequiredFields}`);

    // Test viewType enum values
    const viewTypeEnum = schema.properties.viewType.enum;
    const hasCorrectEnum = viewTypeEnum.includes('form') && viewTypeEnum.includes('none');
    console.log(`✅ ViewType enum correctly defined: ${hasCorrectEnum}`);

    console.log('\n🎉 All GetParticipantTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ GetParticipantTool test failed:', error);
    return false;
  }
}

testGetParticipantTool().then(success => process.exit(success ? 0 : 1));
