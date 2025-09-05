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
- eTag format: Varies by case and timestamp
- Used for: Subsequent case operations requiring optimistic locking
- Retrieved from: get_case_action response
- **Note**: Raw eTag values not exposed in current MCP formatted responses

### Case Action Testing Results
**Last Updated**: 2025-09-05  
**Source**: perform_case_action testing

#### Testing Challenges
- perform_case_action requires valid eTag from get_case_action
- MCP formatted responses don't expose raw eTag values
- Success scenarios limited by eTag dependency

#### Validated Features
- Excellent error handling with 412 PRECONDITION_FAILED responses
- Comprehensive parameter validation (caseID, actionID, eTag required)
- Clear troubleshooting guidance in error messages
- Production-ready security with optimistic locking

## Future Data Collection
Additional sample data will be added here as we test more tools:
- Assignment IDs from assignment tests  
- Data view examples from data view tests
- Participant information from participant tests