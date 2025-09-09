import { RefreshAssignmentActionTool } from '../../src/tools/assignments/refresh-assignment-action.js';
import 'dotenv/config';

async function testRefreshAssignmentAction() {
  console.log('🧪 Testing Refresh Assignment Action Tool...\n');

  const tool = new RefreshAssignmentActionTool();

  // Test 1: Basic Form Refresh
  console.log('📝 Test 1: Basic Form Refresh with Property Change');
  console.log('='.repeat(50));
  
  try {
    const result1 = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW',
      actionID: 'CompleteVerification',
      refreshFor: 'CustomerName',
      content: {
        CustomerName: 'John Smith',
        CustomerAge: 35
      }
    });

    if (result1.content) {
      console.log('✅ Basic refresh test completed successfully');
      console.log(result1.content[0].text);
    } else if (result1.error) {
      console.log('❌ Basic refresh test failed:');
      console.log(result1.error);
    }
  } catch (error) {
    console.log('❌ Basic refresh test error:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 2: Generative AI Form Filling
  console.log('📝 Test 2: Generative AI Form Filling');
  console.log('='.repeat(50));
  
  try {
    const result2 = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293002!AI_FORM_FLOW',
      actionID: 'FillFormAction',
      fillFormWithAI: true,
      content: {
        FormType: 'CustomerApplication'
      }
    });

    if (result2.content) {
      console.log('✅ AI form filling test completed successfully');
      console.log(result2.content[0].text);
    } else if (result2.error) {
      console.log('❌ AI form filling test failed:');
      console.log(result2.error);
    }
  } catch (error) {
    console.log('❌ AI form filling test error:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 3: Table Row Operation - Show Row
  console.log('📝 Test 3: Table Row Operation - Show Row (Add/Edit)');
  console.log('='.repeat(50));
  
  try {
    const result3 = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293003!TABLE_FLOW',
      actionID: 'ManageOrderItems',
      operation: 'showRow',
      interestPage: '.OrderItems(1)',
      interestPageActionID: 'EditOrderItem',
      content: {
        ItemName: 'Product A',
        Quantity: 2,
        UnitPrice: 29.99
      },
      pageInstructions: [{
        target: '.OrderItems(1)',
        instruction: 'update'
      }]
    });

    if (result3.content) {
      console.log('✅ Table row show operation test completed successfully');
      console.log(result3.content[0].text);
    } else if (result3.error) {
      console.log('❌ Table row show operation test failed:');
      console.log(result3.error);
    }
  } catch (error) {
    console.log('❌ Table row show operation test error:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 4: Table Row Operation - Submit Row
  console.log('📝 Test 4: Table Row Operation - Submit Row');
  console.log('='.repeat(50));
  
  try {
    const result4 = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293003!TABLE_FLOW',
      actionID: 'ManageOrderItems',
      operation: 'submitRow',
      interestPage: '.OrderItems(1)',
      interestPageActionID: 'SubmitOrderItem',
      content: {
        ItemName: 'Product A',
        Quantity: 2,
        UnitPrice: 29.99,
        TotalPrice: 59.98
      }
    });

    if (result4.content) {
      console.log('✅ Table row submit operation test completed successfully');
      console.log(result4.content[0].text);
    } else if (result4.error) {
      console.log('❌ Table row submit operation test failed:');
      console.log(result4.error);
    }
  } catch (error) {
    console.log('❌ Table row submit operation test error:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 5: Combined Operations - Refresh with AI and Content
  console.log('📝 Test 5: Combined Operations - Refresh with AI and Content');
  console.log('='.repeat(50));
  
  try {
    const result5 = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293004!COMBINED_FLOW',
      actionID: 'ComplexFormAction',
      refreshFor: 'CompanyType',
      fillFormWithAI: true,
      content: {
        CompanyType: 'Technology',
        CompanySize: 'Medium',
        Industry: 'Software'
      },
      pageInstructions: [{
        target: '.CompanyDetails',
        instruction: 'refresh'
      }]
    });

    if (result5.content) {
      console.log('✅ Combined operations test completed successfully');
      console.log(result5.content[0].text);
    } else if (result5.error) {
      console.log('❌ Combined operations test failed:');
      console.log(result5.error);
    }
  } catch (error) {
    console.log('❌ Combined operations test error:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 6: Parameter Validation Tests
  console.log('📝 Test 6: Parameter Validation Tests');
  console.log('='.repeat(50));

  // Test missing required parameters
  try {
    const result6a = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW'
      // Missing actionID
    });

    if (result6a.error) {
      console.log('✅ Missing actionID validation test passed:');
      console.log('   ' + result6a.error);
    } else {
      console.log('❌ Missing actionID validation test failed - should have returned error');
    }
  } catch (error) {
    console.log('✅ Missing actionID validation test passed with exception:', error.message);
  }

  // Test invalid operation parameter
  try {
    const result6b = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW',
      actionID: 'TestAction',
      operation: 'invalidOperation'
    });

    if (result6b.error) {
      console.log('✅ Invalid operation validation test passed:');
      console.log('   ' + result6b.error);
    } else {
      console.log('❌ Invalid operation validation test failed - should have returned error');
    }
  } catch (error) {
    console.log('✅ Invalid operation validation test passed with exception:', error.message);
  }

  // Test missing conditional parameters
  try {
    const result6c = await tool.execute({
      assignmentID: 'ASSIGN-WORKLIST MYORG-SERVICES-WORK S-293001!APPROVAL_FLOW',
      actionID: 'TestAction',
      operation: 'showRow'
      // Missing interestPage and interestPageActionID
    });

    if (result6c.error) {
      console.log('✅ Missing conditional parameters validation test passed:');
      console.log('   ' + result6c.error);
    } else {
      console.log('❌ Missing conditional parameters validation test failed - should have returned error');
    }
  } catch (error) {
    console.log('✅ Missing conditional parameters validation test passed with exception:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 7: Tool Definition Validation
  console.log('📝 Test 7: Tool Definition Validation');
  console.log('='.repeat(50));

  try {
    const definition = RefreshAssignmentActionTool.getDefinition();
    
    console.log('✅ Tool Definition Retrieved Successfully:');
    console.log(`   Name: ${definition.name}`);
    console.log(`   Description Length: ${definition.description.length} characters`);
    console.log(`   Required Parameters: ${definition.inputSchema.required.join(', ')}`);
    console.log(`   Total Parameters: ${Object.keys(definition.inputSchema.properties).length}`);
    
    // Validate all expected parameters are present
    const expectedParams = [
      'assignmentID', 'actionID', 'refreshFor', 'fillFormWithAI', 
      'operation', 'interestPage', 'interestPageActionID', 'content', 'pageInstructions'
    ];
    
    const actualParams = Object.keys(definition.inputSchema.properties);
    const missingParams = expectedParams.filter(param => !actualParams.includes(param));
    
    if (missingParams.length === 0) {
      console.log('✅ All expected parameters are present in the tool definition');
    } else {
      console.log('❌ Missing parameters in tool definition:', missingParams.join(', '));
    }

    // Validate operation enum values
    const operationEnum = definition.inputSchema.properties.operation.enum;
    if (operationEnum && operationEnum.includes('showRow') && operationEnum.includes('submitRow')) {
      console.log('✅ Operation enum values are correctly defined');
    } else {
      console.log('❌ Operation enum values are missing or incorrect');
    }

  } catch (error) {
    console.log('❌ Tool definition validation error:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');
  console.log('🏁 Refresh Assignment Action Tool Tests Completed\n');
}

// Run the tests
testRefreshAssignmentAction().catch(console.error);
