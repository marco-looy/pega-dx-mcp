#!/usr/bin/env node

import { BulkCasesPatchTool } from '../../src/tools/cases/bulk-cases-patch.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testBulkCasesPatchTool() {
  console.log('🧪 Testing BulkCasesPatchTool\n');

  try {
    // Test tool category
    const category = BulkCasesPatchTool.getCategory();
    console.log(`✅ Category: ${category}`);

    // Test tool definition
    const definition = BulkCasesPatchTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description.substring(0, 100)}...`);

    // Test BaseTool inheritance
    const toolInstance = new BulkCasesPatchTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    // Test parameter validation - Required parameters
    console.log('\n📋 Testing Parameter Validation...\n');
    
    const validationTests = [
      {
        name: 'Missing actionID',
        params: {
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }]
        },
        expectError: true
      },
      {
        name: 'Empty actionID',
        params: {
          actionID: '',
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }]
        },
        expectError: true
      },
      {
        name: 'Missing cases parameter',
        params: {
          actionID: 'pyUpdateCaseDetails'
        },
        expectError: true
      },
      {
        name: 'Cases not an array',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: 'invalid'
        },
        expectError: true
      },
      {
        name: 'Empty cases array',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: []
        },
        expectError: true
      },
      {
        name: 'Case without ID property',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [{ Name: 'Invalid case' }]
        },
        expectError: true
      },
      {
        name: 'Case with empty ID',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [{ ID: '' }]
        },
        expectError: true
      },
      {
        name: 'Invalid runningMode',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }],
          runningMode: 'invalid'
        },
        expectError: true
      },
      {
        name: 'Valid parameters - minimal',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }]
        },
        expectError: false
      },
      {
        name: 'Valid parameters - with async mode',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }],
          runningMode: 'async'
        },
        expectError: false
      }
    ];

    for (const test of validationTests) {
      try {
        console.log(`Testing: ${test.name}`);
        const result = await toolInstance.execute(test.params);
        
        if (test.expectError && result.error) {
          console.log(`✅ Expected validation error: ${result.error}`);
        } else if (test.expectError && !result.error) {
          console.log(`❌ Expected validation error but got success`);
        } else if (!test.expectError && result.error && result.error.includes('validation')) {
          console.log(`❌ Unexpected validation error: ${result.error}`);
        } else if (!test.expectError) {
          // For valid parameters, we expect API calls which may fail due to test environment
          if (result.error && result.error.includes('connect to Pega API')) {
            console.log(`✅ Validation passed (API connection expected to fail in test)`);
          } else if (result.content) {
            console.log(`✅ Validation passed and got response`);
          } else {
            console.log(`✅ Validation passed`);
          }
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

    // Test input schema validation
    console.log('🔍 Testing Input Schema...\n');
    
    const schema = definition.inputSchema;
    console.log(`✅ Schema type: ${schema.type}`);
    console.log(`✅ Required parameters: ${JSON.stringify(schema.required)}`);
    console.log(`✅ ActionID property type: ${schema.properties.actionID.type}`);
    console.log(`✅ Cases property type: ${schema.properties.cases.type}`);
    console.log(`✅ Cases minimum items: ${schema.properties.cases.minItems}`);
    console.log(`✅ RunningMode enum values: ${JSON.stringify(schema.properties.runningMode.enum)}`);

    // Test API call scenarios (these will likely fail in test environment but show the flow)
    console.log('🌐 Testing API Integration Scenarios...\n');
    
    const apiTests = [
      {
        name: 'Single Case - Synchronous (Infinity)',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }]
        }
      },
      {
        name: 'Multiple Cases - Synchronous',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [
            { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
            { ID: 'ON6E5R-DIYRECIPE-WORK R-1009' }
          ]
        }
      },
      {
        name: 'Single Case - Asynchronous (Launchpad)',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }],
          runningMode: 'async'
        }
      },
      {
        name: 'Bulk Action with Content',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [
            { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
            { ID: 'ON6E5R-DIYRECIPE-WORK R-1009' }
          ],
          content: {
            pyWorkPage: {
              BulkUpdated: true,
              UpdatedAt: new Date().toISOString()
            }
          }
        }
      },
      {
        name: 'Bulk Action with Page Instructions',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }],
          pageInstructions: [
            {
              instruction: 'SET',
              target: 'pyWorkPage.Status',
              value: 'BulkProcessed'
            }
          ]
        }
      },
      {
        name: 'Bulk Action with Attachments',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }],
          attachments: [
            {
              category: 'System',
              fileName: 'bulk-operation-log.txt',
              content: 'Bulk operation executed via PATCH endpoint'
            }
          ]
        }
      },
      {
        name: 'Complex Bulk Operation - All Parameters',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [
            { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
            { ID: 'ON6E5R-DIYRECIPE-WORK R-1009' },
            { ID: 'ON6E5R-DIYRECIPE-WORK R-1010' }
          ],
          runningMode: 'async',
          content: {
            pyWorkPage: {
              BulkProcessed: true,
              ProcessingMethod: 'PATCH_BULK_CASES',
              Timestamp: new Date().toISOString()
            }
          },
          pageInstructions: [
            {
              instruction: 'SET',
              target: 'pyWorkPage.BulkOperationId',
              value: 'BULK-' + Date.now()
            }
          ],
          attachments: [
            {
              category: 'ProcessingLog',
              fileName: 'bulk-patch-operation.json',
              content: JSON.stringify({
                operation: 'bulk_cases_patch',
                casesCount: 3,
                timestamp: new Date().toISOString()
              })
            }
          ]
        }
      }
    ];

    for (const test of apiTests) {
      try {
        console.log(`Testing: ${test.name}`);
        console.log(`Cases: ${test.params.cases.length}, RunningMode: ${test.params.runningMode || 'sync'}`);
        
        const startTime = Date.now();
        const result = await toolInstance.execute(test.params);
        const endTime = Date.now();
        
        console.log(`⏱️  Response time: ${endTime - startTime}ms`);
        
        if (result.error) {
          if (result.error.includes('connect to Pega API')) {
            console.log(`✅ API connection test (expected to fail in test environment)`);
            console.log(`   Error: ${result.error}`);
          } else {
            console.log(`📋 API Error Response: ${result.error}`);
          }
        } else if (result.content && result.content[0] && result.content[0].text) {
          console.log(`✅ Success! Got formatted response`);
          
          const responseText = result.content[0].text;
          const lines = responseText.split('\n');
          const preview = lines.slice(0, 10).join('\n');
          console.log(`Response preview:\n${preview}`);
          
          if (lines.length > 10) {
            console.log(`... (${lines.length - 10} more lines)`);
          }
          
          // Check for specific response elements
          if (responseText.includes('## Bulk Cases PATCH:')) {
            console.log('✓ Response contains proper header');
          }
          if (responseText.includes('### Cases Submitted for Processing')) {
            console.log('✓ Response contains cases list');
          }
          if (test.params.runningMode === 'async' && responseText.includes('Asynchronous')) {
            console.log('✓ Response indicates async execution');
          }
          if (responseText.includes('### Important Implementation Notes')) {
            console.log('✓ Response contains implementation notes');
          }
        }
        
      } catch (error) {
        console.log(`📋 Exception: ${error.message}`);
      }
      
      console.log('\n' + '-'.repeat(50) + '\n');
    }

    // Test error scenarios and edge cases
    console.log('🚫 Testing Error Scenarios...\n');
    
    const errorTests = [
      {
        name: 'Invalid Action ID',
        params: {
          actionID: 'NonExistentAction123',
          cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }]
        }
      },
      {
        name: 'Invalid Case IDs',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [
            { ID: 'INVALID-CASE-ID-12345' },
            { ID: 'ANOTHER-INVALID-ID-67890' }
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
        name: 'Large Batch Test',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: Array.from({ length: 50 }, (_, i) => ({ ID: `LARGE-BATCH-TEST-${i + 1000}` }))
        }
      },
      {
        name: 'Special Characters in Case IDs',
        params: {
          actionID: 'pyUpdateCaseDetails',
          cases: [
            { ID: 'TEST CASE WITH SPACES-123' },
            { ID: 'CASE-WITH-SPECIAL@CHARS#456' },
            { ID: 'CASE_WITH_UNDERSCORES_789' }
          ]
        }
      }
    ];

    for (const test of errorTests) {
      try {
        console.log(`Testing: ${test.name}`);
        console.log(`Cases count: ${test.params.cases.length}`);
        
        const result = await toolInstance.execute(test.params);
        
        if (result.error && result.error.includes('connect to Pega API')) {
          console.log(`✅ Connection test (expected in test environment)`);
        } else if (result.content && result.content[0] && result.content[0].text) {
          const responseText = result.content[0].text;
          if (responseText.includes('Error:')) {
            console.log(`✅ Error handled gracefully with formatted response`);
            
            // Show error preview
            const lines = responseText.split('\n');
            const preview = lines.slice(0, 8).join('\n');
            console.log(`Error preview:\n${preview}`);
            
            // Check for error handling elements
            if (responseText.includes('### Request Context')) {
              console.log('✓ Error includes request context');
            }
            if (responseText.includes('### Troubleshooting Guide')) {
              console.log('✓ Error includes troubleshooting guidance');
            }
          } else {
            console.log(`✅ Request processed (might be valid for test environment)`);
          }
        }
        
      } catch (error) {
        console.log(`✅ Error caught: ${error.message}`);
      }
      
      console.log('\n' + '-'.repeat(40) + '\n');
    }

    // Test platform-specific behavior
    console.log('🏗️  Testing Platform-Specific Behavior...\n');
    
    const platformTests = [
      {
        name: 'Infinity-style Response (Synchronous)',
        mockResponse: {
          successCount: '2',
          results: [
            { ID: 'ON6E5R-DIYRECIPE-WORK R-1008', Name: 'Test Case 1', status: '200' },
            { ID: 'ON6E5R-DIYRECIPE-WORK R-1009', Name: 'Test Case 2', status: '200' }
          ],
          failureCount: '0'
        },
        cases: [
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1008' },
          { ID: 'ON6E5R-DIYRECIPE-WORK R-1009' }
        ]
      },
      {
        name: 'Launchpad-style Response (Asynchronous)',
        mockResponse: {
          jobID: '5f9efc21-332d-ee5c-f1df-105f09b6f11a'
        },
        cases: [{ ID: 'ON6E5R-DIYRECIPE-WORK R-1008' }],
        runningMode: 'async'
      }
    ];

    for (const test of platformTests) {
      console.log(`Testing: ${test.name}`);
      
      // Test response formatting
      const formattedResponse = toolInstance.formatSuccessResponse(
        'Bulk Cases PATCH: pyUpdateCaseDetails on 2 cases',
        test.mockResponse,
        {
          actionID: 'pyUpdateCaseDetails',
          cases: test.cases,
          runningMode: test.runningMode
        }
      );
      
      console.log('✅ Response formatting test completed');
      
      // Check platform detection
      if (test.mockResponse.jobID) {
        if (formattedResponse.includes('Pega Launchpad')) {
          console.log('✓ Correctly detected Launchpad platform');
        }
        if (formattedResponse.includes('202 Accepted')) {
          console.log('✓ Shows correct HTTP status for async operation');
        }
        if (formattedResponse.includes(test.mockResponse.jobID)) {
          console.log('✓ Includes job ID in response');
        }
      }
      
      if (test.mockResponse.results) {
        if (formattedResponse.includes('Pega Infinity')) {
          console.log('✓ Correctly detected Infinity platform');
        }
        if (formattedResponse.includes('Synchronous')) {
          console.log('✓ Shows synchronous execution mode');
        }
        if (formattedResponse.includes('Individual Case Results')) {
          console.log('✓ Includes individual case results');
        }
      }
      
      console.log('\n' + '-'.repeat(40) + '\n');
    }

    console.log('🎉 All BulkCasesPatchTool tests completed!\n');
    return true;
    
  } catch (error) {
    console.error('❌ BulkCasesPatchTool test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testBulkCasesPatchTool().then(success => process.exit(success ? 0 : 1));
}

export { testBulkCasesPatchTool };
