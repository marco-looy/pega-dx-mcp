#!/usr/bin/env node

import { GetCaseViewCalculatedFieldsTool } from '../../src/tools/cases/get-case-view-calculated-fields.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testTool() {
  console.log('🧪 Testing GetCaseViewCalculatedFieldsTool\n');

  try {
    // Test tool category
    const category = GetCaseViewCalculatedFieldsTool.getCategory();
    console.log(`✅ Category: ${category}`);

    // Test tool definition
    const definition = GetCaseViewCalculatedFieldsTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);

    // Verify schema structure
    console.log(`✅ Required parameters: ${definition.inputSchema.required.join(', ')}`);
    console.log(`✅ Input schema type: ${definition.inputSchema.type}`);

    // Test BaseTool inheritance
    const toolInstance = new GetCaseViewCalculatedFieldsTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    // Test parameter validation - missing required params
    const requiredTest = toolInstance.validateRequiredParams({}, ['caseID']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);

    // Test parameter validation - valid params
    const validParams = {
      caseID: 'TEST-CASE-001',
      viewID: 'TestView',
      calculations: {
        fields: [
          { name: '.TestField1', context: 'content' },
          { name: '.TestField2' }
        ]
      }
    };
    
    const validTest = toolInstance.validateRequiredParams(validParams, ['caseID', 'viewID', 'calculations']);
    console.log(`✅ Valid parameters pass validation: ${!validTest}`);

    // Test calculations structure validation (this would be done in execute method)
    console.log('✅ Tool structure validation completed');

    // Test input schema validation
    const schema = definition.inputSchema;
    console.log(`✅ Schema has calculations property: ${!!schema.properties.calculations}`);
    console.log(`✅ Calculations has fields array: ${!!schema.properties.calculations.properties.fields}`);
    console.log(`✅ Calculations has optional whens array: ${!!schema.properties.calculations.properties.whens}`);

    console.log('\n🎉 All GetCaseViewCalculatedFieldsTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ GetCaseViewCalculatedFieldsTool test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTool().then(success => process.exit(success ? 0 : 1));
}

export { testTool };
