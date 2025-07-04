#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GetCaseTool } from './tools/cases/get-case.js';
import { CreateCaseTool } from './tools/cases/create-case.js';
import { DeleteCaseTool } from './tools/cases/delete-case.js';
import { GetCaseViewTool } from './tools/cases/get-case-view.js';
import { GetCaseStagesTool } from './tools/cases/get-case-stages.js';
import { GetCaseActionTool } from './tools/cases/get-case-action.js';
import { PerformBulkActionTool } from './tools/cases/perform-bulk-action.js';
import { GetCaseTypesTool } from './tools/casetypes/get-case-types.js';
import { GetCaseTypeBulkActionTool } from './tools/casetypes/get-case-type-bulk-action.js';
import { GetNextAssignmentTool } from './tools/assignments/get-next-assignment.js';
import { GetAssignmentTool } from './tools/assignments/get-assignment.js';
import { GetAssignmentActionTool } from './tools/assignments/get-assignment-action.js';
import { PerformAssignmentActionTool } from './tools/assignments/perform-assignment-action.js';
import { RefreshAssignmentActionTool } from './tools/assignments/refresh-assignment-action.js';
import { UploadAttachmentTool } from './tools/attachments/upload-attachment.js';
import { AddCaseAttachmentsTool } from './tools/attachments/add-case-attachments.js';
import { GetCaseAttachmentsTool } from './tools/attachments/get-case-attachments.js';
import { GetAttachmentCategoriesTool } from './tools/attachments/get-attachment-categories.js';
import { GetAttachmentTool } from './tools/attachments/get-attachment.js';
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
    this.getCaseViewTool = new GetCaseViewTool();
    this.getCaseStagesTool = new GetCaseStagesTool();
    this.getCaseActionTool = new GetCaseActionTool();
    this.performBulkActionTool = new PerformBulkActionTool();
    this.getCaseTypeBulkActionTool = new GetCaseTypeBulkActionTool();
    this.getCaseTypesTool = new GetCaseTypesTool();
    this.getNextAssignmentTool = new GetNextAssignmentTool();
    this.getAssignmentTool = new GetAssignmentTool();
    this.getAssignmentActionTool = new GetAssignmentActionTool();
    this.performAssignmentActionTool = new PerformAssignmentActionTool();
    this.refreshAssignmentActionTool = new RefreshAssignmentActionTool();
    this.uploadAttachmentTool = new UploadAttachmentTool();
    this.addCaseAttachmentsTool = new AddCaseAttachmentsTool();
    this.getCaseAttachmentsTool = new GetCaseAttachmentsTool();
    this.getAttachmentCategoriesTool = new GetAttachmentCategoriesTool();
    this.getAttachmentTool = new GetAttachmentTool();
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
          GetCaseViewTool.getDefinition(),
          GetCaseStagesTool.getDefinition(),
          GetCaseActionTool.getDefinition(),
          PerformBulkActionTool.getDefinition(),
          GetCaseTypeBulkActionTool.getDefinition(),
          GetCaseTypesTool.getDefinition(),
          GetNextAssignmentTool.getDefinition(),
          GetAssignmentTool.getDefinition(),
          GetAssignmentActionTool.getDefinition(),
          PerformAssignmentActionTool.getDefinition(),
          RefreshAssignmentActionTool.getDefinition(),
          UploadAttachmentTool.getDefinition(),
          AddCaseAttachmentsTool.getDefinition(),
          GetCaseAttachmentsTool.getDefinition(),
          GetAttachmentCategoriesTool.getDefinition(),
          GetAttachmentTool.getDefinition(),
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

          case 'get_case_view':
            return await this.getCaseViewTool.execute(args);

          case 'get_case_stages':
            return await this.getCaseStagesTool.execute(args);

          case 'get_case_action':
            return await this.getCaseActionTool.execute(args);

          case 'perform_bulk_action':
            return await this.performBulkActionTool.execute(args);

          case 'get_case_type_bulk_action':
            return await this.getCaseTypeBulkActionTool.execute(args);

          case 'get_case_types':
            return await this.getCaseTypesTool.execute(args);

          case 'get_next_assignment':
            return await this.getNextAssignmentTool.execute(args);

          case 'get_assignment':
            return await this.getAssignmentTool.execute(args);

          case 'get_assignment_action':
            return await this.getAssignmentActionTool.execute(args);

          case 'perform_assignment_action':
            return await this.performAssignmentActionTool.execute(args);

          case 'refresh_assignment_action':
            return await this.refreshAssignmentActionTool.execute(args);

          case 'upload_attachment':
            return await this.uploadAttachmentTool.execute(args);

          case 'add_case_attachments':
            return await this.addCaseAttachmentsTool.execute(args);

          case 'get_case_attachments':
            return await this.getCaseAttachmentsTool.execute(args);

          case 'get_attachment_categories':
            return await this.getAttachmentCategoriesTool.execute(args);

          case 'get_attachment':
            return await this.getAttachmentTool.execute(args);

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
