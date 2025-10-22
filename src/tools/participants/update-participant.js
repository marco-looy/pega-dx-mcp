import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class UpdateParticipantTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'participants';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'update_participant',
      description: 'Update participant details in a Pega case by case ID and participant ID. If no eTag is provided, automatically fetches the latest eTag from the case for seamless operation. Allows updating participant information such as contact details, personal information, and other properties. Requires an eTag value for optimistic locking and returns updated participant details with optional UI resources.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) containing the participant to update. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          participantID: {
            type: 'string',
            description: 'Participant ID to update. This identifies the specific participant within the case whose information will be modified.'
          },
          eTag: {
            type: 'string',
            description: 'Optional eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. If not provided, the tool will automatically fetch the latest eTag from the case. For manual eTag management, provide the eTag from a previous case operation. Used for optimistic locking to prevent concurrent modification conflicts.'
          },
          content: {
            type: 'object',
            description: 'Optional participant data object with properties to update. Can include personal information like pyFirstName, pyLastName, pyEmail1, pyPhoneNumber, etc. Only provided properties will be updated - others remain unchanged.',
            properties: {
              pyFirstName: {
                type: 'string',
                description: 'First name of the participant'
              },
              pyLastName: {
                type: 'string',
                description: 'Last name of the participant'
              },
              pyFullName: {
                type: 'string',
                description: 'Full name of the participant'
              },
              pyEmail1: {
                type: 'string',
                description: 'Primary email address of the participant'
              },
              pyPhoneNumber: {
                type: 'string',
                description: 'Phone number of the participant'
              },
              pyTitle: {
                type: 'string',
                description: 'Title or position of the participant'
              }
            }
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
          viewType: {
            type: 'string',
            enum: ['form', 'none'],
            description: 'Type of view data to return after update. "form" returns form UI metadata in uiResources object for display purposes, "none" returns no UI resources. Default: "form".',
            default: 'form'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID', 'participantID']
      }
    };
  }

  /**
   * Execute the update participant operation
   */
  async execute(params) {
    const { caseID, participantID, eTag, content, pageInstructions, viewType } = params;
    let sessionInfo = null;

    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID', 'participantID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Validate enum parameters using base class
      const enumValidation = this.validateEnumParams(params, {
        viewType: ['form', 'none']
      });
      if (enumValidation) {
        return enumValidation;
      }

      // Prepare options object for API call
      const options = {};
      if (content) {
        options.content = content;
      }
      if (pageInstructions) {
        options.pageInstructions = pageInstructions;
      }
      if (viewType) {
        options.viewType = viewType;
      }

      // Auto-fetch eTag if not provided
      let finalETag = eTag;
      let autoFetchedETag = false;

      if (!finalETag) {
        try {
          console.log(`Auto-fetching latest eTag for participant operation on ${caseID}...`);
          const caseResponse = await this.pegaClient.getCase(caseID.trim());

          if (!caseResponse || !caseResponse.success) {
            const errorMsg = `Failed to auto-fetch eTag: ${caseResponse?.error?.message || 'Unknown error'}`;
            return {
              error: errorMsg
            };
          }

          finalETag = caseResponse.eTag;
          autoFetchedETag = true;
          console.log(`Successfully auto-fetched eTag: ${finalETag}`);

          if (!finalETag) {
            const errorMsg = 'Auto-fetch succeeded but no eTag was returned from get_case. This may indicate a server issue.';
            return {
              error: errorMsg
            };
          }
        } catch (error) {
          const errorMsg = `Failed to auto-fetch eTag: ${error.message}`;
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

      return await this.executeWithErrorHandling(
        `Update Participant: ${caseID.trim()} / ${participantID.trim()}`,
        async () => await this.pegaClient.updateParticipant(caseID.trim(), participantID.trim(), finalETag.trim(), options),
        {
          caseID: caseID.trim(),
          participantID: participantID.trim(),
          eTag: '***', // Hide eTag in logs for security
          hasContent: !!content,
          hasPageInstructions: !!pageInstructions,
          viewType,
          sessionInfo
        }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Update Participant: ${caseID} / ${participantID}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
