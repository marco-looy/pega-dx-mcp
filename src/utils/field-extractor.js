/**
 * Utility functions for extracting field metadata and validation errors from Pega API responses
 */

/**
 * Extract fields from Pega UI resources view hierarchy
 * @param {Object} uiResources - UI resources from API response
 * @returns {Array} Array of field objects with {name, type, label, required}
 */
export function extractFieldsFromViews(uiResources) {
  const fields = [];
  const fieldMap = new Map(); // Use map to avoid duplicates

  if (!uiResources?.resources?.views) {
    return fields;
  }

  const views = uiResources.resources.views;

  /**
   * Recursively traverse view children to find field components
   */
  const traverseChildren = (children) => {
    if (!Array.isArray(children)) return;

    for (const child of children) {
      // Check if this component has a field value
      if (child.config?.value) {
        const fieldName = extractFieldName(child.config.value);

        if (fieldName && !fieldMap.has(fieldName)) {
          const fieldInfo = {
            name: fieldName,
            type: child.type || 'Unknown',
            label: extractLabel(child.config.label) || fieldName,
            required: child.config.required === true
          };

          // Extract datasource information for dropdowns/autocomplete
          if (child.config.datasource || child.config.listType === 'associated') {
            fieldInfo.datasource = extractDatasourceInfo(child.config);
          }

          fieldMap.set(fieldName, fieldInfo);
        }
      }

      // Handle reference components
      if (child.type === 'reference' && child.config?.name) {
        // References point to other views - we'll process those separately
        continue;
      }

      // Recursively traverse children
      if (child.children) {
        traverseChildren(child.children);
      }
    }
  };

  // Process each view
  for (const viewName in views) {
    const viewArray = views[viewName];
    if (Array.isArray(viewArray)) {
      for (const view of viewArray) {
        if (view.children) {
          traverseChildren(view.children);
        }
      }
    }
  }

  return Array.from(fieldMap.values());
}

/**
 * Extract field name from Pega value reference
 * @param {string} valueRef - Value reference (e.g., "@P .LastName", "@USER .pyOwnerUserID")
 * @returns {string|null} Extracted field name or null
 */
function extractFieldName(valueRef) {
  if (!valueRef || typeof valueRef !== 'string') return null;

  // Handle various reference patterns:
  // @P .FieldName → FieldName
  // @P .Address.pyCity → Address.pyCity
  // @USER .pyOwnerUserID → pyOwnerUserID
  const match = valueRef.match(/@[A-Z]+\s+\.(.+)/);
  return match ? match[1] : null;
}

/**
 * Extract label from Pega label reference
 * @param {string} labelRef - Label reference (e.g., "@L Last name", "@FL .LastName")
 * @returns {string} Extracted label or empty string
 */
function extractLabel(labelRef) {
  if (!labelRef || typeof labelRef !== 'string') return '';

  // Handle various label patterns:
  // @L Label Text → Label Text
  // @FL .PropertyName → PropertyName (field label)
  const match = labelRef.match(/@[LF]*L\s+(.+)/);
  return match ? match[1] : labelRef;
}

/**
 * Extract datasource information from field config
 * @param {Object} config - Field config object
 * @returns {Object|null} Datasource metadata or null
 */
function extractDatasourceInfo(config) {
  if (!config) return null;

  // Handle datasource object (most common for dropdowns)
  if (config.datasource) {
    const ds = config.datasource;

    // Extract from @ASSOCIATED reference pattern
    if (typeof config.datasource === 'string' && config.datasource.startsWith('@ASSOCIATED')) {
      const match = config.datasource.match(/@ASSOCIATED\s+\.(.+)/);
      return {
        type: 'associated',
        fieldName: match ? match[1] : config.datasource
      };
    }

    // Extract from datasource object with Data Page
    if (ds.name && ds.tableType === 'DataPage') {
      return {
        type: 'datapage',
        dataPageID: ds.name,
        dataPageClass: ds.tableClass,
        displayProperty: ds.propertyForDisplayText,
        valueProperty: ds.propertyForValue,
        parameters: ds.parameters || []
      };
    }
  }

  // Handle associated list type
  if (config.listType === 'associated' && config.datasource) {
    if (typeof config.datasource === 'string' && config.datasource.startsWith('@ASSOCIATED')) {
      const match = config.datasource.match(/@ASSOCIATED\s+\.(.+)/);
      return {
        type: 'associated',
        fieldName: match ? match[1] : config.datasource
      };
    }
  }

  return null;
}

