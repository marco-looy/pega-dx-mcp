import { BaseTool } from '../../registry/base-tool.js';

export class ChangeToNextStageTool extends BaseTool {
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
      name: 'change_to_next_stage',
      description: 'Navigate a Pega case to its next stage in the primary stage sequence. Cannot be used when case is in alternate stage or already in final stage.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (e.g., "MYORG-SERVICES-WORK S-293001"). Must be a complete case identifier including spaces and special characters.'
          },
          eTag: {
            type: 'string',
            description: 'eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. Required for optimistic locking to prevent concurrent modifications. Obtained from previous case operations.'
          },
          viewType: {
            type: 'string',
            enum: ['none', 'form', 'page'],
            description: 'Type of view data to return. "none" returns no UI resources (default), "form" returns form UI metadata in read-only review mode, "page" returns full page UI metadata in read-only review mode.',
            default: 'none'
          },
          cleanupProcesses: {
            type: 'boolean',
            description: 'Whether to clean up the processes, including assignments, of the stage being switched away from. Default is true. Set to false to opt out of this cleanup feature.',
            default: true
          }
        },
        required: ['caseID', 'eTag']
      }
    };
  }

  /**
   * Execute the change to next stage operation
   */
  async execute(params) {
    const { caseID, eTag, viewType, cleanupProcesses } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'eTag']);
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
      `Change to Next Stage: ${caseID}`,
      async () => await this.pegaClient.changeToNextStage(caseID.trim(), eTag.trim(), { viewType, cleanupProcesses }),
      { viewType, cleanupProcesses }
    );
  }
}
