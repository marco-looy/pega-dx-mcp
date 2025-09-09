#!/usr/bin/env node
import 'dotenv/config';

import { RecalculateCaseActionFieldsTool } from '../../src/tools/cases/recalculate-case-action-fields.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testRecalculateCaseActionFieldsTool() {
  console.log('🧪 Testing RecalculateCaseActionFieldsTool\n');

  try {
    // Test tool category
    const category = RecalculateCaseActionFieldsTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'cases') {
      throw new Error(`Expected category 'cases', got '${category}'`);
    }

    // Test tool definition
    const definition = RecalculateCaseActionFieldsTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    
    if (definition.name !== 'recalculate_case_action_fields') {
      throw new Error(`Expected name 'recalculate_case_action_fields', got '${definition.name}'`);
    }

    // Test BaseTool inheritance
    const toolInstance = new RecalculateCaseActionFieldsTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool should extend BaseTool');
    }

    // Test input schema structure
    const schema = definition.inputSchema;
    console.log(`✅ Input schema type: ${schema.type}`);
    
    // Check required parameters
    const requiredParams = schema.required;
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    const expectedRequired = ['caseID', 'actionID', 'eTag', 'calculations'];
    for (const param of expectedRequired) {
      if (!requiredParams.includes(param)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }

    // Test parameter validation - missing required params
    const missingCaseIDTest = toolInstance.validateRequiredParams({}, ['caseID']);
    console.log(`✅ Missing caseID validation: ${!!missingCaseIDTest.error}`);
    
    const missingActionIDTest = toolInstance.validateRequiredParams({ caseID: 'test' }, ['caseID', 'actionID']);
    console.log(`✅ Missing actionID validation: ${!!missingActionIDTest.error}`);

    const missingETagTest = toolInstance.validateRequiredParams({ caseID: 'test', actionID: 'test' }, ['caseID', 'actionID', 'eTag']);
    console.log(`✅ Missing eTag validation: ${!!missingETagTest.error}`);

    const missingCalculationsTest = toolInstance.validateRequiredParams({ caseID: 'test', actionID: 'test', eTag: 'test' }, ['caseID', 'actionID', 'eTag', 'calculations']);
    console.log(`✅ Missing calculations validation: ${!!missingCalculationsTest.error}`);

    // Test calculations object validation
    console.log('\n🔍 Testing calculations object validation...');

    // Test with invalid calculations object (not an object)
    const invalidCalculationsResult1 = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: 'not-an-object'
    });
    console.log(`✅ Invalid calculations (string) validation: ${!!invalidCalculationsResult1.error}`);

    // Test with invalid calculations object (array)
    const invalidCalculationsResult2 = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: []
    });
    console.log(`✅ Invalid calculations (array) validation: ${!!invalidCalculationsResult2.error}`);

    // Test with empty calculations object
    const emptyCalculationsResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {}
    });
    console.log(`✅ Empty calculations validation: ${!!emptyCalculationsResult.error}`);

    // Test with invalid fields array
    const invalidFieldsResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        fields: 'not-an-array'
      }
    });
    console.log(`✅ Invalid fields (not array) validation: ${!!invalidFieldsResult.error}`);

    // Test with empty fields array
    const emptyFieldsResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        fields: []
      }
    });
    console.log(`✅ Empty fields array validation: ${!!emptyFieldsResult.error}`);

    // Test with invalid field object (missing name)
    const invalidFieldObjectResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        fields: [
          { context: 'test-context' } // missing name
        ]
      }
    });
    console.log(`✅ Invalid field object (missing name) validation: ${!!invalidFieldObjectResult.error}`);

    // Test with invalid field object (missing context)
    const invalidFieldContextResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        fields: [
          { name: 'TestField' } // missing context
        ]
      }
    });
    console.log(`✅ Invalid field object (missing context) validation: ${!!invalidFieldContextResult.error}`);

    // Test with invalid whens array
    const invalidWhensResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        whens: 'not-an-array'
      }
    });
    console.log(`✅ Invalid whens (not array) validation: ${!!invalidWhensResult.error}`);

    // Test with empty whens array
    const emptyWhensResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        whens: []
      }
    });
    console.log(`✅ Empty whens array validation: ${!!emptyWhensResult.error}`);

    // Test with invalid when object (missing name)
    const invalidWhenObjectResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        whens: [
          { context: 'test-context' } // missing name
        ]
      }
    });
    console.log(`✅ Invalid when object (missing name) validation: ${!!invalidWhenObjectResult.error}`);

    // Test with invalid when object (missing context)
    const invalidWhenContextResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        whens: [
          { name: 'TestWhen' } // missing context
        ]
      }
    });
    console.log(`✅ Invalid when object (missing context) validation: ${!!invalidWhenContextResult.error}`);

    // Test valid calculations structure (this should pass validation but fail on API call)
    console.log('\n🔍 Testing valid calculations structure...');
    
    const validCalculationsResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        fields: [
          { name: 'TestField1', context: 'test-context1' },
          { name: 'TestField2', context: 'test-context2' }
        ],
        whens: [
          { name: 'TestWhen1', context: 'test-context1' }
        ]
      }
    });
    console.log(`✅ Valid calculations structure validation passed, API call result: ${!!validCalculationsResult.error ? 'Expected API error' : 'Unexpected success'}`);

    // Test parameter types validation
    console.log('\n🔍 Testing parameter type validation...');

    // Test invalid content parameter (array instead of object)
    const invalidContentResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        fields: [{ name: 'TestField', context: 'test-context' }]
      },
      content: ['not', 'an', 'object']
    });
    console.log(`✅ Invalid content (array) validation: ${!!invalidContentResult.error}`);

    // Test invalid pageInstructions parameter (not array)
    const invalidPageInstructionsResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        fields: [{ name: 'TestField', context: 'test-context' }]
      },
      pageInstructions: 'not-an-array'
    });
    console.log(`✅ Invalid pageInstructions (not array) validation: ${!!invalidPageInstructionsResult.error}`);

    // Test invalid originChannel parameter (empty string)
    const invalidOriginChannelResult = await toolInstance.execute({
      caseID: 'TEST-CASE-WORK T-1001',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: {
        fields: [{ name: 'TestField', context: 'test-context' }]
      },
      originChannel: ''
    });
    console.log(`✅ Invalid originChannel (empty) validation: ${!!invalidOriginChannelResult.error}`);

    // Test schema properties
    console.log('\n🔍 Testing schema properties...');
    
    const properties = schema.properties;
    
    // Check caseID property
    if (!properties.caseID || properties.caseID.type !== 'string') {
      throw new Error('caseID property should be a string');
    }
    console.log(`✅ caseID property: ${properties.caseID.type}`);

    // Check actionID property
    if (!properties.actionID || properties.actionID.type !== 'string') {
      throw new Error('actionID property should be a string');
    }
    console.log(`✅ actionID property: ${properties.actionID.type}`);

    // Check eTag property
    if (!properties.eTag || properties.eTag.type !== 'string') {
      throw new Error('eTag property should be a string');
    }
    console.log(`✅ eTag property: ${properties.eTag.type}`);

    // Check calculations property
    if (!properties.calculations || properties.calculations.type !== 'object') {
      throw new Error('calculations property should be an object');
    }
    console.log(`✅ calculations property: ${properties.calculations.type}`);

    // Check calculations.fields property
    const calcProperties = properties.calculations.properties;
    if (!calcProperties.fields || calcProperties.fields.type !== 'array') {
      throw new Error('calculations.fields property should be an array');
    }
    console.log(`✅ calculations.fields property: ${calcProperties.fields.type}`);

    // Check calculations.whens property
    if (!calcProperties.whens || calcProperties.whens.type !== 'array') {
      throw new Error('calculations.whens property should be an array');
    }
    console.log(`✅ calculations.whens property: ${calcProperties.whens.type}`);

    // Check field item schema
    const fieldItemSchema = calcProperties.fields.items;
    if (!fieldItemSchema.properties.name || fieldItemSchema.properties.name.type !== 'string') {
      throw new Error('field.name property should be a string');
    }
    if (!fieldItemSchema.properties.context || fieldItemSchema.properties.context.type !== 'string') {
      throw new Error('field.context property should be a string');
    }
    console.log(`✅ Field item schema: name=${fieldItemSchema.properties.name.type}, context=${fieldItemSchema.properties.context.type}`);

    // Check when item schema
    const whenItemSchema = calcProperties.whens.items;
    if (!whenItemSchema.properties.name || whenItemSchema.properties.name.type !== 'string') {
      throw new Error('when.name property should be a string');
    }
    if (!whenItemSchema.properties.context || whenItemSchema.properties.context.type !== 'string') {
      throw new Error('when.context property should be a string');
    }
    console.log(`✅ When item schema: name=${whenItemSchema.properties.name.type}, context=${whenItemSchema.properties.context.type}`);

    // Check optional properties
    if (!properties.content || properties.content.type !== 'object') {
      throw new Error('content property should be an object');
    }
    console.log(`✅ content property: ${properties.content.type} (optional)`);

    if (!properties.pageInstructions || properties.pageInstructions.type !== 'array') {
      throw new Error('pageInstructions property should be an array');
    }
    console.log(`✅ pageInstructions property: ${properties.pageInstructions.type} (optional)`);

    if (!properties.originChannel || properties.originChannel.type !== 'string') {
      throw new Error('originChannel property should be a string');
    }
    console.log(`✅ originChannel property: ${properties.originChannel.type} (optional)`);

    // Test description
    if (!definition.description || definition.description.length === 0) {
      throw new Error('Tool should have a description');
    }
    console.log(`✅ Description length: ${definition.description.length} characters`);

    // Test that tool has proper methods
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('Tool should have execute method');
    }
    console.log(`✅ Execute method: ${typeof toolInstance.execute}`);

    if (typeof toolInstance.formatSuccessResponse !== 'function') {
      throw new Error('Tool should have formatSuccessResponse method');
    }
    console.log(`✅ FormatSuccessResponse method: ${typeof toolInstance.formatSuccessResponse}`);

    if (typeof toolInstance.formatErrorResponse !== 'function') {
      throw new Error('Tool should have formatErrorResponse method');
    }
    console.log(`✅ FormatErrorResponse method: ${typeof toolInstance.formatErrorResponse}`);

    console.log('\n🎉 All RecalculateCaseActionFieldsTool tests passed!');
    
    return true;
  } catch (error) {
    console.error('❌ RecalculateCaseActionFieldsTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testRecalculateCaseActionFieldsTool().then(success => {
  process.exit(success ? 0 : 1);
});
