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
            description: 'A list of page-related operations to be performed on embedded pages, page lists, or page group properties (optional)'
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  description: 'Name of the attachment file'
                },
                fileContent: {
                  type: 'string',
                  description: 'Base64 encoded file content'
                },
                mimeType: {
                  type: 'string',
                  description: 'MIME type of the attachment'
                }
              },
              description: 'Attachment object with file details and metadata'
            },
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
   * Discover available fields for case creation and provide guidance using data objects approach
   */
  async discoverFieldsAndGuide(caseTypeID, originalError = null, attemptedContent = null) {
    try {
      // Step 1: Get case data objects to find the default list data view
      const dataObjectsResponse = await this.pegaClient.getDataObjects({ type: 'case' });
      
      if (!dataObjectsResponse.success) {
        throw new Error(`Failed to retrieve case data objects: ${dataObjectsResponse.error?.message || 'Unknown error'}`);
      }
      
      // Step 2: Find the matching case type in the data objects  
      const dataObjects = dataObjectsResponse.data?.dataObjects || dataObjectsResponse.data;
      const caseTypeData = this.findCaseTypeInDataObjects(dataObjects, caseTypeID);
      
      if (!caseTypeData) {
        throw new Error(`Case type "${caseTypeID}" not found in available data objects`);
      }
      
      if (!caseTypeData.defaultListDataView) {
        throw new Error(`No default list data view found for case type "${caseTypeID}"`);
      }
      
      // Step 3: Get field metadata from the data view
      const fieldMetadataResponse = await this.pegaClient.getDataViewMetadata(caseTypeData.defaultListDataView);
      
      if (!fieldMetadataResponse.success) {
        throw new Error(`Failed to retrieve field metadata for data view "${caseTypeData.defaultListDataView}": ${fieldMetadataResponse.error?.message || 'Unknown error'}`);
      }
      
      // Step 4: Process field metadata and filter out OOTB fields
      const processedFields = this.processDataViewFields(fieldMetadataResponse.data);
      
      // Format and return field discovery guidance
      return {
        content: [
          {
            type: "text",
            text: this.formatFieldDiscoveryGuidanceFromDataView(caseTypeID, processedFields, caseTypeData, originalError, attemptedContent)
          }
        ]
      };
    } catch (discoveryError) {
      // If field discovery fails, return a helpful fallback message
      let errorMessage = `Unable to discover fields for case type "${caseTypeID}".`;
      
      if (originalError) {
        errorMessage += `\n\nOriginal creation error: ${originalError.message}`;
      }
      
      errorMessage += `\n\nField discovery error: ${discoveryError.message}`;
      errorMessage += `\n\nPlease verify the case type ID is correct and accessible.`;
      
      return {
        error: errorMessage
      };
    }
  }

  /**
   * Find case type data in the data objects response
   */
  findCaseTypeInDataObjects(dataObjectsData, caseTypeID) {
    if (!dataObjectsData || !Array.isArray(dataObjectsData)) {
      return null;
    }
    
    // Look for exact match first
    let caseTypeData = dataObjectsData.find(obj => obj.classID === caseTypeID);
    
    // If no exact match, try partial matching (case insensitive)
    if (!caseTypeData) {
      const caseTypeIDLower = caseTypeID.toLowerCase();
      caseTypeData = dataObjectsData.find(obj => 
        obj.classID && obj.classID.toLowerCase().includes(caseTypeIDLower)
      );
    }
    
    return caseTypeData;
  }

  /**
   * Process data view fields and filter out OOTB Pega fields
   */
  processDataViewFields(fieldMetadataData) {
    if (!fieldMetadataData || !fieldMetadataData.fields || !Array.isArray(fieldMetadataData.fields)) {
      return [];
    }
    
    return fieldMetadataData.fields
      .filter(field => {
        // Filter out OOTB Pega fields (px, py, pz prefixes)
        const fieldName = field.fieldID || field.name || '';
        const isOOTBField = /^p[xyz]/i.test(fieldName);
        
        // Also filter out read-only fields
        const isReadOnly = field.isReadOnly === true;
        
        // Filter out associated/nested fields (those with colons or associationID)
        const hasColonNotation = fieldName.includes(':');
        const isAssociatedField = field.associationID !== undefined;
        const isEmbeddedPageField = fieldName.startsWith('!P!');
        
        return !isOOTBField && !isReadOnly && !hasColonNotation && !isAssociatedField && !isEmbeddedPageField;
      })
      .map(field => ({
        name: field.fieldID || field.name,
        type: this.mapDataViewFieldType(field.dataType || field.fieldType),
        label: field.name || field.fieldID,
        required: field.required || false, // Data view metadata typically doesn't indicate required fields
        category: field.category,
        maxLength: field.maxLength,
        dataType: field.dataType,
        fieldType: field.fieldType
      }));
  }

  /**
   * Map data view field types to user-friendly types
   */
  mapDataViewFieldType(dataType) {
    if (!dataType) return 'Text';
    
    const typeMapping = {
      'Text': 'Text',
      'Text (single line)': 'Text', 
      'Text (multiple lines)': 'Text',
      'Integer': 'Integer',
      'Decimal': 'Decimal',
      'Number': 'Integer',
      'Date': 'Date',
      'DateTime': 'DateTime',
      'Time': 'TimeOfDay',
      'TimeOfDay': 'TimeOfDay',
      'Boolean': 'Boolean',
      'True/False': 'Boolean',
      'Page': 'Page',
      'Page List': 'Page List',
      'Page Group': 'Page Group'
    };
    
    return typeMapping[dataType] || 'Text';
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
   * Format field discovery guidance response using data view fields
   */
  formatFieldDiscoveryGuidanceFromDataView(caseTypeID, processedFields, caseTypeData, originalError = null, attemptedContent = null) {
    let response = `## Field Discovery for Case Type: ${caseTypeID}\n\n`;
    
    // Add timestamp
    response += `*Field discovery completed at: ${new Date().toISOString()}*\n\n`;
    
    // Add data view information
    response += `**Data View**: ${caseTypeData.defaultListDataView}\n`;
    response += `**Case Type Description**: ${caseTypeData.description || 'N/A'}\n\n`;
    
    
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
    
    if (processedFields.length > 0) {
      response += `| Field Name | Type | Label | Required | Category | Example |\n`;
      response += `|------------|------|-------|----------|----------|----------|\n`;
      
      // Sort fields by category first, then alphabetically
      processedFields.sort((a, b) => {
        if (a.category !== b.category) {
          return (a.category || '').localeCompare(b.category || '');
        }
        return a.name.localeCompare(b.name);
      });
      
      processedFields.forEach(field => {
        const example = this.generateFieldExample(field.type, field.name);
        const exampleStr = typeof example === 'string' ? example : JSON.stringify(example);
        const requiredIcon = field.required ? '✅' : '';
        const category = field.category || 'General';
        
        response += `| ${field.name} | ${field.type} | ${field.label} | ${requiredIcon} | ${category} | ${exampleStr} |\n`;
      });
      
      response += `\n*Required fields are marked with ✅*\n`;
      response += `*OOTB Pega fields (px, py, pz) have been filtered out*\n\n`;
    } else {
      response += `No business fields discovered after filtering OOTB fields. This case type may be configured for automatic field population or may require different parameters.\n\n`;
    }
    
    // Generate sample case creation request
    response += `### 🚀 Sample Case Creation Request\n\n`;
    response += `\`\`\`json\n`;
    response += `{\n`;
    response += `  "caseTypeID": "${caseTypeID}",\n`;
    response += `  "content": {\n`;
    
    if (processedFields.length > 0) {
      // Show up to 5 fields for the sample
      const sampleFields = processedFields.slice(0, 5);
      
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
      response += `    // No specific fields required - try basic case properties\n`;
      response += `    "Description": "Sample case description",\n`;
      response += `    "Priority": "Medium"\n`;
    }
    
    response += `  }\n`;
    response += `}\n`;
    response += `\`\`\`\n\n`;
    
    // Add helpful tips
    response += `### 💡 Tips for Successful Case Creation\n\n`;
    response += `1. **Data View Based**: Fields discovered from ${caseTypeData.defaultListDataView}\n`;
    response += `2. **OOTB Fields Filtered**: Pega system fields (px, py, pz) are excluded\n`;
    response += `3. **Field Types**: Match the expected data types shown above\n`;
    response += `4. **Case Categories**: Fields are organized by category for clarity\n`;
    response += `5. **Validation**: Some fields may have additional validation rules not shown here\n\n`;
    
    // Add workflow guidance
    response += `### 🔄 Recommended Workflow\n\n`;
    response += `1. Review the available fields above\n`;
    response += `2. Use the sample JSON as a template\n`;
    response += `3. Customize field values for your specific case\n`;
    response += `4. Call create_case again with your content object\n`;
    response += `5. If creation still fails, check Pega AllowedStartingFields configuration\n\n`;
    
    // Add troubleshooting section
    response += `### 🔧 Troubleshooting\n\n`;
    if (processedFields.length === 0) {
      response += `- **No Fields Found**: This may indicate the case type uses a different field configuration approach\n`;
      response += `- **Try Without Content**: Call create_case with just the caseTypeID to see what Pega accepts\n`;
      response += `- **Check Configuration**: Verify the case type supports the discovered data view\n`;
    } else {
      response += `- **Field Validation**: If creation fails, check field formats and required validation rules\n`;
      response += `- **AllowedStartingFields**: Ensure fields are configured in the case type's AllowedStartingFields Data Transform\n`;
      response += `- **Case Access**: Verify you have permission to create cases of this type\n`;
    }
    
    return response;
  }

  /**
   * Format field discovery guidance response (legacy UI resources method)
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
        
        // Include fields for the case type (flexible matching for both short and full class names)
        if (field.classID && (field.classID === caseTypeID || field.classID.includes(caseTypeID))) {
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
