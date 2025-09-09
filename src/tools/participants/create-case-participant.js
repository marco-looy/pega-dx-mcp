import { BaseTool } from '../../registry/base-tool.js';

export class CreateCaseParticipantTool extends BaseTool {
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
      name: 'create_case_participant',
      description: 'Create a new participant in a Pega case with specified role and participant information. If no eTag is provided, automatically fetches the latest eTag from the case for seamless operation. Adds users to case access control with appropriate permissions and role assignments.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to add participant to. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          eTag: {
            type: 'string',
            description: 'Optional eTag unique value representing the most recent save date time (pxSaveDateTime) of the case. If not provided, the tool will automatically fetch the latest eTag from the case. For manual eTag management, provide the eTag from a previous case operation. Used for optimistic locking to prevent concurrent modification conflicts.'
          },
          content: {
            type: 'object',
            description: 'Participant information object containing user details such as name, email, phone, and other contact information. Structure matches Data-Party schema.',
            properties: {
              pyFirstName: { type: 'string', description: 'First name of the participant' },
              pyLastName: { type: 'string', description: 'Last name of the participant' },
              pyEmail1: { type: 'string', description: 'Email address of the participant' },
              pyPhoneNumber: { type: 'string', description: 'Phone number of the participant' },
              pyWorkPartyUri: { type: 'string', description: 'Unique identifier for the participant' },
              pyFullName: { type: 'string', description: 'Full name of the participant' },
              pyTitle: { type: 'string', description: 'Title of the participant' }
            }
          },
          participantRoleID: {
            type: 'string',
            description: 'Role ID to assign to the participant. This determines the permissions and access level the participant will have for the case.'
          },
          viewType: {
            type: 'string',
            enum: ['form', 'none'],
            description: 'Type of view data to return. "form" returns form UI metadata, "none" returns no UI resources (default: "form")',
            default: 'form'
          },
          pageInstructions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                instruction: {
                  type: 'string',
                  description: 'The type of page instruction to perform'
                },
                target: {
                  type: 'string',
                  description: 'The target page or page list for the instruction'
                }
              },
              description: 'Page operation object with instruction type and target'
            },
            description: 'Optional list of page-related operations for embedded pages, page lists, or page groups included in the participant creation view.'
          }
        },
        required: ['caseID', 'content', 'participantRoleID']
      }
    };
  }

  /**
   * Execute the create case participant operation
   */
  async execute(params) {
    const { caseID, eTag, content, participantRoleID, viewType, pageInstructions } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'content', 'participantRoleID']);
    if (requiredValidation) {
      return requiredValidation;
    }

    // Validate enum parameters
    const enumValidation = this.validateEnumParams(params, {
      viewType: ['form', 'none']
    });
    if (enumValidation) {
      return enumValidation;
    }

    // Execute with standardized error handling
// Auto-fetch eTag if not provided
    let finalETag = eTag;
    let autoFetchedETag = false;
    
    if (!finalETag) {
      try {
        console.log(`Auto-fetching latest eTag for participant operation on ${caseID}...`);
        const caseResponse = await this.pegaClient.getCase(caseID.trim(), {
          viewType: 'form'  // Use form view for eTag retrieval
        });
        
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
      `Create Participant: ${caseID}`,
      async () => await this.pegaClient.createCaseParticipant(caseID.trim(), {
        eTag,
        content,
        participantRoleID,
        viewType,
        pageInstructions
      }),
      { caseID: caseID.trim(), participantRoleID }
    );
  }
}
