#!/usr/bin/env node
import 'dotenv/config';

import { AddOptionalProcessTool } from '../../src/tools/cases/add-optional-process.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testAddOptionalProcessTool() {
  console.log('🧪 Testing AddOptionalProcessTool\n');

  try {
    // Test tool category
    const category = AddOptionalProcessTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'cases') {
      throw new Error(`Expected category 'cases', got '${category}'`);
    }

    // Test tool definition
    const definition = AddOptionalProcessTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description length: ${definition.description.length} characters`);
    
    // Validate definition structure
    if (definition.name !== 'add_optional_process') {
      throw new Error(`Expected tool name 'add_optional_process', got '${definition.name}'`);
    }
    
    if (!definition.inputSchema || !definition.inputSchema.properties) {
      throw new Error('Tool definition missing inputSchema or properties');
    }
    
    // Check required parameters
    const requiredParams = definition.inputSchema.required;
    const expectedRequired = ['caseID', 'processID'];
    if (!expectedRequired.every(param => requiredParams.includes(param))) {
      throw new Error(`Missing required parameters. Expected: ${expectedRequired.join(', ')}, Got: ${requiredParams.join(', ')}`);
    }
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    // Check optional parameters
    const properties = definition.inputSchema.properties;
    if (!properties.viewType || !properties.viewType.enum) {
      throw new Error('viewType parameter missing or invalid');
    }
    console.log(`✅ viewType enum values: ${properties.viewType.enum.join(', ')}`);

    // Test BaseTool inheritance
    const toolInstance = new AddOptionalProcessTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('AddOptionalProcessTool does not extend BaseTool');
    }

    // Test parameter validation - missing required parameters
    console.log('\n📋 Testing parameter validation...');
    
    // Test missing caseID
    const missingCaseIdResult = toolInstance.validateRequiredParams({}, ['caseID', 'processID']);
    if (!missingCaseIdResult || !missingCaseIdResult.error) {
      throw new Error('Expected validation error for missing caseID');
    }
    console.log('✅ Validates missing caseID correctly');
    
    // Test missing processID
    const missingProcessIdResult = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE' }, ['caseID', 'processID']);
    if (!missingProcessIdResult || !missingProcessIdResult.error) {
      throw new Error('Expected validation error for missing processID');
    }
    console.log('✅ Validates missing processID correctly');
    
    // Test valid required parameters
    const validRequiredResult = toolInstance.validateRequiredParams({ 
      caseID: 'MYORG-SERVICES-WORK S-293001', 
      processID: 'UpdateContactDetails' 
    }, ['caseID', 'processID']);
    if (validRequiredResult) {
      throw new Error('Expected no validation error for valid required parameters');
    }
    console.log('✅ Validates correct required parameters');

    // Test enum validation
    const invalidEnumResult = toolInstance.validateEnumParams({ 
      caseID: 'MYORG-SERVICES-WORK S-293001', 
      processID: 'UpdateContactDetails',
      viewType: 'invalid' 
    }, { viewType: ['none', 'form', 'page'] });
    if (!invalidEnumResult || !invalidEnumResult.error) {
      throw new Error('Expected validation error for invalid viewType enum');
    }
    console.log('✅ Validates invalid viewType enum correctly');
    
    // Test valid enum
    const validEnumResult = toolInstance.validateEnumParams({ 
      caseID: 'MYORG-SERVICES-WORK S-293001', 
      processID: 'UpdateContactDetails',
      viewType: 'form' 
    }, { viewType: ['none', 'form', 'page'] });
    if (validEnumResult) {
      throw new Error('Expected no validation error for valid viewType enum');
    }
    console.log('✅ Validates correct viewType enum');

    // Test method availability
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('execute method not available');
    }
    console.log('✅ execute method available');

    // Test static methods
    if (typeof AddOptionalProcessTool.getCategory !== 'function') {
      throw new Error('getCategory static method not available');
    }
    if (typeof AddOptionalProcessTool.getDefinition !== 'function') {
      throw new Error('getDefinition static method not available');
    }
    console.log('✅ Static methods available');

    console.log('\n🎉 All AddOptionalProcessTool tests passed!');
    console.log('\n📝 Tool Summary:');
    console.log(`   Name: ${definition.name}`);
    console.log(`   Category: ${category}`);
    console.log(`   Required Parameters: ${requiredParams.length} (${requiredParams.join(', ')})`);
    console.log(`   Optional Parameters: viewType (${properties.viewType.enum.join('|')})`);
    console.log(`   Extends BaseTool: Yes`);
    console.log(`   API Endpoint: POST /cases/{caseID}/processes/{processID}`);
    
    return true;
  } catch (error) {
    console.error('❌ AddOptionalProcessTool test failed:', error.message);
    console.error('\n📋 Error Details:');
    console.error(`   Error Type: ${error.constructor.name}`);
    console.error(`   Stack: ${error.stack}`);
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAddOptionalProcessTool().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testAddOptionalProcessTool };
