import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';
import {
  extractFieldsFromViews,
  extractValidationErrors,
  groupFieldsByRequired,
  formatValidationErrors,
  extractDataPages,
  formatDataPagesInfo
} from '../../utils/field-extractor.js';

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
      description: 'Create a new Pega case. This is the FIRST step in case workflows. Automatically creates the initial assignment (returned in nextAssignmentInfo). Many case types accept empty content {}. If fields required, automatic field discovery provides guidance. Returns: caseID, assignmentID (in nextAssignmentInfo.ID), eTag. Next steps: use get_assignment with assignmentID to view form fields.',
      inputSchema: {
        type: 'object',
        properties: {
          caseTypeID: {
            type: 'string',
            description: 'Case type ID (Example: "Org-App-Work-CaseType"). Use get_case_types to discover available types.'
          },
          parentCaseID: {
            type: 'string',
            description: 'Parent case ID for child case creation'
          },
          processID: {
            type: 'string',
            description: 'Starting process ID to use for case creation (Example: "pyStartCase"). Optional parameter that specifies which flow to use when creating the case. Some case types may require this to bypass initial validation.'
          },
          content: {
            type: 'object',
            description: 'Field values for case creation (optional). Empty {} often works. If fields required, automatic discovery provides guidance. For embedded pages use pageInstructions.'
          },
          pageInstructions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                instruction: {
                  type: 'string',
                  enum: ['UPDATE', 'REPLACE', 'DELETE', 'APPEND', 'INSERT', 'MOVE'],
                  description: 'Page instruction type. UPDATE (add fields to page), REPLACE (replace entire page), DELETE (remove page), APPEND (add item to page list), INSERT (insert item in page list), MOVE (reorder page list items)'
                },
                target: {
                  type: 'string',
                  description: 'Target embedded page name (Example: "Collection", "Datasource")'
                },
                content: {
                  type: 'object',
                  description: 'Content to set on the embedded page (required for UPDATE and REPLACE)'
                }
              },
              required: ['instruction', 'target'],
              description: 'Page operation for embedded pages. IMPORTANT: Use REPLACE instruction to set embedded page references like Collection or Datasource with full object including pzInsKey. Example: {"instruction": "REPLACE", "target": "Collection", "content": {"CollectionName": "knowledge", "pyID": "DC-1", "pzInsKey": "PEGAFW-QNA-WORK DC-1"}}'
            },
            description: 'Optional list of page-related operations for embedded pages, page lists, or page groups. Required for setting embedded page references (Example: Collection, Datasource). See Pega DX API documentation on page instructions for embedded pages.'
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
            description: 'UI resources to return. "none" returns no UI resources, "form" returns form UI metadata, "page" returns full page UI metadata',
            default: 'none'
          },
          pageName: {
            type: 'string',
            description: 'If provided, view metadata for specific page name will be returned (only used when viewType is "page")'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseTypeID']
      }
    };
  }

  /**
   * Execute the create case operation with hybrid field discovery
   */
  async execute(params) {
    const { caseTypeID, parentCaseID, processID, content, pageInstructions, attachments, viewType, pageName } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

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
    // Try creation with empty content first for both V1 and V2 (many case types accept empty content)
    if (!content || Object.keys(content).length === 0) {
      const apiVersion = this.pegaClient.getApiVersion();

      // Try creation with empty content first (works for many case types)
      const emptyResult = await this.executeWithErrorHandling(
        `Case Creation: ${caseTypeID}`,
        async () => await this.pegaClient.createCase({
          caseTypeID: caseTypeID.trim(),
          parentCaseID: parentCaseID?.trim(),
          processID: processID?.trim(),
          content: {},
          pageInstructions,
          attachments,
          viewType,
          pageName
        }),
        { caseTypeID, viewType, pageName, sessionInfo }
      );

      // If empty content worked, return success
      if (emptyResult.content && emptyResult.content[0].text.includes('✅')) {
        return emptyResult;
      }

      // If it failed, provide version-specific guidance
      if (apiVersion === 'v1') {
        // V1: Field discovery not supported, provide manual guidance
        return {
          content: [{
            type: 'text',
            text: `## V1 Case Creation Failed

${emptyResult.content?.[0]?.text || 'Case creation with empty content failed.'}

**Note**: Traditional DX API (V1) does not support automatic field discovery.

### To create a case with V1 API:

Provide the content object with your case fields directly:

\`\`\`json
{
  "caseTypeID": "${caseTypeID}",
  "content": {
    "YourField1": "value1",
    "YourField2": "value2"
  }
}
\`\`\`

**Tip**: Consult your Pega application's case type configuration to determine which fields are required.`
          }]
        };
      }

      // V2: Check if error is truly field-related before doing field discovery
      if (this.isFieldRelatedErrorInResult(emptyResult)) {
        return await this.discoverFieldsAndGuide(caseTypeID, { message: this.extractErrorMessage(emptyResult) });
      }

      // Not field-related, return the actual error
      return emptyResult;
    }

    // NORMAL: Try creation with provided content
    const result = await this.executeWithErrorHandling(
      `Case Creation: ${caseTypeID}`,
      async () => await this.pegaClient.createCase({
        caseTypeID: caseTypeID.trim(),
        parentCaseID: parentCaseID?.trim(),
        processID: processID?.trim(),
        content,
        pageInstructions,
        attachments,
        viewType,
        pageName
      }),
      { caseTypeID, viewType, pageName, sessionInfo }
    );

      // REACTIVE: If the result contains a field-related error, auto-discover and guide
      if (this.isFieldRelatedErrorInResult(result)) {
        return await this.discoverFieldsAndGuide(caseTypeID, { message: this.extractErrorMessage(result) }, content);
      }

      return result;
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Create Case

**Unexpected Error**: ${error.message}

${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Discover available fields for case creation using Case Type Action approach
   * This provides more accurate field list (28 vs 500+ fields) with 85% token savings
   */
  async discoverFieldsAndGuide(caseTypeID, originalError = null, attemptedContent = null) {
    try {
      // Use Case Type Action "Create" to get accurate creation form fields
      // This returns ~28 fields instead of 500+ from Data Views
      const actionResponse = await this.pegaClient.getCaseTypeAction(caseTypeID, 'Create');

      if (!actionResponse.success) {
        throw new Error(`Failed to retrieve case type action: ${actionResponse.error?.message || 'Unknown error'}`);
      }

      // Extract fields from UI resources
      const processedFields = this.processCaseTypeActionFields(actionResponse.data);

      // Format and return field discovery guidance
      return {
        content: [
          {
            type: "text",
            text: this.formatFieldDiscoveryGuidanceFromCaseTypeAction(caseTypeID, processedFields, originalError, attemptedContent)
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
   * Process fields from Case Type Action response
   * Extracts fields from uiResources for more accurate field discovery (28 vs 500+ fields)
   * Uses extractFieldsFromViews to properly traverse view hierarchy and detect required fields
   */
  processCaseTypeActionFields(actionData) {
    if (!actionData) {
      return [];
    }

    // Use the field extraction utility to get fields from view hierarchy
    // This properly detects required fields from the view configuration
    const extractedFields = extractFieldsFromViews(actionData.uiResources);

    // Filter out OOTB Pega fields (px, py, pz prefixes)
    const filteredFields = extractedFields.filter(field => {
      const isOOTBField = /^p[xyz]/i.test(field.name);
      return !isOOTBField;
    });

    return filteredFields;
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
   * Excludes operator/authentication errors that should be shown directly
   */
  isFieldRelatedError(error) {
    if (!error || !error.message) return false;

    const errorMessage = error.message.toLowerCase();

    // Check for non-field errors that should NOT trigger field discovery
    const nonFieldErrorKeywords = [
      'operator id',
      'pyowneruserid',
      'does not exist',
      'authentication',
      'permission',
      'access denied',
      'unauthorized'
    ];

    if (nonFieldErrorKeywords.some(keyword => errorMessage.includes(keyword))) {
      return false;
    }

    // Check for actual field-related errors
    const fieldErrorKeywords = [
      'field',
      'property',
      'required',
      'allowedstartingfields',
      'may not be blank',
      'cannot be blank'
    ];

    return fieldErrorKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Check if a result object contains a field-related error
   * Excludes operator/authentication errors that should be shown directly
   */
  isFieldRelatedErrorResult(result) {
    if (!result || !result.error) return false;

    const errorMessage = result.error.toLowerCase();

    // Check for non-field errors that should NOT trigger field discovery
    const nonFieldErrorKeywords = [
      'operator id',
      'pyowneruserid',
      'does not exist',
      'authentication',
      'permission',
      'access denied',
      'unauthorized'
    ];

    if (nonFieldErrorKeywords.some(keyword => errorMessage.includes(keyword))) {
      return false;
    }

    // Check for actual field-related errors
    const fieldErrorKeywords = [
      'field',
      'property',
      'required',
      'allowedstartingfields',
      'may not be blank',
      'cannot be blank'
    ];

    return fieldErrorKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Check if a result object contains a field-related error (in content format)
   * Excludes operator/authentication errors that should be shown directly
   */
  isFieldRelatedErrorInResult(result) {
    // Check if result has content array with error text
    if (result && result.content && Array.isArray(result.content) && result.content.length > 0) {
      const errorText = result.content[0].text;
      if (errorText && typeof errorText === 'string') {
        const errorMessage = errorText.toLowerCase();

        // Check for non-field errors that should NOT trigger field discovery
        const nonFieldErrorKeywords = [
          'operator id',
          'pyowneruserid',
          'does not exist',
          'authentication',
          'permission',
          'access denied',
          'unauthorized'
        ];

        if (nonFieldErrorKeywords.some(keyword => errorMessage.includes(keyword))) {
          return false;
        }

        // Check for actual field-related errors
        const fieldErrorKeywords = [
          'field',
          'property',
          'required',
          'allowedstartingfields',
          'may not be blank',
          'cannot be blank'
        ];

        return fieldErrorKeywords.some(keyword => errorMessage.includes(keyword));
      }
    }

    // Also check direct error field
    return this.isFieldRelatedErrorResult(result);
  }

  /**
   * Extract error message from result object (handles both formats)
   * Enhanced to detect and format validation errors with specific field information
   */
  extractErrorMessage(result) {
    // Check if we have an API error response with validation details
    if (result && result.apiError && result.apiError.errorDetails) {
      const validationErrors = extractValidationErrors(result.apiError);

      if (validationErrors.length > 0) {
        // Format validation errors in a structured way
        let errorMessage = result.apiError.localizedValue || 'Validation failed';
        errorMessage += '\n\n' + formatValidationErrors(validationErrors);
        return errorMessage;
      }
    }

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
    response += `5. **Validation**: Some fields may have additional validation rules not shown here\n`;
    response += `6. **Embedded Pages**: For embedded page references, use pageInstructions parameter (see below)\n\n`;

    response += `### 📄 Using pageInstructions for Embedded Pages\n\n`;
    response += `If fields of type "Page" need to be set, use the \`pageInstructions\` parameter with REPLACE instruction:\n\n`;
    response += `\`\`\`json\n`;
    response += `{\n`;
    response += `  "caseTypeID": "${caseTypeID}",\n`;
    response += `  "content": { /* scalar fields */ },\n`;
    response += `  "pageInstructions": [\n`;
    response += `    {\n`;
    response += `      "instruction": "REPLACE",\n`;
    response += `      "target": "PagePropertyName",\n`;
    response += `      "content": {\n`;
    response += `        "PropertyName": "value",\n`;
    response += `        "pyID": "ID-123",\n`;
    response += `        "pzInsKey": "CLASS-NAME ID-123"\n`;
    response += `      }\n`;
    response += `    }\n`;
    response += `  ]\n`;
    response += `}\n`;
    response += `\`\`\`\n\n`;
    response += `**Available Instructions**: UPDATE (add fields), REPLACE (replace entire page), DELETE (remove page)\n\n`;
    
    // Add workflow guidance
    response += `### 🔄 Recommended Workflow\n\n`;
    response += `**For Case Creation**:\n`;
    response += `1. Review the available fields above\n`;
    response += `2. Use the sample JSON as a template\n`;
    response += `3. Customize field values for your specific case\n`;
    response += `4. Call create_case again with your content object\n`;
    response += `5. If creation still fails, check Pega AllowedStartingFields configuration\n\n`;
    response += `**After Successful Case Creation**:\n`;
    response += `1. Case creation returns: caseID, eTag, and nextAssignmentInfo with assignment ID\n`;
    response += `2. Use get_assignment with the assignment ID to view form structure and required fields\n`;
    response += `3. Use refresh_assignment_action for progressive form updates (optional)\n`;
    response += `4. Use perform_assignment_action with all required fields to submit the assignment\n\n`;
    
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
    response += `3. **Time Format**: Use "HH:MM" format for TimeOfDay fields (Example: "00:30")\n`;
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
    const { caseTypeID, viewType, sessionInfo } = options;

    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }

    // Display case ID prominently (check both formats for V1 and V2 compatibility)
    const caseID = data.ID || data.caseInfo?.ID;
    if (caseID) {
      response += `### ✅ New Case ID: ${caseID}\n\n`;
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

    // Display next assignment information (check both formats for V1 and V2 compatibility)
    const nextAssignmentID = data.nextAssignmentInfo?.ID || data.caseInfo?.nextAssignmentID;
    if (nextAssignmentID) {
      response += '\n### Next Assignment (Automatically Created)\n';
      if (data.nextAssignmentInfo) {
        const assignment = data.nextAssignmentInfo;
        response += `- **Assignment ID**: ${assignment.ID || 'N/A'}\n`;
        response += `- **Name**: ${assignment.name || 'N/A'}\n`;
        response += `- **Type**: ${assignment.type || 'N/A'}\n`;
        response += `- **Actions**: ${assignment.actions?.join(', ') || 'N/A'}\n`;
      } else {
        response += `- **Assignment ID**: ${nextAssignmentID}\n`;
      }

      // Add workflow guidance
      response += '\n### 🔄 Next Steps\n';
      response += `1. Use **get_assignment** with assignment ID "${nextAssignmentID}" to view form fields and required fields\n`;
      response += `2. (Optional) Use **refresh_assignment_action** for progressive form filling with real-time validation\n`;
      response += `3. Use **perform_assignment_action** to submit the completed assignment\n`;
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

  /**
   * Format field discovery guidance from Case Type Action response
   * More concise format with only creation-relevant fields (28 vs 500+)
   * Clearly separates required vs optional fields
   */
  formatFieldDiscoveryGuidanceFromCaseTypeAction(caseTypeID, processedFields, originalError = null, attemptedContent = null) {
    let response = `## Field Discovery for Case Type: ${caseTypeID}\n\n`;

    response += `*Field discovery completed at: ${new Date().toISOString()}*\n`;
    response += `*Source: Case Type Action "Create"*\n\n`;

    // Show original error if provided
    if (originalError) {
      response += `### ❌ Case Creation Error\n`;
      response += `**Error**: ${originalError.message}\n\n`;

      if (attemptedContent && Object.keys(attemptedContent).length > 0) {
        response += `**Attempted Content**:\n`;
        response += `\`\`\`json\n${JSON.stringify(attemptedContent, null, 2)}\n\`\`\`\n\n`;
      }
    }

    // Group fields by required status
    const grouped = groupFieldsByRequired(processedFields);

    // Extract Data Pages referenced by fields
    const dataPages = extractDataPages(processedFields);

    response += `### 📋 Available Fields Summary\n\n`;
    response += `- **Total Fields**: ${processedFields.length}\n`;
    response += `- **Required Fields**: ${grouped.required.length}\n`;
    response += `- **Optional Fields**: ${grouped.optional.length}\n`;
    if (dataPages.length > 0) {
      response += `- **Data Pages Referenced**: ${dataPages.length}\n`;
    }
    response += `\n`;

    // Show required fields first
    if (grouped.required.length > 0) {
      response += `### ✅ Required Fields (${grouped.required.length})\n\n`;
      response += `*These fields MUST be provided to create the case*\n\n`;
      response += `| Field Name | Type | Label | Data Source |\n`;
      response += `|------------|------|-------|-------------|\n`;

      grouped.required.forEach(field => {
        const dataSource = field.datasource?.type === 'datapage'
          ? `📊 ${field.datasource.dataPageID}`
          : field.datasource?.type === 'associated'
          ? '📋 Associated'
          : '';
        response += `| ${field.name} | ${field.type} | ${field.label} | ${dataSource} |\n`;
      });

      response += `\n`;
    }

    // Show optional fields
    if (grouped.optional.length > 0) {
      response += `### 📝 Optional Fields (${grouped.optional.length})\n\n`;
      response += `| Field Name | Type | Label | Data Source |\n`;
      response += `|------------|------|-------|-------------|\n`;

      grouped.optional.forEach(field => {
        const dataSource = field.datasource?.type === 'datapage'
          ? `📊 ${field.datasource.dataPageID}`
          : field.datasource?.type === 'associated'
          ? '📋 Associated'
          : '';
        response += `| ${field.name} | ${field.type} | ${field.label} | ${dataSource} |\n`;
      });

      response += `\n`;
    }

    if (processedFields.length === 0) {
      response += `No fields found. Case type may accept empty content.\n\n`;
    }

    // Show Data Pages section if any are referenced
    if (dataPages.length > 0) {
      response += formatDataPagesInfo(dataPages);
    }

    // Generate sample request with required fields first
    response += `### 🚀 Sample Case Creation Request\n\n`;
    response += `\`\`\`json\n{\n`;
    response += `  "caseTypeID": "${caseTypeID}",\n`;
    response += `  "content": {\n`;

    if (processedFields.length > 0) {
      // Show required fields first, then up to 5 total fields
      const requiredFields = grouped.required;
      const optionalFields = grouped.optional;
      const sampleFields = [...requiredFields, ...optionalFields].slice(0, 5);

      sampleFields.forEach((field, index) => {
        const example = this.generateFieldExample(field.type, field.name);
        const comma = index < sampleFields.length - 1 ? ',' : '';
        const comment = field.required ? ' // REQUIRED' : '';
        response += `    "${field.name}": ${JSON.stringify(example)}${comma}${comment}\n`;
      });

      if (processedFields.length > 5) {
        response += `    // ... and ${processedFields.length - 5} more fields available\n`;
      }
    }

    response += `  }\n}\n\`\`\`\n\n`;

    // Concise tips
    response += `### 💡 Next Steps\n\n`;
    if (grouped.required.length > 0) {
      response += `1. **Provide values for all ${grouped.required.length} required fields** listed above\n`;
      response += `2. Optionally add any of the ${grouped.optional.length} optional fields\n`;
      response += `3. Call create_case again with the complete content\n\n`;
    } else {
      response += `1. Review the ${processedFields.length} fields above\n`;
      response += `2. Update the content object with valid field values\n`;
      response += `3. Call create_case again with the complete content\n\n`;
    }

    response += `**After successful creation**, use:\n`;
    response += `- **get_assignment** to view the assignment form\n`;
    response += `- **perform_assignment_action** to submit the assignment\n\n`;

    response += `For complete field details, use: \`get_case_type_action(caseTypeID="${caseTypeID}", actionID="Create")\`\n`;

    return response;
  }
}
