#!/usr/bin/env node

import { ToolRegistry } from '../../src/registry/tool-registry.js';

async function debug() {
  console.log('🔍 Debug Tool Registry...\n');
  
  const registry = new ToolRegistry();
  await registry.initialize();
  
  console.log('📊 Registry Stats:', registry.getStats());
  console.log('📋 Tool Names:', registry.getToolNames());
  
  // Test one specific tool
  const toolName = 'get_case';
  console.log(`\n🧐 Debugging tool: ${toolName}`);
  
  const toolInfo = registry.getToolInfo(toolName);
  console.log('Tool Info:', toolInfo);
  
  const tool = registry.getToolByName(toolName);
  console.log('Tool Instance:', tool);
  console.log('Tool Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(tool)));
  
  if (toolInfo) {
    console.log('Class:', toolInfo.class);
    console.log('Class Methods:', toolInfo.class ? Object.getOwnPropertyNames(toolInfo.class) : 'undefined');
  }
}

debug().catch(console.error);
