#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GetCaseTool } from './tools/cases/get-case.js';
import { CreateCaseTool } from './tools/cases/create-case.js';
import { DeleteCaseTool } from './tools/cases/delete-case.js';
import { GetCaseTypeBulkActionTool } from './tools/casetypes/get-case-type-bulk-action.js';
import { PingServiceTool } from './tools/ping-service.js';

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
    this.setupTools();
  }

  setupTools() {
    // Initialize tools
    this.getCaseTool = new GetCaseTool();
    this.createCaseTool = new CreateCaseTool();
    this.deleteCaseTool = new DeleteCaseTool();
    this.getCaseTypeBulkActionTool = new GetCaseTypeBulkActionTool();
    this.pingServiceTool = new PingServiceTool();
  }

  setupHandlers() {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          GetCaseTool.getDefinition(),
          CreateCaseTool.getDefinition(),
          DeleteCaseTool.getDefinition(),
          GetCaseTypeBulkActionTool.getDefinition(),
          PingServiceTool.getDefinition()
        ]
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_case':
            return await this.getCaseTool.execute(args);

          case 'create_case':
            return await this.createCaseTool.execute(args);

          case 'delete_case':
            return await this.deleteCaseTool.execute(args);

          case 'get_case_type_bulk_action':
            return await this.getCaseTypeBulkActionTool.execute(args);

          case 'ping_pega_service':
            return await this.pingServiceTool.execute(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
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
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Pega DX MCP server running on stdio');
  }
}

// Start the server
const server = new PegaDXMCPServer();
server.run().catch(console.error);
