# Sample Questions for Pega Traditional DX API (V1) Tools

Simple questions you can ask the MCP to perform tasks with V1-exclusive endpoints.

**Important**: Set `PEGA_API_VERSION=v1` in your `.env` file to use these endpoints.

## V1-EXCLUSIVE ENDPOINTS

### get_cases (V1 EXCLUSIVE)
- "Show me all cases I've created"
- "List all my cases in the default work pool"
- "Get all cases I created, ordered from oldest to newest"
- "How many cases have I created in total?"
- "Show me a summary of all my cases grouped by status"

**Note**: This endpoint returns up to 500 cases (pyMaxRecords DSS). V2 users should use Data Views instead.

### update_case (V1 EXCLUSIVE - If Implemented)
- "Update the ExpenseAmount field in case MYCO-PAC-WORK E-26"
- "Change case properties directly without using actions"
- "Modify case E-26 with new data"

**Note**: V2 uses case actions instead of direct case updates.

### get_assignments (V1 EXCLUSIVE - If Implemented)
- "Show me all my assignments"
- "List all work items in my worklist"
- "Get all assignments for the authenticated user"

**Note**: V2 users should use Data Views instead.

## SHARED ENDPOINTS (V1 Compatible)

### ping_pega_service
- "Can you check if I have a valid connection to my Pega application?"
- "Test my Pega V1 API authentication setup"
- "Verify my OAuth2 configuration is working with Traditional DX API"

### get_case_types
- "What types of cases can I create in this application?"
- "Show me all available case types (V1 API)"
- "List the case types I can use for creating new cases"

### create_case
- "Create a new case with ExpenseReport case type"
- "Help me create an expense report case with processID pyStartCase"
- "Create a case using the Traditional DX API"

**V1 Specific**: Supports `processID` parameter (default: pyStartCase)

### get_case
- "Show me the details of case MYCO-PAC-WORK E-26"
- "Get information about this case using V1 API"
- "What's the current status of my expense report case?"

**V1 Note**: Returns harness and section structure, no UI separation

### get_case_action
- "Show me the available actions for case MYCO-PAC-WORK E-26"
- "What can I do with case E-26?"
- "Get action metadata for UpdateDetails action"

### perform_case_action
- "Perform the Approve action on case MYCO-PAC-WORK E-26"
- "Execute pyUpdateCaseDetails action with new expense amount"
- "Complete the review action on my expense case"

**V1 Note**: Simpler request structure, no eTag required

### get_assignment
- "Show me assignment ASSIGN-WORKLIST MYCO-PAC-WORK E-26!REVIEW"
- "Get details for my current assignment"
- "What's in my Review Expense assignment?"

### get_assignment_action
- "Show me the action form for my assignment"
- "Get metadata for Approve action on my assignment"
- "What fields are in my assignment action?"

### perform_assignment_action
- "Execute the Approve action on my assignment"
- "Complete my Review assignment with updated comments"
- "Perform assignment action with new data"

**V1 Note**: POST method, action in body, no eTag required

### Attachments (Highly Aligned with V2)
- "Upload a file to Pega"
- "Add attachments to case MYCO-PAC-WORK E-26"
- "Get attachments for my expense case"
- "Delete attachment from case"

**V1 Note**: Very similar to V2, minor response structure differences

## V1 API CHARACTERISTICS

### Key Differences from V2
- **No eTag Support**: V1 doesn't use eTags for optimistic locking
- **Simpler Responses**: Flat JSON structures without data/uiResources separation
- **No UI Metadata**: UI elements embedded in responses, not separated
- **processID Field**: V1 create_case supports processID parameter
- **Direct Updates**: PUT /cases/{ID} for direct case updates
- **GET /cases**: List all user's cases (not available in V2)

### Not Available in V1
- ❌ Participants Management
- ❌ Followers Management
- ❌ Tags Management
- ❌ Related Cases
- ❌ Stage Navigation (change_to_stage, change_to_next_stage)
- ❌ Bulk Operations
- ❌ Advanced Data View Queries
- ❌ Assignment Navigation (navigate_assignment_previous, jump_to_step)
- ❌ Save Assignment Action
- ❌ Refresh Operations
- ❌ Recalculate Fields

### When to Use V1 vs V2

**Use V1 When:**
- You need GET /cases endpoint (list all user's cases)
- You need direct case updates (PUT /cases/{ID})
- You're working with legacy Pega applications
- You need simpler response structures
- eTag support is not required

**Use V2 When:**
- You need participants, followers, or tags
- You need stage navigation
- You need bulk operations
- You need eTag support for optimistic locking
- You need advanced Data View queries
- You're building new applications on Pega Constellation

## Migration Path

### From V1 GET /cases to V2 Data Views
Instead of:
```javascript
get_cases()  // V1 only
```

Use:
```javascript
get_list_data_view({
  dataViewID: "D_MyCaseList",
  query: {
    filter: {
      filterConditions: {
        "F1": {
          "lhs": {"field": "pyCreatedBy"},
          "comparator": "EQ",
          "rhs": {"value": "{current_user}"}
        }
      },
      "logic": "F1"
    }
  },
  paging: {
    pageSize: 500,
    pageNumber: 1
  }
})
```

### From V1 PUT /cases/{ID} to V2 Case Actions
Instead of:
```javascript
updateCase(caseID, content)  // V1 only
```

Use:
```javascript
perform_case_action({
  caseID: caseID,
  actionID: "pyUpdateCaseDetails",
  content: content
})
```

## Testing V1 Endpoints

### Environment Setup
```bash
# .env file
PEGA_API_VERSION=v1
PEGA_BASE_URL=https://your-pega-instance.com
PEGA_CLIENT_ID=your-client-id
PEGA_CLIENT_SECRET=your-client-secret
```

### Session-Based Testing
You can also use session credentials to test V1 without changing environment:
```javascript
{
  sessionCredentials: {
    baseUrl: "https://your-pega-instance.com",
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    apiVersion: "v1"
  }
}
```

## Common V1 Error Scenarios

### 401 Unauthorized
- Invalid credentials
- Expired token
- OAuth configuration issues

### 403 Forbidden
- Missing pxGetCases privilege (for GET /cases)
- Missing required access roles
- Insufficient privileges for action

### 404 Not Found
- Invalid case ID
- Invalid action ID
- Case doesn't exist

### 409 Conflict
- Invalid process ID
- Process not available for current stage

## Additional Resources

- **V1 API Documentation**: `/documentation/platform/dx-api/dx-api-version-1-con.md`
- **V1 vs V2 Comparison**: `/V1-V2-COMPARISON.md`
- **V1 Implementation Guide**: `/V1-IMPLEMENTATION-GUIDE.md`
- **Phase 2 Progress**: `/PROGRESS-PHASE2.md`
