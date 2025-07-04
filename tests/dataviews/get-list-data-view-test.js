#!/usr/bin/env node

import { GetListDataViewTool } from '../../src/tools/dataviews/get-list-data-view.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetListDataViewTool() {
  console.log('🧪 Testing GetListDataViewTool\n');

  try {
    // Test tool category
    const category = GetListDataViewTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'dataviews') {
      throw new Error(`Expected category 'dataviews', got '${category}'`);
    }

    // Test tool definition
    const definition = GetListDataViewTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    if (definition.name !== 'get_list_data_view') {
      throw new Error(`Expected name 'get_list_data_view', got '${definition.name}'`);
    }

    // Test BaseTool inheritance
    const toolInstance = new GetListDataViewTool();
    console.log(`✅ Extends BaseTool: ${toolInstance instanceof BaseTool}`);
    if (!(toolInstance instanceof BaseTool)) {
      throw new Error('Tool does not extend BaseTool');
    }

    // Test input schema structure
    const schema = definition.inputSchema;
    console.log('✅ Input schema validation:');
    
    // Check required parameters
    if (!schema.required.includes('dataViewID')) {
      throw new Error('dataViewID should be required');
    }
    console.log('  - dataViewID is required ✓');

    // Check optional parameters exist
    const properties = schema.properties;
    const expectedProperties = ['dataViewID', 'dataViewParameters', 'query', 'paging', 'useExtendedTimeout'];
    for (const prop of expectedProperties) {
      if (!properties[prop]) {
        throw new Error(`Missing property: ${prop}`);
      }
    }
    console.log('  - All expected properties present ✓');

    // Check complex nested query structure
    const queryProperties = properties.query?.properties;
    if (!queryProperties) {
      throw new Error('Query properties not defined');
    }
    
    const expectedQueryProperties = ['select', 'sortBy', 'filter', 'aggregations', 'distinctResultsOnly'];
    for (const prop of expectedQueryProperties) {
      if (!queryProperties[prop]) {
        throw new Error(`Missing query property: ${prop}`);
      }
    }
    console.log('  - Query sub-properties present ✓');

    // Check paging structure
    const pagingProperties = properties.paging?.properties;
    if (!pagingProperties) {
      throw new Error('Paging properties not defined');
    }
    
    const expectedPagingProperties = ['pageNumber', 'pageSize', 'maxResultsToFetch'];
    for (const prop of expectedPagingProperties) {
      if (!pagingProperties[prop]) {
        throw new Error(`Missing paging property: ${prop}`);
      }
    }
    console.log('  - Paging sub-properties present ✓');

    // Test parameter validation - required parameter missing
    const requiredTest = toolInstance.validateRequiredParams({}, ['dataViewID']);
    console.log(`✅ Required validation works: ${!!requiredTest.error}`);
    if (!requiredTest.error) {
      throw new Error('Should return error when required parameter is missing');
    }

    // Test parameter validation - required parameter present
    const validTest = toolInstance.validateRequiredParams({ dataViewID: 'D_Test' }, ['dataViewID']);
    console.log(`✅ Valid parameter passes: ${!validTest}`);
    if (validTest) {
      throw new Error('Should not return error when required parameter is present');
    }

    // Test use case examples in description
    const description = definition.description;
    const useCases = [
      'Standard Data Retrieval',
      'Aggregated Data',
      'Distinct Values',
      'Non-queryable Data Views'
    ];
    
    for (const useCase of useCases) {
      if (!description.includes(useCase)) {
        throw new Error(`Use case "${useCase}" not found in description`);
      }
    }
    console.log('✅ All 4 use cases documented in description');

    // Test filter comparators documentation
    const filterComparators = ['IS_TRUE', 'IS_FALSE', 'EQ', 'NEQ', 'IN', 'NOT_IN', 'STARTS_WITH', 'CONTAINS'];
    for (const comparator of filterComparators) {
      if (!description.includes(comparator)) {
        throw new Error(`Filter comparator "${comparator}" not documented`);
      }
    }
    console.log('✅ Filter comparators documented');

    // Test aggregation functions documentation
    const aggregationFunctions = ['COUNT', 'MAX', 'MIN', 'SUM', 'AVG', 'DISTINCT_COUNT'];
    for (const func of aggregationFunctions) {
      if (!description.includes(func)) {
        throw new Error(`Aggregation function "${func}" not documented`);
      }
    }
    console.log('✅ Aggregation functions documented');

    // Test execution method exists and handles parameters correctly
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('Execute method not implemented');
    }
    console.log('✅ Execute method implemented');

    // Test with minimal parameters
    console.log('\n🔄 Testing execution scenarios...');
    
    // Mock the pegaClient for testing without actual API calls
    toolInstance.pegaClient = {
      getListDataView: async (dataViewID, requestBody) => {
        return {
          success: true,
          data: {
            fetchDateTime: '2023-05-10T10:15:30.000Z',
            resultCount: 3,
            data: [
              { Name: 'John Doe', Age: 30 },
              { Name: 'Jane Smith', Age: 25 },
              { Name: 'Bob Johnson', Age: 35 }
            ]
          }
        };
      }
    };

    // Test Case 1: Minimal parameters (Non-queryable data view)
    const minimalResult = await toolInstance.execute({ dataViewID: 'D_SimpleData' });
    if (!minimalResult.content || !Array.isArray(minimalResult.content)) {
      throw new Error(`Minimal execution failed: Expected MCP content array, got ${typeof minimalResult.content}`);
    }
    console.log('✅ Use Case 4: Non-queryable data view execution test passed');

    // Test Case 2: With dataViewParameters
    const parametersResult = await toolInstance.execute({
      dataViewID: 'D_ParameterizedData',
      dataViewParameters: { param1: 'value1', param2: 'value2' }
    });
    if (!parametersResult.content || !Array.isArray(parametersResult.content)) {
      throw new Error('Parameters execution failed: Expected MCP content array');
    }
    console.log('✅ Data view parameters execution test passed');

    // Test Case 3: With query and paging
    const queryResult = await toolInstance.execute({
      dataViewID: 'D_Employees',
      query: {
        select: [{ field: 'Name' }, { field: 'Age' }],
        filter: {
          filterConditions: {
            F1: {
              lhs: { field: 'Department' },
              comparator: 'EQ',
              rhs: { value: 'IT' }
            }
          },
          logic: 'F1'
        }
      },
      paging: { pageSize: 50 }
    });
    if (!queryResult.content || !Array.isArray(queryResult.content)) {
      throw new Error('Query execution failed: Expected MCP content array');
    }
    console.log('✅ Use Case 1: Standard data retrieval execution test passed');

    // Test Case 4: With aggregations
    const aggregationResult = await toolInstance.execute({
      dataViewID: 'D_Employees',
      query: {
        aggregations: {
          AvgAge: { field: 'age', summaryFunction: 'AVG' },
          EmployeeCount: { field: 'EmployeeID', summaryFunction: 'COUNT' }
        },
        select: [{ field: 'Department' }]
      },
      paging: { maxResultsToFetch: 1000 }
    });
    if (!aggregationResult.content || !Array.isArray(aggregationResult.content)) {
      throw new Error('Aggregation execution failed: Expected MCP content array');
    }
    console.log('✅ Use Case 2: Aggregated data execution test passed');

    // Test Case 5: Distinct results
    const distinctResult = await toolInstance.execute({
      dataViewID: 'D_Employees',
      query: {
        select: [{ field: 'Department' }],
        distinctResultsOnly: true
      },
      paging: { maxResultsToFetch: 500 }
    });
    if (!distinctResult.content || !Array.isArray(distinctResult.content)) {
      throw new Error('Distinct execution failed: Expected MCP content array');
    }
    console.log('✅ Use Case 3: Distinct values execution test passed');

    // Test Case 6: Extended timeout
    const timeoutResult = await toolInstance.execute({
      dataViewID: 'D_ReportBased',
      useExtendedTimeout: true
    });
    if (!timeoutResult.content || !Array.isArray(timeoutResult.content)) {
      throw new Error('Extended timeout execution failed: Expected MCP content array');
    }
    console.log('✅ Extended timeout execution test passed');

    console.log('\n🎉 All GetListDataViewTool tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('- Tool registration and inheritance: ✅');
    console.log('- Parameter schema validation: ✅');
    console.log('- All 4 use cases documented: ✅');
    console.log('- Filter comparators documented: ✅');
    console.log('- Aggregation functions documented: ✅');
    console.log('- Execution method implementation: ✅');
    console.log('- All use case execution scenarios: ✅');
    console.log('\n🔧 Tool is ready for production use!');
    
    return true;
  } catch (error) {
    console.error('❌ GetListDataViewTool test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testGetListDataViewTool().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testGetListDataViewTool };
