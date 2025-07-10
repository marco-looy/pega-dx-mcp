# Pega Test Environment Documentation

*Last Updated: 2025-07-07T15:06:25Z*

## Environment Overview

This document captures the details of our Pega Platform environment used for comprehensive MCP tool testing.

## Pega Platform Configuration

### Connection Details
- **Environment**: Pega Cloud (Pega Enablement)
- **Base URL**: https://pega.52a90b217c219.pegaenablement.com
- **API Base URL**: https://pega.52a90b217c219.pegaenablement.com/prweb/api/application/v2
- **OAuth2 Token URL**: https://pega.52a90b217c219.pegaenablement.com/prweb/PRRestService/oauth2/v1/token

### Authentication
- **Type**: OAuth2 Client Credentials
- **Status**: ✅ Working (verified 2025-07-07T15:03:27Z)
- **Token Type**: Bearer
- **Token Length**: 1211 characters
- **Token Prefix**: eyJraWQiOi...
- **Caching**: Enabled

### Application Details
- **Application Type**: Constellation Compatible
- **Application Name**: DIYRecipe
- **Organization**: ON6E5R

## Available Case Types

The following case types are available for testing (verified 2025-07-07T15:03:46Z):

### 1. Recipe Collection
- **Case Type ID**: `ON6E5R-DIYRecipe-Work-RecipeCollection`
- **Display Name**: Recipe Collection
- **Status**: Available for creation
- **Primary Use**: Testing case management, workflows, and assignments

### 2. Recipe Submission
- **Case Type ID**: `ON6E5R-DIYRecipe-Work-RecipeSubmission`
- **Display Name**: Recipe Submission
- **Status**: Available for creation
- **Primary Use**: Testing case creation and submission workflows

### 3. Recipe Review
- **Case Type ID**: `ON6E5R-DIYRecipe-Work-RecipeReview`
- **Display Name**: Recipe Review
- **Status**: Available for creation
- **Primary Use**: Testing assignment and review processes

### 4. Recipe Sharing
- **Case Type ID**: `ON6E5R-DIYRecipe-Work-RecipeSharing`
- **Display Name**: Recipe Sharing
- **Status**: Available for creation
- **Primary Use**: Testing sharing and collaboration features

### 5. Recipe Planning
- **Case Type ID**: `ON6E5R-DIYRecipe-Work-RecipePlanning`
- **Display Name**: Recipe Planning
- **Status**: Available for creation
- **Primary Use**: Testing planning and scheduling workflows

## Test Data Standards

### Case ID Format
**Working Format**: `ON6E5R-DIYRECIPE-WORK R-{Number}` (discovered during testing)

Examples:
- `ON6E5R-DIYRECIPE-WORK R-1016` ✅ **Working case ID**

**Note**: The documented format `ON6E5R-DIYRecipe-Work-{CaseType} R-{Number}` does not work.

### Available Test Cases

#### Primary Test Case: ON6E5R-DIYRECIPE-WORK R-1016 ✅ Fully Tested
**Recipe Collection case** (tested and verified 2025-07-10)
- **Case Type**: ON6E5R-DIYRecipe-Work-RecipeCollection  
- **Status**: New
- **Current Stage**: Recipe Intake (PRIM0)
- **Stage Label**: "Recipe Intake"
- **Business ID**: R-1016
- **Owner**: AU20881751960963974
- **Created**: 2025-07-08T07:49:24.006Z
- **Last Updated**: 2025-07-08T07:49:24.024Z

**Case Properties**:
- **Recipe Name**: "Test Recipe for Get Case"
- **Category**: "Test"
- **Urgency**: 10
- **SLA**: No goals/deadlines set

**Workflow Information**:
- **Active Assignment**: "Enter Recipe Details"
- **Assignment ID**: `ASSIGN-WORKLIST ON6E5R-DIYRECIPE-WORK R-1016!RECIPEINTAKE_FLOW`
- **Process ID**: `RecipeIntake_Flow`
- **Process Name**: "Recipe Intake"
- **Assignment Action ID**: `EnterRecipeDetails`

**Available Case Actions**:
- **Edit details**: `pyUpdateCaseDetails`
- **Change stage**: `pyChangeStage`

**Stage Progression** (7 stages total):
1. **PRIM0**: Recipe Intake (active) - create transition
2. **PRIM1**: Classification (future) - automatic transition  
3. **PRIM2**: Enhancement (future) - automatic transition
4. **PRIM3**: Review (future) - automatic transition
5. **PRIM4**: Publication (future) - automatic transition
6. **PRIM5**: Archival (future) - resolution transition
7. **ALT1**: Approval Rejection (future, alternate) - resolution transition

**Testing Status**: 
- ✅ get-case: All viewType options tested successfully
- ✅ Error handling: Invalid case ID scenarios validated
- ✅ UI Resources: Page metadata loading confirmed
- ✅ JSON Display: Full case data structure verified

### User Context
- **Test User**: Current authenticated user via OAuth2
- **Permissions**: Full access to all case types and operations
- **Role**: Case Worker with administrative privileges

## Environment Capabilities

### Confirmed Working Features
- ✅ OAuth2 Authentication
- ✅ Case Type Discovery
- ✅ API Connectivity
- ✅ Constellation UI Support

### To Be Tested
- ⏳ Case Creation with various case types
- ⏳ Assignment Management
- ⏳ Attachment Handling
- ⏳ Data View Operations
- ⏳ Bulk Operations
- ⏳ Participant Management
- ⏳ Tag Management
- ⏳ Related Case Management
- ⏳ Document Management
- ⏳ Follower Management

## Testing Constraints

### Known Limitations
- Case creation requires proper field mapping (discovered during initial testing)
- Some case types may have required fields not yet identified
- Attachment operations may require specific file types/sizes

### Best Practices
1. Always verify case type availability before testing
2. Use URL encoding for case IDs with spaces
3. Capture eTag values for update operations
4. Test both success and error scenarios
5. Document actual API responses for verification

## Environment Health Checks

### Daily Verification
Run these commands to verify environment health:

```bash
# 1. Test connectivity
node tests/ping-service/ping-service-test.js

# 2. Verify case types
node tests/casetypes/get-case-types-test.js

# 3. Test authentication
# (Included in ping service test)
```

### Weekly Verification
- Test case creation for each case type
- Verify assignment workflows
- Check data view access
- Validate attachment operations

## Troubleshooting

### Common Issues
1. **OAuth2 Failures**: Check client credentials in environment variables
2. **Case Creation Errors**: Verify required fields for each case type
3. **API Timeouts**: Pega Cloud can be slower than on-premise systems
4. **URL Encoding**: Always encode case IDs with spaces and special characters

### Debug Resources
- **Ping Service Test**: `tests/ping-service/ping-service-test.js`
- **Case Types Test**: `tests/casetypes/get-case-types-test.js`
- **MCP Debug**: `tests/debug/mcp-debug-simple.js`

## Environment Changelog

### 2025-07-07
- Initial environment documentation
- Confirmed 5 case types available
- Verified OAuth2 authentication working
- Established base URL and API endpoints
- Confirmed Constellation compatibility

---

*This document serves as the foundation for all MCP tool testing and should be updated as we discover new capabilities and constraints.*
