#!/usr/bin/env node
import 'dotenv/config';

console.log('Starting MCP Ping Debug Test...\n');

try {
  // Test 1: Load configuration
  console.log('=== 1. Testing Configuration Load ===');
  const { config } = await import('../src/config.js');
  console.log('✅ Configuration loaded successfully');
  console.log(`   Base URL: ${config.pega.baseUrl}`);
  console.log(`   Token URL: ${config.pega.tokenUrl}`);
  console.log(`   Client ID: ${config.pega.clientId ? 'Present' : 'Missing'}`);
  console.log(`   Client Secret: ${config.pega.clientSecret ? 'Present' : 'Missing'}\n`);

  // Test 2: Load OAuth2 Client
  console.log('=== 2. Testing OAuth2 Client Load ===');
  const { OAuth2Client } = await import('../src/auth/oauth2-client.js');
  console.log('✅ OAuth2Client loaded successfully\n');

  // Test 3: Load PingServiceTool
  console.log('=== 3. Testing PingServiceTool Load ===');
  const { PingServiceTool } = await import('../src/tools/ping-service.js');
  const pingTool = new PingServiceTool();
  console.log('✅ PingServiceTool loaded successfully');
  console.log(`   Tool definition: ${JSON.stringify(PingServiceTool.getDefinition(), null, 2)}\n`);

  // Test 4: Execute PingServiceTool
  console.log('=== 4. Testing PingServiceTool Execution ===');
  const result = await pingTool.execute({});
  console.log('✅ PingServiceTool executed successfully');
  console.log(`   Result type: ${typeof result}`);
  console.log(`   Has content: ${result.content ? 'Yes' : 'No'}`);
  console.log(`   Content length: ${result.content ? result.content.length : 'N/A'}`);
  
  if (result.content && result.content[0]) {
    console.log('\n--- Tool Response ---');
    console.log(result.content[0].text);
  }
  
} catch (error) {
  console.error('❌ Debug test failed:', error.message);
  console.error('Stack trace:', error.stack);
}
