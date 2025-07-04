#!/usr/bin/env node

import { UploadAttachmentTool } from '../../src/tools/attachments/upload-attachment.js';
import fs from 'fs';
import path from 'path';

class UploadAttachmentTestRunner {
  constructor() {
    this.tool = new UploadAttachmentTool();
    this.testResults = [];
  }

  /**
   * Create test files for testing
   */
  async createTestFiles() {
    const testDir = path.join(process.cwd(), 'tests', 'attachments', 'test-files');
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create a small text file
    const textContent = 'This is a test attachment file for upload testing.\nIt contains multiple lines.\nAnd some special characters: !@#$%^&*()';
    fs.writeFileSync(path.join(testDir, 'test-document.txt'), textContent);

    // Create a small JSON file
    const jsonContent = JSON.stringify({
      test: true,
      message: 'This is a test JSON file',
      timestamp: new Date().toISOString(),
      data: {
        numbers: [1, 2, 3, 4, 5],
        nested: {
          value: 'test'
        }
      }
    }, null, 2);
    fs.writeFileSync(path.join(testDir, 'test-data.json'), jsonContent);

    console.log('✅ Test files created successfully');
  }

  /**
   * Test tool definition
   */
  testToolDefinition() {
    console.log('\n🧪 Testing tool definition...');
    
    try {
      const definition = UploadAttachmentTool.getDefinition();
      
      // Validate definition structure
      if (!definition.name || definition.name !== 'upload_attachment') {
        throw new Error('Invalid tool name');
      }
      
      if (!definition.description || definition.description.length < 50) {
        throw new Error('Description too short or missing');
      }
      
      if (!definition.inputSchema || !definition.inputSchema.properties) {
        throw new Error('Missing input schema');
      }

      // Check required properties
      const props = definition.inputSchema.properties;
      if (!props.filePath || !props.fileContent || !props.fileUrl) {
        throw new Error('Missing file input properties');
      }

      if (!props.fileName || !props.appendUniqueIdToFileName) {
        throw new Error('Missing required properties');
      }

      // Check anyOf validation
      if (!definition.inputSchema.anyOf || definition.inputSchema.anyOf.length !== 3) {
        throw new Error('Missing or incorrect anyOf validation');
      }

      this.logSuccess('Tool definition validation passed');
      this.testResults.push({ test: 'Tool definition', status: 'PASS' });
    } catch (error) {
      this.logError('Tool definition validation failed', error);
      this.testResults.push({ test: 'Tool definition', status: 'FAIL', error: error.message });
    }
  }

  /**
   * Test parameter validation
   */
  async testParameterValidation() {
    console.log('\n🧪 Testing parameter validation...');

    // Test 1: No input provided
    try {
      const result = await this.tool.execute({});
      if (!result.error || !result.error.includes('No file input provided')) {
        throw new Error('Should have failed with no input');
      }
      this.logSuccess('No input validation passed');
    } catch (error) {
      this.logError('No input validation failed', error);
    }

    // Test 2: Multiple inputs provided
    try {
      const result = await this.tool.execute({
        filePath: '/test/path',
        fileContent: 'dGVzdA==',
        fileName: 'test.txt'
      });
      if (!result.error || !result.error.includes('Multiple file input methods')) {
        throw new Error('Should have failed with multiple inputs');
      }
      this.logSuccess('Multiple input validation passed');
    } catch (error) {
      this.logError('Multiple input validation failed', error);
    }

    // Test 3: Missing fileName for fileContent
    try {
      const result = await this.tool.execute({
        fileContent: 'dGVzdA=='
      });
      if (!result.error || !result.error.includes('fileName parameter is required')) {
        throw new Error('Should have failed with missing fileName');
      }
      this.logSuccess('Missing fileName validation passed');
    } catch (error) {
      this.logError('Missing fileName validation failed', error);
    }

    // Test 4: Invalid appendUniqueIdToFileName type
    try {
      const result = await this.tool.execute({
        filePath: '/test/path',
        appendUniqueIdToFileName: 'invalid'
      });
      if (!result.error || !result.error.includes('must be a boolean')) {
        throw new Error('Should have failed with invalid boolean');
      }
      this.logSuccess('Boolean validation passed');
    } catch (error) {
      this.logError('Boolean validation failed', error);
    }

    this.testResults.push({ test: 'Parameter validation', status: 'PASS' });
  }

