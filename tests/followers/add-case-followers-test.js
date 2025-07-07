#!/usr/bin/env node

import { AddCaseFollowersTool } from '../../src/tools/followers/add-case-followers.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testAddCaseFollowersTool() {
  console.log('🧪 Testing AddCaseFollowersTool\n');

  try {
    // Test tool category
    const category = AddCaseFollowersTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'followers') {
      throw new Error(`Expected category 'followers', got '${category}'`);
    }

    // Test tool definition
    const definition = AddCaseFollowersTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    console.log(`✅ Description: ${definition.description}`);
    
    if (definition.name !== 'add_case_followers') {
      throw new Error(`Expected name 'add_case_followers', got '${definition.name}'`);
    }

    // Test BaseTool inheritance
    const toolInstance = new AddCaseFollowersTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('AddCaseFollowersTool should extend BaseTool');
    }

    // Test parameter validation - missing required parameters
    const missingCaseIdTest = toolInstance.validateRequiredParams({ users: [] }, ['caseID', 'users']);
    console.log(`✅ Required validation (missing caseID): ${!!missingCaseIdTest.error}`);
    
    if (!missingCaseIdTest.error) {
      throw new Error('Should return error for missing caseID parameter');
    }

    const missingUsersTest = toolInstance.validateRequiredParams({ caseID: 'TEST-CASE' }, ['caseID', 'users']);
    console.log(`✅ Required validation (missing users): ${!!missingUsersTest.error}`);
    
    if (!missingUsersTest.error) {
      throw new Error('Should return error for missing users parameter');
    }

    // Test parameter validation - with required parameters
    const validParamTest = toolInstance.validateRequiredParams({ 
      caseID: 'TEST-CASE', 
      users: [{ ID: 'user1' }] 
    }, ['caseID', 'users']);
    console.log(`✅ Required validation (all present): ${!validParamTest}`);
    
    if (validParamTest) {
      throw new Error('Should not return error when all required parameters are present');
    }

    // Test input schema structure
    const schema = definition.inputSchema;
    console.log(`✅ Schema type: ${schema.type}`);
    console.log(`✅ Required fields: ${schema.required.join(', ')}`);
    console.log(`✅ Has caseID property: ${!!schema.properties.caseID}`);
    console.log(`✅ Has users property: ${!!schema.properties.users}`);
    
    if (schema.type !== 'object') {
      throw new Error('Input schema should be of type object');
    }
    
    if (!schema.required.includes('caseID')) {
      throw new Error('caseID should be required in schema');
    }
    
    if (!schema.required.includes('users')) {
      throw new Error('users should be required in schema');
    }
    
    if (!schema.properties.caseID) {
      throw new Error('Schema should have caseID property');
    }
    
    if (!schema.properties.users) {
      throw new Error('Schema should have users property');
    }

    // Test users array schema
    const usersSchema = schema.properties.users;
    console.log(`✅ Users is array: ${usersSchema.type === 'array'}`);
    console.log(`✅ Users has minItems: ${!!usersSchema.minItems}`);
    
    if (usersSchema.type !== 'array') {
      throw new Error('users property should be of type array');
    }
    
    if (usersSchema.minItems !== 1) {
      throw new Error('users array should have minItems of 1');
    }

    // Test user object schema
    const userItemSchema = usersSchema.items;
    console.log(`✅ User item has ID property: ${!!userItemSchema.properties.ID}`);
    console.log(`✅ ID is required in user item: ${userItemSchema.required.includes('ID')}`);
    
    if (!userItemSchema.properties.ID) {
      throw new Error('User item should have ID property');
    }
    
    if (!userItemSchema.required.includes('ID')) {
      throw new Error('ID should be required in user item');
    }

    // Test custom validation logic
    const emptyUsersTest = await toolInstance.execute({ 
      caseID: 'TEST-CASE', 
      users: [] 
    });
    console.log(`✅ Empty users validation: ${!!emptyUsersTest.error}`);
    
    if (!emptyUsersTest.error) {
      throw new Error('Should return error for empty users array');
    }

    const missingIdTest = await toolInstance.execute({ 
      caseID: 'TEST-CASE', 
      users: [{ ID: 'user1' }, { name: 'user2' }] // missing ID in second user
    });
    console.log(`✅ Missing ID validation: ${!!missingIdTest.error}`);
    
    if (!missingIdTest.error) {
      throw new Error('Should return error when user is missing ID field');
    }

    console.log('✅ Tool structure validation completed');

    console.log('\n🎉 All AddCaseFollowersTool tests passed!');
    return true;
  } catch (error) {
    console.error('❌ AddCaseFollowersTool test failed:', error.message);
    return false;
  }
}

testAddCaseFollowersTool().then(success => process.exit(success ? 0 : 1));
