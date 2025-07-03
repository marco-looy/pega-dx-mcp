import { GetCaseTool } from '../src/tools/cases/get-case.js';

async function testGetCase() {
  console.log('\n📋 Testing Get Case Tool...\n');
  
  const tool = new GetCaseTool();
  
  // Test cases to try
  const testCases = [
    {
      name: 'Basic Case Retrieval (no view)',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008',
        viewType: 'none'
      }
    },
    {
      name: 'Case with Page View Metadata',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008',
        viewType: 'page'
      }
    },
    {
      name: 'Case with Specific Page Name',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008',
        viewType: 'page',
        pageName: 'pyWorkPage'
      }
    },
    {
      name: 'Case ID with Spaces (URL encoding test)',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008'
      }
    }
  ];

  // Test input validation
  console.log('📋 Testing Input Validation...\n');
  
  const validationTests = [
    {
      name: 'Missing Case ID',
      params: {},
      expectError: true
    },
    {
      name: 'Empty Case ID',
      params: { caseID: '' },
      expectError: true
    },
    {
      name: 'Null Case ID',
      params: { caseID: null },
      expectError: true
    },
    {
      name: 'Invalid View Type',
      params: { caseID: 'MON6E5R-DIYRECIPE-WORK R-1008', viewType: 'invalid' },
      expectError: true
    },
    {
      name: 'Page Name without Page View Type',
      params: { caseID: 'ON6E5R-DIYRECIPE-WORK R-1008', viewType: 'none', pageName: 'pyWorkPage' },
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
        const preview = lines.slice(0, 12).join('\n');
        console.log(preview);
        
        if (lines.length > 12) {
          console.log(`... (${lines.length - 12} more lines)`);
        }
        
        // Check for key elements in the response
        if (responseText.includes('## Case Details:')) {
          console.log('✓ Response contains case details header');
        }
        if (responseText.includes('### Case Information')) {
          console.log('✓ Response contains case information section');
        }
        if (responseText.includes('Case ID:')) {
          console.log('✓ Response contains case ID');
        }
        if (responseText.includes('Case Type:')) {
          console.log('✓ Response contains case type');
        }
        if (responseText.includes('Status:')) {
          console.log('✓ Response contains case status');
        }
        if (testCase.params.viewType === 'page' && responseText.includes('### UI Resources')) {
          console.log('✓ Response contains UI resources (page view)');
        }
        if (responseText.includes('### Child Cases')) {
          console.log('✓ Response contains child cases section');
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
        caseID: 'NONEXISTENT-CASE-123'
      }
    },
    {
      name: 'Malformed Case ID',
      params: {
        caseID: 'INVALID-FORMAT'
      }
    },
    {
      name: 'Case ID with Special Characters',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008 T-999'
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
        if (responseText.includes('Error retrieving case:')) {
          console.log('✅ Error handled gracefully with user-friendly message');
          
          // Show the error response
          const lines = responseText.split('\n');
          const preview = lines.slice(0, 8).join('\n');
          console.log(`Error response preview:\n${preview}`);
        } else {
          console.log('✅ Request succeeded (might be valid case)');
          
          // Show brief success preview
          const lines = responseText.split('\n');
          const preview = lines.slice(0, 5).join('\n');
          console.log(`Success response preview:\n${preview}`);
        }
      } else if (result.error) {
        console.log(`✅ Error caught: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`✅ Error handled: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }

  // Test different case types and scenarios
  console.log('🔍 Testing Different Case Scenarios...\n');
  
  const scenarioTests = [
    {
      name: 'Recently Created Case',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008'
      }
    },
    {
      name: 'Case with Complex ID',
      params: {
        caseID: 'ON6E5R-DIYRECIPE-WORK R-1008'
      }
    }
  ];

  for (const test of scenarioTests) {
    try {
      console.log(`Testing: ${test.name}`);
      const result = await tool.execute(test.params);
      
      if (result.content && result.content[0] && result.content[0].text) {
        const responseText = result.content[0].text;
        if (responseText.includes('## Case Details:')) {
          console.log('✅ Case retrieved successfully');
          
          // Extract key information
          if (responseText.includes('Status: ')) {
            const statusMatch = responseText.match(/Status: ([^\n]+)/);
            if (statusMatch) {
              console.log(`  Status: ${statusMatch[1]}`);
            }
          }
          if (responseText.includes('Stage: ')) {
            const stageMatch = responseText.match(/Stage: ([^\n]+)/);
            if (stageMatch) {
              console.log(`  Stage: ${stageMatch[1]}`);
            }
          }
        } else if (responseText.includes('Error retrieving case:')) {
          console.log('✅ Case not found (expected for some test cases)');
        }
      }
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
    
    console.log('\n' + '-'.repeat(40) + '\n');
  }

  console.log('📋 Get Case Tool testing completed!\n');
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGetCase().catch(console.error);
}

export { testGetCase };
