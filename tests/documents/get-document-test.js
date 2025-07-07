#!/usr/bin/env node

import { GetDocumentTool } from '../../src/tools/documents/get-document.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetDocumentTool() {
  console.log('🧪 Testing GetDocumentTool\n');

  try {
    // Test tool category
    const category = GetDocumentTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'documents') {
      throw new Error(`Expected category 'documents', got '${category}'`);
    }

    // Test tool definition
    const definition = GetDocumentTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    
    if (definition.name !== 'get_document') {
      throw new Error(`Expected tool name 'get_document', got '${definition.name}'`);
    }

    // Verify required schema properties
    if (!definition.description) {
      throw new Error('Tool definition missing description');
    }
    
    if (!definition.inputSchema) {
      throw new Error('Tool definition missing inputSchema');
    }
    
    if (!definition.inputSchema.properties || !definition.inputSchema.properties.documentID) {
      throw new Error('Tool definition missing documentID property');
    }
    
    if (!definition.inputSchema.required || !definition.inputSchema.required.includes('documentID')) {
      throw new Error('Tool definition missing required documentID');
    }

    console.log('✅ Tool definition structure valid');

    // Test BaseTool inheritance
    const toolInstance = new GetDocumentTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('GetDocumentTool does not extend BaseTool');
    }

    // Test required parameter validation
    const requiredTest = toolInstance.validateRequiredParams({}, ['documentID']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);
    
    if (!requiredTest.error) {
      throw new Error('Required parameter validation should fail for missing documentID');
    }

    // Test required parameter validation with valid input
    const validRequiredTest = toolInstance.validateRequiredParams({ documentID: 'test-doc-123' }, ['documentID']);
    console.log(`✅ Required validation passes with valid input: ${!validRequiredTest}`);
    
    if (validRequiredTest) {
      throw new Error('Required parameter validation should pass for valid documentID');
    }

    // Test parameter validation method
    const validationResult = toolInstance.validateParameters('test-document-id');
    console.log(`✅ Parameter validation works: ${validationResult.valid}`);
    
    if (!validationResult.valid) {
      throw new Error('Parameter validation should pass for valid documentID');
    }

    // Test parameter validation with invalid input
    const invalidValidationResult = toolInstance.validateParameters('');
    console.log(`✅ Parameter validation rejects empty string: ${!invalidValidationResult.valid}`);
    
    if (invalidValidationResult.valid) {
      throw new Error('Parameter validation should fail for empty documentID');
    }

    // Test parameter validation with null
    const nullValidationResult = toolInstance.validateParameters(null);
    console.log(`✅ Parameter validation rejects null: ${!nullValidationResult.valid}`);
    
    if (nullValidationResult.valid) {
      throw new Error('Parameter validation should fail for null documentID');
    }

    // Test formatSuccessResponse method
    const mockData = {
      data: 'VGVzdCBkb2N1bWVudCBjb250ZW50IGluIGJhc2U2NA==', // "Test document content in base64" in base64
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="test-document.pdf"',
        'content-transfer-encoding': 'base64',
        'cache-control': 'no-store'
      }
    };
    
    const formattedResponse = toolInstance.formatSuccessResponse(
      'Document Content: test-doc-123',
      mockData,
      { documentID: 'test-doc-123' }
    );
    
    console.log('✅ formatSuccessResponse method works');
    
    if (!formattedResponse.includes('Document Content: test-doc-123')) {
      throw new Error('formatSuccessResponse should include operation title');
    }
    
    if (!formattedResponse.includes('test-doc-123')) {
      throw new Error('formatSuccessResponse should include document ID');
    }
    
    if (!formattedResponse.includes('test-document.pdf')) {
      throw new Error('formatSuccessResponse should parse filename from headers');
    }
    
    if (!formattedResponse.includes('Base64 encoded document')) {
      throw new Error('formatSuccessResponse should indicate base64 content type');
    }

    // Test formatErrorResponse method
    const mockError = {
      type: 'NOT_FOUND',
      message: 'Document not found',
      details: 'The document cannot be found',
      status: 404,
      statusText: 'Not Found'
    };
    
    const formattedError = toolInstance.formatErrorResponse('test-doc-123', mockError);
    console.log('✅ formatErrorResponse method works');
    
    if (!formattedError.includes('Error Retrieving Document Content')) {
      throw new Error('formatErrorResponse should include error title');
    }
    
    if (!formattedError.includes('test-doc-123')) {
      throw new Error('formatErrorResponse should include document ID');
    }
    
    if (!formattedError.includes('NOT_FOUND')) {
      throw new Error('formatErrorResponse should include error type');
    }
    
    if (!formattedError.includes('Document not found')) {
      throw new Error('formatErrorResponse should include error message');
    }

    // Test that tool has the required methods
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('GetDocumentTool missing execute method');
    }
    
    if (typeof toolInstance.validateParameters !== 'function') {
      throw new Error('GetDocumentTool missing validateParameters method');
    }
    
    if (typeof toolInstance.formatSuccessResponse !== 'function') {
      throw new Error('GetDocumentTool missing formatSuccessResponse method');
    }
    
    if (typeof toolInstance.formatErrorResponse !== 'function') {
      throw new Error('GetDocumentTool missing formatErrorResponse method');
    }

    console.log('✅ All required methods present');

    // Test static methods
    if (typeof GetDocumentTool.getCategory !== 'function') {
      throw new Error('GetDocumentTool missing getCategory static method');
    }
    
    if (typeof GetDocumentTool.getDefinition !== 'function') {
      throw new Error('GetDocumentTool missing getDefinition static method');
    }

    console.log('✅ All static methods present');

    console.log('\n🎉 All GetDocumentTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ GetDocumentTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGetDocumentTool().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { testGetDocumentTool };
