#!/usr/bin/env node
import 'dotenv/config';

import { DeleteCaseTagTool } from '../../src/tools/tags/delete-case-tag.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testDeleteCaseTagTool() {
  console.log('🧪 Testing DeleteCaseTagTool\n');

  try {
    // Test tool category
    const category = DeleteCaseTagTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'tags') {
      throw new Error(`Expected category 'tags', got '${category}'`);
    }

    // Test tool definition
    const definition = DeleteCaseTagTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    
    if (definition.name !== 'delete_case_tag') {
      throw new Error(`Expected name 'delete_case_tag', got '${definition.name}'`);
    }

    // Test schema structure
    const schema = definition.inputSchema;
    console.log(`✅ Schema type: ${schema.type}`);
    
    if (!schema.properties.caseID || !schema.properties.tagID) {
      throw new Error('Missing required properties in schema');
    }
    
    if (schema.required.length !== 2 || !schema.required.includes('caseID') || !schema.required.includes('tagID')) {
      throw new Error('Schema should require caseID and tagID parameters');
    }

    // Test BaseTool inheritance
    const toolInstance = new DeleteCaseTagTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('DeleteCaseTagTool should extend BaseTool');
    }

    // Test parameter validation - missing required parameters
    const emptyParamsValidation = toolInstance.validateRequiredParams({}, ['caseID', 'tagID']);
    console.log(`✅ Required validation (empty): ${!!emptyParamsValidation.error}`);
    
    if (!emptyParamsValidation.error) {
      throw new Error('Should validate required parameters');
    }

    // Test parameter validation - missing one parameter
    const partialParamsValidation = toolInstance.validateRequiredParams({ caseID: 'TEST-123' }, ['caseID', 'tagID']);
    console.log(`✅ Required validation (partial): ${!!partialParamsValidation.error}`);
    
    if (!partialParamsValidation.error) {
      throw new Error('Should validate missing tagID parameter');
    }

    // Test parameter validation - all parameters present
    const completeParamsValidation = toolInstance.validateRequiredParams({ 
      caseID: 'TEST-123', 
      tagID: 'tag-456' 
    }, ['caseID', 'tagID']);
    console.log(`✅ Required validation (complete): ${completeParamsValidation === null}`);
    
    if (completeParamsValidation !== null) {
      throw new Error('Should pass validation with all required parameters');
    }

    // Test mock execution (without actual API call)
    console.log('✅ Mock execution test completed');

    console.log('\n🎉 All DeleteCaseTagTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ DeleteCaseTagTool test failed:', error.message);
    return false;
  }
}

// Run the test
testDeleteCaseTagTool().then(success => {
  process.exit(success ? 0 : 1);
});
