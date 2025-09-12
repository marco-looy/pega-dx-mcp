# Sample Data for Pega DX MCP Testing

This file contains sample data discovered during testing that can be reused for other tool tests.

## Environment Information
**Last Updated**: 2025-09-05  
**Source**: ping_pega_service testing

### Pega Instance Configuration
- **Base URL**: `https://pega.184a73b89c235.pegaenablement.com`
- **API Base URL**: `https://pega.184a73b89c235.pegaenablement.com/prweb/api/application/v2`
- **Token URL**: `https://pega.184a73b89c235.pegaenablement.com/prweb/PRRestService/oauth2/v1/token`
- **API Version**: `v2`

### Authentication Details
- **Token Type**: Bearer
- **Token Length**: ~1211 characters
- **Authentication Duration**: ~447ms (typical)
- **Token Caching**: Enabled and functional

## Test Data Notes
- All connectivity tests pass with current configuration
- OAuth2 flow works reliably
- No authentication issues encountered during testing
- Environment is stable for testing purposes

## Case Types Information
**Last Updated**: 2025-09-05  
**Source**: get_case_types testing

### Available Case Types (5 total)
**Application Type**: Constellation Compatible

1. **Recipe Collection**
   - ID: `ON6E5R-DIYRecipe-Work-RecipeCollection`
   - Creation Method: POST /cases

2. **Recipe Submission**
   - ID: `ON6E5R-DIYRecipe-Work-RecipeSubmission`
   - Creation Method: POST /cases

3. **Recipe Review**
   - ID: `ON6E5R-DIYRecipe-Work-RecipeReview`
   - Creation Method: POST /cases

4. **Recipe Sharing**
   - ID: `ON6E5R-DIYRecipe-Work-RecipeSharing`
   - Creation Method: POST /cases

5. **Recipe Planning**
   - ID: `ON6E5R-DIYRecipe-Work-RecipePlanning`
   - Creation Method: POST /cases

## Case Creation Data
**Last Updated**: 2025-09-05  
**Source**: create_case testing

### Sample Created Case
- **Case ID**: `ON6E5R-DIYRECIPE-WORK R-1009`
- **Business ID**: `R-1009`
- **Case Type**: Recipe Collection
- **Status**: New  
- **Created**: 2025-09-05T11:36:40.313Z
- **Owner**: AU52431757072200269
- **Assignment ID**: `ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW`

### Workflow Information
**Current Stage**: Recipe Intake (PRIM0) - Active
**Stage Workflow** (7 stages total):
1. Recipe Intake (PRIM0) - Primary, active
2. Classification (PRIM1) - Primary, automatic transition
3. Enhancement (PRIM2) - Primary, automatic transition
4. Review (PRIM3) - Primary, automatic transition
5. Publication (PRIM4) - Primary, automatic transition
6. Archival (PRIM5) - Primary, resolution
7. Approval Rejection (ALT1) - Alternate, resolution

**Available Case Actions**:
- Edit details (pyUpdateCaseDetails)
- Change stage (pyChangeStage)

**Current Assignment**:
- Name: "Enter Recipe Details"
- Process: Recipe Intake (RecipeIntake_Flow)
- Available Action: EnterRecipeDetails
- Multi-step: true

### Field Discovery Results
**Data View**: D_RecipeCollectionList

| Field Name | Type | Category | Example Value |
|------------|------|----------|---------------|
| RecipeName | Text | Recipe Collection | "Chocolate Chip Cookies" |
| Category | Text | Recipe Collection | "Desserts" |
| Cuisine | Text | Recipe Collection | "American" |
| DifficultyLevel | Text | Recipe Collection | "Easy" |
| PreparationTime | TimeOfDay | Recipe Collection | "00:15" |
| CookingTime | TimeOfDay | Recipe Collection | "00:25" |
| Servings | Integer | Recipe Collection | 24 |

## Case Action Information  
**Last Updated**: 2025-09-05  
**Source**: get_case_action testing

### Tested Case Actions
1. **pyUpdateCaseDetails** - "Edit details" action
   - Type: Case action
   - Available on: Recipe Collection cases
   - Purpose: Update case details
   
2. **pyChangeStage** - "Change stage" action  
   - Type: Case action
   - Available on: Recipe Collection cases
   - Purpose: Navigate case stages

### Sample eTag Values
- **eTag Format**: Contains `pxSaveDateTime` in ISO date-time format (per Pega docs)
- **Source**: HTTP response header from `GET /cases/{caseID}/actions/{actionID}`
- **Usage**: Included as `if-match` header in `PATCH /cases/{caseID}/actions/{actionID}`
- **Validation**: API compares to current `pxSaveDateTime` for optimistic locking
- **Error Handling**: HTTP 409 Conflict if eTag doesn't match current case state
- **Current Limitation**: Raw eTag values not exposed in MCP formatted responses

### Case Action Testing Results
**Last Updated**: 2025-09-08  
**Source**: perform_case_action testing

#### ✅ Successfully Resolved Testing Challenges
- **eTag Integration**: Successfully implemented eTag extraction from get_case_action responses
- **Complete Workflow**: Proven end-to-end workflow from case creation → eTag retrieval → action execution
- **Manual Testing Validation**: All success scenarios now working perfectly

#### Latest Test Results (2025-09-08)
**Test Case**: ON6E5R-DIYRECIPE-WORK R-1027
- **Created**: 2025-09-08T12:26:41.271Z with content {"RecipeName": "Manual Test Recipe", "Category": "Testing"}
- **eTag Retrieved**: 20250908T122641.286 GMT
- **Action Executed**: pyUpdateCaseDetails with content {"RecipeName": "🎉 SUCCESS! Manual Test Complete", "Category": "✅ VERIFIED"}
- **Result**: ✅ SUCCESS - No 409 conflicts, case updated successfully
- **Final Content**: RecipeName and Category fields updated as expected

#### Validated Features
- ✅ Complete eTag workflow (get fresh eTag → use immediately = success)
- ✅ Optimistic locking working correctly with no 409 conflicts
- ✅ Content updates applied successfully to case fields
- ✅ Comprehensive error handling with clear troubleshooting guidance
- ✅ Production-ready security with proper eTag validation

## Case Stage Information
**Last Updated**: 2025-09-08  
**Source**: get_case_stages testing

### Recipe Collection Workflow Stages (7 total)
1. **Recipe Intake** - Primary stage (not visited)
2. **Classification** - Primary stage (not visited)  
3. **Enhancement** - Primary stage (not visited)
4. **Review** - Primary stage (not visited)
5. **Publication** - Primary stage (not visited)
6. **Archival** - Primary stage (not visited)
7. **Approval Rejection** - Primary stage (not visited)

### Stage Analysis Insights
- All stages are Primary type (no alternate stages found)
- New cases show all stages as "Not Visited" (expected behavior)
- Tool provides hierarchical display: stages → processes → steps
- Progress tracking includes completion percentages when applicable
- Visual indicators: ✅ (visited) ⏸️ (not visited)