/**
 * Extract validation errors from Pega error response
 * @param {Object} errorResponse - Error response from API
 * @returns {Array} Array of error objects with {field, message, localizedValue}
 */
export function extractValidationErrors(errorResponse) {
  const errors = [];

  if (!errorResponse?.errorDetails || !Array.isArray(errorResponse.errorDetails)) {
    return errors;
  }

  for (const error of errorResponse.errorDetails) {
    // Extract field identifier (e.g., ".LeadMobile" → "LeadMobile")
    const fieldIdentifier = error.erroneousInputOutputIdentifier || '';
    const fieldName = fieldIdentifier.startsWith('.')
      ? fieldIdentifier.substring(1)
      : fieldIdentifier;

    errors.push({
      field: fieldName,
      message: error.message || '',
      localizedValue: error.localizedValue || error.message || 'Unknown error',
      errorClassification: error.errorClassification || ''
    });
  }

  return errors;
}

/**
 * Format fields for display, grouped by required status
 * @param {Array} fields - Array of field objects
 * @returns {Object} Object with {required: [], optional: []}
 */
export function groupFieldsByRequired(fields) {
  const required = [];
  const optional = [];

  for (const field of fields) {
    if (field.required) {
      required.push(field);
    } else {
      optional.push(field);
    }
  }

  return { required, optional };
}

/**
 * Extract all unique Data Pages referenced by fields
 * @param {Array} fields - Array of field objects with datasource info
 * @returns {Array} Array of unique Data Page objects
 */
export function extractDataPages(fields) {
  const dataPageMap = new Map();

  for (const field of fields) {
    if (field.datasource && field.datasource.type === 'datapage') {
      const ds = field.datasource;
      const key = ds.dataPageID;

      if (!dataPageMap.has(key)) {
        dataPageMap.set(key, {
          dataPageID: ds.dataPageID,
          dataPageClass: ds.dataPageClass,
          displayProperty: ds.displayProperty,
          valueProperty: ds.valueProperty,
          parameters: ds.parameters,
          usedByFields: [field.name]
        });
      } else {
        // Add this field to the list of fields using this Data Page
        dataPageMap.get(key).usedByFields.push(field.name);
      }
    }
  }

  return Array.from(dataPageMap.values());
}

/**
 * Format Data Pages for display with get_list_data_view instructions
 * @param {Array} dataPages - Array of Data Page objects
 * @returns {string} Formatted Data Pages information
 */
export function formatDataPagesInfo(dataPages) {
  if (!dataPages || dataPages.length === 0) {
    return '';
  }

  let info = `### 📊 Data Pages Referenced (${dataPages.length})\n\n`;
  info += `These dropdown/autocomplete fields get their options from Data Pages.\n`;
  info += `Use \`get_list_data_view\` to fetch available options:\n\n`;

  dataPages.forEach(dp => {
    info += `**${dp.dataPageID}**\n`;
    info += `- Used by: ${dp.usedByFields.join(', ')}\n`;

    if (dp.parameters && dp.parameters.length > 0) {
      const params = dp.parameters.map(p => `"${p.name}": "${p.value || ''}"`).join(', ');
      info += `- Parameters: { ${params} }\n`;
    }

    info += `- Fetch options: \`get_list_data_view(dataViewID: "${dp.dataPageID}"`;
    if (dp.parameters && dp.parameters.length > 0) {
      info += `, dataViewParameters: {...}`;
    }
    info += `)\`\n\n`;
  });

  return info;
}

/**
 * Format validation errors for display
 * @param {Array} errors - Array of error objects
 * @returns {string} Formatted error message
 */
export function formatValidationErrors(errors) {
  if (!errors || errors.length === 0) {
    return 'No specific field errors found.';
  }

  let message = 'Validation Errors:\n';

  for (const error of errors) {
    if (error.field) {
      message += `  • ${error.field}: ${error.localizedValue}\n`;
    } else {
      message += `  • ${error.localizedValue}\n`;
    }
  }

  return message;
}

/**
 * Extract field metadata including dropdown options from uiResources.resources.fields
 * This is the primary source for field type and dropdown options
 * @param {Object} uiResources - UI resources from API response
 * @returns {Array} Array of field objects with type, options, etc.
 */