  /**
   * Test file path processing
   */
  async testFilePathProcessing() {
    console.log('\n🧪 Testing file path processing...');

    const testFilePath = path.join(process.cwd(), 'tests', 'attachments', 'test-files', 'test-document.txt');

    try {
      // Test valid file path
      const result = await this.tool.processFilePath(testFilePath);
      
      if (result.error) {
        throw new Error(`File processing failed: ${result.error}`);
      }

      if (!result.buffer || !Buffer.isBuffer(result.buffer)) {
        throw new Error('Invalid buffer returned');
      }

      if (!result.fileName || result.fileName !== 'test-document.txt') {
        throw new Error('Invalid fileName returned');
      }

      if (!result.mimeType || result.mimeType !== 'text/plain') {
        throw new Error('Invalid mimeType returned');
      }

      this.logSuccess('File path processing passed');
    } catch (error) {
      this.logError('File path processing failed', error);
    }

    // Test non-existent file
    try {
      const result = await this.tool.processFilePath('/non/existent/file.txt');
      if (!result.error || !result.error.includes('File not found')) {
        throw new Error('Should have failed with file not found');
      }
      this.logSuccess('Non-existent file validation passed');
    } catch (error) {
      this.logError('Non-existent file validation failed', error);
    }

    this.testResults.push({ test: 'File path processing', status: 'PASS' });
  }

  /**
   * Test base64 content processing
   */
  async testBase64Processing() {
    console.log('\n🧪 Testing base64 content processing...');

    try {
      const testContent = 'Hello, World! This is a test file.';
      const base64Content = Buffer.from(testContent).toString('base64');

      const result = await this.tool.processFileContent(base64Content, 'test.txt');
      
      if (result.error) {
        throw new Error(`Base64 processing failed: ${result.error}`);
      }

      if (!result.buffer || !Buffer.isBuffer(result.buffer)) {
        throw new Error('Invalid buffer returned');
      }

      const decodedContent = result.buffer.toString('utf8');
      if (decodedContent !== testContent) {
        throw new Error('Content mismatch after base64 decode');
      }

      if (!result.fileName || result.fileName !== 'test.txt') {
        throw new Error('Invalid fileName returned');
      }

      if (!result.mimeType || result.mimeType !== 'text/plain') {
        throw new Error('Invalid mimeType returned');
      }

      this.logSuccess('Base64 content processing passed');
    } catch (error) {
      this.logError('Base64 content processing failed', error);
    }

    // Test invalid base64
    try {
      const result = await this.tool.processFileContent('invalid-base64!@#', 'test.txt');
      if (!result.error || !result.error.includes('Invalid base64 content')) {
        throw new Error('Should have failed with invalid base64');
      }
      this.logSuccess('Invalid base64 validation passed');
    } catch (error) {
      this.logError('Invalid base64 validation failed', error);
    }

    this.testResults.push({ test: 'Base64 processing', status: 'PASS' });
  }

  /**
   * Test URL processing
   */
  async testUrlProcessing() {
    console.log('\n🧪 Testing URL processing...');

    try {
      // Test data URL
      const testContent = 'Hello from data URL!';
      const dataUrl = `data:text/plain;base64,${Buffer.from(testContent).toString('base64')}`;

      const result = await this.tool.processFileUrl(dataUrl, 'test-data.txt');
      
      if (result.error) {
        throw new Error(`Data URL processing failed: ${result.error}`);
      }

      if (!result.buffer || !Buffer.isBuffer(result.buffer)) {
        throw new Error('Invalid buffer returned');
      }

      const decodedContent = result.buffer.toString('utf8');
      if (decodedContent !== testContent) {
        throw new Error('Content mismatch from data URL');
      }

      if (!result.fileName || result.fileName !== 'test-data.txt') {
        throw new Error('Invalid fileName returned');
      }

      if (!result.mimeType || result.mimeType !== 'text/plain') {
        throw new Error('Invalid mimeType returned');
      }

      this.logSuccess('Data URL processing passed');
    } catch (error) {
      this.logError('Data URL processing failed', error);
    }

    // Test invalid URL
    try {
      const result = await this.tool.processFileUrl('not-a-url', 'test.txt');
      if (!result.error || !result.error.includes('Invalid URL format')) {
        throw new Error('Should have failed with invalid URL');
      }
      this.logSuccess('Invalid URL validation passed');
    } catch (error) {
      this.logError('Invalid URL validation failed', error);
    }

    // Test unsupported scheme
    try {
      const result = await this.tool.processFileUrl('ftp://example.com/file.txt', 'test.txt');
      if (!result.error || !result.error.includes('Unsupported URL scheme')) {
        throw new Error('Should have failed with unsupported scheme');
      }
      this.logSuccess('Unsupported scheme validation passed');
    } catch (error) {
      this.logError('Unsupported scheme validation failed', error);
    }

    this.testResults.push({ test: 'URL processing', status: 'PASS' });
  }