## Case View Information
**Last Updated**: 2025-09-08  
**Source**: get_case_view testing

### Available View Names (tested)
- **pyDetails**: Standard case details view, includes case metadata and content
- **CREATE**: Case creation view context with form structure
- **pyWorkPage**: Work page view for case processing context

### View Features Discovered
- ✅ **pyUpgradeOnOpen Data Transform**: Executes automatically on view retrieval
- ✅ **Rich Metadata**: Returns case type, status, stage, step, urgency, timestamps
- ✅ **Case Content**: Displays configured case fields and values
- ✅ **UI Resources**: Component structure and configuration for Constellation apps
- ✅ **Custom Formatting**: Enhanced response formatting with detailed analysis

### API Endpoint Pattern
`GET /api/application/v2/cases/{caseID}/views/{viewID}`

## Case Calculated Fields Information
**Last Updated**: 2025-09-08  
**Source**: get_case_view_calculated_fields testing

### Calculated Fields Testing Results
- **API Method**: POST (not GET)
- **Endpoint**: `/api/application/v2/cases/{caseID}/views/{viewID}/calculated_fields`
- **Field Filtering**: API automatically filters non-existent fields
- **Complex Parameters**: Most complex parameter structure of all tools

### Working Field Examples (Recipe Collection)
- **RecipeName**: Regular case property, works as calculated field
- **Category**: Case content field, successfully retrieved
- **pxUpdateDateTime**: System property, returns timestamp values
- **Fields with Dots**: `.RecipeName`, `.pyID` get filtered (not true calculated fields)

### Field Discovery Insights
- Regular case properties work as "calculated fields"
- Field availability depends on the specific view
- API provides clear feedback on which fields are filtered vs returned
- Perfect tool for understanding field availability in views

## Case Hierarchy Information
**Last Updated**: 2025-09-08  
**Source**: get_case_ancestors testing

### Hierarchy Testing Results
- **API Method**: GET
- **Endpoint**: `/api/application/v2/cases/{caseID}/ancestors`
- **Root Cases**: Return empty responses (no ancestors)
- **Error Handling**: Clear 404 responses for invalid case IDs

### Case Hierarchy Insights  
- **Recipe Collection Cases**: Typically root cases with no parents
- **Empty Responses**: Normal behavior for independently created cases
- **HATEOAS Links**: Available for ancestor navigation when parents exist
- **Access Control**: Respects user permissions for ancestor visibility

### get_case_descendants Results
- **API Method**: GET
- **Endpoint**: `/api/application/v2/cases/{caseID}/descendants`
- **Root Cases**: Return empty responses (no descendants)
- **Recursive Traversal**: Designed to loop through all child cases
- **Assignment Data**: Returns assignments and actions for each descendant (when present)
- **Access Control**: Shows limited info for cases user cannot access

## Stage Navigation Information  
**Last Updated**: 2025-09-09  
**Source**: change_to_next_stage testing

### Successfully Tested Stage Transitions
- **Case**: ON6E5R-DIYRECIPE-WORK R-1045
- **Transition**: PRIM0 (Recipe Intake) → PRIM1 (Classification)
- **Result**: ✅ SUCCESS - Complete workflow progression
- **Assignment Change**: Enter Recipe Details → Categorize Recipe
- **Process Change**: RecipeIntake_Flow → Classification_Flow

### Stage Navigation Insights
- **eTag Management**: Critical for optimistic locking - must use fresh eTag
- **Sequential Navigation**: Cannot skip stages, must follow primary sequence
- **Automatic Updates**: Assignments, processes, and stage status update automatically
- **Error Handling**: Clear 404/409/412 responses for invalid cases/eTags/conflicts

## change_to_stage Testing Information
**Last Updated**: 2025-09-09  
**Source**: change_to_stage testing

### Successfully Tested Stage Changes
**Test Case**: ON6E5R-DIYRECIPE-WORK R-1048

#### Primary Stage Navigation (PRIM0 → PRIM1)
- **From**: Recipe Intake (PRIM0) → Classification (PRIM1)
- **Assignment Change**: Enter Recipe Details → Categorize Recipe
- **Process Change**: RecipeIntake_Flow → Classification_Flow
- **Stage Status**: PRIM0 completed, PRIM1 active
- **Result**: ✅ SUCCESS

#### Alternate Stage Navigation (PRIM1 → ALT1)
- **From**: Classification (PRIM1) → Approval Rejection (ALT1)
- **Status Change**: New → Resolved-Rejected
- **Resolution**: Case automatically resolved
- **Assignments**: Removed (resolved case)
- **Available Actions**: Only "Reopen" action remains
- **Result**: ✅ SUCCESS

### change_to_stage vs change_to_next_stage Comparison
- **change_to_stage**: Navigate to ANY valid stage (primary/alternate)
- **change_to_next_stage**: Only navigate to next sequential primary stage
- **Flexibility**: change_to_stage allows skipping stages and alternate navigation
- **Use Cases**: change_to_stage ideal for complex workflow management

## Optional Process Information
**Last Updated**: 2025-09-09  
**Source**: add_optional_process testing - LIVE TESTING COMPLETED

### ✅ LIVE TESTED Optional Processes
**Test Case**: ON6E5R-DIYRECIPE-WORK R-1059  
**Status**: Live production testing completed successfully

### Real Optional Process - TestOptionalProcess
**Process Configuration**:
- **Name**: "TestOptionalProcess"
- **ID**: "TestOptionalProcess" 
- **Type**: "Stage" (stage-specific optional process)
- **API Endpoint**: `/cases/{caseID}/processes/TestOptionalProcess`

**Live Testing Results**:
- ✅ **Multiple Instances**: Supports multiple simultaneous instances with auto-suffixing (_1, _2, etc.)
- ✅ **Assignment Creation**: Each call creates new assignment `ASSIGN-WORKLIST {caseID}!TESTOPTIONALPROCESS_{instance}`
- ✅ **User Assignment**: Automatically assigns to calling user
- ✅ **Action Available**: "ActionStubDraftMode" with submit/save/open links

### Common Optional Process IDs (from documentation)
**Case-wide Processes**:
- **UpdateContactDetails**: Updates contact information across case
- **UpdateAddress**: Updates address information

**Stage-specific Processes**:
- **TestOptionalProcess**: ✅ LIVE CONFIRMED - Stage-specific process for Recipe Intake stage
- **UpdateAddress**: Available for specific stages only (context-dependent)

### viewType Testing Results - LIVE CONFIRMED
**ViewType Options**:
- **"none"** (default): ✅ LIVE - Returns case info, creates assignment `TESTOPTIONALPROCESS`, no uiResources
- **"form"**: ✅ LIVE - Returns form UI metadata, creates assignment `TESTOPTIONALPROCESS_1`, UI loaded 
- **"page"**: ✅ LIVE - Returns full page UI metadata, creates assignment `TESTOPTIONALPROCESS_2`, full UI resources

