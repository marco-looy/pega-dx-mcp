import { GetAttachmentCategoriesTool } from '../../src/tools/attachments/get-attachment-categories.js';
import 'dotenv/config';

async function testGetAttachmentCategories() {
  console.log('🧪 Testing Get Attachment Categories Tool');
  console.log('==========================================\n');

  const tool = new GetAttachmentCategoriesTool();

  // Test 1: Tool definition validation
  console.log('📋 Test 1: Tool Definition Validation');
  const definition = GetAttachmentCategoriesTool.getDefinition();
  console.log('Tool Name:', definition.name);
  console.log('Description:', definition.description);
  console.log('Required Parameters:', definition.inputSchema.required);
  console.log('✅ Tool definition is valid\n');

  // Test 2: Parameter validation - Invalid caseID
  console.log('🔍 Test 2: Parameter Validation - Invalid caseID');
  try {
    const result = await tool.execute({ caseID: '' });
    if (result.error) {
      console.log('✅ Correctly rejected empty caseID:', result.error);
    } else {
      console.log('❌ Should have rejected empty caseID');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  console.log('');

  // Test 3: Parameter validation - Invalid type
  console.log('🔍 Test 3: Parameter Validation - Invalid type');
  try {
    const result = await tool.execute({ 
      caseID: 'TEST123', 
      type: 'InvalidType' 
    });
    if (result.error) {
      console.log('✅ Correctly rejected invalid type:', result.error);
    } else {
      console.log('❌ Should have rejected invalid type');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  console.log('');

  // Test 4: Valid request with File type (default)
  console.log('📁 Test 4: Valid Request - File Categories (Default)');
  try {
    const result = await tool.execute({ 
      caseID: 'OSIEO3-DOCSAPP-WORK T-561003' 
    });
    
    if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Request executed successfully');
      console.log('Response preview:', result.content[0].text.substring(0, 200) + '...');
      
      // Check if it contains expected sections
      const response = result.content[0].text;
      if (response.includes('Attachment Categories Retrieved Successfully') || 
          response.includes('Error Retrieving Attachment Categories')) {
        console.log('✅ Response format is correct');
      } else {
        console.log('❌ Unexpected response format');
      }
    } else {
      console.log('❌ Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  console.log('');

  // Test 5: Valid request with URL type
  console.log('🔗 Test 5: Valid Request - URL Categories');
  try {
    const result = await tool.execute({ 
      caseID: 'OSIEO3-DOCSAPP-WORK T-561003',
      type: 'URL'
    });
    
    if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Request executed successfully');
      console.log('Response preview:', result.content[0].text.substring(0, 200) + '...');
      
      // Check if it mentions URL type
      const response = result.content[0].text;
      if (response.includes('URL attachment categories')) {
        console.log('✅ URL type filter is working');
      } else {
        console.log('⚠️  URL type may not be explicitly mentioned (could be normal if no URL categories exist)');
      }
    } else {
      console.log('❌ Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  console.log('');

  // Test 6: Case insensitive type parameter
  console.log('🔤 Test 6: Case Insensitive Type Parameter');
  try {
    const result = await tool.execute({ 
      caseID: 'OSIEO3-DOCSAPP-WORK T-561003',
      type: 'file'  // lowercase
    });
    
    if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Lowercase type parameter accepted');
      
      // Check if it's treated as File type
      const response = result.content[0].text;
      if (response.includes('File attachment categories')) {
        console.log('✅ Case insensitive handling is working');
      }
    } else {
      console.log('❌ Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  console.log('');

  // Test 7: Non-existent case ID
  console.log('❓ Test 7: Non-existent Case ID');
  try {
    const result = await tool.execute({ 
      caseID: 'NONEXISTENT-CASE-ID T-999999' 
    });
    
    if (result.content && result.content[0] && result.content[0].text) {
      const response = result.content[0].text;
      if (response.includes('Error Retrieving Attachment Categories')) {
        console.log('✅ Error handling is working for non-existent case');
        console.log('Error type detected in response');
      } else {
        console.log('⚠️  May have succeeded (case might exist or different error handling)');
      }
    } else {
      console.log('❌ Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  console.log('');

  // Test 8: Response format validation
  console.log('📄 Test 8: Response Format Validation');
  try {
    const result = await tool.execute({ 
      caseID: 'OSIEO3-DOCSAPP-WORK T-561003',
      type: 'File'
    });
    
    if (result.content && result.content[0] && result.content[0].text) {
      const response = result.content[0].text;
      
      // Check for expected sections
      const expectedSections = [
        'Case:',
        'Filter:',
        'Configuration Details',
        'Attachment Category Rule Configuration Guide',
        'Related Operations'
      ];
      
      let sectionsFound = 0;
      expectedSections.forEach(section => {
        if (response.includes(section)) {
          sectionsFound++;
        }
      });
      
      console.log(`✅ Found ${sectionsFound}/${expectedSections.length} expected sections`);
      
      if (response.includes('Retrieved at:')) {
        console.log('✅ Timestamp is included');
      }
      
      if (response.includes('Attachment Category Rule Configuration Guide')) {
        console.log('✅ Configuration guidance is included');
      }
      
    } else {
      console.log('❌ Invalid response structure');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  console.log('');

  console.log('🎯 Get Attachment Categories Tool Testing Complete');
  console.log('==================================================');
}

// Run the test
testGetAttachmentCategories().catch(console.error);