export function extractFieldMetadata(uiResources) {
  const fields = [];

  if (!uiResources?.resources?.fields) {
    return fields;
  }

  const fieldsResource = uiResources.resources.fields;

  for (const fieldName in fieldsResource) {
    const fieldArray = fieldsResource[fieldName];
    if (!Array.isArray(fieldArray) || fieldArray.length === 0) continue;

    const fieldDef = fieldArray[0]; // Take first definition

    const fieldInfo = {
      name: fieldName,
      label: fieldDef.label || fieldName,
      type: fieldDef.type || 'Unknown',
      displayAs: fieldDef.displayAs || 'pxTextInput'
    };

    // Extract dropdown options from datasource.records (PromptList)
    if (fieldDef.datasource) {
      const ds = fieldDef.datasource;

      // Handle PromptList with inline records (dropdown options)
      if (ds.tableType === 'PromptList' && ds.records) {
        fieldInfo.isDropdown = true;
        fieldInfo.options = ds.records.map(r => ({
          key: r.key,
          value: r.value
        }));
      }
      // Handle DataPage datasource
      else if (ds.tableType === 'DataPage' || ds.name) {
        fieldInfo.isDropdown = true;
        fieldInfo.dataPage = {
          name: ds.name,
          tableClass: ds.tableClass,
          displayProperty: ds.propertyForDisplayText,
          valueProperty: ds.propertyForValue
        };
      }
    }

    // Check displayAs for dropdown hint
    if (fieldDef.displayAs === 'pxDropdown' || fieldDef.displayAs === 'pxAutoComplete') {
      fieldInfo.isDropdown = true;
    }

    fields.push(fieldInfo);
  }

  return fields;
}

/**
 * Extract fields only from the current view hierarchy (starting from root)
 * This ensures we only return fields that are actually editable in the current step
 * @param {Object} uiResources - UI resources from API response
 * @returns {Array} Array of field objects for the current view only
 */
export function extractFieldsForCurrentView(uiResources) {
  const fields = [];
  const fieldNamesInView = new Set();

  if (!uiResources?.root || !uiResources?.resources?.views) {
    return fields;
  }

  const views = uiResources.resources.views;
  const fieldsResource = uiResources.resources.fields || {};

  /**
   * Extract field name from a value reference like "@P .FieldName"
   */
  const extractFieldNameFromRef = (valueRef) => {
    if (!valueRef || typeof valueRef !== 'string') return null;
    const match = valueRef.match(/@[A-Z]+\s+\.(.+)/);
    return match ? match[1] : null;
  };

  /**
   * Recursively traverse view children to find field references
   */
  const traverseChildren = (children) => {
    if (!Array.isArray(children)) return;

    for (const child of children) {
      // Check if this component has a field value reference
      if (child.config?.value) {
        const fieldName = extractFieldNameFromRef(child.config.value);
        if (fieldName) {
          fieldNamesInView.add(fieldName);
        }
      }

      // Handle reference components - follow them to their view
      if (child.type === 'reference' && child.config?.name) {
        const referencedViewName = child.config.name;
        traverseView(referencedViewName);
      }

      // Recursively traverse children
      if (child.children) {
        traverseChildren(child.children);
      }
    }
  };

  /**
   * Traverse a specific view by name
   */
  const visitedViews = new Set();
  const traverseView = (viewName) => {
    // Prevent infinite loops
    if (visitedViews.has(viewName)) return;
    visitedViews.add(viewName);

    const viewArray = views[viewName];
    if (!Array.isArray(viewArray)) return;

    for (const view of viewArray) {
      if (view.children) {
        traverseChildren(view.children);
      }
    }
  };

  // Start from root - get the root view name
  const rootViewName = uiResources.root?.config?.name;
  if (rootViewName) {
    traverseView(rootViewName);
  }

  // Now build field metadata only for fields found in the current view
  for (const fieldName of fieldNamesInView) {
    const fieldArray = fieldsResource[fieldName];
    if (!Array.isArray(fieldArray) || fieldArray.length === 0) continue;

    const fieldDef = fieldArray[0];

    const fieldInfo = {
      name: fieldName,
      label: fieldDef.label || fieldName,
      type: fieldDef.type || 'Unknown',
      displayAs: fieldDef.displayAs || 'pxTextInput'
    };

    // Extract dropdown options from datasource.records (PromptList)
    if (fieldDef.datasource) {
      const ds = fieldDef.datasource;

      if (ds.tableType === 'PromptList' && ds.records) {
        fieldInfo.isDropdown = true;
        fieldInfo.options = ds.records.map(r => ({
          key: r.key,
          value: r.value
        }));
      } else if (ds.tableType === 'DataPage' || ds.name) {
        fieldInfo.isDropdown = true;
        fieldInfo.dataPage = {
          name: ds.name,
          tableClass: ds.tableClass,
          displayProperty: ds.propertyForDisplayText,
          valueProperty: ds.propertyForValue
        };
      }
    }

    if (fieldDef.displayAs === 'pxDropdown' || fieldDef.displayAs === 'pxAutoComplete') {
      fieldInfo.isDropdown = true;
    }

    fields.push(fieldInfo);
  }

  return fields;
}

