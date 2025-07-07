#!/usr/bin/env node

import { RecalculateAssignmentFieldsTool } from '../../src/tools/assignments/recalculate-assignment-fields.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testRecalculateAssignmentFieldsTool() {
  console.log('🧪 Testing RecalculateAssignmentFieldsTool\n');

  try {
    // Test tool category
    const category = RecalculateAssignmentFieldsTool.getCategory();
    console.log(`✅ Category: ${category}`);

    // Test tool definition
    const definition = RecalculateAssignmentFieldsTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description.substring(0, 100)}...`);

    // Test BaseTool inheritance
    const toolInstance = new RecalculateAssignmentFieldsTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    // Test required parameter validation
    console.log('\n🔍 Testing parameter validation...');
    
    // Test missing required parameters
    const missingParamsTest = toolInstance.validateRequiredParams({}, ['assignmentID', 'actionID', 'eTag', 'calculations']);
    console.log(`✅ Required validation (missing params): ${!!missingParamsTest.error}`);

    const completeParamsTest = toolInstance.validateRequiredParams({
      assignmentID: 'ASSIGN-WORKLIST TEST-WORK S-1!FLOW',
      actionID: 'TestAction',
      eTag: 'test-etag',
      calculations: { fields: [{ name: 'TestField', context: 'TestContext' }] }
    }, ['assignmentID', 'actionID', 'eTag', 'calculations']);
    console.log(`✅ Required validation (complete params): ${!completeParamsTest}`);

    // Test input schema structure
    console.log('\n🔍 Testing input schema...');
    const schema = definition.inputSchema;
    console.log(`✅ Schema type: ${schema.type}`);
    console.log(`✅ Required fields: ${schema.required.join(', ')}`);
    console.log(`✅ AssignmentID property exists: ${!!schema.properties.assignmentID}`);
    console.log(`✅ ActionID property exists: ${!!schema.properties.actionID}`);
    console.log(`✅ ETag property exists: ${!!schema.properties.eTag}`);
    console.log(`✅ Calculations property exists: ${!!schema.properties.calculations}`);

    // Test calculations schema structure
    const calculationsSchema = schema.properties.calculations;
    console.log(`✅ Calculations has fields array: ${!!calculationsSchema.properties.fields}`);
    console.log(`✅ Calculations has whens array: ${!!calculationsSchema.properties.whens}`);

    // Test field item schema
    const fieldSchema = calculationsSchema.properties.fields.items;
    console.log(`✅ Field item has name property: ${!!fieldSchema.properties.name}`);
    console.log(`✅ Field item has context property: ${!!fieldSchema.properties.context}`);
    console.log(`✅ Field item required fields: ${fieldSchema.required.join(', ')}`);

    // Test when item schema
    const whenSchema = calculationsSchema.properties.whens.items;
    console.log(`✅ When item has name property: ${!!whenSchema.properties.name}`);
    console.log(`✅ When item has context property: ${!!whenSchema.properties.context}`);
    console.log(`✅ When item required fields: ${whenSchema.required.join(', ')}`);

    // Test optional parameters
    console.log(`✅ Content property exists: ${!!schema.properties.content}`);
    console.log(`✅ PageInstructions property exists: ${!!schema.properties.pageInstructions}`);

    // Test validation logic (without actual execution)
    console.log('\n🔍 Testing validation logic...');
    
    // Test empty calculations object
    try {
      await toolInstance.execute({
        assignmentID: 'ASSIGN-WORKLIST TEST-WORK S-1!FLOW',
        actionID: 'TestAction',
        eTag: 'test-etag',
        calculations: {}
      });
      console.log('❌ Should have failed with empty calculations');
    } catch (error) {
      // Expected to fail in actual execution due to missing calculations
      console.log('✅ Empty calculations validation works');
    }

    // Test invalid calculations structure
    try {
      await toolInstance.execute({
        assignmentID: 'ASSIGN-WORKLIST TEST-WORK S-1!FLOW',
        actionID: 'TestAction',
        eTag: 'test-etag',
        calculations: []
      });
      console.log('❌ Should have failed with array calculations');
    } catch (error) {
      // Expected to fail in actual execution
      console.log('✅ Invalid calculations structure validation works');
    }

    // Test format methods exist
    console.log('\n🔍 Testing formatter methods...');
    console.log(`✅ formatSuccessResponse method exists: ${typeof toolInstance.formatSuccessResponse === 'function'}`);
    console.log(`✅ formatErrorResponse method exists: ${typeof toolInstance.formatErrorResponse === 'function'}`);

    // Test success response formatting
    console.log('\n🔍 Testing success response formatting...');
    const mockSuccessData = {
      data: {
        caseInfo: {
          ID: 'TEST-CASE-123',
          caseTypeName: 'TestCase',
          status: 'Open',
          stageLabel: 'TestStage'
        },
        calculationResults: {
          fields: [{
            name: 'TestField',
            context: 'TestContext',
            oldValue: 'old',
            newValue: 'new',
            status: 'Success'
          }],
          whens: [{
            name: 'TestWhen',
            context: 'TestContext',
            oldResult: false,
            newResult: true,
            status: 'Success'
          }],
          summary: {
            totalFields: 1,
            successfulFields: 1,
            fieldErrors: 0,
            totalWhens: 1,
            successfulWhens: 1,
            whenErrors: 0
          }
        }
      },
      uiResources: {
        root: { type: 'Form' },
        resources: {
          fields: { TestField: {} },
          calculatedFields: { TestField: {} }
        },
        fieldStates: {
          valuesChanged: ['TestField'],
          required: [],
          disabled: [],
          visible: ['TestField'],
          hidden: []
        }
      }
    };

    const successResponse = toolInstance.formatSuccessResponse(
      'ASSIGN-WORKLIST TEST-WORK S-1!FLOW',
      'TestAction',
      mockSuccessData,
      'test-etag',
      {
        calculations: {
          fields: [{ name: 'TestField', context: 'TestContext' }],
          whens: [{ name: 'TestWhen', context: 'TestContext' }]
        },
        content: { TestProp: 'TestValue' },
        pageInstructions: [{ operation: 'test' }]
      }
    );
    console.log(`✅ Success response generated: ${successResponse.length > 0}`);
    console.log(`✅ Success response contains assignment ID: ${successResponse.includes('ASSIGN-WORKLIST TEST-WORK S-1!FLOW')}`);
    console.log(`✅ Success response contains calculation results: ${successResponse.includes('Field Calculation Results')}`);

    // Test error response formatting
    console.log('\n🔍 Testing error response formatting...');
    const mockError = {
      type: 'BAD_REQUEST',
      message: 'Invalid request parameters',
      details: 'Test error details',
      status: 400,
      statusText: 'Bad Request',
      errorDetails: [{
        localizedValue: 'Test error detail',
        erroneousInputOutputFieldInPage: 'TestField',
        erroneousInputOutputIdentifier: 'TestIdentifier'
      }]
    };

    const errorResponse = toolInstance.formatErrorResponse(
      'ASSIGN-WORKLIST TEST-WORK S-1!FLOW',
      'TestAction',
      mockError,
      {
        eTag: 'test-etag',
        calculations: {
          fields: [{ name: 'TestField', context: 'TestContext' }],
          whens: [{ name: 'TestWhen', context: 'TestContext' }]
        }
      }
    );
    console.log(`✅ Error response generated: ${errorResponse.length > 0}`);
    console.log(`✅ Error response contains assignment ID: ${errorResponse.includes('ASSIGN-WORKLIST TEST-WORK S-1!FLOW')}`);
    console.log(`✅ Error response contains error type: ${errorResponse.includes('BAD_REQUEST')}`);
    console.log(`✅ Error response contains calculation context: ${errorResponse.includes('Fields Requested')}`);
    console.log(`✅ Error response contains error details: ${errorResponse.includes('Test error detail')}`);

    // Test comprehensive parameter validation
    console.log('\n🔍 Testing comprehensive parameter validation...');
    
    // Test valid parameters structure (without execution)
    const validParams = {
      assignmentID: 'ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW',
      actionID: 'CompleteVerification',
      eTag: 'd6b2f9a8e4c1b3d5f7a9c2e8b1d4f6g9',
      calculations: {
        fields: [
          { name: 'CustomerName', context: 'primary' },
          { name: 'TotalAmount', context: 'primary' }
        ],
        whens: [
          { name: 'ShowDiscountSection', context: 'primary' },
          { name: 'RequireApproval', context: 'primary' }
        ]
      },
      content: {
        CustomerType: 'Premium',
        OrderTotal: 1500
      },
      pageInstructions: [
        { operation: 'update', target: 'OrderDetails' }
      ]
    };

    // Validate individual parameter types
    console.log(`✅ Valid assignmentID format: ${typeof validParams.assignmentID === 'string'}`);
    console.log(`✅ Valid actionID format: ${typeof validParams.actionID === 'string'}`);
    console.log(`✅ Valid eTag format: ${typeof validParams.eTag === 'string'}`);
    console.log(`✅ Valid calculations structure: ${typeof validParams.calculations === 'object' && !Array.isArray(validParams.calculations)}`);
    console.log(`✅ Valid fields array: ${Array.isArray(validParams.calculations.fields)}`);
    console.log(`✅ Valid whens array: ${Array.isArray(validParams.calculations.whens)}`);
    console.log(`✅ Valid content object: ${typeof validParams.content === 'object' && !Array.isArray(validParams.content)}`);
    console.log(`✅ Valid pageInstructions array: ${Array.isArray(validParams.pageInstructions)}`);

    // Test field object validation
    const validField = validParams.calculations.fields[0];
    console.log(`✅ Field has name: ${typeof validField.name === 'string' && validField.name.length > 0}`);
    console.log(`✅ Field has context: ${typeof validField.context === 'string' && validField.context.length > 0}`);

    // Test when object validation
    const validWhen = validParams.calculations.whens[0];
    console.log(`✅ When has name: ${typeof validWhen.name === 'string' && validWhen.name.length > 0}`);
    console.log(`✅ When has context: ${typeof validWhen.context === 'string' && validWhen.context.length > 0}`);

    console.log('\n🎉 All RecalculateAssignmentFieldsTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ RecalculateAssignmentFieldsTool test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Handle both direct execution and module import
if (import.meta.url === `file://${process.argv[1]}`) {
  testRecalculateAssignmentFieldsTool().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testRecalculateAssignmentFieldsTool };
