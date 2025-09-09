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
- "Show me the Edit details action for case R-1009"
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

---
*More examples will be added as testing progresses*