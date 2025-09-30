import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

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
      description: 'Change to a specified stage of a case based on stageID passed. Allows navigation to any valid stage (primary, alternate) within a case workflow. If no eTag is provided, automatically fetches the latest eTag from the case action for seamless operation.',
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
            description: 'Optional eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. If not provided, the tool will automatically fetch the latest eTag from the case action. For manual eTag management, provide the eTag from a previous case operation. Used for optimistic locking to prevent concurrent modification conflicts.'
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
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID', 'stageID']
      }
    };
  }

  /**
   * Execute the change to stage operation
   */
  async execute(params) {
    console.log(`[DEBUG] change_to_stage execute called with params:`, JSON.stringify(params, null, 2));
    const { caseID, stageID, eTag, viewType, cleanupProcesses } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'stageID']);
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

    // Auto-fetch eTag if not provided
    let finalETag = eTag;
    let autoFetchedETag = false;
    
    if (!finalETag) {
      console.log(`[DEBUG] Starting auto-fetch for case ${caseID}`);
      try {
        console.log(`Auto-fetching latest eTag for stage change on case ${caseID}...`);
        const caseActionResponse = await this.pegaClient.getCaseAction(caseID.trim(), 'pyChangeStage', {
          viewType: 'form',  // getCaseAction only accepts 'form' or 'page', not 'none'
          excludeAdditionalActions: true
        });
        
        console.log(`[DEBUG] getCaseAction response:`, JSON.stringify(caseActionResponse, null, 2));
        
        if (!caseActionResponse || !caseActionResponse.success) {
          const errorMsg = `Failed to auto-fetch eTag: ${caseActionResponse?.error?.message || 'Unknown error'}`;
          console.log(`[DEBUG] Auto-fetch failed: ${errorMsg}`);
          return {
            error: errorMsg
          };
        }
        
        finalETag = caseActionResponse.eTag;
        autoFetchedETag = true;
        console.log(`Successfully auto-fetched eTag: ${finalETag}`);
        
        if (!finalETag) {
          const errorMsg = 'Auto-fetch succeeded but no eTag was returned from get_case_action. This may indicate a server issue.';
          console.log(`[DEBUG] ${errorMsg}`);
          return {
            error: errorMsg
          };
        }
      } catch (error) {
        const errorMsg = `Failed to auto-fetch eTag: ${error.message}`;
        console.log(`[DEBUG] Exception during auto-fetch: ${errorMsg}`);
        console.log(`[DEBUG] Stack trace:`, error.stack);
        return {
          error: errorMsg
        };
      }
    }
    
    // Validate eTag format (should be a timestamp-like string)
    if (typeof finalETag !== 'string' || finalETag.trim().length === 0) {
      return {
        error: 'Invalid eTag parameter. Must be a non-empty string representing case save date time.'
      };
    }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Change to Stage: ${caseID} -> ${stageID}${autoFetchedETag ? ' (auto-fetched eTag)' : ''}`,
        async () => await this.pegaClient.changeToStage(caseID.trim(), stageID.trim(), finalETag.trim(), { viewType, cleanupProcesses }),
        { viewType, cleanupProcesses, autoFetchedETag, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Change to Stage\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
