#!/usr/bin/env node
import 'dotenv/config';

import { ChangeToStageTool } from '../../src/tools/cases/change-to-stage.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testChangeToStageTool() {
  console.log('🧪 Testing ChangeToStageTool\n');

  try {
    // Test tool category
    const category = ChangeToStageTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'cases') {
      throw new Error(`Expected category 'cases', got '${category}'`);
    }

    // Test tool definition
    const definition = ChangeToStageTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    
    if (definition.name !== 'change_to_stage') {
      throw new Error(`Expected name 'change_to_stage', got '${definition.name}'`);
    }

    // Test required parameters
    const requiredParams = definition.inputSchema.required;
    console.log(`✅ Required parameters: ${requiredParams.join(', ')}`);
    
    const expectedRequired = ['caseID', 'stageID', 'eTag'];
    if (JSON.stringify(requiredParams.sort()) !== JSON.stringify(expectedRequired.sort())) {
      throw new Error(`Required parameters mismatch. Expected: ${expectedRequired.join(', ')}, got: ${requiredParams.join(', ')}`);
    }

    // Test optional parameters
    const properties = definition.inputSchema.properties;
    console.log(`✅ Has viewType enum: ${JSON.stringify(properties.viewType.enum)}`);
    console.log(`✅ Has cleanupProcesses boolean: ${properties.cleanupProcesses.type}`);

    // Test BaseTool inheritance
    const toolInstance = new ChangeToStageTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('ChangeToStageTool should extend BaseTool');
    }

    // Test parameter validation - missing required parameters
    const missingParamsTest = toolInstance.validateRequiredParams({}, ['caseID', 'stageID', 'eTag']);
    console.log(`✅ Missing parameters validation: ${!!missingParamsTest.error}`);

    // Test parameter validation - valid parameters
    const validParamsTest = toolInstance.validateRequiredParams({
      caseID: 'TEST-CASE-001',
      stageID: 'PRIM1',
      eTag: '12345'
    }, ['caseID', 'stageID', 'eTag']);
    console.log(`✅ Valid parameters validation: ${!validParamsTest}`);

    // Test enum validation - invalid viewType
    const invalidEnumTest = toolInstance.validateEnumParams({
      viewType: 'invalid'
    }, {
      viewType: ['none', 'form', 'page']
    });
    console.log(`✅ Invalid enum validation: ${!!invalidEnumTest.error}`);

    // Test enum validation - valid viewType
    const validEnumTest = toolInstance.validateEnumParams({
      viewType: 'form'
    }, {
      viewType: ['none', 'form', 'page']
    });
    console.log(`✅ Valid enum validation: ${!validEnumTest}`);

    // Test tool description
    console.log(`✅ Description: ${definition.description.substring(0, 50)}...`);
    
    if (!definition.description.includes('stage') || !definition.description.includes('stageID')) {
      throw new Error('Description should mention stage and stageID');
    }

    console.log('\n🎉 All ChangeToStageTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ ChangeToStageTool test failed:', error);
    return false;
  }
}

testChangeToStageTool().then(success => process.exit(success ? 0 : 1));
