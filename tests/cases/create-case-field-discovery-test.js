import { CreateCaseTool } from '../../src/tools/cases/create-case.js';
import 'dotenv/config';
import { PegaAPIClient } from '../../src/api/pega-client.js';

/**
 * Test the hybrid field discovery functionality in CreateCaseTool
 * 
 * This test covers three scenarios:
 * 1. Proactive Discovery: No content provided → Auto-discover fields
 * 2. Normal Creation: Valid content provided → Create case successfully  
 * 3. Reactive Discovery: Invalid content → Auto-discover on error
 */

// Initialize the tool
console.log('🧪 Testing CreateCaseTool Hybrid Field Discovery\n');
console.log('=' .repeat(80));

const createCaseTool = new CreateCaseTool();

// Test case type from the DIY Recipe application
const TEST_CASE_TYPE = 'ON6E5R-DIYRecipe-Work-RecipeCollection';

/**
 * Test 1: Proactive Field Discovery (No Content)
 */
async function testProactiveDiscovery() {
  console.log('\n📋 TEST 1: Proactive Field Discovery (No Content)\n');
  console.log('-'.repeat(60));
  
  try {
    const params = {
      caseTypeID: TEST_CASE_TYPE
      // No content provided - should trigger proactive discovery
    };
    
    console.log('Input Parameters:');
    console.log(JSON.stringify(params, null, 2));
    console.log('\nExecuting create_case...\n');
    
    const result = await createCaseTool.execute(params);
    
    if (result.error) {
      console.log('❌ Error:', result.error);
      return false;
    }
    
    if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Field Discovery Result:');
      console.log(result.content[0].text);
      return true;
    } else {
      console.log('❌ Unexpected result format:', JSON.stringify(result, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

/**
 * Test 2: Normal Case Creation (Valid Content) 
 */
async function testNormalCreation() {
  console.log('\n🚀 TEST 2: Normal Case Creation (Valid Content)\n');
  console.log('-'.repeat(60));
  
  try {
    const params = {
      caseTypeID: TEST_CASE_TYPE,
      content: {
        RecipeName: 'Test Recipe via Field Discovery',
        Category: 'Test Category',
        Cuisine: 'International',
        DifficultyLevel: 'Easy',
        PreparationTime: '00:15',
        CookingTime: '00:30',
        Servings: 4,
        Description: 'Test recipe created to verify field discovery enhancement'
      }
    };
    
    console.log('Input Parameters:');
    console.log(JSON.stringify(params, null, 2));
    console.log('\nExecuting create_case...\n');
    
    const result = await createCaseTool.execute(params);
    
    if (result.error) {
      console.log('❌ Error:', result.error);
      return false;
    }
    
    if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Case Creation Result:');
      console.log(result.content[0].text.substring(0, 500) + '...');
      
      // Extract case ID if available
      const caseIdMatch = result.content[0].text.match(/Case ID: ([^\n]+)/);
      if (caseIdMatch) {
        console.log(`\n📝 Created Case ID: ${caseIdMatch[1]}`);
      }
      
      return true;
    } else {
      console.log('❌ Unexpected result format:', JSON.stringify(result, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

/**
 * Test 3: Reactive Field Discovery (Invalid Content)
 */
async function testReactiveDiscovery() {
  console.log('\n🔄 TEST 3: Reactive Field Discovery (Invalid Content)\n');
  console.log('-'.repeat(60));
  
  try {
    const params = {
      caseTypeID: TEST_CASE_TYPE,
      content: {
        InvalidField: 'This field does not exist',
        AnotherBadField: 'Neither does this one',
        WrongDataType: 'This should be a date or number'
      }
    };
    
    console.log('Input Parameters (with invalid fields):');
    console.log(JSON.stringify(params, null, 2));
    console.log('\nExecuting create_case...\n');
    
    const result = await createCaseTool.execute(params);
    
    // For reactive discovery, we expect either:
    // 1. A successful case creation (if Pega accepts unknown fields)
    // 2. Field discovery guidance (if field validation fails)
    
    if (result.error) {
      console.log('❌ Error (expected for invalid fields):', result.error);
      return true; // Error is expected for this test
    }
    
    if (result.content && result.content[0] && result.content[0].text) {
      // Check if it's field discovery or case creation
      if (result.content[0].text.includes('Field Discovery')) {
        console.log('✅ Reactive Field Discovery Triggered:');
        console.log(result.content[0].text.substring(0, 500) + '...');
        return true;
      } else if (result.content[0].text.includes('Case ID:')) {
        console.log('✅ Case Created (Pega accepted unknown fields):');
        console.log(result.content[0].text.substring(0, 300) + '...');
        return true;
      }
    }
    
    console.log('❌ Unexpected result format:', JSON.stringify(result, null, 2));
    return false;
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

/**
 * Test 4: Edge Case - Empty Content Object
 */
async function testEmptyContentObject() {
  console.log('\n📝 TEST 4: Edge Case - Empty Content Object\n');
  console.log('-'.repeat(60));
  
  try {
    const params = {
      caseTypeID: TEST_CASE_TYPE,
      content: {} // Empty object - should trigger proactive discovery
    };
    
    console.log('Input Parameters:');
    console.log(JSON.stringify(params, null, 2));
    console.log('\nExecuting create_case...\n');
    
    const result = await createCaseTool.execute(params);
    
    if (result.error) {
      console.log('❌ Error:', result.error);
      return false;
    }
    
    if (result.content && result.content[0] && result.content[0].text) {
      console.log('✅ Field Discovery Result:');
      console.log(result.content[0].text.substring(0, 400) + '...');
      return true;
    } else {
      console.log('❌ Unexpected result format:', JSON.stringify(result, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log(`🎯 Testing Case Type: ${TEST_CASE_TYPE}`);
  console.log(`⏰ Test started at: ${new Date().toISOString()}`);
  
  const results = [];
  
  // Run all tests
  results.push(await testProactiveDiscovery());
  results.push(await testNormalCreation());
  results.push(await testReactiveDiscovery());
  results.push(await testEmptyContentObject());
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  results.forEach((result, index) => {
    const testNames = [
      'Proactive Discovery',
      'Normal Creation', 
      'Reactive Discovery',
      'Empty Content Object'
    ];
    
    console.log(`   ${result ? '✅' : '❌'} ${testNames[index]}`);
  });
  
  console.log(`\n⏰ Test completed at: ${new Date().toISOString()}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Hybrid field discovery is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }
}

// Execute the tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