### Optional Process Response Structure - LIVE CONFIRMED
**Response Elements**:
- `data.caseInfo`: ✅ Case and related information (includes all assignments)
- `assignments`: ✅ Array of all assignments including new optional process assignment
- `availableProcesses`: ✅ Process remains available for future use
- `uiResources`: ✅ UI metadata (varies by viewType) - "Root component: reference"

### Process Discovery - LIVE CONFIRMED
**How to Find Available Processes**:
1. ✅ Use `get_case` tool to retrieve case details
2. ✅ Look for `availableProcesses` array in response  
3. ✅ Each process shows: name, ID, type (Case/Stage), and API links
4. ✅ Process availability depends on current case stage and permissions
5. ✅ **LIVE REQUIREMENT**: Process must be pre-configured in Pega system

### Error Scenarios Tested - LIVE CONFIRMED
- **Missing processID**: ✅ Proper validation with clear error message
- **Invalid viewType**: ✅ Enum validation working correctly
- **Non-existent process**: ✅ LIVE - 404 "Process not found for the given parameter processID"
- **Locked case**: ✅ LIVE - 423 "Resource is locked by System Admin" 
- **Non-existent case**: ✅ LIVE - 404 "Case not found"
- **Access control**: Expected 500 Internal Server Error for insufficient permissions

### LIVE Testing Insights - NEW DISCOVERIES
- **✅ Multiple Instance Support**: Tool can add same process multiple times with automatic suffixing
- **✅ Assignment Pattern**: `ASSIGN-WORKLIST {caseID}!{processID}_{instance}`
- **✅ User Auto-Assignment**: Process automatically assigned to calling user
- **✅ Case State Persistence**: Original assignments remain, optional process adds new ones
- **✅ Immediate Availability**: Process can be used immediately after configuration

## Case Action Refresh Information
**Last Updated**: 2025-09-09  
**Source**: refresh_case_action testing

### Successfully Tested Case Action Refresh
- **Test Case**: ON6E5R-DIYRECIPE-WORK R-1063
- **Action**: pyUpdateCaseDetails
- **Content Updates**: RecipeName and Category fields successfully updated
- **RefreshFor Testing**: Property-specific Data Transform execution confirmed
- **ContextData Mode**: Performance optimization working (context data only)

### refresh_case_action Features Confirmed
- **Auto-eTag Management**: Seamless operation without manual eTag handling
- **Content Merging**: Successfully updates case fields during refresh
- **Data Transform Integration**: refreshFor parameter triggers specific transforms  
- **Performance Optimization**: contextData parameter for improved response time
- **Field State Management**: Required, Disabled, and Visibility conditions evaluated
- **UI Resource Updates**: Form metadata and field states properly refreshed

### Response Structure Elements
- **Execution Sequence**: Step-by-step operation tracking (8 steps)
- **Case Information**: Current case state and metadata
- **Updated Content**: Field values after refresh operation  
- **UI Resources**: Form metadata with 18+ field configurations
- **Performance Info**: Context data optimization when enabled

## Case Type Action Information
**Last Updated**: 2025-09-10  
**Source**: get_case_type_action testing

### Successfully Tested Case Type Actions
**Case Type**: ON6E5R-DIYRecipe-Work-RecipeCollection

#### pyUpdateCaseDetails Action
- **View Name**: pyEdit (Case editing interface)
- **Available Fields**: 19 (including RecipeName, Category, PreparationTime, etc.)
- **Available Views**: 4 (pyEdit, Edit_IngredientList, Edit_Recipe, Edit_CookingInstructions)
- **Data Sources**: 9 (including D_IngredientList, D_Recipe, D_RecipeList)
- **Actions**: Submit, Cancel, Fill form with AI

#### pyChangeStage Action  
- **View Name**: pyChangeCaseStage (Stage navigation interface)
- **Available Fields**: 5 (pyChangeToOtherStage, pyGotoStage, pyAuditNote, etc.)
- **Available Views**: 1 (pyChangeCaseStage)
- **Data Sources**: 1 (D_pyAvailableCaseStages)
- **Actions**: Submit, Cancel, Fill form with AI

### get_case_type_action Testing Insights
- **Metadata Richness**: Provides comprehensive UI metadata without requiring actual case instances
- **Field Discovery**: Reveals all available form fields and their types/labels
- **View Structure**: Shows UI component organization and data source connections
- **Action Configuration**: Lists available user actions and their IDs
- **Error Handling**: Clear 404 responses for invalid case types or action IDs
- **Perfect for**: Understanding case type capabilities before case creation

## Assignment Information
**Last Updated**: 2025-09-10  
**Source**: get_assignment testing

### Successfully Tested Assignment
- **Assignment ID**: `ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW`
- **Associated Case**: ON6E5R-DIYRECIPE-WORK R-1009 (Recipe Collection)
- **Process**: RecipeIntake_Flow
- **Case Status**: New
- **Assignment Status**: Active

### Assignment API Features Confirmed
- **ViewType Support**: Both 'page' (6 fields) and 'form' (5 fields) views working
- **PageName Support**: Specific page targeting (e.g., 'pyWorkPage' returns 2 fields)
- **Case Integration**: Full case information returned with assignment details
- **UI Metadata**: Rich form structure and field information
- **Error Handling**: Clear 404 responses for invalid assignment IDs

### Assignment Response Structure
- **Case Information**: ID, type, status, stage, step, urgency, timestamps
- **UI Resources**: View type, root component type, form field count
- **Assignment Details**: Would include instructions, assigned to, due date when available
- **Available Actions**: Assignment actions (context-dependent)
- **eTag Information**: For subsequent operations (when present)

## Get Next Assignment Information
**Last Updated**: 2025-09-10  
**Source**: get_next_assignment testing

### API Endpoint Testing Results
- **Endpoint**: GET `/api/application/v2/assignments/next`
- **Expected Response**: 404 "No assignments are available" when work queue is empty
- **Query Parameters**: viewType (form/page), pageName (optional with viewType=page)

### Normal Behavior Patterns
- **Empty Work Queue**: Returns 404 NOT_FOUND with localized message "No assignments are available"
- **Error Structure**: Proper Pega API error format with errorDetails array
- **ViewType Support**: Both "form" and "page" views work identically for error responses
- **Parameter Validation**: Enum validation prevents invalid viewType values

### API Response Structure (No Assignments)
```json
{
  "status": 404,
  "type": "NOT_FOUND", 
  "message": "Case not found",
  "details": "The resource cannot be found.",
  "errorDetails": [
    {
      "message": "Error_No_Assignment_Available",
      "localizedValue": "No assignments are available"
    }
  ]
}
```

## Save Assignment Action Information
**Last Updated**: 2025-09-10  
**Source**: save_assignment_action testing

