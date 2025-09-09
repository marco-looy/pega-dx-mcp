#!/usr/bin/env node
import 'dotenv/config';

import { SaveAssignmentActionTool } from '../../src/tools/assignments/save-assignment-action.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testSaveAssignmentActionTool() {
  console.log('🧪 Testing SaveAssignmentActionTool\n');

  try {
    // Test 1: Tool category
    const category = SaveAssignmentActionTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'assignments') {
      throw new Error(`Expected category 'assignments', got '${category}'`);
    }

    // Test 2: Tool definition
    const definition = SaveAssignmentActionTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    if (definition.name !== 'save_assignment_action') {
      throw new Error(`Expected name 'save_assignment_action', got '${definition.name}'`);
    }

    // Test 3: Schema validation
    const schema = definition.inputSchema;
    console.log(`✅ Input schema type: ${schema.type}`);
    
    // Check required parameters
    const requiredParams = schema.required;
    const expectedRequired = ['assignmentID', 'actionID', 'eTag'];
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    if (JSON.stringify(requiredParams.sort()) !== JSON.stringify(expectedRequired.sort())) {
      throw new Error(`Expected required params ${expectedRequired.join(', ')}, got ${requiredParams.join(', ')}`);
    }

    // Check parameter properties
    const properties = schema.properties;
    const expectedParams = ['assignmentID', 'actionID', 'eTag', 'content', 'pageInstructions', 'attachments', 'originChannel'];
    for (const param of expectedParams) {
      if (!properties[param]) {
        throw new Error(`Missing parameter definition: ${param}`);
      }
      console.log(`  ✅ Parameter '${param}': ${properties[param].type}`);
    }

    // Test 4: BaseTool inheritance
    const toolInstance = new SaveAssignmentActionTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('SaveAssignmentActionTool should extend BaseTool');
    }

    // Test 5: Required parameter validation
    const emptyParamsResult = toolInstance.validateRequiredParams({}, ['assignmentID', 'actionID', 'eTag']);
    console.log(`✅ Required validation (empty): ${!!emptyParamsResult}`);
    if (!emptyParamsResult || !emptyParamsResult.error) {
      throw new Error('Should return error for missing required parameters');
    }

    const validParamsResult = toolInstance.validateRequiredParams({
      assignmentID: 'ASSIGN-WORKLIST TEST-WORK T-123!PROCESS',
      actionID: 'TestAction',
      eTag: 'test-etag-123'
    }, ['assignmentID', 'actionID', 'eTag']);
    console.log(`✅ Required validation (valid): ${!validParamsResult}`);
    if (validParamsResult) {
      throw new Error('Should not return error for valid required parameters');
    }

    // Test 6: Parameter type validation
    console.log('✅ Parameter type validation:');
    
    // Test invalid content type
    const invalidContentParams = {
      assignmentID: 'ASSIGN-WORKLIST TEST-WORK T-123!PROCESS',
      actionID: 'TestAction',
      eTag: 'test-etag-123',
      content: 'invalid-content-type'
    };
    
    const contentResult = await toolInstance.execute(invalidContentParams);
    if (!contentResult.error || !contentResult.error.includes('content must be an object')) {
      throw new Error('Should return error for invalid content type');
    }
    console.log('  ✅ Content type validation works');

    // Test invalid pageInstructions type
    const invalidPageInstructionsParams = {
      assignmentID: 'ASSIGN-WORKLIST TEST-WORK T-123!PROCESS',
      actionID: 'TestAction',
      eTag: 'test-etag-123',
      pageInstructions: 'invalid-array-type'
    };
    
    const pageInstructionsResult = await toolInstance.execute(invalidPageInstructionsParams);
    if (!pageInstructionsResult.error || !pageInstructionsResult.error.includes('pageInstructions must be an array')) {
      throw new Error('Should return error for invalid pageInstructions type');
    }
    console.log('  ✅ PageInstructions type validation works');

    // Test invalid attachments type
    const invalidAttachmentsParams = {
      assignmentID: 'ASSIGN-WORKLIST TEST-WORK T-123!PROCESS',
      actionID: 'TestAction',
      eTag: 'test-etag-123',
      attachments: 'invalid-array-type'
    };
    
    const attachmentsResult = await toolInstance.execute(invalidAttachmentsParams);
    if (!attachmentsResult.error || !attachmentsResult.error.includes('attachments must be an array')) {
      throw new Error('Should return error for invalid attachments type');
    }
    console.log('  ✅ Attachments type validation works');

    // Test 7: Tool description and functionality
    console.log('✅ Tool description validation:');
    if (!definition.description.includes('Save for later')) {
      throw new Error('Description should mention "Save for later" functionality');
    }
    if (!definition.description.includes('form data')) {
      throw new Error('Description should mention form data preservation');
    }
    if (!definition.description.includes('Connector actions')) {
      throw new Error('Description should mention supported action types');
    }
    console.log('  ✅ Description includes key functionality details');

    // Test 8: Parameter descriptions
    console.log('✅ Parameter description validation:');
    const assignmentIDDesc = properties.assignmentID.description;
    if (!assignmentIDDesc.includes('ASSIGN-WORKLIST')) {
      throw new Error('assignmentID description should include format example');
    }
    
    const actionIDDesc = properties.actionID.description;
    if (!actionIDDesc.includes('flow action rule')) {
      throw new Error('actionID description should mention flow action rule');
    }
    
    const eTagDesc = properties.eTag.description;
    if (!eTagDesc.includes('optimistic locking')) {
      throw new Error('eTag description should mention optimistic locking');
    }
    console.log('  ✅ All parameter descriptions are comprehensive');

    // Test 9: Response formatting methods
    console.log('✅ Response formatting methods:');
    if (typeof toolInstance.formatSuccessResponse !== 'function') {
      throw new Error('Missing formatSuccessResponse method');
    }
    if (typeof toolInstance.formatErrorResponse !== 'function') {
      throw new Error('Missing formatErrorResponse method');
    }
    if (typeof toolInstance.buildSuccessMarkdown !== 'function') {
      throw new Error('Missing buildSuccessMarkdown method');
    }
    if (typeof toolInstance.buildErrorMarkdown !== 'function') {
      throw new Error('Missing buildErrorMarkdown method');
    }
    console.log('  ✅ All formatting methods present');

    // Test 10: Success response building
    console.log('✅ Success response building:');
    const mockSuccessData = {
      data: {
        confirmationNote: 'Form data saved successfully',
        caseInfo: {
          ID: 'TEST-WORK T-123',
          caseTypeName: 'TestCase',
          status: 'Open',
          stageLabel: 'Review'
        }
      }
    };
    
    const mockParams = {
      assignmentID: 'ASSIGN-WORKLIST TEST-WORK T-123!PROCESS',
      actionID: 'TestAction',
      eTag: 'test-etag-123',
      content: { field1: 'value1', field2: 'value2' },
      attachments: [{ type: 'File', name: 'test.pdf' }],
      pageInstructions: [{ operation: 'update' }]
    };
    
    const successResponse = toolInstance.formatSuccessResponse(mockSuccessData, mockParams);
    if (!successResponse.content || !successResponse.content[0] || !successResponse.content[0].text) {
      throw new Error('Success response should have proper structure');
    }
    
    const successMarkdown = successResponse.content[0].text;
    if (!successMarkdown.includes('Assignment Form Data Saved Successfully')) {
      throw new Error('Success markdown should include success title');
    }
    if (!successMarkdown.includes('Save for Later Details')) {
      throw new Error('Success markdown should include save details section');
    }
    if (!successMarkdown.includes('Next Steps')) {
      throw new Error('Success markdown should include next steps guidance');
    }
    console.log('  ✅ Success response formatting works correctly');

    // Test 11: Error response building
    console.log('✅ Error response building:');
    const mockError = {
      type: 'NOT_FOUND',
      message: 'Assignment not found',
      details: 'The assignment cannot be found'
    };
    
    const errorResponse = toolInstance.formatErrorResponse(mockError);
    if (!errorResponse.content || !errorResponse.content[0] || !errorResponse.content[0].text) {
      throw new Error('Error response should have proper structure');
    }
    
    const errorMarkdown = errorResponse.content[0].text;
    if (!errorMarkdown.includes('Assignment Form Data Save Failed')) {
      throw new Error('Error markdown should include failure title');
    }
    if (!errorMarkdown.includes('Assignment or Action Not Found')) {
      throw new Error('Error markdown should include specific error handling');
    }
    if (!errorMarkdown.includes('Troubleshooting Tips')) {
      throw new Error('Error markdown should include troubleshooting section');
    }
    console.log('  ✅ Error response formatting works correctly');

    // Test 12: Comprehensive error handling
    console.log('✅ Comprehensive error handling:');
    const errorTestCases = [
      { type: 'UNAUTHORIZED', expectedText: 'Authentication Failed' },
      { type: 'FORBIDDEN', expectedText: 'Access Denied' },
      { type: 'BAD_REQUEST', expectedText: 'Invalid Save Request' },
      { type: 'CONFLICT', expectedText: 'Conflict Error' },
      { type: 'PRECONDITION_FAILED', expectedText: 'eTag Mismatch' },
      { type: 'VALIDATION_FAIL', expectedText: 'Server-Side Validation Error' },
      { type: 'LOCKED', expectedText: 'Assignment Locked' },
      { type: 'FAILED_DEPENDENCY', expectedText: 'Dependency Failure' },
      { type: 'INTERNAL_SERVER_ERROR', expectedText: 'Server Error' }
    ];
    
    for (const testCase of errorTestCases) {
      const testError = { type: testCase.type, message: `Test ${testCase.type}` };
      const testErrorMarkdown = toolInstance.buildErrorMarkdown(testError);
      
      if (!testErrorMarkdown.includes(testCase.expectedText)) {
        throw new Error(`Error handling for ${testCase.type} should include "${testCase.expectedText}"`);
      }
    }
    console.log('  ✅ All error types handled with specific guidance');

    console.log('\n🎉 All SaveAssignmentActionTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ SaveAssignmentActionTool test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testSaveAssignmentActionTool().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
