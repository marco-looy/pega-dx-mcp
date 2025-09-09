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

## Future Data Collection
Additional sample data will be added here as we test more tools:
- Assignment IDs from assignment tests  
- Data view examples from data view tests
- Participant information from participant tests