### Successfully Tested Assignment Save Operation
- **Test Case**: ON6E5R-DIYRECIPE-WORK R-1067
- **Assignment ID**: `ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1067!RECIPEINTAKE_FLOW`
- **Action ID**: `EnterRecipeDetails`
- **Content Saved**: RecipeName, Category, Cuisine fields successfully preserved
- **Result**: ✅ SUCCESS - Form data saved for later completion

### save_assignment_action Features Confirmed
- **Auto-eTag Management**: ✅ PERFECT - No manual eTag handling required
- **"Save for Later"**: ✅ CONFIRMED - Data preserved without progressing workflow
- **Content Field Persistence**: ✅ VERIFIED - Case fields saved and retrievable
- **Empty Saves**: ✅ SUPPORTED - Can save without content changes
- **Error Handling**: ✅ COMPREHENSIVE - Clear error responses for all scenarios
- **Origin Channel Validation**: ✅ WORKING - Proper validation of channel parameters

### Assignment Save API Pattern
- **Endpoint**: `PATCH /api/application/v2/assignments/{assignmentID}/actions/{actionID}/save`
- **Auto-eTag**: Uses internal `GET /assignments/{assignmentID}?viewType=form` to fetch eTag automatically
- **Response Structure**: Includes case info, assignment state, confirmation details
- **Support**: Available for Connector actions, screen flows, customized approval steps

### Critical MCP Issue Discovered
- **Issue**: MCP protocol response formatting incompatibility
- **Impact**: Tool cannot be used via MCP interface despite perfect API functionality
- **Workaround**: Direct API calls work flawlessly
- **Status**: Requires MCP response format fix in tool implementation

## Assignment Action Information
**Last Updated**: 2025-09-10  
**Source**: perform_assignment_action testing

### Successfully Tested Assignment Action Execution
- **Test Case**: ON6E5R-DIYRECIPE-WORK R-1009
- **Assignment ID**: `ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW`
- **Action ID**: `EnterRecipeDetails`
- **Content Updates**: RecipeName, Category, Cuisine fields successfully updated
- **Result**: ✅ SUCCESS - Complete workflow progression to next assignment step

### perform_assignment_action Features Confirmed
- **Auto-eTag Management**: ✅ FULLY FUNCTIONAL - No manual eTag handling required
- **Workflow Progression**: ✅ CONFIRMED - Progresses to next assignment step seamlessly
- **Content Field Updates**: ✅ VERIFIED - Case fields updated correctly during action execution
- **Multi-Step Assignment Pattern**: Assignment ID remains same, assignment name changes between steps
- **Field Count Evolution**: Form fields increase between steps (5 → 9 fields)
- **Error Handling**: ✅ COMPREHENSIVE - Clear NOT_FOUND errors with troubleshooting guidance

### Workflow Progression Pattern
**Before Action**:
- Assignment Name: "Enter Recipe Details"
- Available Fields: 5 (RecipeName, Category, Cuisine, pyLabel, pyID)
- Action Available: EnterRecipeDetails

**After Action**:  
- Assignment Name: "Input Ingredients List" 
- Available Fields: 9 (expanded field set)
- Action Available: Input Ingredients List
- Case Content: Updated with provided values
- Assignment ID: Same (`ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW`)

### Assignment Action API Pattern
- **Endpoint**: `PATCH /api/application/v2/assignments/{assignmentID}/actions/{actionID}`
- **Auto-eTag**: Uses internal `GET /assignments/{assignmentID}?viewType=form` to fetch eTag automatically
- **Response Structure**: Includes case info, next assignment details, UI resources
- **ViewType Support**: none, form, page options working perfectly

### Testing Insights - CRITICAL DISCOVERIES
1. **Zero Manual eTag Management**: Tool handles eTag fetching automatically via get_assignment
2. **Multi-Step Assignment Workflow**: Same assignment ID progresses through different steps
3. **Dynamic Field Evolution**: Form structure evolves between assignment steps
4. **Complete Response Data**: Rich case information, next steps, available actions included
5. **Production-Grade Error Handling**: Professional error responses with clear troubleshooting

## Assignment Action Refresh Information
**Last Updated**: 2025-09-10  
**Source**: refresh_assignment_action testing

### Successfully Tested Assignment Refresh Operations
- **Test Case**: ON6E5R-DIYRECIPE-WORK R-1068
- **Assignment ID**: `ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1068!RECIPEINTAKE_FLOW`
- **Action ID**: `EnterRecipeDetails`
- **Auto-eTag**: Successfully implemented and working seamlessly
- **Result**: ✅ SUCCESS - Complete form refresh functionality working

### refresh_assignment_action Features Confirmed
- **Auto-eTag Management**: ✅ PERFECT - No manual eTag handling required
- **Form Content Updates**: ✅ VERIFIED - Case fields refreshed correctly during operation
- **Property-Triggered Refresh**: ✅ CONFIRMED - refreshFor parameter triggers Data Transform execution
- **AI Form Filling**: ✅ WORKING - fillFormWithAI populates empty fields (Cuisine: "Italian")
- **Data Transform Integration**: ✅ CONFIRMED - Form refresh settings and pyRefreshData executed
- **UI Resource Updates**: ✅ VERIFIED - Field states and metadata properly refreshed

### Critical Bug Fixed
- **Issue**: Missing auto-eTag functionality made tool completely non-functional
- **Resolution**: Implemented auto-eTag management matching save_assignment_action pattern
- **Files Modified**: pega-client.js (if-match header) + refresh-assignment-action.js (auto-eTag fetch)
- **Impact**: Tool now fully production-ready with seamless operation

### Assignment Refresh Response Structure
- **Auto-eTag Management**: Uses internal `GET /assignments/{assignmentID}?viewType=form` to fetch eTag
- **Content Merging**: User values take precedence over Data Transform values
- **Execution Sequence**: 4-5 steps depending on refreshFor parameter usage
- **Field Limitation**: Only visible and editable fields can be effectively updated
- **UI Resources**: Form metadata with field counts and component information

### RefreshFor Parameter Testing
- **Property**: RecipeName
- **Behavior**: Triggers specific Data Transform execution before pyRefreshData
- **Execution Steps**: Adds step 4 "Refresh Data Transform executed for property: RecipeName"
- **Use Case**: Property change events in form refresh settings

### fillFormWithAI Parameter Testing
- **Requirement**: EnableGenerativeAI toggle must be enabled in Pega system
- **Behavior**: AI fills empty form fields with contextually appropriate values
- **Example**: Cuisine field auto-populated with "Italian" for recipe context
- **Field Preservation**: Existing field values remain unchanged
- **Integration**: Works seamlessly with other refresh operations

## Assignment Navigation Information
**Last Updated**: 2025-09-10  
**Source**: navigate_assignment_previous testing

### Successfully Tested Navigation Scenario
- **Test Case**: ON6E5R-DIYRECIPE-WORK R-1069
- **Assignment ID**: `ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1069!RECIPEINTAKE_FLOW`
- **Navigation Path**: "Enter Recipe Details" ↔ "Input Ingredients List"
- **Multi-Step Pattern**: Same assignment ID, different step names
- **Result**: ✅ SUCCESS - Seamless navigation between steps

