import { BaseTool } from '../../registry/base-tool.js';

export class ChangeToStageTool extends BaseTool {
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
      name: 'change_to_stage',
      description: 'Change to a specified stage of a case based on stageID passed. Allows navigation to any valid stage (primary, alternate) within a case workflow.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (e.g., "MYORG-SERVICES-WORK S-293001"). Must be a complete case identifier including spaces and special characters.'
          },
          stageID: {
            type: 'string',
            description: 'Stage ID to navigate to (e.g., "PRIM1", "ALT1"). Must be a valid stage identifier for the case type.'
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
        required: ['caseID', 'stageID', 'eTag']
      }
    };
  }

  /**
   * Execute the change to stage operation
   */
  async execute(params) {
    const { caseID, stageID, eTag, viewType, cleanupProcesses } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'stageID', 'eTag']);
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
      `Change to Stage: ${caseID} -> ${stageID}`,
      async () => await this.pegaClient.changeToStage(caseID.trim(), stageID.trim(), eTag.trim(), { viewType, cleanupProcesses }),
      { viewType, cleanupProcesses }
    );
  }
}
