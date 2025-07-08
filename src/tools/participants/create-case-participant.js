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
      description: 'Create a new participant in a Pega case with specified role and participant information. Adds users to case access control with appropriate permissions and role assignments.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to add participant to. Example: "ON6E5R-DIYRecipe-Work-RecipeCollection R-1008". Must be a complete case identifier including spaces and special characters.'
          },
          eTag: {
            type: 'string',
            description: 'Required eTag unique value for optimistic locking from a previous case or participant API call. Prevents concurrent modification conflicts.'
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
                      "type": "object",
                      "description": "Page operation object with instruction type and target"
            },
            description: 'Optional list of page-related operations for embedded pages, page lists, or page groups included in the participant creation view.'
          }
        },
        required: ['caseID', 'eTag', 'content', 'participantRoleID']
      }
    };
  }

  /**
   * Execute the create case participant operation
   */
  async execute(params) {
    const { caseID, eTag, content, participantRoleID, viewType, pageInstructions } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseID', 'eTag', 'content', 'participantRoleID']);
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
