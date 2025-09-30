import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class GetDataViewCountTool extends BaseTool {
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
      name: 'get_data_view_count',
      description: `Retrieve the total count of results for a specified data view query without fetching the actual data. This is useful for pagination planning, understanding dataset sizes, and performance optimization before executing full data retrieval operations.

Supports the same comprehensive query capabilities as get_list_data_view:

1. **Simple Count**: Get total count of all records in a data view
   Example: { "dataViewID": "D_Employees" }

2. **Count with Parameters**: Count records with data view parameters for parameterized data views
   Example: { "dataViewID": "D_CustomerOrders", "dataViewParameters": { "CustomerID": "C-123", "Status": "Active" } }

3. **Filtered Count**: Count records matching specific filter criteria
   Example: { "dataViewID": "D_Employees", "query": { "filter": { "filterConditions": { "F1": { "lhs": {"field": "Department"}, "comparator": "EQ", "rhs": {"value": "IT"} } }, "logic": "F1" } } }

4. **Distinct Count**: Count unique combinations of selected fields
   Example: { "dataViewID": "D_Employees", "query": { "select": [{"field": "Department"}], "distinctResultsOnly": true } }

5. **Aggregated Count**: Count records with aggregation grouping
   Example: { "dataViewID": "D_Sales", "query": { "aggregations": { "TotalRevenue": { "field": "Revenue", "summaryFunction": "SUM" } }, "select": [{"aggregation": "TotalRevenue"}] } }

Filter comparators supported: boolean (IS_TRUE, IS_FALSE, IS_NULL, IS_NOT_NULL, EQ, NEQ), string (EQ, NEQ, IN, NOT_IN, IS_NULL, IS_NOT_NULL, STARTS_WITH, NOT_STARTS_WITH, ENDS_WITH, NOT_ENDS_WITH, CONTAINS, NOT_CONTAINS), number/date (EQ, NEQ, IN, NOT_IN, GT, GTE, LT, LTE, ISNULL, ISNOTNULL).

Aggregation functions: COUNT, MAX, MIN, DISTINCT_COUNT. For numbers: SUM, AVG.

Calculation functions: YEARS, QUARTERS, MONTHS, WEEKS, DAYS, HOURS, MONTHS_OF_YEAR, DAYS_OF_MONTH, DAYS_OF_WEEK, INTERVAL_GROUPING_FLOOR, INTERVAL_GROUPING_CEILING.

Note: Maximum result count is 5000 for queryable data views. The hasMoreResults field indicates if there are additional results beyond the count limit.`,
      inputSchema: {
        type: 'object',
        properties: {
          dataViewID: {
            type: 'string',
            description: 'ID of the data view to count results for. Must be a valid data view identifier that exists in the Pega system. Example: "D_Employees", "D_CustomerList"'
          },
          dataViewParameters: {
            type: 'object',
            description: 'Optional parameters for parameterized data views. Key-value pairs where keys are parameter names and values are parameter values. Example: {"CustomerID": "C-123", "Status": "Active"}'
          },
          query: {
            type: 'object',
            description: 'Optional query configuration for filtering, aggregation, and field selection. Uses the same structure as get_list_data_view for consistency.',
            properties: {
              select: {
                type: 'array',
                description: 'Array of field, aggregation, or calculation objects to include in count calculation. Each object should specify one of: field, aggregation, or calculation. Example: [{"field": "Name"}, {"aggregation": "AvgAge"}, {"calculation": "YearGrouping"}]',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string',
                      description: 'Field name to include. Format: "fieldName" or "associationID:fieldID" for associated fields.'
                    },
                    aggregation: {
                      type: 'string',
                      description: 'Aggregation name to include (must be defined in aggregations object)'
                    },
                    calculation: {
                      type: 'string',
                      description: 'Calculation name to include (must be defined in calculations object)'
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
                description: 'Object containing aggregation definitions. Each key is a unique name for the aggregation, each value contains field/calculation and summaryFunction. Example: {"AverageAge": {"field": "age", "summaryFunction": "AVG"}, "EmployeeCount": {"field": "EmployeeID", "summaryFunction": "COUNT"}}'
              },
              calculations: {
                type: 'object',
                description: 'Object containing calculation definitions. Each key is a unique name, each value contains function and parameters. Example: {"YearGrouping": {"function": "YEARS", "parameters": [{"field": "CreateDate"}]}, "CustomInterval": {"function": "INTERVAL_GROUPING_FLOOR", "parameters": [{"field": "Amount"}, {"interval": 1000}]}}'
              },
              distinctResultsOnly: {
                type: 'boolean',
                description: 'Set to true to count only distinct combinations of selected fields. Cannot be specified with aggregations. Use with select fields to count unique combinations.',
                default: false
              }
            }
          },
          paging: {
            type: 'object',
            description: 'Optional pagination configuration that affects count calculation. Can specify either maxResultsToFetch or pageNumber/pageSize combination, but not both.',
            properties: {
              pageNumber: {
                type: 'integer',
                minimum: 1,
                description: 'Page number for count calculation (1-based). Use with pageSize. Cannot be used with maxResultsToFetch.',
                default: 1
              },
              pageSize: {
                type: 'integer',
                minimum: 1,
                description: 'Number of records per page for count calculation. Use with pageNumber. Cannot be used with maxResultsToFetch.'
              },
              maxResultsToFetch: {
                type: 'integer',
                minimum: 1,
                description: 'Maximum number of results to consider in count calculation when data is not paginated. Cannot be used with pageNumber/pageSize.'
              }
            }
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['dataViewID']
      }
    };
  }

  /**
   * Execute the get data view count operation
   */
  async execute(params) {
    const { dataViewID, dataViewParameters, query, paging } = params;
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

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Data View Count: ${dataViewID}${query ? ' (with query)' : ''}${paging ? ' (with paging)' : ''}`,
        async () => await this.pegaClient.getDataViewCount(dataViewID, requestBody),
        { sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Data View Count: ${dataViewID}\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }
}
