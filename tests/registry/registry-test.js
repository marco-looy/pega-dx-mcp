#!/usr/bin/env node

import { toolRegistry } from '../../src/registry/tool-registry.js';

/**
 * Test script for the new modular tool registry
 */
async function testRegistry() {
  console.log('🧪 Testing Tool Registry Architecture\n');

  try {
    // Initialize the registry
    console.log('1. Initializing registry...');
    await toolRegistry.initialize();
    
    // Get statistics
    const stats = toolRegistry.getStats();
    console.log(`✅ Registry initialized successfully`);
    console.log(`   - Total tools: ${stats.totalTools}`);
    console.log(`   - Categories: ${stats.categories}`);
    console.log(`   - Tools by category:`);
    for (const [category, count] of Object.entries(stats.toolsByCategory)) {
      console.log(`     - ${category}: ${count} tools`);
    }
    console.log();

    // Test tool listing
    console.log('2. Testing tool definitions...');
    const definitions = toolRegistry.getAllDefinitions();
    console.log(`✅ Found ${definitions.length} tool definitions:`);
    definitions.forEach(def => {
      console.log(`   - ${def.name}: ${def.description}`);
    });
    console.log();

    // Test specific tool lookup
    console.log('3. Testing tool lookup...');
    const getCaseTool = toolRegistry.getToolByName('get_case');
    if (getCaseTool) {
      console.log('✅ get_case tool found and loaded');
      console.log(`   - Class: ${getCaseTool.constructor.name}`);
      console.log(`   - Category: ${getCaseTool.constructor.getCategory()}`);
    } else {
      console.log('❌ get_case tool not found');
    }

    const pingTool = toolRegistry.getToolByName('ping_pega_service');
    if (pingTool) {
      console.log('✅ ping_pega_service tool found and loaded');
      console.log(`   - Class: ${pingTool.constructor.name}`);
      console.log(`   - Category: ${pingTool.constructor.getCategory()}`);
    } else {
      console.log('❌ ping_pega_service tool not found');
    }
    console.log();

    // Test category filtering
    console.log('4. Testing category filtering...');
    const categories = toolRegistry.getCategoryNames();
    console.log(`✅ Found categories: ${categories.join(', ')}`);
    
    for (const category of categories) {
      const tools = toolRegistry.getToolsByCategory(category);
      console.log(`   - ${category}: ${tools.length} tools`);
    }
    console.log();

    // Test tool information
    console.log('5. Testing tool information...');
    const toolInfos = toolRegistry.getAllToolInfo();
    console.log(`✅ Tool information loaded for ${toolInfos.length} tools:`);
    toolInfos.forEach(info => {
      console.log(`   - ${info.name} (${info.category}): ${info.className}`);
    });
    console.log();

    // Generate summary
    console.log('6. Registry summary:');
    const summary = toolRegistry.generateSummary();
    console.log(summary);

    console.log('🎉 All registry tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Registry test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testRegistry().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
