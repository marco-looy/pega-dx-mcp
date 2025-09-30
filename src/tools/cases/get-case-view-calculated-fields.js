import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class GetCaseViewCalculatedFieldsTool extends BaseTool {
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
      name: 'get_case_view_calculated_fields',
      description: 'Get calculated fields for a given case view. Retrieves only the requested calculated fields from the case view. All requested calculated fields in the request body must be included in the view. Any requested fields that are not part of the view will be filtered out.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (case ID) to retrieve calculated fields from. Example: "MYORG-SERVICES-WORK S-293001". Must be a complete case identifier including spaces and special characters.'
          },
          viewID: {
            type: 'string',
            description: 'Name of the view from which calculated fields are retrieved - ID of the view rule. This identifies the specific view containing the calculated fields to be evaluated.'
          },
          calculations: {
            type: 'object',
            description: 'Object containing the fields data to retrieve their respective calculated values. Must contain a "fields" array with field objects.',
            properties: {
              fields: {
                type: 'array',
                description: 'Array of field objects specifying which calculated fields to retrieve from the view.',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Name of the calculated field to retrieve. Can include property references starting with dot notation (e.g., ".LoanEligibilityCheckListCountAll").'
                    },
                    context: {
                      type: 'string',
                      description: 'Context for the calculated field evaluation. Optional parameter that specifies the context in which the field should be evaluated. Default: "content".',
                      default: 'content'
                    }
                  },
                  required: ['name'],
                  additionalProperties: false
                },
                minItems: 1
              },
              whens: {
                type: 'array',
                description: 'Array of when condition objects for conditional field evaluation. Optional parameter for advanced field calculation scenarios.',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Name of the when condition.'
                    },
                    context: {
                      type: 'string',
                      description: 'Context for the when condition evaluation.'
                    }
                  },
                  required: ['name'],
                  additionalProperties: false
                }
              }
            },
            required: ['fields'],
            additionalProperties: false
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID', 'viewID', 'calculations']
      }
    };
  }

  /**
   * Execute the get case view calculated fields operation
   */
  async execute(params) {
    const { caseID, viewID, calculations } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID', 'viewID', 'calculations']);
      if (requiredValidation) {
        return requiredValidation;
      }

    // Additional validation for calculations structure
    if (!calculations || typeof calculations !== 'object' || Array.isArray(calculations)) {
      return {
        error: 'Invalid calculations parameter. Must be an object containing field specifications.'
      };
    }

    if (!calculations.fields || !Array.isArray(calculations.fields) || calculations.fields.length === 0) {
      return {
        error: 'Invalid calculations.fields parameter. Must be a non-empty array of field objects.'
      };
    }

    // Validate each field object
    for (let i = 0; i < calculations.fields.length; i++) {
      const field = calculations.fields[i];
      
      if (!field || typeof field !== 'object' || Array.isArray(field)) {
        return {
          error: `Invalid field object at index ${i}. Must be an object with required 'name' property.`
        };
      }

      if (!field.name || typeof field.name !== 'string' || field.name.trim() === '') {
        return {
          error: `Invalid field name at index ${i}. Must be a non-empty string.`
        };
      }

      if (field.context !== undefined && (typeof field.context !== 'string' || field.context.trim() === '')) {
        return {
          error: `Invalid field context at index ${i}. When provided, must be a non-empty string.`
        };
      }
    }

    // Validate whens array if provided
    if (calculations.whens !== undefined) {
      if (!Array.isArray(calculations.whens)) {
        return {
          error: 'Invalid calculations.whens parameter. Must be an array of when condition objects.'
        };
      }

      for (let i = 0; i < calculations.whens.length; i++) {
        const when = calculations.whens[i];
        
        if (!when || typeof when !== 'object' || Array.isArray(when)) {
          return {
            error: `Invalid when object at index ${i}. Must be an object with required 'name' property.`
          };
        }

        if (!when.name || typeof when.name !== 'string' || when.name.trim() === '') {
          return {
            error: `Invalid when name at index ${i}. Must be a non-empty string.`
          };
        }

        if (when.context !== undefined && (typeof when.context !== 'string' || when.context.trim() === '')) {
          return {
            error: `Invalid when context at index ${i}. When provided, must be a non-empty string.`
          };
        }
      }
    }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Case View Calculated Fields: ${viewID} for ${caseID}`,
        async () => await this.pegaClient.getCaseViewCalculatedFields(
          caseID.trim(),
          viewID.trim(),
          calculations
        ),
        { caseID, viewID, calculations, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Get Case View Calculated Fields\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Override formatSuccessResponse to add calculated fields specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID, viewID, calculations, sessionInfo } = options;

    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }
    
    response += '### Request Details\n';
    response += `- **Case ID**: ${caseID}\n`;
    response += `- **View ID**: ${viewID}\n`;
    response += `- **Fields Requested**: ${calculations.fields.length}\n`;
    if (calculations.whens && calculations.whens.length > 0) {
      response += `- **When Conditions**: ${calculations.whens.length}\n`;
    }

    // Display requested fields
    response += '\n#### Requested Fields\n';
    calculations.fields.forEach((field, index) => {
      response += `${index + 1}. **${field.name}**`;
      if (field.context) {
        response += ` (context: ${field.context})`;
      }
      response += '\n';
    });

    if (calculations.whens && calculations.whens.length > 0) {
      response += '\n#### When Conditions\n';
      calculations.whens.forEach((when, index) => {
        response += `${index + 1}. **${when.name}**`;
        if (when.context) {
          response += ` (context: ${when.context})`;
        }
        response += '\n';
      });
    }

    // Display case data and calculated field results
    if (data.data) {
      response += '\n### Calculated Field Results\n';
      
      // Handle case info and content
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        
        response += `- **Case Type**: ${caseInfo.caseTypeName || caseInfo.classID || 'N/A'}\n`;
        response += `- **Case Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stage || 'N/A'}\n`;
        response += `- **Step**: ${caseInfo.step || 'N/A'}\n\n`;
        
        // Display calculated field values from content
        if (caseInfo.content && Object.keys(caseInfo.content).length > 0) {
          response += '#### Calculated Field Values\n';
          
          // Track which requested fields were returned
          const returnedFields = [];
          const filteredFields = [];
          
          calculations.fields.forEach(requestedField => {
            const fieldName = requestedField.name;
            
            if (caseInfo.content.hasOwnProperty(fieldName)) {
              const value = caseInfo.content[fieldName];
              response += `- **${fieldName}**: ${value !== null && value !== undefined ? value : 'null'}\n`;
              returnedFields.push(fieldName);
            } else {
              filteredFields.push(fieldName);
            }
          });

          // Show field availability summary
          response += '\n#### Field Availability Summary\n';
          response += `- **Fields Returned**: ${returnedFields.length} of ${calculations.fields.length} requested\n`;
          
          if (returnedFields.length > 0) {
            response += `- **Successful Fields**: ${returnedFields.join(', ')}\n`;
          }
          
          if (filteredFields.length > 0) {
            response += `- **Filtered Fields**: ${filteredFields.join(', ')}\n`;
            response += '  *(These fields are not part of the view or not accessible)*\n';
          }

          // Display other content fields (non-calculated)
          const otherFields = Object.keys(caseInfo.content).filter(key => 
            key !== 'classID' && 
            !calculations.fields.some(field => field.name === key)
          );
          
          if (otherFields.length > 0) {
            response += '\n#### Additional Case Content\n';
            otherFields.forEach(key => {
              const value = caseInfo.content[key];
              if (value !== null && value !== undefined) {
                response += `- **${key}**: ${value}\n`;
              }
            });
          }
        } else {
          response += '#### No calculated field values returned\n';
          response += '- All requested fields may have been filtered out\n';
          response += '- Verify that the requested fields exist in the specified view\n';
        }
      }

      // Display any other data properties
      const otherDataKeys = Object.keys(data.data).filter(key => key !== 'caseInfo');
      if (otherDataKeys.length > 0) {
        response += '\n#### Additional Response Data\n';
        otherDataKeys.forEach(key => {
          const value = data.data[key];
          if (value !== null && value !== undefined) {
            if (typeof value === 'object') {
              response += `- **${key}**: ${JSON.stringify(value, null, 2)}\n`;
            } else {
              response += `- **${key}**: ${value}\n`;
            }
          }
        });
      }
    }

    // Note about UI Resources (this API doesn't return uiResources)
    response += '\n### Processing Details\n';
    response += '- **View Validation**: Case ID and View ID validated successfully\n';
    response += '- **Field Filtering**: API filtered requested fields to only those present in the view\n';
    response += '- **Calculation**: Requested calculated fields evaluated and returned\n';
    response += '- **UI Resources**: Not returned by this API (calculated fields only)\n';
    
    return response;
  }
}
