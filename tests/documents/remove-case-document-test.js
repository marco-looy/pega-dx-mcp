#!/usr/bin/env node
import 'dotenv/config';

import { RemoveCaseDocumentTool } from '../../src/tools/documents/remove-case-document.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testRemoveCaseDocumentTool() {
  console.log('🧪 Testing RemoveCaseDocumentTool\n');

  try {
    // Test tool category
    const category = RemoveCaseDocumentTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'documents') {
      throw new Error(`Expected category 'documents', got '${category}'`);
    }

    // Test tool definition
    const definition = RemoveCaseDocumentTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description.substring(0, 100)}...`);
    
    if (definition.name !== 'remove_case_document') {
      throw new Error(`Expected tool name 'remove_case_document', got '${definition.name}'`);
    }

    // Test input schema structure
    const schema = definition.inputSchema;
    console.log(`✅ Input schema type: ${schema.type}`);
    console.log(`✅ Required parameters: ${schema.required.join(', ')}`);
    
    if (schema.type !== 'object') {
      throw new Error(`Expected schema type 'object', got '${schema.type}'`);
    }
    
    if (!schema.required.includes('caseID') || !schema.required.includes('documentID')) {
      throw new Error('Expected required parameters: caseID, documentID');
    }

    // Test parameter properties
    const properties = schema.properties;
    if (!properties.caseID || !properties.documentID) {
      throw new Error('Missing required parameter definitions');
    }
    
    console.log(`✅ caseID parameter type: ${properties.caseID.type}`);
    console.log(`✅ documentID parameter type: ${properties.documentID.type}`);

    // Test BaseTool inheritance
    const toolInstance = new RemoveCaseDocumentTool();
    const isBaseTool = toolInstance instanceof BaseTool;
    console.log(`✅ Extends BaseTool: ${isBaseTool}`);
    
    if (!isBaseTool) {
      throw new Error('RemoveCaseDocumentTool should extend BaseTool');
    }

    // Test required parameter validation
    console.log('\n🔍 Testing parameter validation...');
    
    const emptyParamsTest = toolInstance.validateRequiredParams({}, ['caseID', 'documentID']);
    console.log(`✅ Empty params validation: ${!!emptyParamsTest}`);
    if (!emptyParamsTest) {
      throw new Error('Should return error for empty parameters');
    }

    const missingCaseIDTest = toolInstance.validateRequiredParams({ documentID: 'test-doc' }, ['caseID', 'documentID']);
    console.log(`✅ Missing caseID validation: ${!!missingCaseIDTest}`);
    if (!missingCaseIDTest) {
      throw new Error('Should return error for missing caseID');
    }

    const missingDocumentIDTest = toolInstance.validateRequiredParams({ caseID: 'CASE-123' }, ['caseID', 'documentID']);
    console.log(`✅ Missing documentID validation: ${!!missingDocumentIDTest}`);
    if (!missingDocumentIDTest) {
      throw new Error('Should return error for missing documentID');
    }

    const validParamsTest = toolInstance.validateRequiredParams({ 
      caseID: 'ON6E5R-DIYRecipe-Work-RecipeCollection R-1008',
      documentID: 'doc-123-456'
    }, ['caseID', 'documentID']);
    console.log(`✅ Valid params validation: ${!validParamsTest}`);
    if (validParamsTest) {
      throw new Error('Should not return error for valid parameters');
    }

    // Test parameter validation method
    console.log('\n🔍 Testing internal parameter validation...');
    
    const emptyParamsValidation = toolInstance.validateParameters('', '');
    console.log(`✅ Empty params internal validation: ${!emptyParamsValidation.valid}`);
    if (emptyParamsValidation.valid) {
      throw new Error('Should be invalid for empty parameters');
    }

    const spaceCaseIDValidation = toolInstance.validateParameters('   ', 'doc-123');
    console.log(`✅ Whitespace caseID validation: ${!spaceCaseIDValidation.valid}`);
    if (spaceCaseIDValidation.valid) {
      throw new Error('Should be invalid for whitespace-only caseID');
    }

    const validParamsValidation = toolInstance.validateParameters(
      'ON6E5R-DIYRecipe-Work-RecipeCollection R-1008', 
      'doc-123-456'
    );
    console.log(`✅ Valid params internal validation: ${validParamsValidation.valid}`);
    if (!validParamsValidation.valid) {
      throw new Error('Should be valid for proper parameters');
    }

    // Test tool methods exist
    console.log('\n🔍 Testing tool methods...');
    
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('Tool should have execute method');
    }
    console.log('✅ execute method exists');

    if (typeof toolInstance.validateParameters !== 'function') {
      throw new Error('Tool should have validateParameters method');
    }
    console.log('✅ validateParameters method exists');

    if (typeof toolInstance.formatSuccessResponse !== 'function') {
      throw new Error('Tool should have formatSuccessResponse method');
    }
    console.log('✅ formatSuccessResponse method exists');

    if (typeof toolInstance.formatErrorResponse !== 'function') {
      throw new Error('Tool should have formatErrorResponse method');
    }
    console.log('✅ formatErrorResponse method exists');

    // Test response formatting
    console.log('\n🔍 Testing response formatting...');
    
    const mockSuccessData = {
      data: {},
      headers: { 'cache-control': 'no-store' },
      status: 200,
      statusText: 'OK'
    };
    
    const successResponse = toolInstance.formatSuccessResponse(
      'Remove Document from Case: doc-123 from CASE-456',
      mockSuccessData,
      { caseID: 'CASE-456', documentID: 'doc-123' }
    );
    
    if (!successResponse.includes('✅ Document Removal Successful')) {
      throw new Error('Success response should include success indicator');
    }
    if (!successResponse.includes('CASE-456')) {
      throw new Error('Success response should include case ID');
    }
    if (!successResponse.includes('doc-123')) {
      throw new Error('Success response should include document ID');
    }
    console.log('✅ Success response formatting works');

    const mockError = {
      type: 'NOT_FOUND',
      message: 'Case or document not found',
      details: 'The case or document cannot be found',
      status: 404,
      statusText: 'Not Found'
    };
    
    const errorResponse = toolInstance.formatErrorResponse('CASE-456', 'doc-123', mockError);
    
    if (!errorResponse.includes('Error Removing Document from Case')) {
      throw new Error('Error response should include error header');
    }
    if (!errorResponse.includes('CASE-456')) {
      throw new Error('Error response should include case ID');
    }
    if (!errorResponse.includes('doc-123')) {
      throw new Error('Error response should include document ID');
    }
    if (!errorResponse.includes('NOT_FOUND')) {
      throw new Error('Error response should include error type');
    }
    console.log('✅ Error response formatting works');

    // Test comprehensive error scenarios
    console.log('\n🔍 Testing error scenario formatting...');
    
    const unauthorizedError = {
      type: 'UNAUTHORIZED',
      message: 'Authentication failed',
      details: 'Invalid or expired token',
      status: 401,
      statusText: 'Unauthorized'
    };
    
    const unauthorizedResponse = toolInstance.formatErrorResponse('CASE-789', 'doc-789', unauthorizedError);
    if (!unauthorizedResponse.includes('Authentication token may have expired')) {
      throw new Error('Unauthorized error should include token refresh guidance');
    }
    console.log('✅ Unauthorized error formatting works');

    const forbiddenError = {
      type: 'FORBIDDEN',
      message: 'Insufficient permissions',
      details: 'User is not allowed to remove documents',
      status: 403,
      statusText: 'Forbidden'
    };
    
    const forbiddenResponse = toolInstance.formatErrorResponse('CASE-789', 'doc-789', forbiddenError);
    if (!forbiddenResponse.includes('permission to remove documents')) {
      throw new Error('Forbidden error should include permission guidance');
    }
    console.log('✅ Forbidden error formatting works');

    console.log('\n🎉 All RemoveCaseDocumentTool tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('  ✅ Tool category and definition');
    console.log('  ✅ Input schema validation');
    console.log('  ✅ BaseTool inheritance');
    console.log('  ✅ Parameter validation (empty, missing, valid)');
    console.log('  ✅ Internal validation methods');
    console.log('  ✅ Tool method existence');
    console.log('  ✅ Success response formatting');
    console.log('  ✅ Error response formatting');
    console.log('  ✅ Comprehensive error scenarios');
    
    return true;
  } catch (error) {
    console.error('\n❌ RemoveCaseDocumentTool test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Execute the test
testRemoveCaseDocumentTool().then(success => {
  process.exit(success ? 0 : 1);
});
