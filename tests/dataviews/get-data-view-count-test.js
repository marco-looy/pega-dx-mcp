#!/usr/bin/env node
import 'dotenv/config';

import { GetDataViewCountTool } from '../../src/tools/dataviews/get-data-view-count.js';
import { BaseTool } from '../../src/registry/base-tool.js';

async function testGetDataViewCountTool() {
  console.log('🧪 Testing GetDataViewCountTool\n');

  try {
    // Test tool category
    const category = GetDataViewCountTool.getCategory();
    console.log(`✅ Category: ${category}`);
    if (category !== 'dataviews') {
      throw new Error(`Expected category 'dataviews', got '${category}'`);
    }

    // Test tool definition
    const definition = GetDataViewCountTool.getDefinition();
    console.log(`✅ Tool name: ${definition.name}`);
    if (definition.name !== 'get_data_view_count') {
      throw new Error(`Expected name 'get_data_view_count', got '${definition.name}'`);
    }

    // Test BaseTool inheritance
    const toolInstance = new GetDataViewCountTool();
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
    const expectedProperties = ['dataViewID', 'dataViewParameters', 'query', 'paging'];
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
    
    const expectedQueryProperties = ['select', 'filter', 'aggregations', 'calculations', 'distinctResultsOnly'];
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
      'Simple Count',
      'Count with Parameters',
      'Filtered Count',
      'Distinct Count',
      'Aggregated Count'
    ];
    
    for (const useCase of useCases) {
      if (!description.includes(useCase)) {
        throw new Error(`Use case "${useCase}" not found in description`);
      }
    }
    console.log('✅ All 5 use cases documented in description');

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

    // Test calculation functions documentation
    const calculationFunctions = ['YEARS', 'QUARTERS', 'MONTHS', 'WEEKS', 'DAYS', 'HOURS'];
    for (const func of calculationFunctions) {
      if (!description.includes(func)) {
        throw new Error(`Calculation function "${func}" not documented`);
      }
    }
    console.log('✅ Calculation functions documented');

    // Test execution method exists and handles parameters correctly
    if (typeof toolInstance.execute !== 'function') {
      throw new Error('Execute method not implemented');
    }
    console.log('✅ Execute method implemented');

    // Test with minimal parameters
    console.log('\n🔄 Testing execution scenarios...');
    
    // Mock the pegaClient for testing without actual API calls
    toolInstance.pegaClient = {
      getDataViewCount: async (dataViewID, requestBody) => {
        return {
          success: true,
          data: {
            fetchDateTime: '2023-05-10T10:15:30.000Z',
            resultCount: 1234,
            totalCount: 1234,
            hasMoreResults: false,
            ID: 'test-count-id'
          }
        };
      }
    };

    // Test Case 1: Minimal parameters (Simple count)
    const minimalResult = await toolInstance.execute({ dataViewID: 'D_SimpleData' });
    if (!minimalResult.content || !Array.isArray(minimalResult.content)) {
      throw new Error(`Minimal execution failed: Expected MCP content array, got ${typeof minimalResult.content}`);
    }
    console.log('✅ Use Case 1: Simple count execution test passed');

    // Test Case 2: With dataViewParameters
    const parametersResult = await toolInstance.execute({
      dataViewID: 'D_ParameterizedData',
      dataViewParameters: { CustomerID: 'C-123', Status: 'Active' }
    });
    if (!parametersResult.content || !Array.isArray(parametersResult.content)) {
      throw new Error('Parameters execution failed: Expected MCP content array');
    }
    console.log('✅ Use Case 2: Count with parameters execution test passed');

    // Test Case 3: With filtered count
    const filteredResult = await toolInstance.execute({
      dataViewID: 'D_Employees',
      query: {
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
      }
    });
    if (!filteredResult.content || !Array.isArray(filteredResult.content)) {
      throw new Error('Filtered count execution failed: Expected MCP content array');
    }
    console.log('✅ Use Case 3: Filtered count execution test passed');

    // Test Case 4: With distinct count
    const distinctResult = await toolInstance.execute({
      dataViewID: 'D_Employees',
      query: {
        select: [{ field: 'Department' }],
        distinctResultsOnly: true
      }
    });
    if (!distinctResult.content || !Array.isArray(distinctResult.content)) {
      throw new Error('Distinct count execution failed: Expected MCP content array');
    }
    console.log('✅ Use Case 4: Distinct count execution test passed');

    // Test Case 5: With aggregation count
    const aggregationResult = await toolInstance.execute({
      dataViewID: 'D_Sales',
      query: {
        aggregations: {
          TotalRevenue: { field: 'Revenue', summaryFunction: 'SUM' },
          OrderCount: { field: 'OrderID', summaryFunction: 'COUNT' }
        },
        select: [{ aggregation: 'TotalRevenue' }, { aggregation: 'OrderCount' }]
      }
    });
    if (!aggregationResult.content || !Array.isArray(aggregationResult.content)) {
      throw new Error('Aggregation count execution failed: Expected MCP content array');
    }
    console.log('✅ Use Case 5: Aggregated count execution test passed');

    // Test Case 6: With calculations
    const calculationResult = await toolInstance.execute({
      dataViewID: 'D_TimeData',
      query: {
        calculations: {
          YearGroup: { function: 'YEARS', parameters: [{ field: 'CreateDate' }] }
        },
        select: [{ calculation: 'YearGroup' }]
      }
    });
    if (!calculationResult.content || !Array.isArray(calculationResult.content)) {
      throw new Error('Calculation count execution failed: Expected MCP content array');
    }
    console.log('✅ Calculation-based count execution test passed');

    // Test Case 7: With paging parameters
    const pagingResult = await toolInstance.execute({
      dataViewID: 'D_LargeDataset',
      paging: { 
        pageNumber: 1, 
        pageSize: 100 
      }
    });
    if (!pagingResult.content || !Array.isArray(pagingResult.content)) {
      throw new Error('Paging count execution failed: Expected MCP content array');
    }
    console.log('✅ Paging-based count execution test passed');

    // Test Case 8: With maxResultsToFetch
    const maxResultsResult = await toolInstance.execute({
      dataViewID: 'D_LimitedData',
      paging: { 
        maxResultsToFetch: 5000 
      }
    });
    if (!maxResultsResult.content || !Array.isArray(maxResultsResult.content)) {
      throw new Error('MaxResults count execution failed: Expected MCP content array');
    }
    console.log('✅ MaxResultsToFetch count execution test passed');

    // Test Case 9: Complex combined query
    const complexResult = await toolInstance.execute({
      dataViewID: 'D_ComplexData',
      dataViewParameters: { Region: 'North' },
      query: {
        select: [{ field: 'Category' }, { aggregation: 'TotalSales' }],
        filter: {
          filterConditions: {
            F1: {
              lhs: { field: 'Status' },
              comparator: 'EQ',
              rhs: { value: 'Active' }
            }
          },
          logic: 'F1'
        },
        aggregations: {
          TotalSales: { field: 'Sales', summaryFunction: 'SUM' }
        }
      },
      paging: { pageSize: 50 }
    });
    if (!complexResult.content || !Array.isArray(complexResult.content)) {
      throw new Error('Complex count execution failed: Expected MCP content array');
    }
    console.log('✅ Complex combined query count execution test passed');

    console.log('\n🎉 All GetDataViewCountTool tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('- Tool registration and inheritance: ✅');
    console.log('- Parameter schema validation: ✅');
    console.log('- All 5 use cases documented: ✅');
    console.log('- Filter comparators documented: ✅');
    console.log('- Aggregation functions documented: ✅');
    console.log('- Calculation functions documented: ✅');
    console.log('- Execution method implementation: ✅');
    console.log('- All use case execution scenarios: ✅');
    console.log('- Complex query combinations: ✅');
    console.log('\n🔧 Tool is ready for production use!');
    
    return true;
  } catch (error) {
    console.error('❌ GetDataViewCountTool test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testGetDataViewCountTool().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testGetDataViewCountTool };
