import { PerformBulkActionTool } from '../../src/tools/cases/perform-bulk-action.js';
import 'dotenv/config';

async function testPerformBulkAction() {
  console.log('\n🔄 Testing Perform Bulk Action Tool...\n');
  
  const tool = new PerformBulkActionTool();

  // Test input validation
  console.log('📋 Testing Input Validation...\n');
  
  const validationTests = [
    {
      name: 'Missing Action ID',
      params: {
        cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }]
      },
      expectError: true
    },
    {
      name: 'Empty Action ID',
      params: {
        actionID: '',
        cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }]
      },
      expectError: true
    },
    {
      name: 'Missing Cases Array',
      params: {
        actionID: 'pyUpdateCaseDetails'
      },
      expectError: true
    },
    {
      name: 'Empty Cases Array',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: []
      },
      expectError: true
    },
    {
      name: 'Invalid Case Object - Missing ID',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [{ Name: 'InvalidCase' }]
      },
      expectError: true
    },
    {
      name: 'Invalid Case Object - Empty ID',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [{ ID: '' }]
      },
      expectError: true
    },
    {
      name: 'Invalid Running Mode',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }],
        runningMode: 'invalid'
      },
      expectError: true
    },
    {
      name: 'Invalid Content Type',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }],
        content: 'invalid_string'
      },
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

  // Test API calls with various scenarios
  console.log('🌐 Testing API Calls...\n');
  
  const testCases = [
    {
      name: 'Single Case Bulk Action (Synchronous)',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }
        ]
      }
    },
    {
      name: 'Multiple Cases Bulk Action',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1009' }
        ]
      }
    },
    {
      name: 'Bulk Action with Content',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }
        ],
        content: {
          pyWorkPage: {
            Status: 'Updated via bulk action'
          }
        }
      }
    },
    {
      name: 'Bulk Action with Async Mode (Launchpad)',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }
        ],
        runningMode: 'async'
      }
    },
    {
      name: 'Bulk Action with Page Instructions',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }
        ],
        pageInstructions: [
          {
            instruction: 'SET',
            target: 'pyWorkPage.SomeField',
            value: 'BulkUpdatedValue'
          }
        ]
      }
    },
    {
      name: 'Bulk Action with Attachments',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }
        ],
        attachments: [
          {
            category: 'File',
            fileName: 'bulk-action-log.txt',
            content: 'Bulk action executed'
          }
        ]
      }
    },
    {
      name: 'Complex Bulk Action with All Parameters',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1009' }
        ],
        runningMode: 'async',
        content: {
          pyWorkPage: {
            BulkProcessed: true,
            ProcessedDate: new Date().toISOString()
          }
        },
        pageInstructions: [
          {
            instruction: 'SET',
            target: 'pyWorkPage.BulkStatus',
            value: 'Processed'
          }
        ],
        attachments: [
          {
            category: 'System',
            fileName: 'bulk-processing-log.json',
            content: JSON.stringify({ processed: true, timestamp: new Date().toISOString() })
          }
        ]
      }
    }
  ];

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
        const preview = lines.slice(0, 15).join('\n');
        console.log(preview);
        
        if (lines.length > 15) {
          console.log(`... (${lines.length - 15} more lines)`);
        }
        
        // Check for key elements in the response
        if (responseText.includes('## Bulk Action Executed:')) {
          console.log('✓ Response contains bulk action header');
        }
        if (responseText.includes('Cases Processed:')) {
          console.log('✓ Response contains cases processed count');
        }
        if (responseText.includes('Execution Mode:')) {
          console.log('✓ Response contains execution mode');
        }
        if (responseText.includes('### Processed Cases')) {
          console.log('✓ Response contains processed cases section');
        }
        if (testCase.params.content && responseText.includes('### Content Applied')) {
          console.log('✓ Response contains content section');
        }
        if (testCase.params.runningMode === 'async' && responseText.includes('Asynchronous')) {
          console.log('✓ Response indicates asynchronous execution');
        }
        if (responseText.includes('### Important Notes')) {
          console.log('✓ Response contains important notes');
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
      name: 'Non-existent Action ID',
      params: {
        actionID: 'NonExistentAction',
        cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }]
      }
    },
    {
      name: 'Invalid Case IDs',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'INVALID-CASE-ID-123' },
          { ID: 'ANOTHER-INVALID-ID-456' }
        ]
      }
    },
    {
      name: 'Mixed Valid and Invalid Cases',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
          { ID: 'INVALID-CASE-ID-123' }
        ]
      }
    },
    {
      name: 'Assignment-Level Action (Should Fail)',
      params: {
        actionID: 'Transfer',
        cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }]
      }
    },
    {
      name: 'Large Number of Cases (Performance Test)',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: Array.from({ length: 10 }, (_, i) => ({ ID: `TEST-CASE-${i + 1000}` }))
      }
    }
  ];

  for (const test of errorTests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`Cases count: ${test.params.cases.length}`);
      
      const result = await tool.execute(test.params);
      
      if (result.content && result.content[0] && result.content[0].text) {
        const responseText = result.content[0].text;
        if (responseText.includes('Error performing bulk action:')) {
          console.log('✅ Error handled gracefully with user-friendly message');
          
          // Show the error response
          const lines = responseText.split('\n');
          const preview = lines.slice(0, 10).join('\n');
          console.log(`Error response preview:\n${preview}`);
          
          // Check for specific error guidance
          if (responseText.includes('**Suggestion**:')) {
            console.log('✓ Error includes helpful suggestions');
          }
          if (responseText.includes('### Case Information')) {
            console.log('✓ Error includes case information for debugging');
          }
        } else if (responseText.includes('## Bulk Action Executed:')) {
          console.log('✅ Request succeeded (might be valid action/cases)');
          
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

  // Test different bulk action scenarios
  console.log('📊 Testing Different Bulk Action Scenarios...\n');
  
  const scenarioTests = [
    {
      name: 'Small Batch (2 cases)',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1009' }
        ]
      }
    },
    {
      name: 'Medium Batch (5 cases)',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: Array.from({ length: 5 }, (_, i) => ({ ID: `BATCH-TEST-${i + 1}` }))
      }
    },
    {
      name: 'Case IDs with Special Characters',
      params: {
        actionID: 'pyUpdateCaseDetails',
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
          { ID: 'TEST CASE WITH SPACES-123' },
          { ID: 'CASE-WITH-DASHES_AND_UNDERSCORES' }
        ]
      }
    }
  ];

  for (const test of scenarioTests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`Batch size: ${test.params.cases.length} cases`);
      
      const startTime = Date.now();
      const result = await tool.execute(test.params);
      const endTime = Date.now();
      
      console.log(`⏱️  Processing time: ${endTime - startTime}ms`);
      console.log(`📈 Time per case: ${Math.round((endTime - startTime) / test.params.cases.length)}ms`);
      
      if (result.content && result.content[0] && result.content[0].text) {
        const responseText = result.content[0].text;
        if (responseText.includes('## Bulk Action Executed:')) {
          console.log('✅ Bulk action executed successfully');
          
          // Extract key information
          if (responseText.includes('Cases Processed: ')) {
            const countMatch = responseText.match(/Cases Processed: (\d+)/);
            if (countMatch) {
              console.log(`  Processed: ${countMatch[1]} cases`);
            }
          }
          if (responseText.includes('Execution Mode: ')) {
            const modeMatch = responseText.match(/Execution Mode: ([^\n]+)/);
            if (modeMatch) {
              console.log(`  Mode: ${modeMatch[1]}`);
            }
          }
        } else if (responseText.includes('Error performing bulk action:')) {
          console.log('✅ Bulk action failed (expected for some test cases)');
          
          // Extract error type
          if (responseText.includes('Error Type: ')) {
            const typeMatch = responseText.match(/Error Type: ([^\n]+)/);
            if (typeMatch) {
              console.log(`  Error Type: ${typeMatch[1]}`);
            }
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
    
    console.log('\n' + '-'.repeat(40) + '\n');
  }

  console.log('🔄 Perform Bulk Action Tool testing completed!\n');
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPerformBulkAction().catch(console.error);
}

export { testPerformBulkAction };
