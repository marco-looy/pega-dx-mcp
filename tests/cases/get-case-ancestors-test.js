#!/usr/bin/env node

import 'dotenv/config';
import { GetCaseAncestorsTool } from '../../src/tools/cases/get-case-ancestors.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetCaseAncestorsTool() {
  console.log('🧪 Testing GetCaseAncestorsTool\n');

  try {
    // Test tool category
    const category = GetCaseAncestorsTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'cases') {
      throw new Error(`Expected category 'cases', got '${category}'`);
    }

    // Test tool definition
    const definition = GetCaseAncestorsTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description.substring(0, 80)}...`);
    
    if (definition.name !== 'get_case_ancestors') {
      throw new Error(`Expected tool name 'get_case_ancestors', got '${definition.name}'`);
    }

    // Test input schema structure
    const schema = definition.inputSchema;
    if (!schema.properties.caseID) {
      throw new Error('Missing caseID property in input schema');
    }
    if (!schema.required.includes('caseID')) {
      throw new Error('caseID should be required in input schema');
    }
    console.log('✅ Input schema structure valid');

    // Test BaseTool inheritance
    const toolInstance = new GetCaseAncestorsTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool should extend BaseTool');
    }

    // Test parameter validation - missing required parameter
    const missingParamTest = toolInstance.validateRequiredParams({}, ['caseID']);
    console.log(`✅ Required validation works: ${!!missingParamTest.error}`);
    if (!missingParamTest.error) {
      throw new Error('Should return error for missing required parameter');
    }

    // Test parameter validation - with required parameter
    const validParamTest = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE ID-123' }, ['caseID']);
    console.log(`✅ Valid param validation: ${validParamTest === null}`);
    if (validParamTest !== null) {
      throw new Error('Should return null for valid required parameters');
    }

    // Test tool execution structure (without actual API call)
    console.log('✅ Tool structure validation completed');

    // Test that pegaClient property exists (from BaseTool)
    if (!toolInstance.pegaClient) {
      throw new Error('Tool should have pegaClient property from BaseTool');
    }
    console.log('✅ PegaClient property available');

    console.log('\n🎉 All GetCaseAncestorsTool tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ GetCaseAncestorsTool test failed:', error.message);
    return false;
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGetCaseAncestorsTool().then(success => process.exit(success ? 0 : 1));
}

export { testGetCaseAncestorsTool };
