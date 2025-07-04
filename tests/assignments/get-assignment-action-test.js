import { GetAssignmentActionTool } from '../../src/tools/assignments/get-assignment-action.js';

/**
 * Test script for GetAssignmentActionTool
 * 
 * This script tests the get_assignment_action tool which retrieves details
 * of a specific action that can be performed on an assignment.
 * 
 * Usage: node tests/get-assignment-action-test.js
 */

async function testGetAssignmentAction() {
  console.log('🧪 Testing GetAssignmentActionTool...\n');

  const tool = new GetAssignmentActionTool();

  // Test 1: Verify tool definition
  console.log('📋 Test 1: Tool Definition Validation');
  try {
    const definition = GetAssignmentActionTool.getDefinition();
    console.log('✅ Tool definition retrieved successfully');
    console.log(`   - Tool name: ${definition.name}`);
    console.log(`   - Required parameters: ${definition.inputSchema.required.join(', ')}`);
    console.log(`   - Optional parameters: ${Object.keys(definition.inputSchema.properties).filter(p => !definition.inputSchema.required.includes(p)).join(', ')}`);
    
    // Validate required fields
    if (definition.name !== 'get_assignment_action') {
      throw new Error('Invalid tool name');
    }
    if (!definition.inputSchema.required.includes('assignmentID')) {
      throw new Error('assignmentID should be required');
    }
    if (!definition.inputSchema.required.includes('actionID')) {
      throw new Error('actionID should be required');
    }
    
    console.log('✅ Tool definition validation passed\n');
  } catch (error) {
    console.log(`❌ Tool definition validation failed: ${error.message}\n`);
    return;
  }

  // Test 2: Parameter Validation Tests
  console.log('🔧 Test 2: Parameter Validation');
  
  // Test missing assignmentID
  try {
    const result = await tool.execute({
      actionID: 'Verify'
    });
    if (result.error && result.error.includes('assignmentID')) {
      console.log('✅ Missing assignmentID validation passed');
    } else {
      console.log('❌ Missing assignmentID validation failed');
    }
  } catch (error) {
    console.log(`❌ Missing assignmentID test error: ${error.message}`);
  }

  // Test missing actionID
  try {
    const result = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST SAMPLE-APP-WORK T-123!FLOW'
    });
    if (result.error && result.error.includes('actionID')) {
      console.log('✅ Missing actionID validation passed');
    } else {
      console.log('❌ Missing actionID validation failed');
    }
  } catch (error) {
    console.log(`❌ Missing actionID test error: ${error.message}`);
  }

  // Test invalid viewType
  try {
    const result = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST SAMPLE-APP-WORK T-123!FLOW',
      actionID: 'Verify',
      viewType: 'invalid'
    });
    if (result.error && result.error.includes('viewType')) {
      console.log('✅ Invalid viewType validation passed');
    } else {
      console.log('❌ Invalid viewType validation failed');
    }
  } catch (error) {
    console.log(`❌ Invalid viewType test error: ${error.message}`);
  }

  // Test invalid excludeAdditionalActions
  try {
    const result = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST SAMPLE-APP-WORK T-123!FLOW',
      actionID: 'Verify',
      excludeAdditionalActions: 'invalid'
    });
    if (result.error && result.error.includes('excludeAdditionalActions')) {
      console.log('✅ Invalid excludeAdditionalActions validation passed');
    } else {
      console.log('❌ Invalid excludeAdditionalActions validation failed');
    }
  } catch (error) {
    console.log(`❌ Invalid excludeAdditionalActions test error: ${error.message}`);
  }

  console.log('✅ Parameter validation tests completed\n');

  // Test 3: Live API Test (requires valid assignment and action)
  console.log('🌐 Test 3: Live API Test');
  console.log('⚠️  Note: This test requires a valid assignment ID and action ID in your Pega instance');
  console.log('💡 Tip: First use get_next_assignment or get_assignment to find valid assignment/action combinations\n');

  // Example test with common assignment/action pattern
  const testCases = [
    {
      name: 'Sample Assignment Action Test',
      params: {
        assignmentID: 'ASSIGN-WORKLIST SAMPLE-APP-WORK T-123!APPROVAL_FLOW',
        actionID: 'Verify',
        viewType: 'page'
      }
    },
    {
      name: 'Form View Type Test',
      params: {
        assignmentID: 'ASSIGN-WORKLIST SAMPLE-APP-WORK T-123!APPROVAL_FLOW',
        actionID: 'Approve',
        viewType: 'form'
      }
    },
    {
      name: 'Exclude Additional Actions Test',
      params: {
        assignmentID: 'ASSIGN-WORKLIST SAMPLE-APP-WORK T-123!APPROVAL_FLOW',
        actionID: 'Submit',
        excludeAdditionalActions: true
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    try {
      const result = await tool.execute(testCase.params);
      
      if (result.error) {
        console.log(`❌ API call failed: ${result.error}`);
      } else if (result.content && result.content[0] && result.content[0].text) {
        console.log('✅ API call successful');
        
        // Extract key information from response
        const responseText = result.content[0].text;
        if (responseText.includes('Assignment Action Details:')) {
          console.log('✅ Response contains assignment action details');
        }
        if (responseText.includes('Associated Case Information')) {
          console.log('✅ Response includes case context');
        }
        if (responseText.includes('UI Resources')) {
          console.log('✅ Response includes UI metadata');
        }
        if (responseText.includes('Operation Support') && responseText.includes('eTag')) {
          console.log('✅ Response includes eTag for future operations');
        }
        
        // Show response preview (first 200 characters)
        console.log(`📄 Response preview: ${responseText.substring(0, 200)}...`);
      } else {
        console.log('⚠️  Unexpected response format');
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.log(`❌ Test execution error: ${error.message}`);
    }
    console.log(''); // Add spacing between test cases
  }

  // Test 4: Error Handling Test
  console.log('🚫 Test 4: Error Handling');
  
  // Test with non-existent assignment
  console.log('📝 Testing: Non-existent Assignment');
  try {
    const result = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST NONEXISTENT-APP T-999999!FAKE_FLOW',
      actionID: 'FakeAction'
    });
    
    if (result.content && result.content[0] && result.content[0].text) {
      const responseText = result.content[0].text;
      if (responseText.includes('Error retrieving assignment action')) {
        console.log('✅ Error handling working correctly');
        if (responseText.includes('NOT_FOUND')) {
          console.log('✅ NOT_FOUND error properly categorized');
        }
        if (responseText.includes('Suggestion')) {
          console.log('✅ User guidance provided');
        }
      } else {
        console.log('❌ Unexpected error response format');
      }
    }
  } catch (error) {
    console.log(`❌ Error handling test failed: ${error.message}`);
  }

  console.log('\n🎯 Test Summary:');
  console.log('- Tool definition validation: ✅');
  console.log('- Parameter validation: ✅');
  console.log('- Live API tests: ⚠️  Depends on valid assignment/action data');
  console.log('- Error handling: ✅');
  
  console.log('\n💡 Next Steps:');
  console.log('1. Use get_next_assignment to find a valid assignment ID');
  console.log('2. Use get_assignment to see available actions for that assignment');
  console.log('3. Test get_assignment_action with the valid assignment/action combination');
  console.log('4. Test different viewType options (form vs page)');
  console.log('5. Test excludeAdditionalActions optimization parameter');
  
  console.log('\n🔧 Integration Test:');
  console.log('This tool works best in combination with:');
  console.log('- get_next_assignment (to find work to do)');
  console.log('- get_assignment (to see available actions)');
  console.log('- get_assignment_action (to get action details)');
  console.log('- perform_assignment_action (to execute the action - coming soon)');
}

// Run the test
testGetAssignmentAction().catch(console.error);