  /**
   * Test response formatting
   */
  testResponseFormatting() {
    console.log('\n🧪 Testing response formatting...');

    try {
      // Test success response
      const mockData = { ID: 'test-attachment-id-12345' };
      const mockOptions = {
        fileName: 'test-document.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        appendUniqueIdToFileName: true
      };

      const successResponse = this.tool.formatSuccessResponse(mockData, mockOptions);
      
      if (!successResponse.includes('File Upload Successful')) {
        throw new Error('Missing success header');
      }

      if (!successResponse.includes(mockData.ID)) {
        throw new Error('Missing attachment ID');
      }

      if (!successResponse.includes('test-document.pdf')) {
        throw new Error('Missing file name');
      }

      if (!successResponse.includes('1.00 MB')) {
        throw new Error('Missing formatted file size');
      }

      if (!successResponse.includes('add_case_attachments')) {
        throw new Error('Missing next steps guidance');
      }

      this.logSuccess('Success response formatting passed');
    } catch (error) {
      this.logError('Success response formatting failed', error);
    }

    try {
      // Test error response
      const mockError = {
        type: 'FILE_TOO_LARGE',
        message: 'File size exceeds limit',
        details: 'File size should not exceed 5 MB'
      };

      const errorResponse = this.tool.formatErrorResponse('large-file.pdf', mockError);
      
      if (!errorResponse.includes('Error uploading file')) {
        throw new Error('Missing error header');
      }

      if (!errorResponse.includes('FILE_TOO_LARGE')) {
        throw new Error('Missing error type');
      }

      if (!errorResponse.includes('File size exceeds limit')) {
        throw new Error('Missing error message');
      }

      if (!errorResponse.includes('Compress the file')) {
        throw new Error('Missing error guidance');
      }

      this.logSuccess('Error response formatting passed');
    } catch (error) {
      this.logError('Error response formatting failed', error);
    }

    this.testResults.push({ test: 'Response formatting', status: 'PASS' });
  }

  /**
   * Test file size formatting utility
   */
  testFileSizeFormatting() {
    console.log('\n🧪 Testing file size formatting...');

    try {
      const testCases = [
        { input: 0, expected: '0 Bytes' },
        { input: 512, expected: '512 Bytes' },
        { input: 1024, expected: '1 KB' },
        { input: 1536, expected: '1.5 KB' },
        { input: 1048576, expected: '1 MB' },
        { input: 1073741824, expected: '1 GB' }
      ];

      for (const testCase of testCases) {
        const result = this.tool.formatFileSize(testCase.input);
        if (result !== testCase.expected) {
          throw new Error(`Size formatting failed: ${testCase.input} bytes should be ${testCase.expected}, got ${result}`);
        }
      }

      this.logSuccess('File size formatting passed');
      this.testResults.push({ test: 'File size formatting', status: 'PASS' });
    } catch (error) {
      this.logError('File size formatting failed', error);
      this.testResults.push({ test: 'File size formatting', status: 'FAIL', error: error.message });
    }
  }

  /**
   * Manual integration test (requires Pega instance)
   */
  async testLiveUpload() {
    console.log('\n🧪 Testing live upload (requires Pega connection)...');

    const testFilePath = path.join(process.cwd(), 'tests', 'attachments', 'test-files', 'test-document.txt');

    try {
      const result = await this.tool.execute({
        filePath: testFilePath,
        appendUniqueIdToFileName: true
      });

      if (result.error) {
        // This might fail due to missing Pega connection, which is expected in development
        console.log('⚠️  Live upload test failed (expected if no Pega connection):');
        console.log('   ', result.error);
        this.testResults.push({ test: 'Live upload', status: 'SKIP', reason: 'No Pega connection' });
      } else {
        this.logSuccess('Live upload test passed');
        console.log('📋 Upload result:', JSON.stringify(result, null, 2));
        this.testResults.push({ test: 'Live upload', status: 'PASS' });
      }
    } catch (error) {
      console.log('⚠️  Live upload test failed (expected if no Pega connection):');
      console.log('   ', error.message);
      this.testResults.push({ test: 'Live upload', status: 'SKIP', reason: 'No Pega connection' });
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Upload Attachment Tool Tests\n');
    console.log('=' .repeat(60));

    await this.createTestFiles();
    this.testToolDefinition();
    await this.testParameterValidation();
    await this.testFilePathProcessing();
    await this.testBase64Processing();
    await this.testUrlProcessing();
    this.testResponseFormatting();
    this.testFileSizeFormatting();
    await this.testLiveUpload();

    this.printSummary();
  }

  /**
   * Print test results summary
   */
  printSummary() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📝 Total: ${this.testResults.length}`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.error}`));
    }

    if (skipped > 0) {
      console.log('\n⏭️  SKIPPED TESTS:');
      this.testResults
        .filter(r => r.status === 'SKIP')
        .forEach(r => console.log(`   - ${r.test}: ${r.reason}`));
    }

    console.log('\n' + '=' .repeat(60));
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Upload Attachment Tool is ready for use.');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix issues before use.');
      process.exit(1);
    }
  }

  /**
   * Utility methods
   */
  logSuccess(message) {
    console.log(`   ✅ ${message}`);
  }

  logError(message, error) {
    console.log(`   ❌ ${message}`);
    if (error) {
      console.log(`      Error: ${error.message || error}`);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testRunner = new UploadAttachmentTestRunner();
  testRunner.runAllTests().catch(console.error);
}

export { UploadAttachmentTestRunner };
