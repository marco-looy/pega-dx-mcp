#!/usr/bin/env node
import 'dotenv/config';

import { DeleteAttachmentTool } from '../../src/tools/attachments/delete-attachment.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testDeleteAttachmentTool() {
  console.log('🧪 Testing DeleteAttachmentTool\n');

  try {
    // Test tool category
    const category = DeleteAttachmentTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'attachments') {
      throw new Error(`Expected category 'attachments', got '${category}'`);
    }

    // Test tool definition
    const definition = DeleteAttachmentTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    if (definition.name !== 'delete_attachment') {
      throw new Error(`Expected tool name 'delete_attachment', got '${definition.name}'`);
    }

    // Verify tool description
    if (!definition.description || !definition.description.includes('Remove the specified attachment')) {
      throw new Error('Tool description is missing or invalid');
    }
    console.log('✅ Tool description is properly defined');

    // Test input schema
    const schema = definition.inputSchema;
    if (!schema || !schema.properties || !schema.properties.attachmentID) {
      throw new Error('Input schema is missing or invalid');
    }
    console.log('✅ Input schema has required attachmentID parameter');

    // Verify required parameters
    if (!schema.required || !schema.required.includes('attachmentID')) {
      throw new Error('attachmentID should be marked as required');
    }
    console.log('✅ attachmentID is marked as required parameter');

    // Test BaseTool inheritance
    const toolInstance = new DeleteAttachmentTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('DeleteAttachmentTool should extend BaseTool');
    }

    // Test parameter validation - missing required parameter
    const missingParamTest = toolInstance.validateRequiredParams({}, ['attachmentID']);
    if (!missingParamTest || !missingParamTest.error) {
      throw new Error('Should detect missing required parameter');
    }
    console.log('✅ Required parameter validation works');

    // Test parameter validation - valid attachment ID
    const validParams = { attachmentID: 'LINK-ATTACHMENT ONNS8O-TESTAPP-WORK B-2001!20211115T061748.900 GMT' };
    const validParamTest = toolInstance.validateRequiredParams(validParams, ['attachmentID']);
    if (validParamTest) {
      throw new Error('Should not error on valid parameters');
    }
    console.log('✅ Valid parameter validation works');

    // Test attachment ID format validation
    const invalidFormatTest = toolInstance.validateParameters('invalid-attachment-id');
    if (invalidFormatTest.valid) {
      throw new Error('Should detect invalid attachment ID format');
    }
    console.log('✅ Attachment ID format validation works');

    // Test valid attachment ID format validation
    const validFormatTest = toolInstance.validateParameters('LINK-ATTACHMENT ONNS8O-TESTAPP-WORK B-2001!20211115T061748.900 GMT');
    if (!validFormatTest.valid) {
      throw new Error('Should accept valid attachment ID format');
    }
    console.log('✅ Valid attachment ID format validation works');

    // Test attachment ID parsing helper
    const attachmentInfo = toolInstance.parseAttachmentID('LINK-ATTACHMENT ONNS8O-TESTAPP-WORK B-2001!20211115T061748.900 GMT');
    if (!attachmentInfo.caseReference || !attachmentInfo.timestamp) {
      throw new Error('Should parse attachment ID components');
    }
    console.log('✅ Attachment ID parsing helper works');

    // Test success response formatting
    const successResponse = toolInstance.formatSuccessResponse(
      'Delete Attachment Test',
      {},
      { attachmentID: 'LINK-ATTACHMENT ONNS8O-TESTAPP-WORK B-2001!20211115T061748.900 GMT' }
    );
    if (!successResponse.includes('Attachment Successfully Deleted') || 
        !successResponse.includes('Related Operations')) {
      throw new Error('Success response formatting is incomplete');
    }
    console.log('✅ Success response formatting works');

    // Test error response formatting
    const testError = {
      type: 'FORBIDDEN',
      message: 'Insufficient delete permissions',
      details: 'User is not allowed to delete this attachment'
    };
    const errorResponse = toolInstance.formatErrorResponse(
      'LINK-ATTACHMENT ONNS8O-TESTAPP-WORK B-2001!20211115T061748.900 GMT',
      testError
    );
    if (!errorResponse.includes('Error Deleting Attachment') || 
        !errorResponse.includes('FORBIDDEN') ||
        !errorResponse.includes('Check Delete Permissions')) {
      throw new Error('Error response formatting is incomplete');
    }
    console.log('✅ Error response formatting works');

    // Test empty/null attachment ID validation
    const emptyTest = toolInstance.validateParameters('');
    if (emptyTest.valid) {
      throw new Error('Should reject empty attachment ID');
    }
    console.log('✅ Empty attachment ID validation works');

    const nullTest = toolInstance.validateParameters(null);
    if (nullTest.valid) {
      throw new Error('Should reject null attachment ID');
    }
    console.log('✅ Null attachment ID validation works');

    console.log('\n🎉 All DeleteAttachmentTool tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   - Tool category and definition verified');
    console.log('   - Input schema validation confirmed');
    console.log('   - BaseTool inheritance working');
    console.log('   - Parameter validation functioning');
    console.log('   - Attachment ID format validation operational');
    console.log('   - Response formatting verified');
    console.log('   - Helper methods functional');
    console.log('\n💡 Note: This tests the tool class only. API integration');
    console.log('   requires a live Pega instance with valid attachments.');

    return true;
  } catch (error) {
    console.error('\n❌ DeleteAttachmentTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDeleteAttachmentTool().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testDeleteAttachmentTool };
