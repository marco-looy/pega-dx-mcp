#!/usr/bin/env node

import { ReleaseCaseLockTool } from '../../src/tools/cases/release-case-lock.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testReleaseCaseLockTool() {
  console.log('🧪 Testing ReleaseCaseLockTool\n');

  try {
    // Test tool category
    const category = ReleaseCaseLockTool.getCategory();
    console.log(`✅ Category: ${category}`);
    
    if (category !== 'cases') {
      throw new Error(`Expected category 'cases', got '${category}'`);
    }

    // Test tool definition
    const definition = ReleaseCaseLockTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);
    
    if (definition.name !== 'release_case_lock') {
      throw new Error(`Expected name 'release_case_lock', got '${definition.name}'`);
    }

    // Test BaseTool inheritance
    const toolInstance = new ReleaseCaseLockTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('ReleaseCaseLockTool should extend BaseTool');
    }

    // Test input schema structure
    const schema = definition.inputSchema;
    console.log(`✅ Has input schema: ${!!schema}`);
    console.log(`✅ Required parameters: ${JSON.stringify(schema.required)}`);
    
    if (!schema.required.includes('caseID')) {
      throw new Error('caseID should be required parameter');
    }

    // Test parameter validation - missing required parameter
    const requiredTest = toolInstance.validateRequiredParams({}, ['caseID']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);
    
    if (!requiredTest.error) {
      throw new Error('Should return error for missing required parameter');
    }

    // Test parameter validation - valid required parameter
    const validRequiredTest = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE-123' }, ['caseID']);
    console.log(`✅ Valid required validation: ${!validRequiredTest}`);
    
    if (validRequiredTest) {
      throw new Error('Should not return error for valid required parameter');
    }

    // Test enum validation - invalid value
    const enumTest = toolInstance.validateEnumParams({ viewType: 'invalid' }, { viewType: ['none', 'page'] });
    console.log(`✅ Enum validation works: ${!!enumTest.error}`);
    
    if (!enumTest.error) {
      throw new Error('Should return error for invalid enum value');
    }

    // Test enum validation - valid value
    const validEnumTest = toolInstance.validateEnumParams({ viewType: 'page' }, { viewType: ['none', 'page'] });
    console.log(`✅ Valid enum validation: ${!validEnumTest}`);
    
    if (validEnumTest) {
      throw new Error('Should not return error for valid enum value');
    }

    // Test schema properties
    const properties = schema.properties;
    console.log(`✅ Has caseID property: ${!!properties.caseID}`);
    console.log(`✅ Has viewType property: ${!!properties.viewType}`);
    
    if (!properties.caseID || properties.caseID.type !== 'string') {
      throw new Error('caseID should be string type');
    }
    
    if (!properties.viewType || !properties.viewType.enum) {
      throw new Error('viewType should have enum values');
    }
    
    const expectedEnums = ['none', 'page'];
    const actualEnums = properties.viewType.enum;
    if (JSON.stringify(actualEnums.sort()) !== JSON.stringify(expectedEnums.sort())) {
      throw new Error(`viewType enum should be ${JSON.stringify(expectedEnums)}, got ${JSON.stringify(actualEnums)}`);
    }

    // Test default value
    if (properties.viewType.default !== 'none') {
      throw new Error(`viewType default should be 'none', got '${properties.viewType.default}'`);
    }

    console.log('\n🎉 All ReleaseCaseLockTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ ReleaseCaseLockTool test failed:', error);
    return false;
  }
}

testReleaseCaseLockTool().then(success => process.exit(success ? 0 : 1));
