#!/usr/bin/env node

import { NavigateAssignmentPreviousTool } from '../../src/tools/assignments/navigate-assignment-previous.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testNavigateAssignmentPreviousTool() {
  console.log('🧪 Testing NavigateAssignmentPreviousTool\n');

  try {
    // Test tool category
    const category = NavigateAssignmentPreviousTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'assignments') {
      throw new Error(`Expected category 'assignments', got '${category}'`);
    }

    // Test tool definition
    const definition = NavigateAssignmentPreviousTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description length: ${definition.description.length} characters`);
    
    if (definition.name !== 'navigate_assignment_previous') {
      throw new Error(`Expected tool name 'navigate_assignment_previous', got '${definition.name}'`);
    }

    // Test required parameters
    const requiredParams = definition.inputSchema.required;
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    if (!requiredParams.includes('assignmentID') || !requiredParams.includes('eTag')) {
      throw new Error('Missing required parameters: assignmentID and eTag should be required');
    }

    // Test optional parameters
    const properties = definition.inputSchema.properties;
    const optionalParams = ['content', 'pageInstructions', 'attachments', 'viewType'];
    optionalParams.forEach(param => {
      if (!properties[param]) {
        throw new Error(`Missing optional parameter: ${param}`);
      }
    });
    console.log(`✅ Optional parameters: ${optionalParams.join(', ')}`);

    // Test viewType enum values
    const viewTypeEnum = properties.viewType.enum;
    const expectedViewTypes = ['none', 'form', 'page'];
    if (!expectedViewTypes.every(type => viewTypeEnum.includes(type))) {
      throw new Error(`viewType enum should include: ${expectedViewTypes.join(', ')}`);
    }
    console.log(`✅ viewType enum values: ${viewTypeEnum.join(', ')}`);

    // Test default value for viewType
    if (properties.viewType.default !== 'none') {
      throw new Error(`Expected viewType default to be 'none', got '${properties.viewType.default}'`);
    }
    console.log(`✅ viewType default: ${properties.viewType.default}`);

    // Test BaseTool inheritance
    const toolInstance = new NavigateAssignmentPreviousTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('NavigateAssignmentPreviousTool should extend BaseTool');
    }

    // Test parameter validation - missing required parameters
    const missingParamsResult = toolInstance.validateRequiredParams({}, ['assignmentID', 'eTag']);
    console.log(`✅ Required validation (missing params): ${!!missingParamsResult.error}`);
    
    if (!missingParamsResult || !missingParamsResult.error) {
      throw new Error('Should return error for missing required parameters');
    }

    // Test parameter validation - valid required parameters
    const validParamsResult = toolInstance.validateRequiredParams({
      assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
      eTag: 'test-etag-value'
    }, ['assignmentID', 'eTag']);
    console.log(`✅ Required validation (valid params): ${validParamsResult === null}`);
    
    if (validParamsResult !== null) {
      throw new Error('Should return null for valid required parameters');
    }

    // Test enum validation - invalid viewType
    const invalidEnumResult = toolInstance.validateEnumParams({
      viewType: 'invalid'
    }, {
      viewType: ['none', 'form', 'page']
    });
    console.log(`✅ Enum validation (invalid): ${!!invalidEnumResult.error}`);
    
    if (!invalidEnumResult || !invalidEnumResult.error) {
      throw new Error('Should return error for invalid enum value');
    }

    // Test enum validation - valid viewType
    const validEnumResult = toolInstance.validateEnumParams({
      viewType: 'form'
    }, {
      viewType: ['none', 'form', 'page']
    });
    console.log(`✅ Enum validation (valid): ${validEnumResult === null}`);
    
    if (validEnumResult !== null) {
      throw new Error('Should return null for valid enum value');
    }

    // Test method existence
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('execute method should be defined');
    }
    console.log(`✅ execute method: defined`);

    if (typeof toolInstance.formatSuccessResponse !== 'function') {
      throw new Error('formatSuccessResponse method should be defined');
    }
    console.log(`✅ formatSuccessResponse method: defined`);

    if (typeof toolInstance.formatErrorResponse !== 'function') {
      throw new Error('formatErrorResponse method should be defined');
    }
    console.log(`✅ formatErrorResponse method: defined`);

    if (typeof toolInstance.buildSuccessMarkdown !== 'function') {
      throw new Error('buildSuccessMarkdown method should be defined');
    }
    console.log(`✅ buildSuccessMarkdown method: defined`);

    if (typeof toolInstance.buildErrorMarkdown !== 'function') {
      throw new Error('buildErrorMarkdown method should be defined');
    }
    console.log(`✅ buildErrorMarkdown method: defined`);

    // Test API client integration
    if (!toolInstance.pegaClient) {
      throw new Error('pegaClient should be initialized');
    }
    console.log(`✅ PegaAPIClient: initialized`);

    // Test API client method existence
    if (typeof toolInstance.pegaClient.navigateAssignmentPrevious !== 'function') {
      throw new Error('navigateAssignmentPrevious method should be defined on PegaAPIClient');
    }
    console.log(`✅ API client method: navigateAssignmentPrevious defined`);

    // Test parameter validation in execute method
    console.log('\n🔍 Testing execute method parameter validation...');

    // Test missing required parameters
    try {
      const result = await toolInstance.execute({});
      if (!result.error) {
        throw new Error('Should return error for missing required parameters');
      }
      console.log(`✅ Execute validation (missing params): error returned`);
    } catch (error) {
      if (error.message.includes('Should return error')) {
        throw error;
      }
      console.log(`✅ Execute validation (missing params): error caught`);
    }

    // Test invalid content parameter
    try {
      const result = await toolInstance.execute({
        assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
        eTag: 'test-etag',
        content: 'invalid-content-should-be-object'
      });
      if (!result.error) {
        throw new Error('Should return error for invalid content parameter');
      }
      console.log(`✅ Execute validation (invalid content): error returned`);
    } catch (error) {
      if (error.message.includes('Should return error')) {
        throw error;
      }
      console.log(`✅ Execute validation (invalid content): error caught`);
    }

    // Test invalid pageInstructions parameter
    try {
      const result = await toolInstance.execute({
        assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
        eTag: 'test-etag',
        pageInstructions: 'invalid-should-be-array'
      });
      if (!result.error) {
        throw new Error('Should return error for invalid pageInstructions parameter');
      }
      console.log(`✅ Execute validation (invalid pageInstructions): error returned`);
    } catch (error) {
      if (error.message.includes('Should return error')) {
        throw error;
      }
      console.log(`✅ Execute validation (invalid pageInstructions): error caught`);
    }

    // Test invalid attachments parameter
    try {
      const result = await toolInstance.execute({
        assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
        eTag: 'test-etag',
        attachments: 'invalid-should-be-array'
      });
      if (!result.error) {
        throw new Error('Should return error for invalid attachments parameter');
      }
      console.log(`✅ Execute validation (invalid attachments): error returned`);
    } catch (error) {
      if (error.message.includes('Should return error')) {
        throw error;
      }
      console.log(`✅ Execute validation (invalid attachments): error caught`);
    }

    // Test invalid viewType parameter
    try {
      const result = await toolInstance.execute({
        assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
        eTag: 'test-etag',
        viewType: 'invalid-view-type'
      });
      if (!result.error) {
        throw new Error('Should return error for invalid viewType parameter');
      }
      console.log(`✅ Execute validation (invalid viewType): error returned`);
    } catch (error) {
      if (error.message.includes('Should return error')) {
        throw error;
      }
      console.log(`✅ Execute validation (invalid viewType): error caught`);
    }

    // Test response formatting
    console.log('\n🔍 Testing response formatting...');

    // Test success response formatting
    const mockSuccessData = {
      data: {
        caseInfo: {
          ID: 'TEST-CASE-001',
          caseTypeName: 'TestCase',
          status: 'Open',
          stageLabel: 'Review',
          urgency: 10,
          lastUpdateTime: '2025-01-07T10:00:00Z',
          lastUpdatedBy: 'TestUser'
        }
      },
      uiResources: {
        navigation: {
          breadcrumb: true,
          steps: [{ name: 'Step1' }, { name: 'Step2' }]
        }
      }
    };

    const successResponse = toolInstance.formatSuccessResponse(mockSuccessData, {
      assignmentID: 'ASSIGN-WORKLIST TEST-CASE!PROCESS',
      viewType: 'form'
    });

    if (!successResponse.content || !successResponse.content[0] || !successResponse.content[0].text) {
      throw new Error('Success response should have content with text');
    }
    console.log(`✅ Success response formatting: valid structure`);

    const successText = successResponse.content[0].text;
    if (!successText.includes('Assignment Navigation Successful')) {
      throw new Error('Success response should include success title');
    }
    if (!successText.includes('TEST-CASE-001')) {
      throw new Error('Success response should include case ID');
    }
    console.log(`✅ Success response content: includes expected information`);

    // Test error response formatting
    const mockError = {
      type: 'VALIDATION_FAIL',
      message: 'Previous assignment not found',
      details: 'Previous assignment not found.'
    };

    const errorResponse = toolInstance.formatErrorResponse(mockError);
    if (!errorResponse.content || !errorResponse.content[0] || !errorResponse.content[0].text) {
      throw new Error('Error response should have content with text');
    }
    console.log(`✅ Error response formatting: valid structure`);

    const errorText = errorResponse.content[0].text;
    if (!errorText.includes('Assignment Navigation Failed')) {
      throw new Error('Error response should include failure title');
    }
    if (!errorText.includes('No Previous Step Available')) {
      throw new Error('Error response should include specific guidance for validation fail');
    }
    console.log(`✅ Error response content: includes expected guidance`);

    // Test specific error scenarios
    console.log('\n🔍 Testing specific error scenarios...');

    const errorScenarios = [
      { type: 'BAD_REQUEST', expectedText: 'Invalid Request Parameters' },
      { type: 'FORBIDDEN', expectedText: 'Access Denied' },
      { type: 'NOT_FOUND', expectedText: 'Assignment Not Found' },
      { type: 'CONFLICT', expectedText: 'Assignment State Changed' },
      { type: 'PRECONDITION_FAILED', expectedText: 'Invalid eTag Value' },
      { type: 'LOCKED', expectedText: 'Assignment Locked' },
      { type: 'INTERNAL_SERVER_ERROR', expectedText: 'Server Error' },
      { type: 'UNAUTHORIZED', expectedText: 'Authentication Failed' }
    ];

    errorScenarios.forEach(scenario => {
      const errorMarkdown = toolInstance.buildErrorMarkdown({
        type: scenario.type,
        message: 'Test error',
        details: 'Test error details'
      });
      
      if (!errorMarkdown.includes(scenario.expectedText)) {
        throw new Error(`Error scenario ${scenario.type} should include '${scenario.expectedText}'`);
      }
      console.log(`✅ Error scenario ${scenario.type}: includes expected guidance`);
    });

    console.log('\n🎉 All NavigateAssignmentPreviousTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ NavigateAssignmentPreviousTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testNavigateAssignmentPreviousTool().then(success => {
  process.exit(success ? 0 : 1);
});
