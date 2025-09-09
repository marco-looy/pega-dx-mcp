#!/usr/bin/env node
import 'dotenv/config';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { PingServiceTool } from '../src/tools/ping-service.js';

console.error('Starting simple MCP debug server...');

const server = new Server(
  {
    name: 'pega-dx-mcp-debug',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const pingTool = new PingServiceTool();

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('Tool list requested');
  try {
    const definition = PingServiceTool.getDefinition();
    console.error('Tool definition:', JSON.stringify(definition, null, 2));
    return {
      tools: [definition]
    };
  } catch (error) {
    console.error('Error in tool listing:', error);
    throw error;
  }
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error('Tool execution requested:', request.params.name);
  const { name, arguments: args } = request.params;

  try {
    if (name === 'ping_pega_service') {
      console.error('Executing ping service tool...');
      const result = await pingTool.execute(args);
      console.error('Tool execution result type:', typeof result);
      console.error('Tool execution result keys:', Object.keys(result));
      console.error('Has content?', !!result.content);
      if (result.content) {
        console.error('Content length:', result.content.length);
      }
      return result;
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error('Error executing tool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Error executing tool ${name}**\n\nError: ${error.message}`
        }
      ]
    };
  }
});

// Handle errors
server.onerror = (error) => {
  console.error('[MCP Error]', error);
};

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Simple MCP debug server running on stdio');
