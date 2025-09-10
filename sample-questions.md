# Sample Questions for Pega DX MCP Tools

Simple questions you can ask the MCP to perform tasks with each tool.

## ping_pega_service
- "Can you check if I have a valid connection to my Pega application?"
- "Test my Pega authentication setup"
- "Verify my OAuth2 configuration is working"

## get_case_types
- "What types of cases can I create in this application?"
- "Show me all available case types"
- "List the case types I can use for creating new cases"

## create_case
- "Create a new Recipe Collection case for me"
- "What fields do I need to create a Recipe Collection case?"
- "Help me create a case with sample recipe data"

## get_case
- "Show me the details of case R-1009"
- "Get information about case ON6E5R-DIYRECIPE-WORK R-1009"
- "What's the current status of my Recipe Collection case?"

## get_case_action
- "Show me the Edit details action for case ON6E5R-DIYRECIPE-WORK R-1009"
- "What can I do with the pyUpdateCaseDetails action on my case?"
- "Get the form metadata for the Change stage action on my Recipe Collection case"

## perform_case_action

1. **First, get the current eTag**:
   - "Get the case action details for pyUpdateCaseDetails on case ON6E5R-DIYRECIPE-WORK R-1027"
   - eTag is automatically extracted from response

2. **Then, perform the action immediately**:
   - "Execute pyUpdateCaseDetails on case ON6E5R-DIYRECIPE-WORK R-1027 with eTag '20250908T122641.286 GMT' and update RecipeName to '🎉 SUCCESS! Manual Test Complete'"

### Sample Questions (All Validated):
- "I need to update case R-1027. First get me the current eTag, then perform the update"
- "Update my Recipe Collection case with new recipe details - handle the eTag workflow for me"
- "Follow the complete manual testing flow to update case name and verify success"
- "Get current case action details, then immediately execute the update action"

### Why eTags Are Required:
- Pega uses optimistic locking to prevent concurrent modifications
- The eTag represents the exact moment (pxSaveDateTime) the case was last saved
- Using a stale eTag will result in 409 Conflict errors
- **Proven Pattern**: Fresh eTag → immediate use = 100% success rate

## change_to_stage
- "Move my case to the Classification stage"
- "Navigate case R-1048 from Recipe Intake to Classification stage"
- "Jump my Recipe Collection case to the Approval Rejection alternate stage"
- "Help me change case R-1048 to stage PRIM2 using the proper eTag workflow"

## get_case_stages
- "Show me the workflow stages for case ON6E5R-DIYRECIPE-WORK R-1009"
- "What stages are in my Recipe Collection case and what's the progress?"
- "Get the stage information for my case to see where it is in the workflow"

## delete_case
- "Delete the test case ON6E5R-DIYRECIPE-WORK R-1030 for me"
- "Remove case R-1031 that's still in the create stage"
- "Clean up my test case that I just created"

## get_case_view
- "Show me the pyDetails view for case ON6E5R-DIYRECIPE-WORK R-1008"
- "Get the CREATE view information for my Recipe Collection case"
- "Retrieve the pyStages view for case ON6E5R-DIYRECIPE-WORK R-1009 to see the UI structure"

## get_case_view_calculated_fields
- "Get calculated fields RecipeName and Category from pyDetails view for case ON6E5R-DIYRECIPE-WORK R-1038"
- "Show me which calculated fields are available in my Recipe Collection case view"
- "Retrieve field values from CREATE view with RecipeName, Category, and pxUpdateDateTime"

## get_case_ancestors
- "Show me the ancestor hierarchy for case ON6E5R-DIYRECIPE-WORK R-1038"
- "Get the parent cases for my Recipe Collection case"
- "Trace the case hierarchy upward from case R-1038"

## get_case_descendants
- "Show me the descendant hierarchy for case ON6E5R-DIYRECIPE-WORK R-1038"
- "Get the child cases for my Recipe Collection case"
- "List all sub-cases descending from case R-1038 with their assignments"