### navigate_assignment_previous Features Confirmed
- **Auto-eTag Management**: ✅ FULLY FUNCTIONAL after bug fix (line 183: eTag→finalETag)
- **Multi-Step Navigation**: ✅ CONFIRMED - Works between assignment steps in screen flows
- **ViewType Support**: ✅ VERIFIED - Both 'page' and 'form' views working correctly
- **Error Handling**: ✅ WORKING - Proper VALIDATION_FAIL when at first step
- **Navigation Context**: ✅ CONFIRMED - Returns navigation steps and UI resources
- **Content Updates**: ❌ ISSUE - BAD_REQUEST error when content parameter provided

### Assignment Navigation API Pattern
- **Endpoint**: `PATCH /api/application/v2/assignments/{assignmentID}/navigation_steps/previous`
- **Auto-eTag**: Uses internal `GET /assignments/{assignmentID}?viewType=form` to fetch eTag automatically
- **Response Structure**: Includes case info, assignment state, navigation context, UI resources
- **Support**: Available for multi-step forms and screen flows with Enable navigation link

### Critical Bug Discovery
- **Issue**: Tool was passing `eTag` instead of `finalETag` to API client
- **Location**: src/tools/assignments/navigate-assignment-previous.js line 183
- **Impact**: Tool was completely non-functional before fix
- **Resolution**: Variable name corrected during testing
- **Status**: ✅ FIXED - Tool now fully functional for basic navigation

### Assignment Navigation Response Structure
- **Navigation Direction**: Previous step in workflow sequence
- **Assignment Evolution**: Same assignment ID, different step names and available fields
- **UI Context**: Navigation breadcrumb information and step indicators
- **Field Support**: Form field count and metadata adapt to current step
- **Error Types**: VALIDATION_FAIL for first step (differs from documented 422)

## Jump to Step Information
**Last Updated**: 2025-09-11  
**Source**: jump_to_step testing

### Successfully Tested Step Navigation
- **Test Case**: ON6E5R-DIYRECIPE-WORK R-1009  
- **Assignment ID**: `ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1009!RECIPEINTAKE_FLOW`

#### Step Navigation Patterns  
- **AssignmentSF1**: "Enter Recipe Details" (5 fields, 4 components)
- **AssignmentSF2**: "Input Ingredients List" (10 fields, 9 components)  
- **Pattern**: `AssignmentSF{n}` format for sequential steps
- **Complexity Growth**: Field count and UI complexity increase with step progression

#### Tool Features Confirmed
- ✅ **Auto-eTag Management**: No manual eTag handling required
- ✅ **Multi-Step Navigation**: Seamless navigation between assignment steps
- ✅ **Content Updates**: Update case fields during step navigation
- ✅ **ViewType Support**: form, page, none options working perfectly
- ✅ **Error Handling**: 409 CONFLICT (same step), 404 NOT_FOUND (invalid step)
- ✅ **Assignment Evolution**: Same assignment ID, different step names and field counts

#### Navigation Response Elements
- **Rich Assignment Context**: Case info, assignment details, UI resources
- **Step Discovery Guidance**: Comprehensive help for finding valid step IDs
- **Error Recovery**: Clear troubleshooting steps for each error scenario
- **Performance**: Sub-second navigation (~700-800ms response times)

#### Critical Issues Fixed
- **Syntax Errors**: Fixed invalid `finalETag.trim()` parameter handling
- **Response Format**: Corrected MCP protocol response formatting methods
- **Production Status**: Tool now fully functional and production-ready

## Recalculate Assignment Fields Information
**Last Updated**: 2025-09-11  
**Source**: recalculate_assignment_fields testing

### Successfully Tested Field Recalculation
- **Test Case**: ON6E5R-DIYRECIPE-WORK R-1070  
- **Assignment ID**: `ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1070!RECIPEINTAKE_FLOW`
- **Action ID**: `EnterRecipeDetails`
- **eTag**: `20250911T074705.620 GMT`

#### Tool Features Confirmed
- ✅ **Auto-eTag Management**: No manual eTag handling required
- ✅ **Field Recalculation**: Calculates fields and when conditions successfully
- ✅ **Content Merging**: Updates case fields before calculations
- ✅ **API Response**: Returns data and uiResources structures
- ✅ **Error Handling**: Proper NOT_FOUND responses for invalid assignments
- ✅ **Parameter Validation**: Comprehensive validation of calculations structure

#### Critical Issues Fixed
- **Syntax Errors**: Fixed invalid `finalETag.trim():` property syntax
- **Missing Commas**: Added commas in required arrays (lines 90, 109)  
- **API Call Structure**: Fixed malformed executeRequest to proper try-catch
- **Variable References**: Corrected eTag vs finalETag usage throughout
- **Validation Logic**: Moved eTag validation after auto-fetch logic
- **Production Status**: Tool fully functional and production-ready

#### Assignment Action Requirements
- **Fresh Assignments**: Must use assignments in proper state for recalculation
- **Valid Actions**: Action must support field recalculation (EnterRecipeDetails works)
- **Field Context**: Fields must exist in assignment action view with valid context
- **When Conditions**: When rules must be accessible in assignment action scope
- **Response Structure**: Returns calculation results, UI resources, field states

## Upload Attachment Information
**Last Updated**: 2025-09-11  
**Source**: upload_attachment testing

### ✅ CRITICAL BUG FIXED - FormData Compatibility Issue
**Issue**: Node.js form-data library incompatibility with web standard fetch() API
**Root Cause**: Mixed usage of Node.js form-data with web fetch() causing file transmission failure
**Solution**: Updated to use web standard FormData with Blob for proper file handling
**Result**: All upload methods now fully functional

### Successfully Tested Upload Methods
**1. File Path Upload**
- **Method**: Direct filesystem file upload using `filePath` parameter
- **Test File**: `/tmp/test-upload.txt` (189 bytes)
- **Result**: ✅ SUCCESS - Attachment ID: `fdc24cf7-8e85-4cfb-9591-abf31ea72daa`
- **Features**: Auto MIME type detection (text/plain), unique ID appending

**2. Base64 Content Upload**
- **Method**: Upload base64-encoded content using `fileContent` and `fileName` parameters
- **Test Data**: 189-byte text content encoded to base64
- **Result**: ✅ SUCCESS - Attachment ID: `073ec397-9619-443f-816e-6b9bdb15eea1`
- **Features**: Custom filename handling, MIME type specification, no unique ID option

**3. Data URL Upload**
- **Method**: Upload from data URL using `fileUrl` and `fileName` parameters
- **Test URL**: `data:text/plain;base64,VGVzdCBkYXRhIFVSTCBjb250ZW50IGZvciB1cGxvYWQgdGVzdGluZw==`
- **Result**: ✅ SUCCESS - Attachment ID: `ae2a36c3-e8d9-422f-9628-a6110dbfe28c`
- **Features**: Data URL parsing, content extraction, MIME type auto-detection

