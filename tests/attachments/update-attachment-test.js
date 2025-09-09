#!/usr/bin/env node
import 'dotenv/config';

import { UpdateAttachmentTool } from '../../src/tools/attachments/update-attachment.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testUpdateAttachmentTool() {
  console.log('🧪 Testing UpdateAttachmentTool\n');

  try {
    // Test tool category
    const category = UpdateAttachmentTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'attachments') {
      throw new Error(`Expected category 'attachments', got '${category}'`);
    }

    // Test tool definition
    const definition = UpdateAttachmentTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description length: ${definition.description.length} characters`);
    
    if (definition.name !== 'update_attachment') {
      throw new Error(`Expected tool name 'update_attachment', got '${definition.name}'`);
    }

    // Test required parameters
    const requiredParams = definition.inputSchema.required;
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    const expectedParams = ['attachmentID', 'name', 'category'];
    expectedParams.forEach(param => {
      if (!requiredParams.includes(param)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    });

    // Test parameter properties
    const properties = definition.inputSchema.properties;
    expectedParams.forEach(param => {
      if (!properties[param]) {
        throw new Error(`Missing property definition for parameter: ${param}`);
      }
      if (!properties[param].description) {
        throw new Error(`Missing description for parameter: ${param}`);
      }
    });
    console.log(`✅ All parameter properties defined`);

    // Test BaseTool inheritance
    const toolInstance = new UpdateAttachmentTool();
    const isBaseTool = toolInstance instanceof BaseTool;
    console.log(`✅ Extends BaseTool: ${isBaseTool}`);
    
    if (!isBaseTool) {
      throw new Error('UpdateAttachmentTool must extend BaseTool');
    }

    // Test required parameter validation
    const emptyParamsTest = toolInstance.validateRequiredParams({}, ['attachmentID', 'name', 'category']);
    console.log(`✅ Required validation works: ${!!emptyParamsTest}`);

    // Test parameter validation method
    if (typeof toolInstance.validateParameters !== 'function') {
      throw new Error('validateParameters method is required');
    }

    // Test valid parameters
    const validResult = toolInstance.validateParameters(
      'LINK-ATTACHMENT TEST-WORK T-1001!20240101T120000.000 GMT',
      'Updated Document Name',
      'Document'
    );
    console.log(`✅ Valid parameters accepted: ${validResult.valid}`);
    
    if (!validResult.valid) {
      throw new Error('Valid parameters should be accepted');
    }

    // Test invalid attachment ID (empty)
    const invalidAttachmentIdResult = toolInstance.validateParameters('', 'Valid Name', 'Valid Category');
    console.log(`✅ Invalid attachment ID rejected: ${!invalidAttachmentIdResult.valid}`);
    
    if (invalidAttachmentIdResult.valid) {
      throw new Error('Empty attachment ID should be rejected');
    }

    // Test invalid attachment ID (wrong format)
    const wrongFormatResult = toolInstance.validateParameters('WRONG-FORMAT', 'Valid Name', 'Valid Category');
    console.log(`✅ Wrong format attachment ID rejected: ${!wrongFormatResult.valid}`);
    
    if (wrongFormatResult.valid) {
      throw new Error('Wrong format attachment ID should be rejected');
    }

    // Test invalid name (empty)
    const invalidNameResult = toolInstance.validateParameters(
      'LINK-ATTACHMENT TEST-WORK T-1001!20240101T120000.000 GMT',
      '',
      'Valid Category'
    );
    console.log(`✅ Invalid name rejected: ${!invalidNameResult.valid}`);
    
    if (invalidNameResult.valid) {
      throw new Error('Empty name should be rejected');
    }

    // Test invalid category (empty)
    const invalidCategoryResult = toolInstance.validateParameters(
      'LINK-ATTACHMENT TEST-WORK T-1001!20240101T120000.000 GMT',
      'Valid Name',
      ''
    );
    console.log(`✅ Invalid category rejected: ${!invalidCategoryResult.valid}`);
    
    if (invalidCategoryResult.valid) {
      throw new Error('Empty category should be rejected');
    }

    // Test formatSuccessResponse method
    if (typeof toolInstance.formatSuccessResponse !== 'function') {
      throw new Error('formatSuccessResponse method is required');
    }

    const mockSuccessData = {
      data: { message: 'Attachment edited successfully' }
    };
    const mockOptions = {
      attachmentID: 'LINK-ATTACHMENT TEST-WORK T-1001!20240101T120000.000 GMT',
      name: 'Updated Document',
      category: 'Document'
    };

    const successResponse = toolInstance.formatSuccessResponse(
      'Test Update Operation',
      mockSuccessData,
      mockOptions
    );
    
    console.log(`✅ Success response formatted (${successResponse.length} characters)`);
    
    if (!successResponse.includes('Updated Document')) {
      throw new Error('Success response should include updated name');
    }
    if (!successResponse.includes('Document')) {
      throw new Error('Success response should include category');
    }

    // Test formatErrorResponse method
    if (typeof toolInstance.formatErrorResponse !== 'function') {
      throw new Error('formatErrorResponse method is required');
    }

    const mockError = {
      type: 'NOT_FOUND',
      message: 'Attachment not found',
      details: 'The attachment cannot be found',
      status: 404,
      statusText: 'Not Found'
    };

    const errorResponse = toolInstance.formatErrorResponse('Test Update Operation', mockError);
    console.log(`✅ Error response formatted (${errorResponse.length} characters)`);
    
    if (!errorResponse.includes('NOT_FOUND')) {
      throw new Error('Error response should include error type');
    }
    if (!errorResponse.includes('Solutions')) {
      throw new Error('Error response should include solutions');
    }

    // Test method availability
    const requiredMethods = ['execute', 'validateParameters', 'formatSuccessResponse', 'formatErrorResponse'];
    requiredMethods.forEach(method => {
      if (typeof toolInstance[method] !== 'function') {
        throw new Error(`Missing required method: ${method}`);
      }
    });
    console.log(`✅ All required methods available`);

    // Test static methods
    if (typeof UpdateAttachmentTool.getCategory !== 'function') {
      throw new Error('Static method getCategory is required');
    }
    if (typeof UpdateAttachmentTool.getDefinition !== 'function') {
      throw new Error('Static method getDefinition is required');
    }
    console.log(`✅ Static methods available`);

    console.log('\n🎉 All UpdateAttachmentTool tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('- ✅ Tool category and inheritance verified');
    console.log('- ✅ Tool definition and schema validated');
    console.log('- ✅ Parameter validation logic tested');
    console.log('- ✅ Response formatting methods verified');
    console.log('- ✅ Error handling capabilities confirmed');
    console.log('- ✅ BaseTool integration working');
    
    console.log('\n🔄 Ready for integration testing with:');
    console.log('- Registry auto-discovery');
    console.log('- MCP protocol compliance');
    console.log('- Live Pega API calls');
    
    return true;
  } catch (error) {
    console.error('❌ UpdateAttachmentTool test failed:', error.message);
    return false;
  }
}

// Execute test if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testUpdateAttachmentTool().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testUpdateAttachmentTool };
