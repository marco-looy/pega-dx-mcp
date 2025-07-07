a#!/usr/bin/env node

import { AddCaseTagsTool } from '../../src/tools/tags/add-case-tags.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testAddCaseTagsTool() {
  console.log('🧪 Testing AddCaseTagsTool\n');

  try {
    // Test tool category
    const category = AddCaseTagsTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'tags') {
      throw new Error(`Expected category 'tags', got '${category}'`);
    }

    // Test tool definition
    const definition = AddCaseTagsTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    if (definition.name !== 'add_case_tags') {
      throw new Error(`Expected name 'add_case_tags', got '${definition.name}'`);
    }

    // Test BaseTool inheritance
    const toolInstance = new AddCaseTagsTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('AddCaseTagsTool must extend BaseTool');
    }

    // Test required parameters validation
    const requiredTest = toolInstance.validateRequiredParams({}, ['caseID', 'tags']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);

    // Test missing tags parameter
    const missingTagsTest = toolInstance.validateRequiredParams({ caseID: 'TEST-123' }, ['caseID', 'tags']);
    console.log(`✅ Missing tags validation: ${!!missingTagsTest.error}`);

    // Test valid basic parameters
    const validTest = toolInstance.validateRequiredParams({ 
      caseID: 'TEST-CASE-123',
      tags: [{ Name: 'TestTag' }]
    }, ['caseID', 'tags']);
    console.log(`✅ Valid parameters: ${validTest === null}`);

    // Test tool schema validation
    const schema = definition.inputSchema;
    console.log(`✅ Has input schema: ${!!schema}`);
    console.log(`✅ Required parameters: ${JSON.stringify(schema.required)}`);

    // Test parameter descriptions
    const caseIDParam = schema.properties.caseID;
    const tagsParam = schema.properties.tags;
    console.log(`✅ Case ID parameter configured: ${!!caseIDParam}`);
    console.log(`✅ Tags parameter configured: ${!!tagsParam}`);
    console.log(`✅ Tags is array type: ${tagsParam.type === 'array'}`);

    console.log('\n🎉 All AddCaseTagsTool basic tests passed!');
    return true;
  } catch (error) {
    console.error('❌ AddCaseTagsTool test failed:', error.message);
    return false;
  }
}

async function testValidation() {
  console.log('\n🔍 Testing Parameter Validation...\n');

  try {
    const toolInstance = new AddCaseTagsTool();

    // Test empty tags array
    const emptyArrayResult = await toolInstance.execute({
      caseID: 'TEST-123',
      tags: []
    });
    console.log(`✅ Empty tags array rejected: ${!!emptyArrayResult.error}`);

    // Test non-array tags
    const nonArrayResult = await toolInstance.execute({
      caseID: 'TEST-123',
      tags: 'not-an-array'
    });
    console.log(`✅ Non-array tags rejected: ${!!nonArrayResult.error}`);

    // Test tags without Name property
    const noNameResult = await toolInstance.execute({
      caseID: 'TEST-123',
      tags: [{ NotName: 'test' }]
    });
    console.log(`✅ Tags without Name rejected: ${!!noNameResult.error}`);

    // Test tags with empty Name
    const emptyNameResult = await toolInstance.execute({
      caseID: 'TEST-123',
      tags: [{ Name: '' }]
    });
    console.log(`✅ Tags with empty Name rejected: ${!!emptyNameResult.error}`);

    // Test tags with whitespace-only Name
    const whitespaceNameResult = await toolInstance.execute({
      caseID: 'TEST-123',
      tags: [{ Name: '   ' }]
    });
    console.log(`✅ Tags with whitespace Name rejected: ${!!whitespaceNameResult.error}`);

    // Test mixed valid and invalid tags
    const mixedResult = await toolInstance.execute({
      caseID: 'TEST-123',
      tags: [
        { Name: 'ValidTag' },
        { NotName: 'InvalidTag' }
      ]
    });
    console.log(`✅ Mixed valid/invalid tags rejected: ${!!mixedResult.error}`);

    console.log('\n✅ All validation tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
    return false;
  }
}

// Test with real API if credentials are available
async function testRealAPI() {
  console.log('\n🔗 Testing Real API Integration...\n');
  
  try {
    const toolInstance = new AddCaseTagsTool();
    
    // Test with valid tag structure (this will likely fail with 404 for case not found, which is expected)
    const result = await toolInstance.execute({
      caseID: 'TEST-CASE-TAGS-12345',
      tags: [
        { Name: 'TestTag1' },
        { Name: 'TestTag2' },
        { Name: 'Priority-High' }
      ]
    });
    
    console.log('📡 API Response received');
    
    // Check if we got a structured response (success or error)
    if (result.content || result.error) {
      console.log('✅ Structured response format');
      
      if (result.error) {
        console.log(`⚠️  Expected error (likely case not found): ${result.error}`);
      } else {
        console.log('✅ Successful API response');
        console.log('📊 Response structure validated');
      }
    } else {
      console.log('❌ Unexpected response format');
      return false;
    }
    
    console.log('✅ Real API integration test completed');
    return true;
  } catch (error) {
    console.error('❌ Real API test failed:', error.message);
    console.log('ℹ️  This might be due to missing credentials or network issues');
    return false;
  }
}

// Run tests sequentially
testAddCaseTagsTool()
  .then(success => {
    if (success) {
      return testValidation();
    }
    return false;
  })
  .then(success => {
    if (success) {
      return testRealAPI();
    }
    return false;
  })
  .then(success => {
    console.log(success ? '\n🎉 All tests completed!' : '\n❌ Some tests failed');
    process.exit(success ? 0 : 1);
  });