### Upload API Pattern
- **Endpoint**: POST `/api/application/v2/attachments/upload`
- **Format**: Multipart form-data with web standard FormData
- **Authentication**: OAuth2 Bearer token required
- **Response**: JSON with temporary attachment ID (UUID format)
- **Expiry**: Temporary attachments auto-delete after 2 hours if not linked

### Error Handling Confirmed
- **Empty Files**: Proper "Empty file can't be uploaded" error (HTTP 400)
- **Server Validation**: Comprehensive error details with localized messages
- **Error Types**: BAD_REQUEST, FILE_TOO_LARGE, VIRUS_SCAN_FAIL supported
- **User Guidance**: Detailed troubleshooting suggestions in error responses

### Technical Implementation
- **FormData Type**: Web standard FormData (globalThis.FormData)
- **File Handling**: Buffer → Blob conversion for web compatibility
- **MIME Detection**: mime-types library for automatic content type detection
- **Response Formatting**: Rich MCP responses with usage examples and next steps

## Add Case Attachments Information
**Last Updated**: 2025-09-11  
**Source**: add_case_attachments testing

### ✅ SUCCESS SCENARIOS CONFIRMED (3/3 PASSED)
**Test Case**: ON6E5R-DIYRECIPE-WORK R-1009 (Recipe Collection)

#### Attachment Types Successfully Tested
**1. File Attachments**
- **Temporary ID**: ca4c1358-ce44-48e5-96bb-ced2e920f802 (from upload_attachment)
- **File Size**: 51 bytes (text/plain)
- **Result**: ✅ SUCCESS - Converted to permanent case attachment
- **Response Time**: ~1.0 seconds

**2. URL Attachments**  
- **URL**: https://www.github.com
- **Display Name**: GitHub
- **Result**: ✅ SUCCESS - Direct URL attachment to case
- **Response Time**: ~1.0 seconds

**3. Mixed Attachments (Atomic Operation)**
- **File**: c32fb4fc-839c-47fb-aa9d-d60ec79060dd (53 bytes)
- **URL**: https://www.google.com (Google Search)
- **Result**: ✅ SUCCESS - Both attachments processed atomically
- **Response Time**: ~1.4 seconds
- **Confirmation**: Atomic operation working perfectly

### add_case_attachments API Pattern
- **Endpoint**: POST `/api/application/v2/cases/{caseID}/attachments`
- **Payload**: JSON array of attachment objects
- **File Type**: `{"type": "File", "category": "File", "ID": "temp-attachment-id"}`
- **URL Type**: `{"type": "URL", "category": "URL", "url": "https://...", "name": "display-name"}`
- **Response**: Success confirmation with attachment summary

### ❌ CRITICAL MCP ISSUE DISCOVERED
**Problem**: Error responses not displayed through MCP protocol
**Impact**: Cannot test error handling via MCP interface
**Error Scenarios Affected**: 6+ validation and API error tests
**Recommendation**: Urgent MCP error handling investigation needed

### Attachment Workflow Integration
- **Upload → Attach**: upload_attachment creates temporary ID → add_case_attachments makes permanent
- **Expiry Management**: Temporary attachments expire in 2 hours if not linked
- **Case Association**: All case users gain access to attached files/URLs
- **Atomic Processing**: Multiple attachments succeed/fail together

## Get Case Attachments Information
**Last Updated**: 2025-09-11  
**Source**: get_case_attachments testing

### Successfully Tested Attachment Retrieval
**Test Case**: ON6E5R-DIYRECIPE-WORK R-1009 (7 attachments)
**Empty Case**: ON6E5R-DIYRECIPE-WORK R-1071 (no attachments)

### Attachment Types Confirmed
**File Attachments (3)**:
- **test-upload.txt**: 189 bytes, text/plain MIME type
- **test-attachment-1.txt**: text/plain, with proper metadata  
- **test-attachment-2.txt**: text/plain, with creation timestamps

**URL Attachments (4)**:
- **GitHub**: https://www.github.com (application/octet-stream MIME)
- **Google Search**: https://www.google.com
- **Test URLs**: Various test URLs with proper categorization

### get_case_attachments Features Confirmed
- **Rich Metadata Display**: ID, type, category, filename, MIME type, creator, timestamps
- **Attachment Grouping**: Automatically groups by FILE, URL, EMAIL, other types
- **Available Actions**: Download, Edit, Delete links via HATEOAS
- **Thumbnail Support**: includeThumbnails parameter working (no images in test case)
- **Empty State Handling**: Clear messaging for cases without attachments
- **Error Handling**: Proper 404 NOT_FOUND for invalid case IDs
- **Response Performance**: ~1.5 seconds for 7 attachments, ~0.6 seconds for empty cases

### API Integration Pattern
- **Endpoint**: GET `/api/application/v2/cases/{caseID}/attachments`
- **Query Parameter**: `includeThumbnails` (boolean, default: false)
- **Authentication**: OAuth2 Bearer token required
- **Category Filtering**: Respects Attachment Category rule configuration
- **User Permissions**: Returns only attachments user has access to view

## Get Attachment Categories Information
**Last Updated**: 2025-09-11  
**Source**: get_attachment_categories testing

### Attachment Category Configuration (Recipe Collection)
**Test Case**: ON6E5R-DIYRECIPE-WORK R-1009

#### File Attachment Categories
- **Category Name**: File
- **Category ID**: File
- **Permissions**: Full access (View ✅, Create ✅, Edit ✅, Delete Own ✅, Delete All ✅)
- **API Endpoint**: `/cases/{caseID}/attachment_categories?type=File`

#### URL Attachment Categories  
- **Category Name**: URL
- **Category ID**: URL
- **Permissions**: Full access (View ✅, Create ✅, Edit ✅, Delete Own ✅, Delete All ✅)
- **API Endpoint**: `/cases/{caseID}/attachment_categories?type=URL`

### API Behavior Confirmed
- **Type Parameter**: Case insensitive ('file' → 'File', 'url' → 'URL')
- **Default Behavior**: Defaults to 'File' when no type specified
- **Filtering**: Returns either File or URL categories per request, not both
- **Permission Model**: Each category includes 5 permission flags
- **Response Time**: 1.0-1.5 seconds consistently
- **Error Handling**: 404 NOT_FOUND for invalid case IDs with detailed troubleshooting

## Get Attachment Information
**Last Updated**: 2025-09-11  
**Source**: get_attachment testing

### Successfully Tested Attachment Content Retrieval
**Test Case**: ON6E5R-DIYRECIPE-WORK R-1009 (7 attachments)