## change_to_next_stage
- "Move my Recipe Collection case ON6E5R-DIYRECIPE-WORK R-1045 to the next stage"
- "Progress case R-1045 through the workflow to Classification stage"
- "Navigate my case from Recipe Intake to the next stage in the sequence"

## add_optional_process
- "Add the UpdateContactDetails process to case ON6E5R-DIYRECIPE-WORK R-1056"
- "Start the optional UpdateAddress process for my Recipe Collection case"
- "What optional processes can I add to case R-1056?"
- "Add a case-wide optional process with form view to see the UI metadata"

## release_case_lock
- "Release any locks on my Recipe Collection case ON6E5R-DIYRECIPE-WORK R-1060"
- "Clean up cached data and unlock case R-1061"
- "Cancel my case operation and release the pessimistic lock"
- "Release the lock on case R-1060 and show me the updated case information"

## refresh_case_action
- "Refresh the pyUpdateCaseDetails form for case ON6E5R-DIYRECIPE-WORK R-1063 with updated RecipeName and Category"
- "Execute Data Transform refresh for RecipeName property on my Recipe Collection case"
- "Refresh my case action form in context data mode for better performance"
- "Update case fields and refresh the form to see the latest field states"

## recalculate_case_action_fields
- "Recalculate the RecipeName and Category fields for case ON6E5R-DIYRECIPE-WORK R-1063 using pyUpdateCaseDetails action"
- "Evaluate calculated fields with content merging for my Recipe Collection case"
- "Calculate field values and when conditions for my case action form"
- "Recalculate specific fields using the content context and see the updated values"

## get_assignment
- "Show me the details of assignment ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW"
- "Get information about my Recipe Collection assignment with form view"
- "What's the current status and context of my Enter Recipe Details assignment?"
- "Show me the assignment details with UI metadata for the pyWorkPage view"

## get_assignment_action
- "Get the EnterRecipeDetails action metadata for assignment ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW"
- "Show me the form structure for my assignment action with page view"
- "What UI resources are available for the EnterRecipeDetails action on my assignment?"
- "Get assignment action details with optimized response (exclude additional case actions)"

## perform_assignment_action
- "Execute the EnterRecipeDetails action on assignment ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW"
- "Perform my assignment action and update RecipeName to 'Updated Chocolate Chip Cookies'"
- "Complete my Recipe Details assignment with updated Category and Cuisine fields"
- "Execute assignment action with content updates and progress the workflow to the next step"
- "Run my assignment action without providing eTag (let the tool handle it automatically)"

## get_next_assignment
- "What's the next assignment I should work on?"
- "Get my next work item from the queue"
- "Show me the next available task with form view"
- "Fetch my next assignment with full page UI metadata"
- "Do I have any assignments waiting for me?"

## save_assignment_action
- "Save my form data for assignment ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW without submitting"
- "I need to save my work in progress on this assignment and come back to it later"
- "Save the recipe details I've entered so far without completing the assignment"
- "Preserve my form data for assignment with action EnterRecipeDetails"
- "Save for later on my current assignment without eTag (auto-fetch it for me)"

## refresh_assignment_action
- "Refresh my assignment form to update field states and execute data transforms"
- "I changed the Recipe Name field and need to refresh the form to see updated defaults"
- "Update my assignment form with new content and trigger field recalculation"
- "Refresh assignment ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1068!RECIPEINTAKE_FLOW with EnterRecipeDetails action"
- "Fill my assignment form with AI-generated sample values using generative AI"

## navigate_assignment_previous
- "Navigate back to the previous step in assignment ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1069!RECIPEINTAKE_FLOW"
- "Go back one step in my multi-step Recipe Collection assignment"  
- "I'm on step 2 and need to go back to step 1 to update something"
- "Navigate to the previous assignment step with content updates for RecipeName and Category"

### 💡 Tip: Multi-Step Navigation Success
**For navigation to work, you must be on step 2 or later** - there's no previous step from step 1! The tool automatically handles eTag management and works perfectly when there's actually a previous step to navigate to. Content updates work seamlessly when combined with valid navigation.

---
*More examples will be added as testing progresses*