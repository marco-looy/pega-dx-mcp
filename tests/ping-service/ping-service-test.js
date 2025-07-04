#!/usr/bin/env node

import { PingServiceTool } from '../../src/tools/ping-service.js';

async function testPingService() {
  console.log('Testing Ping Service Tool...\n');
  
  const pingTool = new PingServiceTool();
  
  try {
    console.log('=== OAuth2 Authentication Test ===');
    const result = await pingTool.execute({});
    console.log(result.content[0].text);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testPingService().catch(console.error);
