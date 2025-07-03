import { GetCaseActionTool } from '../src/tools/cases/get-case-action.js';

async function testGetCaseAction() {
  console.log('\n🔧 Testing Get Case Action Tool...\n');
  
  const tool = new GetCaseActionTool();
  
  // Test cases to try
  const testCases = [
    {
      name: 'Basic Action Retrieval (page view)',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008',
        actionID: 'Submit',
        viewType: 'page'
      }
    },
    {
      name: 'Form View Action',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008',
        actionID: 'Submit',
        viewType: 'form'
      }
    },
    {
      name: 'Action with Additional Actions Excluded',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008',
        actionID: 'Submit',
        viewType: 'page',
        excludeAdditionalActions: true
      }
    },
    {
      name: 'Different Action Type',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008',
        actionID: 'Approve',
        viewType: 'page'
      }
    }
  ];

  // Test input validation
  console.log('📋 Testing Input Validation...\n');
  
  const validationTests = [
    {
      name: 'Missing Case ID',
      params: { actionID: 'Submit' },
      expectError: true
    },
    {
      name: 'Empty Case ID',
      params: { caseID: '', actionID: 'Submit' },
      expectError: true
    },
    {
      name: 'Missing Action ID',
      params: { caseID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
      expectError: true
    },
    {
      name: 'Empty Action ID',
      params: { caseID: 'ON6E5R-DIYRECIPE-WORK R-1008', actionID: '' },
      expectError: true
    },
    {
      name: 'Invalid View Type',
      params: { caseID: 'ON6E5R-DIYRECIPE-WORK R-1008', actionID: 'Submit', viewType: 'invalid' },
      expectError: true
    },
    {
      name: 'Invalid excludeAdditionalActions Type',
      params: { caseID: 'ON6E5R-DIYRECIPE-WORK R-1008', actionID: 'Submit', excludeAdditionalActions: 'not-boolean' },
      expectError: true
    }
  ];

  for (const test of validationTests) {
    try {
      console.log(`Testing: ${test.name}`);
      const result = await tool.execute(test.params);
      
      if (test.expectError && result.error) {
        console.log(`✅ Expected error caught: ${result.error}`);
      } else if (test.expectError && !result.error) {
        console.log(`❌ Expected error but got success`);
      } else if (!test.expectError && !result.error) {
        console.log(`✅ Validation passed`);
      } else {
        console.log(`❌ Unexpected result: ${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      if (test.expectError) {
        console.log(`✅ Expected error caught: ${error.message}`);
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }
    console.log('');
  }

  // Test actual API calls
  console.log('🌐 Testing API Calls...\n');
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`Parameters: ${JSON.stringify(testCase.params, null, 2)}`);
      
      const startTime = Date.now();
      const result = await tool.execute(testCase.params);
      const endTime = Date.now();
      
      console.log(`⏱️  Response time: ${endTime - startTime}ms`);
      
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      } else if (result.content && result.content[0] && result.content[0].text) {
        console.log(`✅ Success! Response preview:`);
        
        // Show first few lines of the response
        const responseText = result.content[0].text;
        const lines = responseText.split('\n');
        const preview = lines.slice(0, 10).join('\n');
        console.log(preview);
        
        if (lines.length > 10) {
          console.log(`... (${lines.length - 10} more lines)`);
        }
        
        // Check for key elements in the response
        if (responseText.includes('## Case Action Details:')) {
          console.log('✓ Response contains action details header');
        }
        if (responseText.includes('### Case Information')) {
          console.log('✓ Response contains case information section');
        }
        if (responseText.includes('### UI Resources')) {
          console.log('✓ Response contains UI resources section');
        }
        if (responseText.includes('ETag')) {
          console.log('✓ Response contains eTag for future updates');
        }
      } else {
        console.log(`❌ Unexpected response format: ${JSON.stringify(result, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
      console.log(`Stack: ${error.stack}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }

  // Test error scenarios
  console.log('🚫 Testing Error Scenarios...\n');
  
  const errorTests = [
    {
      name: 'Non-existent Case',
      params: {
        caseID: 'NONEXISTENT-CASE-123',
        actionID: 'Submit'
      }
    },
    {
      name: 'Non-existent Action',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008',
        actionID: 'NonExistentAction'
      }
    },
    {
      name: 'Case with Special Characters',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008',
        actionID: 'Submit With Spaces'
      }
    }
  ];

  for (const test of errorTests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`Parameters: ${JSON.stringify(test.params, null, 2)}`);
      
      const result = await tool.execute(test.params);
      
      if (result.content && result.content[0] && result.content[0].text) {
        const responseText = result.content[0].text;
        if (responseText.includes('Error retrieving case action:')) {
          console.log('✅ Error handled gracefully with user-friendly message');
          
          // Show the error response
          const lines = responseText.split('\n');
          const preview = lines.slice(0, 8).join('\n');
          console.log(`Error response preview:\n${preview}`);
        } else {
          console.log('✅ Request succeeded (might be valid case/action)');
        }
      } else if (result.error) {
        console.log(`✅ Error caught: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`✅ Error handled: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }

  console.log('🔧 Get Case Action Tool testing completed!\n');
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGetCaseAction().catch(console.error);
}

export { testGetCaseAction };
