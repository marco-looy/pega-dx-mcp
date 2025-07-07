import { BaseTool } from '../../registry/base-tool.js';

export class AddOptionalProcessTool extends BaseTool {
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
      name: 'add_optional_process',
      description: 'Add stage or case-wide optional process and return details of the next assignment in the process. The API is invoked when a user tries to initiate an optional action listed under case actions which are configured and designed as a process under case wide actions or stage-only actions.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to add optional process to. Example: "MYORG-SERVICES-WORK S-293001". Must be a complete case identifier including spaces and special characters.'
          },
          processID: {
            type: 'string',
            description: 'Process ID - Name of the process which is the ID of a flow rule. Example: "UpdateContactDetails". ProcessID can be retrieved with a lookup for ID attribute under availableProcesses node of a DX API response.'
          },
          viewType: {
            type: 'string',
            enum: ['none', 'form', 'page'],
            description: 'Type of view data to return. "none" returns no uiResources, data.caseInfo.content contains the fields of the pyDetails view (default), "form" returns the form UI metadata (read-only review mode, without page-specific metadata) in the uiResources object, "page" returns the full page (read-only review mode) UI metadata in the uiResources object.',
            default: 'none'
          }
        },
        required: ['caseID', 'processID']
      }
    };
  }

  /**
   * Execute the add optional process operation
   */
  async execute(params) {
    const { caseID, processID, viewType } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'processID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate enum parameters using base class
    const enumValidation = this.validateEnumParams(params, {
      viewType: ['none', 'form', 'page']
    });
    if (enumValidation) {
      return enumValidation;
    }

    // Execute with standardized error handling
    return await this.executeWithErrorHandling(
      `Add Optional Process: ${processID} to case ${caseID}`,
      async () => await this.pegaClient.addOptionalProcess(caseID.trim(), processID.trim(), { viewType }),
      { processID, viewType }
    );
  }
}
