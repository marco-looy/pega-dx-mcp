#!/usr/bin/env node

import { JumpToStepTool } from '../../src/tools/assignments/jump-to-step.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testJumpToStepTool() {
  console.log('🧪 Testing JumpToStepTool\n');

  try {
    // Test tool category
    const category = JumpToStepTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'assignments') {
      throw new Error(`Expected category 'assignments', got '${category}'`);
    }

    // Test tool definition
    const definition = JumpToStepTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description length: ${definition.description.length} characters`);
    
    if (definition.name !== 'jump_to_step') {
      throw new Error(`Expected tool name 'jump_to_step', got '${definition.name}'`);
    }

    // Test required parameters
    const requiredParams = definition.inputSchema.required;
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    const expectedRequired = ['assignmentID', 'stepID', 'eTag'];
    if (JSON.stringify(requiredParams.sort()) !== JSON.stringify(expectedRequired.sort())) {
      throw new Error(`Expected required params ${expectedRequired}, got ${requiredParams}`);
    }

    // Test viewType enum values
    const viewTypeProperty = definition.inputSchema.properties.viewType;
    if (viewTypeProperty && viewTypeProperty.enum) {
      console.log(`✅ ViewType enum values: ${viewTypeProperty.enum.join(', ')}`);
      const expectedEnum = ['form', 'page', 'none'];
      if (JSON.stringify(viewTypeProperty.enum.sort()) !== JSON.stringify(expectedEnum.sort())) {
        throw new Error(`Expected viewType enum ${expectedEnum}, got ${viewTypeProperty.enum}`);
      }
    }

    // Test BaseTool inheritance
    const toolInstance = new JumpToStepTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('JumpToStepTool should extend BaseTool');
    }

    // Test parameter validation - missing required parameters
    console.log('\n🔍 Testing parameter validation...');
    
    const emptyParamsResult = toolInstance.validateRequiredParams({}, ['assignmentID', 'stepID', 'eTag']);
    console.log(`✅ Missing required params validation: ${!!emptyParamsResult.error}`);
    
    if (!emptyParamsResult.error) {
      throw new Error('Should return error for missing required parameters');
    }

    const partialParamsResult = toolInstance.validateRequiredParams(
      { assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS' },
      ['assignmentID', 'stepID', 'eTag']
    );
    console.log(`✅ Partial required params validation: ${!!partialParamsResult.error}`);
    
    if (!partialParamsResult.error) {
      throw new Error('Should return error for missing stepID and eTag');
    }

    const completeParamsResult = toolInstance.validateRequiredParams(
      {
        assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
        stepID: 'ProcessStep_1',
        eTag: 'mock-etag-123'
      },
      ['assignmentID', 'stepID', 'eTag']
    );
    console.log(`✅ Complete required params validation: ${!completeParamsResult}`);
    
    if (completeParamsResult) {
      throw new Error('Should not return error for complete required parameters');
    }

    // Test enum parameter validation
    const validEnumResult = toolInstance.validateEnumParams(
      { viewType: 'form' },
      { viewType: ['form', 'page', 'none'] }
    );
    console.log(`✅ Valid enum validation: ${!validEnumResult}`);
    
    if (validEnumResult) {
      throw new Error('Should not return error for valid enum value');
    }

    const invalidEnumResult = toolInstance.validateEnumParams(
      { viewType: 'invalid' },
      { viewType: ['form', 'page', 'none'] }
    );
    console.log(`✅ Invalid enum validation: ${!!invalidEnumResult.error}`);
    
    if (!invalidEnumResult.error) {
      throw new Error('Should return error for invalid enum value');
    }

    // Test tool execution with mock data
    console.log('\n⚡ Testing tool execution...');
    
    // Mock the pegaClient to avoid real API calls
    toolInstance.pegaClient = {
      jumpToAssignmentStep: async (assignmentID, stepID, eTag, options) => {
        // Mock successful response
        return {
          success: true,
          data: {
            data: {
              caseInfo: {
                ID: 'TEST-CASE-001',
                caseTypeName: 'TestCase',
                status: 'Open',
                stageLabel: 'Review',
                lastUpdateTime: '2025-01-07T12:38:00Z',
                assignments: [{
                  ID: assignmentID,
                  name: 'Test Assignment',
                  processName: 'Test Process',
                  assigneeInfo: { name: 'Test User' },
                  urgency: 10,
                  canPerform: true,
                  actions: [{ name: 'Complete', ID: 'Complete' }]
                }]
              }
            },
            uiResources: {
              navigation: {
                breadcrumb: [
                  { name: 'Step 1', ID: 'ProcessStep_1', current: false, completed: true },
                  { name: 'Step 2', ID: 'ProcessStep_2', current: true, completed: false }
                ],
                availableSteps: [
                  { name: 'Step 1', ID: 'ProcessStep_1', accessible: true },
                  { name: 'Step 2', ID: 'ProcessStep_2', accessible: true },
                  { name: 'Step 3', ID: 'ProcessStep_3', accessible: false }
                ]
              },
              resources: {
                views: { testView: {} },
                fields: { testField: {} }
              }
            }
          }
        };
      }
    };

    // Execute with valid parameters
    const executionResult = await toolInstance.execute({
      assignmentID: 'ASSIGN-WORKLIST TEST-CASE-001!TEST_PROCESS',
      stepID: 'ProcessStep_2',
      eTag: 'mock-etag-123',
      viewType: 'form'
    });

    console.log(`✅ Tool execution successful: ${!!executionResult.content}`);
    
    if (!executionResult.content || !executionResult.content[0] || !executionResult.content[0].text) {
      throw new Error('Tool execution should return formatted content');
    }

    const responseText = executionResult.content[0].text;
    console.log(`✅ Response contains navigation info: ${responseText.includes('Navigation Breadcrumb')}`);
    console.log(`✅ Response contains step discovery help: ${responseText.includes('Finding Valid Step IDs')}`);
    console.log(`✅ Response contains assignment context: ${responseText.includes('Assignment Context')}`);

    // Test error handling
    console.log('\n🚨 Testing error handling...');
    
    // Mock API client to return error
    toolInstance.pegaClient.jumpToAssignmentStep = async () => {
      return {
        success: false,
        error: {
          type: 'NOT_FOUND',
          message: 'Assignment or step not found',
          details: 'The specified assignment or navigation step could not be found'
        }
      };
    };

    const errorResult = await toolInstance.execute({
      assignmentID: 'ASSIGN-WORKLIST INVALID-CASE!PROCESS',
      stepID: 'InvalidStep',
      eTag: 'mock-etag-123'
    });

    console.log(`✅ Error handling successful: ${!!errorResult.content}`);
    
    if (!errorResult.content || !errorResult.content[0] || !errorResult.content[0].text) {
      throw new Error('Error handling should return formatted error content');
    }

    const errorText = errorResult.content[0].text;
    console.log(`✅ Error response contains troubleshooting: ${errorText.includes('Troubleshooting Tips')}`);
    console.log(`✅ Error response contains step discovery help: ${errorText.includes('Step ID Discovery Help')}`);

    // Test parameter validation in execute method
    console.log('\n📋 Testing execute method parameter validation...');
    
    // Reset to working mock for validation tests
    toolInstance.pegaClient.jumpToAssignmentStep = async () => ({ success: true, data: {} });

    // Test missing required parameters
    const missingParamsResult = await toolInstance.execute({
      assignmentID: 'TEST-ASSIGNMENT'
      // Missing stepID and eTag
    });
    console.log(`✅ Execute handles missing params: ${!!missingParamsResult.error}`);

    // Test invalid content parameter
    const invalidContentResult = await toolInstance.execute({
      assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
      stepID: 'ProcessStep_1',
      eTag: 'mock-etag-123',
      content: 'invalid-not-object'
    });
    console.log(`✅ Execute validates content parameter: ${!!invalidContentResult.error}`);

    // Test invalid pageInstructions parameter
    const invalidPageInstructionsResult = await toolInstance.execute({
      assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
      stepID: 'ProcessStep_1',
      eTag: 'mock-etag-123',
      pageInstructions: 'invalid-not-array'
    });
    console.log(`✅ Execute validates pageInstructions parameter: ${!!invalidPageInstructionsResult.error}`);

    // Test invalid attachments parameter
    const invalidAttachmentsResult = await toolInstance.execute({
      assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
      stepID: 'ProcessStep_1',
      eTag: 'mock-etag-123',
      attachments: 'invalid-not-array'
    });
    console.log(`✅ Execute validates attachments parameter: ${!!invalidAttachmentsResult.error}`);

    console.log('\n🎉 All JumpToStepTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ JumpToStepTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testJumpToStepTool().then(success => {
  process.exit(success ? 0 : 1);
});
