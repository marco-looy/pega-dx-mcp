import { BaseTool } from '../../registry/base-tool.js';

export class CreateCaseTool extends BaseTool {
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
      name: 'create_case',
      description: 'Create a new Pega case with specified case type and optional content. If no content is provided, the tool will automatically discover available fields and provide guidance. If case creation fails due to field issues, field discovery will be performed automatically.',
      inputSchema: {
        type: 'object',
        properties: {
          caseTypeID: {
            type: 'string',
            description: 'The class of the case being created (required)'
          },
          parentCaseID: {
            type: 'string',
            description: 'The ID of the case serving as the parent case (optional)'
          },
          content: {
            type: 'object',
            description: 'A map of scalar properties and embedded page properties to be set upon case creation (optional). If not provided, the tool will discover available fields and return guidance with examples.'
          },
          pageInstructions: {
            type: 'array',
            description: 'A list of page-related operations to be performed on embedded pages, page lists, or page group properties (optional)'
          },
          attachments: {
            type: 'array',
            description: 'A list of attachments to be added to specific attachment fields (optional)'
          },
          viewType: {
            type: 'string',
            enum: ['none', 'form', 'page'],
            description: 'Type of view data to return. "none" returns no UI resources, "form" returns form UI metadata, "page" returns full page UI metadata',
            default: 'none'
          },
          pageName: {
            type: 'string',
            description: 'If provided, view metadata for specific page name will be returned (only used when viewType is "page")'
          }
        },
        required: ['caseTypeID']
      }
    };
  }

  /**
   * Execute the create case operation with hybrid field discovery
   */
  async execute(params) {
    const { caseTypeID, parentCaseID, content, pageInstructions, attachments, viewType, pageName } = params;

    // Validate required parameters using base class
    const requiredValidation = this.validateRequiredParams(params, ['caseTypeID']);
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

    // Validate pageName usage
    if (pageName && viewType !== 'page') {
      return {
        error: 'pageName parameter can only be used when viewType is set to "page".'
      };
    }

    // Validate parentCaseID format if provided
    if (parentCaseID && (typeof parentCaseID !== 'string' || parentCaseID.trim() === '')) {
      return {
        error: 'Invalid parentCaseID parameter. Parent case ID must be a non-empty string if provided.'
      };
    }

    // PROACTIVE: Auto-discover when no content provided
    if (!content || Object.keys(content).length === 0) {
      return await this.discoverFieldsAndGuide(caseTypeID);
    }

    // NORMAL: Try creation with provided content
    const result = await this.executeWithErrorHandling(
      `Case Creation: ${caseTypeID}`,
      async () => await this.pegaClient.createCase({
        caseTypeID: caseTypeID.trim(),
        parentCaseID: parentCaseID?.trim(),
        content,
        pageInstructions,
        attachments,
        viewType,
        pageName
      }),
      { caseTypeID, viewType, pageName }
    );

    // REACTIVE: If the result contains a field-related error, auto-discover and guide
    if (this.isFieldRelatedErrorInResult(result)) {
      return await this.discoverFieldsAndGuide(caseTypeID, { message: this.extractErrorMessage(result) }, content);
    }

    return result;
  }

  /**
   * Discover available fields for case creation and provide guidance
   */
  async discoverFieldsAndGuide(caseTypeID, originalError = null, attemptedContent = null) {
    try {
      // Call get_case_type_action internally to discover fields
      const fieldDiscovery = await this.pegaClient.getCaseTypeAction(caseTypeID.trim(), 'Create');
      
      // Format and return field discovery guidance
      return {
        content: [
          {
            type: "text",
            text: this.formatFieldDiscoveryGuidance(caseTypeID, fieldDiscovery, originalError, attemptedContent)
          }
        ]
      };
    } catch (discoveryError) {
      // If field discovery fails, return a helpful fallback message
      let errorMessage = `Unable to discover fields for case type "${caseTypeID}".`;
      
      if (originalError) {
        errorMessage += `\n\nOriginal creation error: ${originalError.message}`;
      }
      
      errorMessage += `\n\nPlease use the get_case_type_action tool with actionID="Create" to manually discover available fields.`;
      
      return {
        error: errorMessage
      };
    }
  }

  /**
   * Check if an error is related to field validation or missing fields
   */
  isFieldRelatedError(error) {
    if (!error || !error.message) return false;
    
    const errorMessage = error.message.toLowerCase();
    const fieldErrorKeywords = [
      'field',
      'property',
      'required',
      'validation',
      'invalid',
      'missing',
      'content',
      'allowedstartingfields',
      'bad request'
    ];
    
    return fieldErrorKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Check if a result object contains a field-related error
   */
  isFieldRelatedErrorResult(result) {
    if (!result || !result.error) return false;
    
    const errorMessage = result.error.toLowerCase();
    const fieldErrorKeywords = [
      'field',
      'property',
      'required',
      'validation',
      'invalid',
      'missing',
      'content',
      'allowedstartingfields',
      'bad request'
    ];
    
    return fieldErrorKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Check if a result object contains a field-related error (in content format)
   */
  isFieldRelatedErrorInResult(result) {
    // Check if result has content array with error text
    if (result && result.content && Array.isArray(result.content) && result.content.length > 0) {
      const errorText = result.content[0].text;
      if (errorText && typeof errorText === 'string') {
        const errorMessage = errorText.toLowerCase();
        const fieldErrorKeywords = [
          'field',
          'property',
          'required',
          'validation',
          'invalid',
          'missing',
          'content',
          'allowedstartingfields',
          'bad request'
        ];
        
        return fieldErrorKeywords.some(keyword => errorMessage.includes(keyword));
      }
    }
    
    // Also check direct error field
    return this.isFieldRelatedErrorResult(result);
  }

  /**
   * Extract error message from result object (handles both formats)
   */
  extractErrorMessage(result) {
    // Check content array format first
    if (result && result.content && Array.isArray(result.content) && result.content.length > 0) {
      const errorText = result.content[0].text;
      if (errorText && typeof errorText === 'string') {
        // Extract the main error message from the formatted text
        const messageMatch = errorText.match(/\*\*Message\*\*:\s*([^\n]+)/);
        if (messageMatch) {
          return messageMatch[1].trim();
        }
        // Fallback to entire text if pattern doesn't match
        return errorText;
      }
    }
    
    // Check direct error field
    if (result && result.error) {
      return result.error;
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Generate smart field examples based on field type and name
   */
  generateFieldExample(fieldType, fieldName) {
    const fieldNameLower = fieldName.toLowerCase();
    
    // Smart field name based examples
    if (fieldNameLower.includes('name')) return 'Sample Name';
    if (fieldNameLower.includes('email')) return 'user@example.com';
    if (fieldNameLower.includes('phone')) return '+1-555-0123';
    if (fieldNameLower.includes('description')) return 'Sample description text';
    if (fieldNameLower.includes('category')) return 'General';
    if (fieldNameLower.includes('priority')) return 'Medium';
    if (fieldNameLower.includes('status')) return 'Active';
    if (fieldNameLower.includes('type')) return 'Standard';
    if (fieldNameLower.includes('amount') || fieldNameLower.includes('cost') || fieldNameLower.includes('price')) return 99.99;
    if (fieldNameLower.includes('count') || fieldNameLower.includes('number') || fieldNameLower.includes('quantity')) return 42;
    if (fieldNameLower.includes('date')) return '2025-01-15';
    if (fieldNameLower.includes('time') && !fieldNameLower.includes('date')) return '00:30';
    if (fieldNameLower.includes('url') || fieldNameLower.includes('link')) return 'https://example.com';
    if (fieldNameLower.includes('address')) return '123 Main Street, City, State 12345';
    if (fieldNameLower.includes('comment')) return 'Sample comment or note';
    
    // Type-based examples
    const examples = {
      'Text': 'Sample text value',
      'Integer': 42,
      'TimeOfDay': '00:30',
      'Date': '2025-01-15',
      'Boolean': true,
      'Decimal': 99.99,
      'Page List': [],
      'Page': {}
    };
    
    return examples[fieldType] || 'Sample value';
  }

  /**
   * Format field discovery guidance response
   */
  formatFieldDiscoveryGuidance(caseTypeID, discoveryData, originalError = null, attemptedContent = null) {
    let response = `## Field Discovery for Case Type: ${caseTypeID}\n\n`;
    
    // Add timestamp
    response += `*Field discovery completed at: ${new Date().toISOString()}*\n\n`;
    
    // Show original error if provided
    if (originalError) {
      response += `### ❌ Case Creation Error\n`;
      response += `**Error**: ${originalError.message}\n\n`;
      
      if (attemptedContent && Object.keys(attemptedContent).length > 0) {
        response += `**Attempted Content**:\n`;
        response += `\`\`\`json\n${JSON.stringify(attemptedContent, null, 2)}\n\`\`\`\n\n`;
      }
    }
    
    response += `### 📋 Available Fields for Case Creation\n\n`;
    
    // Extract and display fields from UI resources
    const fields = [];
    
    // The API response structure is: discoveryData.data.uiResources.resources.fields
    const uiResources = discoveryData.data?.uiResources;
    if (uiResources?.resources?.fields) {
      const fieldResources = uiResources.resources.fields;
      
      Object.entries(fieldResources).forEach(([fieldName, fieldData]) => {
        const field = Array.isArray(fieldData) ? fieldData[0] : fieldData;
        
        // Only include fields for the main recipe collection class
        if (field.classID === caseTypeID) {
          fields.push({
            name: fieldName,
            type: field.type || 'Unknown',
            label: field.label || fieldName,
            required: field.required || false
          });
        }
      });
    }
    
    if (fields.length > 0) {
      response += `| Field Name | Type | Label | Required | Example |\n`;
      response += `|------------|------|-------|----------|----------|\n`;
      
      // Sort fields by required first, then alphabetically
      fields.sort((a, b) => {
        if (a.required && !b.required) return -1;
        if (!a.required && b.required) return 1;
        return a.name.localeCompare(b.name);
      });
      
      fields.forEach(field => {
        const example = this.generateFieldExample(field.type, field.name);
        const exampleStr = typeof example === 'string' ? example : JSON.stringify(example);
        const requiredIcon = field.required ? '✅' : '';
        
        response += `| ${field.name} | ${field.type} | ${field.label} | ${requiredIcon} | ${exampleStr} |\n`;
      });
      
      response += `\n*Required fields are marked with ✅*\n\n`;
    } else {
      response += `No specific fields discovered. This case type may accept any content fields.\n\n`;
    }
    
    // Generate sample case creation request
    response += `### 🚀 Sample Case Creation Request\n\n`;
    response += `\`\`\`json\n`;
    response += `{\n`;
    response += `  "caseTypeID": "${caseTypeID}",\n`;
    response += `  "content": {\n`;
    
    if (fields.length > 0) {
      // Show required fields first, then some optional ones
      const requiredFields = fields.filter(f => f.required).slice(0, 3);
      const optionalFields = fields.filter(f => !f.required).slice(0, 3);
      const sampleFields = [...requiredFields, ...optionalFields];
      
      sampleFields.forEach((field, index) => {
        const example = this.generateFieldExample(field.type, field.name);
        const comma = index < sampleFields.length - 1 ? ',' : '';
        
        if (field.type === 'Page List') {
          response += `    "${field.name}": []${comma}  // Array of objects\n`;
        } else if (field.type === 'Page') {
          response += `    "${field.name}": {}${comma}  // Nested object\n`;
        } else {
          response += `    "${field.name}": ${JSON.stringify(example)}${comma}\n`;
        }
      });
    } else {
      response += `    "SampleField": "Sample Value"\n`;
    }
    
    response += `  }\n`;
    response += `}\n`;
    response += `\`\`\`\n\n`;
    
    // Add helpful tips
    response += `### 💡 Tips for Successful Case Creation\n\n`;
    response += `1. **Required Fields**: Include all fields marked with ✅\n`;
    response += `2. **Field Types**: Match the expected data types (Text, Integer, etc.)\n`;
    response += `3. **Time Format**: Use "HH:MM" format for TimeOfDay fields (e.g., "00:30")\n`;
    response += `4. **Date Format**: Use "YYYY-MM-DD" format for Date fields\n`;
    response += `5. **Complex Fields**: Page List = arrays, Page = nested objects\n\n`;
    
    // Add workflow guidance
    response += `### 🔄 Recommended Workflow\n\n`;
    response += `1. Review the available fields above\n`;
    response += `2. Use the sample JSON as a template\n`;
    response += `3. Customize field values for your specific case\n`;
    response += `4. Call create_case again with your content object\n\n`;
    
    return response;
  }

  /**
   * Override formatSuccessResponse to add case-specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseTypeID, viewType } = options;
    
    let response = `## ${operation}\n\n`;
    
    // Add timestamp
    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;
    
    // Display case ID prominently
    if (data.ID) {
      response += `### ✅ New Case ID: ${data.ID}\n\n`;
    }

    // Display eTag for future updates  
    if (data.etag) {
      response += `**eTag**: ${data.etag}\n`;
      response += `*Save this eTag for future case updates*\n\n`;
    }
    
    // Display case information
    if (data.data) {
      response += '### Case Information\n';
      
      if (data.data.caseInfo) {
        const caseInfo = data.data.caseInfo;
        response += `- **Case Type**: ${caseInfo.caseTypeName || 'N/A'}\n`;
        response += `- **Status**: ${caseInfo.status || 'N/A'}\n`;
        response += `- **Stage**: ${caseInfo.stage || 'N/A'}\n`;
        response += `- **Step**: ${caseInfo.step || 'N/A'}\n`;
        response += `- **Urgency**: ${caseInfo.urgency || 'N/A'}\n`;
        response += `- **Created**: ${caseInfo.createTime || 'N/A'}\n`;
        response += `- **Created By**: ${caseInfo.createOpName || 'N/A'}\n`;

        // Display content if available
        if (caseInfo.content && Object.keys(caseInfo.content).length > 0) {
          response += '\n### Case Content\n';
          for (const [key, value] of Object.entries(caseInfo.content)) {
            response += `- **${key}**: ${value}\n`;
          }
        }
      }
    }

    // Display next assignment information
    if (data.nextAssignmentInfo) {
      response += '\n### Next Assignment\n';
      const assignment = data.nextAssignmentInfo;
      response += `- **Assignment ID**: ${assignment.ID || 'N/A'}\n`;
      response += `- **Name**: ${assignment.name || 'N/A'}\n`;
      response += `- **Type**: ${assignment.type || 'N/A'}\n`;
      response += `- **Actions**: ${assignment.actions?.join(', ') || 'N/A'}\n`;
    } else if (data.confirmationNote) {
      response += '\n### Confirmation\n';
      response += `${data.confirmationNote}\n`;
    }

    // Add base class UI resources handling
    if (data.uiResources) {
      response += '\n### UI Resources\n';
      response += '- UI metadata has been loaded\n';
      if (data.uiResources.root) {
        response += `- Root component: ${data.uiResources.root.type || 'Unknown'}\n`;
      }
      response += '\n';
    }
    
    return response;
  }
}