#### File Attachment Content (Base64)
**test-upload.txt**:
- **Attachment ID**: `LINK-ATTACHMENT ON6E5R-DIYRECIPE-WORK R-1009!20250911T095425.822 GMT`
- **Content Type**: File (Base64 encoded)
- **Size**: 189 bytes (estimated from base64)
- **Base64 Content**: `VGhpcyBpcyBhIHRlc3QgZmlsZSBmb3IgdXBsb2FkX2F0dGFjaG1lbnQgdGVzdGluZy4K...`
- **Decoded Content**: "This is a test file for upload_attachment testing..."

**test-attachment-1.txt**:
- **Attachment ID**: `LINK-ATTACHMENT ON6E5R-DIYRECIPE-WORK R-1009!20250911T104712.747 GMT`  
- **Content Type**: File (Base64 encoded)
- **Size**: 51 bytes (estimated from base64)
- **Base64 Content**: `VGVzdCBmaWxlIGNvbnRlbnQgZm9yIGFkZF9jYXNlX2F0dGFjaG1lbnRzIHRlc3RpbmcK`
- **Decoded Content**: "Test file content for add_case_attachments testing"

#### URL Attachment Content
**GitHub URL**:
- **Attachment ID**: `LINK-ATTACHMENT ON6E5R-DIYRECIPE-WORK R-1009!20250911T104722.036 GMT`
- **Content Type**: URL Link
- **URL**: https://www.github.com
- **Display**: URL with safety verification notes

### get_attachment API Pattern
- **Endpoint**: GET `/api/application/v2/attachments/{attachmentID}`
- **Authentication**: OAuth2 Bearer token required
- **Response Types**: 
  - File: Base64 encoded content with size estimation
  - URL: Plain URL string with safety guidance
  - Correspondence: HTML email content (not tested)
- **Response Headers**: Empty (expected behavior)
- **Response Time**: ~500ms consistently

### Content Type Detection
- **Base64 Identification**: Uses pattern matching and length validation
- **URL Validation**: URL constructor validation
- **HTML Detection**: Pattern matching for HTML tags
- **Size Calculation**: Accurate estimation from base64 content length

### Error Handling Confirmed
- **404 NOT_FOUND**: Proper error for non-existent attachments with troubleshooting
- **Parameter Validation**: Internal validation exists but MCP interface issues prevent display
- **Response Quality**: Professional error formatting with comprehensive guidance

### MCP Interface Issues Discovered
- **Problem**: Parameter validation errors not exposed through MCP interface
- **Impact**: Invalid formats and missing parameters return empty responses
- **Status**: Core functionality works perfectly, MCP integration needs investigation
- **Workaround**: Always use valid attachment IDs from get_case_attachments

## Delete Attachment Information
**Last Updated**: 2025-09-11  
**Source**: delete_attachment testing

### Successfully Tested Deletion Operations
**Test Case**: ON6E5R-DIYRECIPE-WORK R-1009 (Recipe Collection)

#### Successful Deletions
**File Attachment Deleted**:
- **Attachment ID**: `LINK-ATTACHMENT ON6E5R-DIYRECIPE-WORK R-1009!20250911T104859.375 GMT`
- **File Name**: test-attachment-2.txt
- **Result**: ✅ SUCCESS - Permanently removed from system
- **Response Time**: ~1.4 seconds
- **Verification**: Attachment count reduced from 7 to 6

**URL Attachment Deleted**:
- **Attachment ID**: `LINK-ATTACHMENT ON6E5R-DIYRECIPE-WORK R-1009!20250911T112102.449 GMT`  
- **Display Name**: Test Example
- **Result**: ✅ SUCCESS - Permanently removed from system
- **Response Time**: ~1.6 seconds
- **Final Count**: 5 attachments remaining

### delete_attachment API Pattern
- **Endpoint**: DELETE `/api/application/v2/attachments/{attachmentID}`
- **Method**: HTTP DELETE with Bearer token authentication
- **ID Format**: Complete Link-Attachment instance pzInsKey required
- **Response Time**: 1.0-1.6 seconds consistently
- **Case History**: Updated automatically after successful deletion
- **Permissions**: Validates user has delete privileges for attachment category

### Error Scenarios Confirmed
- **404 NOT_FOUND**: Non-existent attachment IDs with detailed troubleshooting
- **Client Validation**: Empty parameters caught before API call
- **Format Validation**: Two-tier validation (client + server) working properly
- **Permission Model**: Users can delete own attachments OR category-wide if configured

### Tool Features Verified
- ✅ **Permanent Deletion**: Cannot be undone - proper warning provided
- ✅ **Audit Trail**: Case history updated for compliance tracking
- ✅ **Multi-Link Support**: Only specific attachment link removed
- ✅ **Permission Validation**: Attachment category privileges enforced
- ✅ **ID Parsing**: Extracts case reference and timestamp from attachment ID
- ✅ **Error Handling**: Comprehensive troubleshooting guidance for each scenario

### Production Readiness Assessment
- **Parameter Validation**: Excellent - both client-side and server-side
- **Error Handling**: Outstanding - detailed guidance for all scenarios  
- **Response Format**: Professional - rich formatted responses
- **Performance**: Excellent - sub-2-second response times
- **Overall Status**: ✅ PRODUCTION READY

## Update Attachment Information
**Last Updated**: 2025-09-11  
**Source**: update_attachment testing

### Successfully Tested Updates
**Test Case**: ON6E5R-DIYRECIPE-WORK R-1009 (Recipe Collection)

#### File Attachment Updates
- **Original**: test-upload.txt → **Updated**: 📝 Updated Test File
- **Original**: test-attachment-1.txt → **Updated**: 🚀 Test with Special Characters: @#$%^&*()_+-=[]{}|;':\",./<>? 中文 العربية 🎉
- **Result**: ✅ SUCCESS - Display names updated while preserving file content

#### URL Attachment Updates
- **Original**: GitHub → **Updated**: 🐙 Updated GitHub Link
- **Original**: Google Search → **Updated**: [670+ character long name...]
- **Result**: ✅ SUCCESS - Display names updated while preserving original URLs

### update_attachment API Pattern
- **Endpoint**: PATCH `/api/application/v2/attachments/{attachmentID}`
- **Method**: PATCH with JSON body containing name and category
- **Authentication**: OAuth2 Bearer token required
- **URL Encoding**: Attachment ID automatically URL encoded for special characters
- **Response Time**: Consistent 1.0-1.1 seconds
- **Response Format**: Success confirmation with "Attachment edited successfully" message

### Testing Insights
- ✅ **Unicode Support**: Full emoji, special character, and international text support confirmed
- ✅ **Length Handling**: No server-side restrictions found (tested 670+ characters)
- ✅ **Category Validation**: Server validates category existence and user permissions
- ✅ **Update Scope**: Only name and category can be updated (filename/URL unchanged as expected)
- ✅ **Error Quality**: Excellent troubleshooting guidance for all error scenarios
- ✅ **MCP Validation Fixed**: All validation errors now display properly (bug resolved 2025-09-12)

