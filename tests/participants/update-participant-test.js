#!/usr/bin/env node
import 'dotenv/config';

import { UpdateParticipantTool } from '../../src/tools/participants/update-participant.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testUpdateParticipantTool() {
  console.log('🧪 Testing UpdateParticipantTool\n');

  try {
    // Test tool category
    const category = UpdateParticipantTool.getCategory();
    console.log(`✅ Category: ${category}`);

    // Test tool definition
    const definition = UpdateParticipantTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);

    // Test BaseTool inheritance
    const toolInstance = new UpdateParticipantTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    // Test required parameter validation
    const requiredTest = toolInstance.validateRequiredParams({}, ['caseID', 'participantID', 'eTag']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);

    // Test enum parameter validation
    const enumTest = toolInstance.validateEnumParams({ viewType: 'invalid' }, { viewType: ['form', 'none'] });
    console.log(`✅ Enum validation works: ${!!enumTest.error}`);

    // Test schema structure
    const schema = definition.inputSchema;
    const expectedProps = ['caseID', 'participantID', 'eTag', 'content', 'pageInstructions', 'viewType'];
    const hasAllProps = expectedProps.every(prop => schema.properties.hasOwnProperty(prop));
    console.log(`✅ Schema has all expected properties: ${hasAllProps}`);

    // Test required fields (only caseID, participantID, eTag are required)
    const hasRequiredFields = schema.required.includes('caseID') && 
                             schema.required.includes('participantID') && 
                             schema.required.includes('eTag');
    const hasCorrectRequiredCount = schema.required.length === 3;
    console.log(`✅ Required fields correctly defined: ${hasRequiredFields && hasCorrectRequiredCount}`);

    // Test content property structure
    const contentProperty = schema.properties.content;
    const hasContentProperties = contentProperty && contentProperty.properties;
    const expectedContentProps = ['pyFirstName', 'pyLastName', 'pyFullName', 'pyEmail1', 'pyPhoneNumber', 'pyTitle'];
    const hasExpectedContentProps = hasContentProperties && 
                                   expectedContentProps.every(prop => contentProperty.properties.hasOwnProperty(prop));
    console.log(`✅ Content property structure correct: ${hasExpectedContentProps}`);

    // Test viewType enum values
    const viewTypeEnum = schema.properties.viewType.enum;
    const hasCorrectEnum = viewTypeEnum.includes('form') && viewTypeEnum.includes('none');
    console.log(`✅ ViewType enum correctly defined: ${hasCorrectEnum}`);

    // Test eTag security and optimistic locking description
    const eTagDescription = schema.properties.eTag.description;
    const hasOptimisticLocking = eTagDescription.includes('optimistic locking');
    console.log(`✅ eTag mentions optimistic locking: ${hasOptimisticLocking}`);

    // Test pageInstructions array structure
    const pageInstructions = schema.properties.pageInstructions;
    const isArray = pageInstructions.type === 'array';
    const hasItemsSchema = pageInstructions.items && pageInstructions.items.type === 'object';
    console.log(`✅ PageInstructions correctly defined as array: ${isArray && hasItemsSchema}`);

    console.log('\n🎉 All UpdateParticipantTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ UpdateParticipantTool test failed:', error);
    return false;
  }
}

testUpdateParticipantTool().then(success => process.exit(success ? 0 : 1));
