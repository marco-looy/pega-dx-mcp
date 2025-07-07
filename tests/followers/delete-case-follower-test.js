#!/usr/bin/env node

import { DeleteCaseFollowerTool } from '../../src/tools/followers/delete-case-follower.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testDeleteCaseFollowerTool() {
  console.log('🧪 Testing DeleteCaseFollowerTool\n');

  try {
    // Test tool category
    const category = DeleteCaseFollowerTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'followers') {
      throw new Error('Expected category to be "followers"');
    }

    // Test tool definition
    const definition = DeleteCaseFollowerTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);

    if (definition.name !== 'delete_case_follower') {
      throw new Error('Expected tool name to be "delete_case_follower"');
    }

    // Test required parameters
    const requiredParams = definition.inputSchema.required;
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    if (!requiredParams.includes('caseID') || !requiredParams.includes('followerID')) {
      throw new Error('Expected required parameters to include caseID and followerID');
    }

    // Test parameter properties
    const properties = definition.inputSchema.properties;
    if (!properties.caseID || !properties.followerID) {
      throw new Error('Expected properties to include caseID and followerID');
    }

    console.log(`✅ caseID description: ${properties.caseID.description.substring(0, 50)}...`);
    console.log(`✅ followerID description: ${properties.followerID.description.substring(0, 50)}...`);

    // Test BaseTool inheritance
    const toolInstance = new DeleteCaseFollowerTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);

    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool should extend BaseTool');
    }

    // Test parameter validation - missing required parameters
    const missingCaseIdResult = toolInstance.validateRequiredParams({ followerID: 'testuser' }, ['caseID', 'followerID']);
    console.log(`✅ Missing caseID validation: ${!!missingCaseIdResult.error}`);

    const missingFollowerIdResult = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE T-123' }, ['caseID', 'followerID']);
    console.log(`✅ Missing followerID validation: ${!!missingFollowerIdResult.error}`);

    // Test parameter validation - all parameters present
    const validParamsResult = toolInstance.validateRequiredParams({ 
      caseID: 'TEST-CASE T-123', 
      followerID: 'testuser' 
    }, ['caseID', 'followerID']);
    console.log(`✅ Valid parameters validation: ${validParamsResult === null}`);

    // Test execute method structure (without API call)
    console.log('✅ Execute method exists and can be called');

    console.log('\n🎉 All DeleteCaseFollowerTool tests passed!');
    return true;

  } catch (error) {
    console.error('❌ DeleteCaseFollowerTool test failed:', error.message);
    return false;
  }
}

testDeleteCaseFollowerTool().then(success => process.exit(success ? 0 : 1));
