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

## add_case_attachments
- "Can you attach a file to my case ON6E5R-DIYRECIPE-WORK R-1009?"
- "I need to add both a file and a URL to a case"
- "How do I attach multiple files to a Recipe Collection case at once?"

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

## jump_to_step

### Basic Navigation Questions:
- "How can I jump to a specific step in my assignment workflow?"
- "Navigate to step AssignmentSF2 in assignment ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW"
- "Jump to the second step of my Recipe Collection assignment"

### Step Discovery Questions:
- "What step IDs are available for navigation in my assignment?"
- "Show me the available navigation steps for my current assignment"
- "Help me understand the step ID patterns in my workflow"

### Advanced Navigation Questions:
- "Can I update case fields while navigating between assignment steps?"
- "Jump to AssignmentSF2 and update RecipeName to 'Navigation Test' at the same time"
- "Navigate to step AssignmentSF1 with page view to see full UI metadata"

### Error Handling Questions:
- "How do I handle navigation errors when jumping to assignment steps?"
- "What happens if I try to jump to an invalid step ID?"
- "Why am I getting a conflict error when trying to navigate to the same step?"

### ViewType Questions:
- "What's the difference between viewType options in step navigation?"
- "Show me the navigation with minimal UI information (viewType=none)"
- "Give me full page metadata when navigating to my assignment step"

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


## recalculate_assignment_fields
- "Can you recalculate the fields in my assignment form to update calculated values?"
- "I need to recalculate calculated fields for assignment ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1070!RECIPEINTAKE_FLOW with action EnterRecipeDetails"
- "Update the calculated fields RecipeName and Category for my recipe entry assignment"

## upload_attachment
- "Can you upload a file to Pega so I can attach it to a case later?"
- "I need to upload this document from my computer to create a temporary attachment"
- "Upload the file /path/to/document.pdf to Pega and give me the attachment ID"

### 💡 Tip: Multiple Upload Methods
The upload_attachment tool supports **3 different ways** to provide files:
1. **File Path**: Upload directly from your filesystem using `filePath` parameter
2. **Base64 Content**: Upload encoded content using `fileContent` and `fileName` parameters  
3. **Data URL**: Upload from data URLs using `fileUrl` and `fileName` parameters

**Remember**: Temporary attachments expire after 2 hours if not linked to a case!

## get_case_attachments
- "What attachments are associated with case ON6E5R-DIYRECIPE-WORK R-1009?"
- "Show me all files and URLs attached to my Recipe Collection case"
- "Get attachment details including thumbnails for my case"
- "List the attachments for case R-1009 with full metadata and available actions"

### 💡 Tip: Thumbnail Support  
Use `includeThumbnails=true` to get base64-encoded thumbnails for image attachments. Note that thumbnails significantly increase response size, so use them only when needed for displaying images in your interface.

## get_attachment
- "Can you get the content of this attachment for me?"
- "Download the content from attachment LINK-ATTACHMENT ON6E5R-DIYRECIPE-WORK R-1009!20250911T095425.822 GMT"  
- "Show me what's inside this file attachment - I need to see the actual content"

### 💡 Tip: Different Content Types
The get_attachment tool handles **3 types of attachment content**:
1. **File Attachments**: Returns base64-encoded content with size estimation and preview
2. **URL Attachments**: Returns the URL link with safety guidance 
3. **Correspondence**: Returns HTML email content with parsed metadata

**How to get attachment IDs**: Use `get_case_attachments` first to see all attachments and their IDs, then use those IDs with `get_attachment` to retrieve the actual content.

## delete_attachment
- "Can you delete this attachment from my case?"
- "Remove attachment LINK-ATTACHMENT ON6E5R-DIYRECIPE-WORK R-1009!20250911T104859.375 GMT from the case"
- "I need to permanently delete this file attachment that's no longer needed"

### 💡 Tip: Permanent Deletion Warning
The delete_attachment tool performs **permanent deletion** that cannot be undone. Key points:
1. **Case History Updated**: All deletions are recorded in case history for audit purposes
2. **Permission Required**: You need delete privileges for the attachment category (either self-delete or category-wide)  
3. **Multi-Link Support**: If attachment is linked to multiple cases, only the specific link is removed
4. **Verification Recommended**: Use `get_attachment` to verify details before deletion

**How to get attachment IDs**: Use `get_case_attachments` to see all attachments and their full Link-Attachment instance IDs, then use those exact IDs with `delete_attachment`. The tool validates the proper LINK-ATTACHMENT format automatically.

## get_data_objects
- "What data objects are available in this Pega application?"
- "Show me all the recipe-related data objects I can work with"
- "What case objects can I use for workflow management?"

## get_data_view_metadata  
- "Show me the field structure and metadata for the D_RecipeCollectionList data view"
- "What fields are available in the Recipe data view (D_RecipeList)?"
- "Can you analyze the structure of data view D_IngredientList for me?"

## update_attachment
- "Can you update the name of my attachment to 'Updated Document'?"
- "Change the attachment name from 'test-file' to 'Final Report' for case R-1009"
- "Update the category of this attachment to 'File' with a new name"

## get_attachment_categories
- "What attachment categories are available for my case?"
- "Show me the file attachment categories for case ON6E5R-DIYRECIPE-WORK R-1009"
- "What URL attachment categories can I use with this case?"

## update_data_record_full
- "Create a new recipe record in D_RecipeSavable with all details"
- "Replace a complete recipe record with new data"
- "Update all fields for recipe RECIPE-001 with new values"

## update_data_record_partial
- "Update just the rating and servings for recipe RECIPE-001"
- "Change only the category of recipe RECIPE-TEST-001 to 'Dessert'"
- "Partially update recipe data while keeping other fields unchanged"

## delete_data_record
- "Delete recipe record RECIPE-TEST-001 from D_RecipeSavable"
- "Remove a data record using its primary key"
- "Delete the recipe with GUID RECIPE-OLD-001"

## get_list_data_view
- "Can you show me all the recipes in our recipe collection?"
- "Can you find all dessert recipes and show me just the names and categories?"
- "How many recipes do we have in each category?"

## get_data_view_count
- "How many total recipes do we have in the system?"
- "How many unique categories exist in our recipe collection?"
- "Tell me how many dessert recipes we have without showing me the actual recipes"

## create_case_participant
- "Add a new participant to case ON6E5R-DIYRECIPE-WORK R-1009 with Customer role"
- "Can you create a participant in my Recipe Collection case?"
- "I need to add someone as an Interested participant to my case"

## get_case_participants  
- "Who are the participants in case ON6E5R-DIYRECIPE-WORK R-1009?"
- "Show me all participants for my Recipe Collection case"
- "List everyone who has access to this case"

## get_participant_roles
- "What participant roles are available for my case?"
- "Show me the available roles I can assign to participants"
- "What types of participants can I add to case R-1009?"

## get_participant_role_details
- "Show me the details for the Customer role in my case"
- "What fields are available for the Interested participant role?"
- "Get the role configuration for Owner participants"

## get_participant
- "Get details for the Customer participant in case ON6E5R-DIYRECIPE-WORK R-1009"
- "Show me information about a specific participant"
- "What details do we have for the Interested participant?"

## update_participant
- "Update the Customer participant's email to john.doe@example.com"
- "Change the name of the Interested participant in my case"
- "Modify participant details for someone in my Recipe Collection case"

## delete_participant  
- "Remove the Customer participant from case ON6E5R-DIYRECIPE-WORK R-1009"
- "Delete a participant who no longer needs access to my case"
- "Can you remove the Interested participant from my Recipe Collection case?"

---
*More examples will be added as testing progresses*