/**
 * Format current step fields for display
 * @param {Array} fields - Array of field metadata objects for current step
 * @returns {string} Formatted field information
 */
export function formatCurrentStepFields(fields) {
  if (!fields || fields.length === 0) {
    return '\n### Current Step Fields\n\nNo editable fields found for this step.\n';
  }

  let output = `\n### 🎯 Current Step Fields (${fields.length})\n\n`;
  output += '**These are the fields you can fill in this step:**\n\n';

  const dropdownFields = fields.filter(f => f.isDropdown && f.options);
  const dataPageFields = fields.filter(f => f.isDropdown && f.dataPage);
  const otherFields = fields.filter(f => !f.isDropdown);

  // Show dropdown fields with their options
  if (dropdownFields.length > 0) {
    output += `**Dropdown Fields:**\n`;
    output += `| Field | Options |\n`;
    output += `|-------|--------|\n`;

    for (const field of dropdownFields) {
      const optionsList = field.options.map(o => o.value).join(', ');
      output += `| ${field.label || field.name} | ${optionsList} |\n`;
    }
    output += '\n';
  }

  // Show fields that get options from Data Pages
  if (dataPageFields.length > 0) {
    output += `**Data Page Fields:**\n`;
    for (const field of dataPageFields) {
      output += `- **${field.label || field.name}**: Options from \`${field.dataPage.name}\`\n`;
    }
    output += '\n';
  }

  // Show text/other fields
  if (otherFields.length > 0) {
    output += `**Input Fields:**\n`;
    output += `| Field | Type |\n`;
    output += `|-------|------|\n`;

    for (const field of otherFields) {
      const displayType = field.displayAs?.replace('px', '').replace('py', '') || field.type;
      output += `| ${field.label || field.name} | ${displayType} |\n`;
    }
    output += '\n';
  }

  return output;
}

/**
 * Format field metadata for display including dropdown options
 * @param {Array} fields - Array of field metadata objects
 * @returns {string} Formatted field information
 */
export function formatFieldMetadata(fields) {
  if (!fields || fields.length === 0) {
    return '';
  }

  let output = '';
  const dropdownFields = fields.filter(f => f.isDropdown && f.options);
  const dataPageFields = fields.filter(f => f.isDropdown && f.dataPage);
  const textFields = fields.filter(f => !f.isDropdown);

  // Show dropdown fields with their options
  if (dropdownFields.length > 0) {
    output += `\n### Dropdown Fields (${dropdownFields.length})\n\n`;
    output += `| Field | Options |\n`;
    output += `|-------|--------|\n`;

    for (const field of dropdownFields) {
      const optionsList = field.options.map(o => o.value).join(', ');
      output += `| ${field.label || field.name} | ${optionsList} |\n`;
    }

    output += `\n### Dropdown Options (${dropdownFields.length})\n\n`;
    output += `When updating an assignment action, ALWAYS use the key of the dropdown option, NOT the value\n`;
    output += `| Field | Option | Key |\n`;
    output += `|-------|--------|-----|\n`;

    for (const field of dropdownFields) {
      for (const option of field.options) {
        output += `| ${field.label || field.name} | ${option.value} | ${option.key} |\n`;
      }
    }
  }

  // Show fields that get options from Data Pages
  if (dataPageFields.length > 0) {
    output += `\n### Data Page Driven Fields (${dataPageFields.length})\n\n`;
    for (const field of dataPageFields) {
      output += `- **${field.label || field.name}**: Options from \`${field.dataPage.name}\`\n`;
    }
  }

  // Show text/other fields
  if (textFields.length > 0) {
    output += `\n### Other Fields (${textFields.length})\n\n`;
    output += `| Field | Type |\n`;
    output += `|-------|------|\n`;

    for (const field of textFields) {
      const displayType = field.displayAs?.replace('px', '').replace('py', '') || field.type;
      output += `| ${field.label || field.name} | ${displayType} |\n`;
    }
  }

  return output;
}
