#!/usr/bin/env node

import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { toolRegistry } from './registry/tool-registry.js';
import { attemptStartupAuthentication, formatAuthStatus } from './auth/startup-auth.js';

// Load .env file only if it exists, and don't override existing environment variables
// This ensures MCP configuration environment variables take precedence
dotenv.config({ override: false });

class PegaDXMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'pega-dx-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // Handle tool listing - dynamic discovery via registry
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const definitions = toolRegistry.getAllDefinitions();
        return { tools: definitions };
      } catch (error) {
        console.error('Error listing tools:', error);
        return { tools: [] };
      }
    });

    // Handle tool execution - dynamic routing via registry
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        return await toolRegistry.executeTool(name, args);
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
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
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.error('🛑 Shutting down Pega DX MCP server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    try {
      // Initialize the tool registry first
      console.error('🚀 Starting Pega DX MCP server...');
      await toolRegistry.initialize();

      // Show registry summary
      const stats = toolRegistry.getStats();
      console.error(`📊 Registry initialized with ${stats.totalTools} tools in ${stats.categories} categories`);

      // Attempt authentication with environment credentials
      console.error('🔐 Attempting authentication with environment credentials...');
      const authResult = await attemptStartupAuthentication();
      console.error(formatAuthStatus(authResult));

      // Start the MCP server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('✅ Pega DX MCP server running on stdio');

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new PegaDXMCPServer();
server.run().catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});
