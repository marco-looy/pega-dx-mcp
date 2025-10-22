import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class UpdateCaseTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'cases';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'update_case',
      description: 'Update a Pega case by directly modifying case properties. V1 EXCLUSIVE - only available in Traditional DX API. V2 uses perform_case_action instead. If eTag is not provided, automatically fetches the latest eTag from the case for seamless operation. Performs case-wide or stage-wide local action (defaults to pyUpdateCaseDetails if actionID not specified).',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to update. Example: "OZNR3E-MYTEST-WORK C-3". Must be a complete case identifier including spaces and special characters.'
          },
          content: {
            type: 'object',
            description: 'Map of case properties to update. Only valid case properties can be set. Example: {"Status": "Approved", "Priority": "High"}. Empty object is valid for action-only updates.'
          },
          actionID: {
            type: 'string',
            description: 'Optional action ID to perform (defaults to pyUpdateCaseDetails). Specifies the case-wide or stage-wide local action. Example: "pyUpdateCaseDetails", "ApproveCase".'
          },
          eTag: {
            type: 'string',
            description: 'Optional eTag for optimistic locking (if-match header). If not provided, automatically fetches the latest eTag from the case. Provide this for manual eTag management or to prevent auto-fetch overhead. Format: "20251016T120000.000 GMT"'
          },
          pageInstructions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                instruction: {
                  type: 'string',
                  enum: ['UPDATE', 'REPLACE', 'DELETE', 'APPEND', 'INSERT', 'MOVE'],
                  description: 'The type of page instruction: UPDATE (add fields to page), REPLACE (replace entire page), DELETE (remove page), APPEND (add item to page list), INSERT (insert item in page list), MOVE (reorder page list items)'
                },
                target: {
                  type: 'string',
                  description: 'The target embedded page name'
                },
                content: {
                  type: 'object',
                  description: 'Content to set on the embedded page (required for UPDATE and REPLACE)'
                }
              },
              required: ['instruction', 'target'],
              description: 'Page operation for embedded pages. Use REPLACE instruction to set embedded page references with full object including pzInsKey. Example: {"instruction": "REPLACE", "target": "PageName", "content": {"Property": "value", "pyID": "ID-123", "pzInsKey": "CLASS-NAME ID-123"}}'
            },
            description: 'Optional list of page-related operations for embedded pages, page lists, or page groups. Required for setting embedded page references.'
          },
          attachments: {
            type: 'array',
            description: 'Optional list of attachments to add to the case during update.',
            items: {
              type: 'object'
            }
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID', 'content']
      }
    };
  }

  /**
   * Execute the update case operation
   */
  async execute(params) {
    const { caseID, content, actionID, eTag, pageInstructions, attachments } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Check if V1 API
      if (this.pegaClient.getApiVersion() !== 'v1') {
        return {
          error: 'update_case is only available in Traditional DX API (V1). For V2, use perform_case_action tool instead with actionID "pyUpdateCaseDetails".'
        };
      }

      // Validate required parameters
      const requiredValidation = this.validateRequiredParams(params, ['caseID', 'content']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Update Case: ${caseID}`,
        async () => {
          const options = { content };
          if (actionID) options.actionID = actionID;
          if (eTag) options.eTag = eTag;
          if (pageInstructions) options.pageInstructions = pageInstructions;
          if (attachments) options.attachments = attachments;

          return await this.pegaClient.updateCase(caseID.trim(), options);
        },
        { caseID, actionID, eTag, hasContent: !!content, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Update Case

**Unexpected Error**: ${error.message}

${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Override formatSuccessResponse for update case specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID, actionID, eTag, hasContent, sessionInfo } = options;

    let response = `## ${operation}\n\n`;
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }

    // Display update summary
    response += '### Update Summary\n';
    response += `- **Case ID**: ${caseID}\n`;
    response += `- **Action**: ${actionID || 'pyUpdateCaseDetails (default)'}\n`;
    response += `- **HTTP Status**: ${data.metadata?.statusCode || 'N/A'}\n`;
    response += `- **API Version**: ${data.metadata?.apiVersion || 'v1'}\n`;

    if (data.metadata?.autoFetchedETag) {
      response += '\n### 🔄 Automatic eTag Management\n';
      response += '- ✅ Latest eTag automatically fetched before update\n';
      response += '- No manual GET operation needed\n';
      response += '- Optimistic locking ensured\n';
    } else if (eTag) {
      response += '\n### 🔑 Manual eTag Provided\n';
      response += `- eTag used: \`${eTag}\`\n`;
      response += '- Manual eTag management mode\n';
    }

    // Display new eTag for future operations
    if (data.eTag) {
      response += '\n### 🔑 New eTag\n';
      response += `- **eTag**: \`${data.eTag}\`\n`;
      response += '- Use this eTag for subsequent operations\n';
      response += '- Case state has been updated\n';
    }

    if (hasContent) {
      response += '\n### 📝 Content Update\n';
      response += '- ✅ Case properties updated\n';
    } else {
      response += '\n### 📝 Action-Only Update\n';
      response += '- No content properties changed\n';
      response += '- Action performed on case\n';
    }

    response += '\n### ✅ Operation Status\n';
    response += `- ${data.data?.message || 'Case updated successfully'}\n`;
    response += '- Case committed to database\n';
    response += '- Use get_case to view updated case details\n';

    response += '\n### 📌 V1 vs V2\n';
    response += '- **V1**: Direct case update with PUT /cases/{ID}\n';
    response += '- **V2**: Use perform_case_action with pyUpdateCaseDetails instead\n';
    response += '- **Auto-fetch**: Available in both V1 and V2 ✅\n';

    return response;
  }

  /**
   * Override formatErrorResponse for update case specific error context
   */
  formatErrorResponse(operation, error, options = {}) {
    const { caseID, actionID, eTag } = options;

    let response = `## ❌ ${operation} Failed\n\n`;
    response += `*Error occurred at: ${new Date().toISOString()}*\n\n`;

    response += '### Operation Context\n';
    response += `- **Case ID**: ${caseID}\n`;
    response += `- **Action**: ${actionID || 'pyUpdateCaseDetails (default)'}\n`;
    response += `- **eTag Used**: ${eTag || '(auto-fetch)'}\n\n`;

    response += `### Error Details\n`;
    response += `- **Type**: ${error.type}\n`;
    response += `- **Message**: ${error.message}\n`;
    response += `- **Details**: ${error.details}\n`;

    if (error.status) {
      response += `- **HTTP Status**: ${error.status} ${error.statusText || ''}\n`;
    }

    // Provide specific guidance based on error type
    response += '\n### Troubleshooting Guidance\n';

    switch (error.type) {
      case 'AUTO_FETCH_FAILED':
        response += '**Auto-Fetch Failed**:\n';
        response += '- Could not retrieve case to obtain eTag\n';
        response += '- **Solution**: Verify case ID is correct and case exists\n';
        response += '- Or provide eTag manually if you already have it\n';
        break;

      case 'ETAG_MISSING':
        response += '**eTag Missing**:\n';
        response += '- Case retrieved but no eTag in response\n';
        response += '- **Solution**: This may indicate a server configuration issue\n';
        response += '- Contact Pega administrator\n';
        break;

      case 'HTTP_ERROR':
        if (error.status === 412) {
          response += '**Precondition Failed (412)**:\n';
          response += '- eTag is stale - case was modified by another user\n';
          response += '- **Solution**: Retry operation (eTag will auto-fetch latest)\n';
        } else {
          response += '**HTTP Error**:\n';
          response += '- Unexpected HTTP error occurred\n';
          response += '- **Solution**: Check error details and retry\n';
        }
        break;

      case 'NOT_FOUND':
        response += '**Case Not Found (404)**:\n';
        response += '- Case ID could not be found\n';
        response += '- **Solution**: Verify case ID format and spelling\n';
        response += '- Use get_case tool to confirm case exists\n';
        break;

      case 'FORBIDDEN':
        response += '**Access Denied (403)**:\n';
        response += '- User lacks permission to update this case\n';
        response += '- **Solution**: Contact administrator to verify access rights\n';
        break;

      default:
        response += '**General Error**:\n';
        response += '- Review error details above\n';
        response += '- **Solution**: Verify case ID and parameters\n';
        break;
    }

    return response;
  }
}
