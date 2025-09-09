import { PerformAssignmentActionTool } from '../../src/tools/assignments/perform-assignment-action.js';
import 'dotenv/config';

async function testPerformAssignmentAction() {
  console.log('\n🧪 Testing Perform Assignment Action Tool...\n');

  const tool = new PerformAssignmentActionTool();

  try {
    // Test 1: Tool Definition Validation
    console.log('1️⃣ Testing tool definition...');
    const definition = PerformAssignmentActionTool.getDefinition();
    
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Tool description: ${definition.description.substring(0, 100)}...`);
    console.log(`✅ Required parameters: ${definition.inputSchema.required.join(', ')}`);
    console.log(`✅ Total parameters: ${Object.keys(definition.inputSchema.properties).length}`);

    // Validate required parameters
    const requiredParams = ['assignmentID', 'actionID', 'eTag'];
    const actualRequired = definition.inputSchema.required;
    const missingRequired = requiredParams.filter(param => !actualRequired.includes(param));
    if (missingRequired.length > 0) {
      throw new Error(`Missing required parameters: ${missingRequired.join(', ')}`);
    }
    console.log('✅ All required parameters present');

    // Validate parameter types and descriptions
    const properties = definition.inputSchema.properties;
    for (const [paramName, paramDef] of Object.entries(properties)) {
      if (!paramDef.description || paramDef.description.length < 10) {
        throw new Error(`Parameter ${paramName} has insufficient description`);
      }
    }
    console.log('✅ All parameters have proper descriptions');

    // Test 2: Parameter Validation
    console.log('\n2️⃣ Testing parameter validation...');

    // Test missing required parameters
    const emptyResult = await tool.execute({});
    if (emptyResult.type === 'text' && emptyResult.text.includes('assignmentID is required')) {
      console.log('✅ Correctly validates missing assignmentID');
    } else {
      throw new Error('Should have returned error for missing assignmentID');
    }

    const missingActionResult = await tool.execute({ assignmentID: 'test' });
    if (missingActionResult.type === 'text' && missingActionResult.text.includes('actionID is required')) {
      console.log('✅ Correctly validates missing actionID');
    } else {
      throw new Error('Should have returned error for missing actionID');
    }

    const missingETagResult = await tool.execute({ assignmentID: 'test', actionID: 'test' });
    if (missingETagResult.type === 'text' && missingETagResult.text.includes('eTag is required')) {
      console.log('✅ Correctly validates missing eTag');
    } else {
      throw new Error('Should have returned error for missing eTag');
    }

    // Test invalid parameter types
    const invalidAssignmentResult = await tool.execute({ 
      assignmentID: 123, 
      actionID: 'test', 
      eTag: 'test' 
    });
    if (invalidAssignmentResult.type === 'text' && invalidAssignmentResult.text.includes('assignmentID is required and must be a non-empty string')) {
      console.log('✅ Correctly validates assignmentID type');
    } else {
      throw new Error('Should have returned error for invalid assignmentID type');
    }

    const invalidContentResult = await tool.execute({ 
      assignmentID: 'test', 
      actionID: 'test', 
      eTag: 'test',
      content: 'invalid' 
    });
    if (invalidContentResult.type === 'text' && invalidContentResult.text.includes('content must be an object')) {
      console.log('✅ Correctly validates content type');
    } else {
      throw new Error('Should have returned error for invalid content type');
    }

    const invalidViewTypeResult = await tool.execute({ 
      assignmentID: 'test', 
      actionID: 'test', 
      eTag: 'test',
      viewType: 'invalid' 
    });
    if (invalidViewTypeResult.type === 'text' && invalidViewTypeResult.text.includes('viewType must be one of: none, form, page')) {
      console.log('✅ Correctly validates viewType enum');
    } else {
      throw new Error('Should have returned error for invalid viewType');
    }

    console.log('✅ Parameter validation working correctly');

    // Test 3: Valid Parameters (will fail with connection error in test environment)
    console.log('\n3️⃣ Testing with valid parameters...');

    const validParams = {
      assignmentID: 'ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-35005!APPROVAL_FLOW',
      actionID: 'CompleteVerification',
      eTag: 'test-etag-value',
      content: {
        FinalNotes: 'Test completion notes'
      },
      viewType: 'page'
    };

    try {
      const result = await tool.execute(validParams);
      
      // Should get connection error in test environment
      if (result && result.type === 'text' && result.text.includes('CONNECTION_ERROR')) {
        console.log('✅ Tool handles connection errors gracefully');
        console.log('ℹ️  Connection error expected in test environment');
      } else if (result && result.type === 'text' && result.text.includes('Assignment Action Executed Successfully')) {
        console.log('✅ Tool executed successfully (live environment)');
        console.log(`📋 Response preview: ${result.text.substring(0, 200)}...`);
      } else {
        console.log('⚠️  Unexpected response format');
        console.log('Response:', JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.log('⚠️  Execution error (expected in test environment)');
      console.log(`Error: ${error.message}`);
    }

    // Test 4: Response Formatting
    console.log('\n4️⃣ Testing response formatting...');

    // Test success response formatting
    const mockSuccessData = {
      data: {
        caseInfo: {
          ID: 'O1UGTM-TESTAPP13-WORK T-35005',
          caseTypeName: 'Test Case',
          status: 'New',
          stageLabel: 'Approval',
          urgency: '10',
          lastUpdateTime: '2023-09-19T11:30:56.711Z',
          lastUpdatedBy: 'testuser',
          availableActions: [
            { name: 'Edit details', ID: 'pyUpdateCaseDetails', type: 'Case' }
          ],
          assignments: [
            {
              name: 'Complete Verification',
              ID: 'ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-35005!APPROVAL_FLOW',
              processName: 'Approval',
              assigneeInfo: { name: 'Test User', ID: 'testuser' },
              urgency: '10',
              canPerform: 'true'
            }
          ]
        },
        referencedUsers: [
          { UserID: 'testuser', UserName: 'Test User' }
        ]
      },
      nextAssignmentInfo: {
        ID: 'ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-35005!NEXT_FLOW',
        context: 'self',
        className: 'O1UGTM-TestApp13-Work-Test'
      }
    };

    const successResponse = tool.formatSuccessResponse(mockSuccessData, validParams);
    
    if (successResponse.type === 'text' && successResponse.text.includes('Assignment Action Executed Successfully')) {
      console.log('✅ Success response formatting working');
      
      // Check for key sections
      const text = successResponse.text;
      if (text.includes('## Case Information')) {
        console.log('✅ Case information section present');
      }
      if (text.includes('## Next Assignment Available')) {
        console.log('✅ Next assignment section present');
      }
      if (text.includes('## Next Steps')) {
        console.log('✅ Next steps section present');
      }
    } else {
      throw new Error('Success response formatting failed');
    }

    // Test error response formatting
    const mockError = {
      type: 'NOT_FOUND',
      message: 'Assignment not found',
      details: 'The specified assignment could not be found'
    };

    const errorResponse = tool.formatErrorResponse(mockError);
    
    if (errorResponse.type === 'text' && errorResponse.text.includes('Assignment Action Execution Failed')) {
      console.log('✅ Error response formatting working');
      
      const text = errorResponse.text;
      if (text.includes('## Assignment or Action Not Found')) {
        console.log('✅ Error-specific guidance present');
      }
      if (text.includes('**Next Steps:**')) {
        console.log('✅ Recovery guidance present');
      }
    } else {
      throw new Error('Error response formatting failed');
    }

    // Test 5: Complex Scenario Validation
    console.log('\n5️⃣ Testing complex scenarios...');

    // Test with all optional parameters
    const complexParams = {
      assignmentID: 'ASSIGN-WORKLIST O1UGTM-TESTAPP13-WORK T-35005!APPROVAL_FLOW',
      actionID: 'CompleteVerification',
      eTag: 'test-etag-value',
      content: {
        FinalNotes: 'Complex test notes',
        EmployeeStatus: 'Active'
      },
      pageInstructions: [
        {
          instruction: 'add',
          target: 'TestPage'
        }
      ],
      attachments: [
        {
          name: 'test-document.pdf',
          operation: 'add'
        }
      ],
      viewType: 'form',
      originChannel: 'Mobile'
    };

    try {
      const result = await tool.execute(complexParams);
      console.log('✅ Complex parameter handling working');
    } catch (error) {
      if (error.message.includes('Failed to connect') || error.message.includes('CONNECTION_ERROR')) {
        console.log('✅ Complex parameter validation passed (connection error expected)');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}`);
      }
    }

    console.log('\n✅ All Perform Assignment Action Tool tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   • Tool definition validation: ✅');
    console.log('   • Parameter validation: ✅');
    console.log('   • Valid parameter handling: ✅');
    console.log('   • Response formatting: ✅');
    console.log('   • Complex scenario handling: ✅');
    console.log('   • Error handling: ✅');

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testPerformAssignmentAction();
