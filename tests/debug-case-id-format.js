#!/usr/bin/env node

import { PegaAPIClient } from '../src/api/pega-client.js';

/**
 * Debug the exact case ID format expected by the Pega API
 */
async function debugCaseIDFormat() {
  console.log('🔍 Debugging Case ID Format\n');

  const pegaClient = new PegaAPIClient();

  // Test different case ID formats to see which one works
  const testCaseIDs = [
    'R-1005',
    'ON6E5R-DIYRECIPE-WORK-RECIPECOLLECTION R-1005',
    'ON6E5R-DIYRecipe-Work-RecipeCollection R-1005',
    'ON6E5R-DIYRECIPE-WORK RC-1005',
    'RECIPECOLLECTION R-1005'
  ];

  console.log('Testing different case ID formats...\n');

  for (const caseID of testCaseIDs) {
    console.log(`Testing: "${caseID}"`);
    
    try {
      const result = await pegaClient.getCase(caseID);
      
      if (result.success) {
        console.log(`✅ SUCCESS - Case found with ID: ${caseID}`);
        console.log(`   Case Type: ${result.data.data?.caseInfo?.caseTypeName || 'Unknown'}`);
        console.log(`   Status: ${result.data.data?.caseInfo?.status || 'Unknown'}`);
        console.log(`   Stage: ${result.data.data?.caseInfo?.stage || 'Unknown'}\n`);
        break;
      } else {
        console.log(`❌ FAILED - ${result.error.type}: ${result.error.message}`);
        if (result.error.details) {
          console.log(`   Details: ${result.error.details}`);
        }
        console.log('');
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}\n`);
    }
  }

  // Also test creating a case to see what ID format is returned
  console.log('\n🔨 Creating a test case to see ID format...\n');
  
  try {
    const createResult = await pegaClient.createCase({
      caseTypeID: 'ON6E5R-DIYRecipe-Work-RecipeCollection',
      content: {
        Name: 'Test Case for ID Format Debug'
      }
    });

    if (createResult.success) {
      console.log('✅ Test case created successfully');
      const newCaseID = createResult.data.data?.caseInfo?.ID;
      console.log(`📋 New Case ID: "${newCaseID}"`);
      
      if (newCaseID) {
        console.log('\n🔍 Testing retrieval of newly created case...');
        const getResult = await pegaClient.getCase(newCaseID);
        
        if (getResult.success) {
          console.log('✅ Successfully retrieved newly created case');
          console.log(`   ID format that works: "${newCaseID}"`);
        } else {
          console.log('❌ Failed to retrieve newly created case');
          console.log(`   Error: ${getResult.error.message}`);
        }
      }
    } else {
      console.log('❌ Failed to create test case');
      console.log(`   Error: ${createResult.error.message}`);
      if (createResult.error.details) {
        console.log(`   Details: ${createResult.error.details}`);
      }
    }
  } catch (error) {
    console.log(`❌ ERROR creating test case: ${error.message}`);
  }

  console.log('\n📋 Debug Summary:');
  console.log('================');
  console.log('If none of the test formats worked, the case "R-1005" might not exist.');
  console.log('The case ID format depends on your Pega application configuration.');
  console.log('Common formats include:');
  console.log('- Short format: R-1005');
  console.log('- Full format: [ApplicationPrefix]-[CaseType]-[WorkType] [ID]');
  console.log('- Example: ON6E5R-DIYRECIPE-WORK-RECIPECOLLECTION R-1005');
}

debugCaseIDFormat().catch(console.error);
