import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class GetListDataViewTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'dataviews';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_list_data_view',
      description: `Retrieve list type data view with advanced querying capabilities. Supports 4 distinct use cases:

1. **Standard Data Retrieval**: Get data with pagination, filtering, and sorting
   Example: { "dataViewID": "D_Employees", "query": { "select": [{"field": "Name"}, {"field": "Age"}], "filter": { "filterConditions": { "F1": { "lhs": {"field": "Department"}, "comparator": "EQ", "rhs": {"value": "IT"} } }, "logic": "F1" } }, "paging": { "pageSize": 100 } }

2. **Aggregated Data**: Get aggregated data with optional grouping
   Example: { "dataViewID": "D_Employees", "query": { "aggregations": { "AvgAge": { "field": "age", "summaryFunction": "AVG" } }, "select": [{"field": "Department"}] }, "paging": { "maxResultsToFetch": 2000 } }

3. **Distinct Values**: Get unique values from filtered lists
   Example: { "dataViewID": "D_Employees", "query": { "select": [{"field": "Department"}], "distinctResultsOnly": true }, "paging": { "maxResultsToFetch": 1000 } }

4. **Non-queryable Data Views**: Simple data retrieval without querying
   Example: { "dataViewID": "D_SimpleData", "dataViewParameters": { "param1": "value1", "param2": "value2" } }

Filter comparators supported: boolean (IS_TRUE, IS_FALSE, IS_NULL, IS_NOT_NULL, EQ, NEQ), string (EQ, NEQ, IN, NOT_IN, IS_NULL, IS_NOT_NULL, STARTS_WITH, NOT_STARTS_WITH, ENDS_WITH, NOT_ENDS_WITH, CONTAINS, NOT_CONTAINS), number/date (EQ, NEQ, IN, NOT_IN, GT, GTE, LT, LTE, ISNULL, ISNOTNULL).

Aggregation functions: COUNT, MAX, MIN, DISTINCT_COUNT. For numbers: SUM, AVG.`,
      inputSchema: {
        type: 'object',
        properties: {
          dataViewID: {
            type: 'string',
            description: 'ID of the data view to retrieve data from. Must be a valid data view identifier that exists in the Pega system. Example: "D_Employees", "D_CustomerList"'
          },
          dataViewParameters: {
            type: 'object',
            description: 'Optional parameters for the data view if it has mandatory parameters. Key-value pairs where keys are parameter names and values are parameter values. Example: {"param1": "value1", "param2": "value2"}'
          },
          query: {
            type: 'object',
            description: 'Optional query object for filtering, sorting, aggregation, and field selection. If not specified, retrieves data as a regular data view.',
            properties: {
              select: {
                type: 'array',
                description: 'Array of field objects to select. Each object should have a "field" property. Example: [{"field": "Name"}, {"field": "Age"}, {"field": "DOB"}]',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string',
                      description: 'Field name to select'
                    }
                  },
                  required: ['field']
                }
              },
              sortBy: {
                type: 'array',
                description: 'Array of sorting configurations. Each object can specify field name with type (ASC/DESC) or aggregation name with type. Example: [{"field": "Name", "type": "ASC"}, {"aggregation": "AverageAge", "type": "DESC"}]',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string',
                      description: 'Field name to sort by'
                    },
                    aggregation: {
                      type: 'string',
                      description: 'Aggregation name to sort by'
                    },
                    type: {
                      type: 'string',
                      enum: ['ASC', 'DESC'],
                      description: 'Sort direction - ascending or descending',
                      default: 'ASC'
                    }
                  }
                }
              },
              filter: {
                type: 'object',
                description: 'Complex filtering conditions with support for multiple comparators and logical operators.',
                properties: {
                  filterConditions: {
                    type: 'object',
                    description: 'Object containing filter conditions. Each key (F1, F2, etc.) represents a condition with lhs (left-hand side), comparator, and rhs (right-hand side). Example: {"F1": {"ignoreCase": true, "lhs": {"field": "firstname"}, "comparator": "EQ", "rhs": {"value": "abc"}}, "F2": {"lhs": {"field": "IsRetired"}, "comparator": "IS_TRUE"}}'
                  },
                  logic: {
                    type: 'string',
                    description: 'Logical expression combining filter conditions using AND/OR operators. Supports parentheses. Examples: "F1", "F1 AND F2", "(F1 AND F2) OR (F3 AND F4)". Default is AND.',
                    default: 'AND'
                  }
                }
              },
              aggregations: {
                type: 'object',
                description: 'Object containing aggregation definitions. Each key is a unique name for the aggregation, each value contains field and summaryFunction. Example: {"AverageAge": {"field": "age", "summaryFunction": "AVG"}, "EmployeeCount": {"field": "EmployeeID", "summaryFunction": "COUNT"}}'
              },
              distinctResultsOnly: {
                type: 'boolean',
                description: 'Set to true to return distinct set of results only. Cannot be specified with aggregation. Use with select fields to get unique combinations.',
                default: false
              }
            }
          },
          paging: {
            type: 'object',
            description: 'Optional pagination configuration. Can specify either maxResultsToFetch or pageNumber/pageSize combination, but not both.',
            properties: {
              pageNumber: {
                type: 'integer',
                minimum: 1,
                description: 'Page number to retrieve (1-based). Use with pageSize. Cannot be used with maxResultsToFetch.',
                default: 1
              },
              pageSize: {
                type: 'integer',
                minimum: 1,
                maximum: 5000,
                description: 'Number of records per page. Maximum value is 5000. Use with pageNumber. Cannot be used with maxResultsToFetch.',
                default: 100
              },
              maxResultsToFetch: {
                type: 'integer',
                minimum: 1,
                maximum: 5000,
                description: 'Maximum number of results to fetch when data is not paginated. Default and maximum value is 5000. Cannot be used with pageNumber/pageSize.'
              }
            }
          },
          useExtendedTimeout: {
            type: 'boolean',
            description: 'Optional flag that works only if the data view is sourced by a report definition. When set to true, increases timeout to 45 seconds. Otherwise, timeout is 10 seconds.',
            default: false
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['dataViewID']
      }
    };
  }

  /**
   * Execute the get list data view operation
   */
  async execute(params) {
    const { dataViewID, dataViewParameters, query, paging, useExtendedTimeout } = params;
    let sessionInfo = null;

    try {
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters
      const requiredValidation = this.validateRequiredParams(params, ['dataViewID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Build request body from optional parameters
      const requestBody = {};

      if (dataViewParameters) {
        requestBody.dataViewParameters = dataViewParameters;
      }

      if (query) {
        requestBody.query = query;
      }

      if (paging) {
        requestBody.paging = paging;
      }

      if (useExtendedTimeout !== undefined) {
        requestBody.useExtendedTimeout = useExtendedTimeout;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `List Data View: ${dataViewID}${query ? ' (with query)' : ''}${paging ? ' (paginated)' : ''}`,
        async () => await this.pegaClient.getListDataView(dataViewID, requestBody),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: List Data View: ${dataViewID}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
