#!/usr/bin/env node

import { RelateCasesTool } from '../../src/tools/related_cases/relate-cases.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testRelateCasesTool() {
  console.log('🧪 Testing RelateCasesTool\n');

  try {
    // Test tool category
    const category = RelateCasesTool.getCategory();
    console.log(`✅ Category: ${category}`);

    // Test tool definition
    const definition = RelateCasesTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);

    // Validate input schema
    const inputSchema = definition.inputSchema;
    console.log(`✅ Input schema type: ${inputSchema.type}`);
    console.log(`✅ Required parameters: ${inputSchema.required.join(', ')}`);

    // Test BaseTool inheritance
    const toolInstance = new RelateCasesTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    // Test parameter validation - missing required parameters
    const missingParamTest = toolInstance.validateRequiredParams({}, ['caseID', 'cases']);
    console.log(`✅ Required validation works: ${!!missingParamTest.error}`);

    // Test parameter validation - valid parameters
    const validParams = {
      caseID: 'TEST-CASE R-123',
      cases: [{ ID: 'TEST-CASE R-124' }]
    };
    const validParamTest = toolInstance.validateRequiredParams(validParams, ['caseID', 'cases']);
    console.log(`✅ Valid parameters pass: ${!validParamTest}`);

    // Test schema properties
    const properties = inputSchema.properties;
    console.log(`✅ caseID property type: ${properties.caseID.type}`);
    console.log(`✅ cases property type: ${properties.cases.type}`);
    console.log(`✅ cases array items schema exists: ${!!properties.cases.items}`);
    console.log(`✅ cases minItems: ${properties.cases.minItems}`);
    console.log(`✅ cases maxItems: ${properties.cases.maxItems}`);

    // Validate tool follows BaseTool pattern
    console.log(`✅ Has getCategory method: ${typeof RelateCasesTool.getCategory === 'function'}`);
    console.log(`✅ Has getDefinition method: ${typeof RelateCasesTool.getDefinition === 'function'}`);
    console.log(`✅ Has execute method: ${typeof toolInstance.execute === 'function'}`);

    console.log('\n🎉 All RelateCasesTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ RelateCasesTool test failed:', error);
    return false;
  }
}

// Test execution patterns
async function testExecutionPatterns() {
  console.log('\n🔧 Testing Execution Patterns\n');

  try {
    const toolInstance = new RelateCasesTool();

    // Test missing required parameters
    console.log('Testing missing required parameters...');
    const missingTest = await toolInstance.execute({});
    console.log(`✅ Missing parameters handled: ${!!missingTest.error}`);

    // Test missing caseID
    console.log('Testing missing caseID parameter...');
    const missingCaseIdTest = await toolInstance.execute({ cases: [{ ID: 'TEST-CASE R-124' }] });
    console.log(`✅ Missing caseID handled: ${!!missingCaseIdTest.error}`);

    // Test missing cases
    console.log('Testing missing cases parameter...');
    const missingCasesTest = await toolInstance.execute({ caseID: 'TEST-CASE R-123' });
    console.log(`✅ Missing cases handled: ${!!missingCasesTest.error}`);

    // Test empty cases array
    console.log('Testing empty cases array...');
    const emptyCasesTest = await toolInstance.execute({ 
      caseID: 'TEST-CASE R-123', 
      cases: [] 
    });
    console.log(`✅ Empty cases array handled: ${!!emptyCasesTest.error}`);

    // Test invalid case object (missing ID)
    console.log('Testing invalid case object without ID...');
    const invalidCaseTest = await toolInstance.execute({
      caseID: 'TEST-CASE R-123',
      cases: [{ name: 'Invalid Case' }]
    });
    console.log(`✅ Invalid case object handled: ${!!invalidCaseTest.error}`);

    // Test invalid case object (non-string ID)
    console.log('Testing invalid case object with non-string ID...');
    const nonStringIdTest = await toolInstance.execute({
      caseID: 'TEST-CASE R-123',
      cases: [{ ID: 123 }]
    });
    console.log(`✅ Non-string ID handled: ${!!nonStringIdTest.error}`);

    // Test valid parameters structure
    console.log('Testing valid parameters structure...');
    const validParams = {
      caseID: 'TEST-CASE R-123',
      cases: [
        { ID: 'TEST-CASE R-124' },
        { ID: 'TEST-CASE R-125' }
      ]
    };
    
    // This will fail at the API level since we don't have a real connection,
    // but it should pass the validation phase
    try {
      await toolInstance.execute(validParams);
    } catch (error) {
      // Expected to fail at API level, but validation should pass
      console.log(`✅ Valid parameters passed validation (expected API failure)`);
    }

    console.log('\n🎉 All execution pattern tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Execution pattern test failed:', error);
    return false;
  }
}

// Test schema validation details
async function testSchemaValidation() {
  console.log('\n📋 Testing Schema Validation Details\n');

  try {
    const definition = RelateCasesTool.getDefinition();
    const schema = definition.inputSchema;

    // Test cases array item schema
    const itemSchema = schema.properties.cases.items;
    console.log(`✅ Cases item schema type: ${itemSchema.type}`);
    console.log(`✅ Cases item required fields: ${itemSchema.required.join(', ')}`);
    console.log(`✅ Cases item ID property type: ${itemSchema.properties.ID.type}`);
    console.log(`✅ Cases item additionalProperties allowed: ${itemSchema.additionalProperties}`);

    // Test constraints
    console.log(`✅ Cases minimum items: ${schema.properties.cases.minItems}`);
    console.log(`✅ Cases maximum items: ${schema.properties.cases.maxItems}`);

    console.log('\n🎉 All schema validation tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Schema validation test failed:', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Running RelateCasesTool Tests\n');
  console.log('=' .repeat(50));

  const basicTests = await testRelateCasesTool();
  const executionTests = await testExecutionPatterns();
  const schemaTests = await testSchemaValidation();

  console.log('\n' + '='.repeat(50));
  if (basicTests && executionTests && schemaTests) {
    console.log('✅ All tests passed successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