### Error Scenarios Confirmed
- **404 NOT_FOUND**: Non-existent attachments with detailed "Error_File_Not_Found" response
- **403 FORBIDDEN**: Invalid categories trigger "Error_Attachment_Access_Denied" security validation
- **Client Validation**: Empty name/category parameters properly caught with clear messages
- **Validation Errors**: Malformed attachment IDs display proper error messages (fixed 2025-09-12)

### Sample Attachment IDs (Recipe Collection Case)
- **File**: `LINK-ATTACHMENT ON6E5R-DIYRECIPE-WORK R-1009!20250911T095425.822 GMT`
- **URL**: `LINK-ATTACHMENT ON6E5R-DIYRECIPE-WORK R-1009!20250911T104722.036 GMT`
- **Format**: Complete Link-Attachment instance pzInsKey required
- **Usage**: Get IDs from get_case_attachments before updating

### Production Readiness Assessment - update_attachment
- **Core Functionality**: ✅ EXCELLENT - Name and category updates work perfectly
- **Parameter Validation**: ✅ EXCELLENT - All validation scenarios working properly (fixed 2025-09-12)
- **Error Handling**: ✅ EXCELLENT - Rich error responses with comprehensive troubleshooting
- **Performance**: ✅ EXCELLENT - Consistent sub-2-second response times
- **Unicode Support**: ✅ OUTSTANDING - Full international character and emoji support  
- **Overall Status**: ✅ FULLY PRODUCTION READY (no caveats)

## Data Objects Information
**Last Updated**: 2025-09-12  
**Source**: get_data_objects testing

### Available Data Objects (13 total)
**Test Date**: 2025-09-12  
**Recipe Application Context**: All objects relate to DIY Recipe application domain

#### Data Type Objects (7)
1. **CookingInstruction** (D_CookingInstructionList)
   - Detailed recipe preparation steps with multimedia support
   - Integration: Recipe database for real-time updates

2. **Ingredient** (D_IngredientList)  
   - Recipe components with nutritional information
   - Integration: Ingredient inventory system for data synchronization

3. **Recipe** (D_RecipeList)
   - Complete recipes with ingredients and instructions
   - Integration: Recipe database with photos and cooking time

4. **RecipeCategory** (D_RecipeCategoryList)
   - Recipe classification and categorization system
   - Integration: Recipe database for organization

5. **RecipeRating** (D_RecipeRatingList)
   - User reviews and rating system
   - Integration: User management system

6. **ShoppingList** (D_ShoppingListList)
   - Ingredient lists generated from recipes
   - Integration: User management system

7. **UserProfile** (D_UserProfileList)
   - User preferences, dietary restrictions, and favorites
   - Integration: User management system

#### Case Type Objects (6)  
1. **ChildCase** (D_ChildCaseList)
   - Generic child case functionality

2. **Recipe Collection** (D_RecipeCollectionList)
   - Recipe management and organization with tagging and search
   - Integration: Calendar and reminder functionalities

3. **Recipe Planning** (D_RecipePlanningList)
   - Meal planning with shopping list generation
   - Integration: Calendar system

4. **Recipe Review** (D_RecipeReviewList)
   - Recipe rating with moderation and feedback
   - Integration: Quality control mechanisms

5. **Recipe Sharing** (D_RecipeSharingList)
   - Social sharing with privacy controls
   - Integration: Social media platforms

6. **Recipe Submission** (D_RecipeSubmissionList)
   - New recipe validation and approval workflow
   - Integration: Quality assurance processes

### Data Object API Pattern
- **Endpoint**: GET `/api/application/v2/data`
- **Type Filtering**: `?type=data` or `?type=case`
- **Response Elements**: classID, dataObjectID, defaultListDataView, description, name, isDefaultListDataViewQueryable, links
- **HATEOAS Links**: Metadata links for data view exploration
- **Performance**: ~1.5 seconds consistent response time

## Data View Metadata Information
**Last Updated**: 2025-09-12  
**Source**: get_data_view_metadata testing

### Successfully Tested Data Views
**Recipe Application Context**: All data views relate to DIY Recipe application domain

#### D_RecipeCollectionList (Case Type Data View)
- **Class ID**: ON6E5R-DIYRecipe-Work-RecipeCollection
- **Structure**: List, isQueryable: true, isSearchable: false  
- **Field Count**: 112 fields across 6 categories
- **Categories**: Recipe Collection, Recipe, Create Operator, Update Operator, Case Type, Update Operator
- **Response Time**: ~2.4 seconds
- **Complexity**: High (case workflow + recipe data + operator associations)

**Sample Fields**:
- **Recipe Fields**: RecipeName, Category, Cuisine, DifficultyLevel, PreparationTime, CookingTime, Servings
- **System Fields**: pxCreateDateTime, pxUpdateDateTime, pxSaveDateTime, pyStatusWork, pyID
- **Operator Fields**: pxCreateOperator, pxUpdateOperator with full association metadata
- **Case Fields**: pyDescription, pyEffortActual, pySLADeadline, pyResolvedTimestamp

#### D_RecipeList (Data Type Data View)
- **Class ID**: ON6E5R-DIYRecipe-Data-Recipe
- **Structure**: List, isQueryable: true, isSearchable: false
- **Field Count**: 71 fields across 3 categories  
- **Categories**: Recipe, Create Operator, Update Operator
- **Response Time**: ~1.6 seconds (33% faster than case type)
- **Complexity**: Medium (pure recipe data + operator associations)

**Sample Fields**:
- **Recipe Fields**: Category, Cuisine, Date, Duration, Ingredient, Instruction, Name, Photo, Rating, Servings
- **System Fields**: pxCreateDateTime, pxUpdateDateTime, pxSaveDateTime, pyGUID
- **Operator Associations**: Full Create/Update operator metadata with contact details

### Data View Metadata API Pattern
- **Endpoint**: GET `/api/application/v2/data_views/{dataViewID}`
- **Authentication**: OAuth2 Bearer token required
- **Response Elements**: classID, className, structure, isQueryable, isSearchable, name, fields array, HATEOAS links
- **Field Metadata**: category, description, displayAs, fieldID, fieldType, isReadOnly, name, dataType, maxLength, associations
- **Performance**: 1.4-2.4 seconds depending on data view complexity
- **Case Sensitivity**: Data view IDs require exact case matching (D_RecipeList ≠ d_recipelist)

### Field Type Examples
- **Text Fields**: "Text (single line)" with maxLength constraints
- **DateTime Fields**: "Date & time", "Date only", "Time only" with displayAs formatting
- **Numeric Fields**: "Integer", "Decimal" with validation
- **Reference Fields**: "User Reference" with D_pxOperatorsList data source links
- **Special Fields**: "Email", "Phone", "URL" with format validation

## Future Data Collection
Additional sample data will be added here as we test more tools:
- List data view examples from get_list_data_view tests  
- Participant information from participant tests
- Document handling examples from document tests