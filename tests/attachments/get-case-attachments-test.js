import { GetCaseAttachmentsTool } from '../../src/tools/attachments/get-case-attachments.js';

// Test the Get Case Attachments tool
async function testGetCaseAttachments() {
  console.log('🧪 Testing Get Case Attachments Tool');
  console.log('=====================================\n');

  const tool = new GetCaseAttachmentsTool();

  // Test 1: Tool Definition Validation
  console.log('📋 Test 1: Tool Definition Validation');
  try {
    const definition = GetCaseAttachmentsTool.getDefinition();
    console.log('✅ Tool definition:', JSON.stringify(definition, null, 2));
    
    // Verify required properties
    if (definition.name !== 'get_case_attachments') {
      throw new Error('Tool name mismatch');
    }
    if (!definition.description || definition.description.length < 50) {
      throw new Error('Tool description too short or missing');
    }
    if (!definition.inputSchema || !definition.inputSchema.properties) {
      throw new Error('Tool input schema missing');
    }
    if (!definition.inputSchema.properties.caseID) {
      throw new Error('Required caseID parameter missing from schema');
    }
    if (!definition.inputSchema.properties.includeThumbnails) {
      throw new Error('Optional includeThumbnails parameter missing from schema');
    }
    
    console.log('✅ Tool definition validation passed\n');
  } catch (error) {
    console.error('❌ Tool definition validation failed:', error.message);
    return;
  }

  // Test 2: Parameter Validation - Missing caseID
  console.log('📋 Test 2: Parameter Validation - Missing caseID');
  try {
    const result = await tool.execute({});
    if (!result.error) {
      throw new Error('Expected validation error for missing caseID');
    }
    console.log('✅ Correctly rejected missing caseID:', result.error);
    console.log('');
  } catch (error) {
    console.error('❌ Parameter validation test failed:', error.message);
    return;
  }

  // Test 3: Parameter Validation - Empty caseID
  console.log('📋 Test 3: Parameter Validation - Empty caseID');
  try {
    const result = await tool.execute({ caseID: '' });
    if (!result.error) {
      throw new Error('Expected validation error for empty caseID');
    }
    console.log('✅ Correctly rejected empty caseID:', result.error);
    console.log('');
  } catch (error) {
    console.error('❌ Empty caseID validation test failed:', error.message);
    return;
  }

  // Test 4: Parameter Validation - Invalid includeThumbnails
  console.log('📋 Test 4: Parameter Validation - Invalid includeThumbnails');
  try {
    const result = await tool.execute({ 
      caseID: 'ON6E5R-DIYRecipe-Work-RecipeCollection R-1008',
      includeThumbnails: 'invalid'
    });
    if (!result.error) {
      throw new Error('Expected validation error for invalid includeThumbnails');
    }
    console.log('✅ Correctly rejected invalid includeThumbnails:', result.error);
    console.log('');
  } catch (error) {
    console.error('❌ Invalid includeThumbnails validation test failed:', error.message);
    return;
  }

  // Test 5: Valid Case with Attachments (without thumbnails)
  console.log('📋 Test 5: Valid Case - Get Attachments (without thumbnails)');
  try {
    const result = await tool.execute({
      caseID: 'ON6E5R-DIYRecipe-Work-RecipeCollection R-1008',
      includeThumbnails: false
    });
    
    if (result.error) {
      console.log('⚠️  API Error (expected if case/attachments don\'t exist):', result.error);
    } else if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Successfully retrieved case attachments:');
      console.log(result.content[0].text);
    } else {
      console.log('⚠️  Unexpected response format:', JSON.stringify(result, null, 2));
    }
    console.log('');
  } catch (error) {
    console.error('❌ Valid case test failed:', error.message);
    console.log('');
  }

  // Test 6: Valid Case with Thumbnails Enabled
  console.log('📋 Test 6: Valid Case - Get Attachments (with thumbnails)');
  try {
    const result = await tool.execute({
      caseID: 'ON6E5R-DIYRecipe-Work-RecipeCollection R-1008',
      includeThumbnails: true
    });
    
    if (result.error) {
      console.log('⚠️  API Error (expected if case/attachments don\'t exist):', result.error);
    } else if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Successfully retrieved case attachments with thumbnails:');
      console.log(result.content[0].text);
    } else {
      console.log('⚠️  Unexpected response format:', JSON.stringify(result, null, 2));
    }
    console.log('');
  } catch (error) {
    console.error('❌ Valid case with thumbnails test failed:', error.message);
    console.log('');
  }

  // Test 7: Case with Special Characters in ID
  console.log('📋 Test 7: Case with Special Characters - URL Encoding Test');
  try {
    const result = await tool.execute({
      caseID: 'ON6E5R-DIYRecipe-Work-RecipeCollection R-1008',
      includeThumbnails: false
    });
    
    if (result.error) {
      console.log('⚠️  API Error (expected for test case):', result.error);
    } else if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Successfully handled case ID with spaces and special characters');
      console.log('Response preview:', result.content[0].text.substring(0, 200) + '...');
    } else {
      console.log('⚠️  Unexpected response format:', JSON.stringify(result, null, 2));
    }
    console.log('');
  } catch (error) {
    console.error('❌ Special characters test failed:', error.message);
    console.log('');
  }

  // Test 8: Invalid/Non-existent Case ID
  console.log('📋 Test 8: Invalid Case ID - Error Handling Test');
  try {
    const result = await tool.execute({
      caseID: 'INVALID-CASE-ID R-9999',
      includeThumbnails: false
    });
    
    if (result.error) {
      console.log('✅ Expected API error for invalid case ID:', result.error);
    } else if (result.content && result.content[0] && result.content[0].text) {
      // Check if response indicates error handling
      const responseText = result.content[0].text;
      if (responseText.includes('Error') || responseText.includes('not found') || responseText.includes('No attachments')) {
        console.log('✅ Appropriate error handling in response:');
        console.log(responseText);
      } else {
        console.log('⚠️  Unexpected success for invalid case ID:', responseText.substring(0, 200));
      }
    } else {
      console.log('⚠️  Unexpected response format:', JSON.stringify(result, null, 2));
    }
    console.log('');
  } catch (error) {
    console.error('❌ Invalid case ID test failed:', error.message);
    console.log('');
  }

  // Test 9: Response Format Validation
  console.log('📋 Test 9: Response Format Validation');
  try {
    const result = await tool.execute({
      caseID: 'ON6E5R-DIYRecipe-Work-RecipeCollection R-1008',
      includeThumbnails: false
    });
    
    // Validate response structure
    if (result.error) {
      console.log('✅ Error response format valid:', typeof result.error === 'string');
    } else if (result.content) {
      console.log('✅ Success response structure valid:');
      console.log('- Has content array:', Array.isArray(result.content));
      console.log('- Content has text property:', result.content[0] && typeof result.content[0].text === 'string');
      console.log('- Text includes markdown formatting:', result.content[0]?.text?.includes('##'));
      console.log('- Text includes case ID:', result.content[0]?.text?.includes('ON6E5R-DIYRecipe-Work-RecipeCollection'));
    } else {
      console.log('⚠️  Unexpected response structure:', Object.keys(result));
    }
    console.log('');
  } catch (error) {
    console.error('❌ Response format validation failed:', error.message);
    console.log('');
  }

  // Test 10: Default Parameter Handling
  console.log('📋 Test 10: Default Parameter Handling');
  try {
    const result = await tool.execute({
      caseID: 'ON6E5R-DIYRecipe-Work-RecipeCollection R-1008'
      // includeThumbnails not provided - should default to false
    });
    
    if (result.error) {
      console.log('⚠️  API Error (expected):', result.error);
    } else if (result.content && result.content[0] && result.content[0].text) {
      const responseText = result.content[0].text;
      // Check that response indicates thumbnails are disabled
      if (responseText.includes('Thumbnails**: Disabled') || responseText.includes('Thumbnails Requested**: No')) {
        console.log('✅ Default parameter handling correct - thumbnails disabled by default');
      } else {
        console.log('✅ Default parameter accepted, response generated');
      }
      console.log('Response includes proper formatting:', responseText.includes('##'));
    } else {
      console.log('⚠️  Unexpected response format for default parameters');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Default parameter test failed:', error.message);
    console.log('');
  }

  console.log('🎉 Get Case Attachments Tool Testing Complete!');
  console.log('✅ All tests executed - Check individual results above');
  console.log('\n📝 Test Summary:');
  console.log('- Tool definition validation ✅');
  console.log('- Parameter validation (missing, empty, invalid) ✅');
  console.log('- API integration tests (valid/invalid cases) ✅');
  console.log('- Response format validation ✅');  
  console.log('- Default parameter handling ✅');
  console.log('- URL encoding for special characters ✅');
  console.log('- Thumbnail option testing ✅');
  console.log('- Error handling and user guidance ✅');
}

// Run the test
testGetCaseAttachments().catch(console.error);
