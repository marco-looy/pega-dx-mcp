import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

/**
 * Get Cases Tool
 *
 * V1 EXCLUSIVE: Get all cases created by authenticated user in their default work pool.
 *
 * This endpoint is only available in Traditional DX API (V1). V2 uses Data Views instead.
 *
 * Limitations:
 * - Maximum 500 cases (controlled by pyMaxRecords DSS)
 * - Only returns cases from user's default work pool
 * - Returns cases in oldest-to-newest order
 * - No pagination support
 * - No filtering options
 *
 * Required Privilege: pxGetCases
 */
export class GetCasesTool extends BaseTool {
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
      name: 'get_cases',
      description: 'Get all cases created by authenticated user (V1 EXCLUSIVE - max 500 cases, oldest to newest). V2 users should use Data Views instead. Requires pxGetCases privilege.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: []
      }
    };
  }

  /**
   * Execute the get cases operation
   */
  async execute(params) {
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Check API version
      const apiVersion = this.pegaClient.getApiVersion();
      if (apiVersion !== 'v1') {
        return {
          content: [{
            type: 'text',
            text: `## Error: Get Cases (V1 Exclusive)

**Version Mismatch**: This endpoint is only available in Traditional DX API (V1).

**Current API Version**: ${apiVersion.toUpperCase()}

**Solution**: Set \`PEGA_API_VERSION=v1\` environment variable to use this endpoint.

**V2 Alternative**: Use Data Views to query cases:
- Tool: \`get_list_data_view\`
- Data View: \`D_MyCaseList\` or similar case list data view
- Filter by: \`pyCreatedBy\` = current user

${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
          }]
        };
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        'Get All Cases (V1)',
        async () => await this.pegaClient.getAllCases(),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Get Cases

**Unexpected Error**: ${error.message}

${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Override formatSuccessResponse to display cases list
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { sessionInfo } = options;

    let response = `## ${operation}\n\n`;
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }

    // Display metadata prominently
    if (data.metadata) {
      response += '### 📊 Results Metadata\n';
      response += `- **Total Cases Retrieved**: ${data.metadata.count}\n`;
      response += `- **Maximum Records**: ${data.metadata.maxRecords} (pyMaxRecords DSS)\n`;
      response += `- **API Version**: ${data.metadata.apiVersion.toUpperCase()}\n`;
      response += `- **Order**: Oldest to Newest\n\n`;

      if (data.metadata.count === data.metadata.maxRecords) {
        response += `⚠️  **Warning**: Result set may be truncated at ${data.metadata.maxRecords} records.\n\n`;
      }
    }

    // Cases section header
    response += '### 📋 Cases\n\n';

    // Display cases summary
    if (data.data && data.data.cases && data.data.cases.length > 0) {
      response += `**Found ${data.data.cases.length} cases**\n\n`;

      // Group cases by status for better overview
      const casesByStatus = {};
      data.data.cases.forEach(c => {
        const status = c.status || 'Unknown';
        if (!casesByStatus[status]) {
          casesByStatus[status] = [];
        }
        casesByStatus[status].push(c);
      });

      response += '#### Status Summary\n';
      Object.keys(casesByStatus).forEach(status => {
        response += `- **${status}**: ${casesByStatus[status].length} cases\n`;
      });
      response += '\n';

      // Display first 10 cases in detail
      response += '#### Case Details (First 10)\n\n';
      const casesToShow = data.data.cases.slice(0, 10);
      casesToShow.forEach((caseObj, index) => {
        response += `##### ${index + 1}. ${caseObj.ID}\n`;
        response += `- **Case Type**: ${caseObj.caseTypeID || 'N/A'}\n`;
        response += `- **Name**: ${caseObj.name || 'N/A'}\n`;
        response += `- **Status**: ${caseObj.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseObj.stage || 'N/A'}\n`;
        response += `- **Urgency**: ${caseObj.urgency || 0}\n`;
        response += `- **Created**: ${caseObj.createTime || 'N/A'} by ${caseObj.createdBy || 'N/A'}\n`;
        response += `- **Last Updated**: ${caseObj.lastUpdateTime || 'N/A'} by ${caseObj.lastUpdatedBy || 'N/A'}\n`;
        if (caseObj.parentCaseID) {
          response += `- **Parent Case**: ${caseObj.parentCaseID}\n`;
        }
        response += '\n';
      });

      if (data.data.cases.length > 10) {
        response += `*... and ${data.data.cases.length - 10} more cases*\n\n`;
      }
    } else {
      response += 'No cases found for the authenticated user.\n\n';
    }

    // Add V1 notes
    response += '### 📝 V1 API Notes\n';
    response += '- This endpoint is V1 EXCLUSIVE (not available in V2)\n';
    response += '- Returns cases from user\'s default work pool only\n';
    response += '- Maximum 500 cases (controlled by pyMaxRecords DSS)\n';
    response += '- No pagination or filtering options\n';
    response += '- Cases ordered from oldest to newest\n';
    response += '- Requires pxGetCases privilege\n\n';

    return response;
  }
}
