# Sample Questions for Pega Traditional DX API (V1) Tools

**Important**: Set `PEGA_API_VERSION=v1` in your `.env` file to use V1 endpoints.

**Implementation Status**: 3 of 22 endpoints complete

---

## get_cases (V1 EXCLUSIVE)
- "Show me all cases I've created"
- "List all my cases in the default work pool"
- "How many cases have I created in total?"

## get_case_types
- "What types of cases can I create in this application?"
- "Show me all available case types"

## create_case
- "Create a new Change Request case"
- "Create a case of type OZNR3E-MyTest-Work-ChangeRequest"

**V1 Note**: Supports `processID` parameter (defaults to 'pyStartCase')

## get_case
- "Get details for case OZNR3E-MYTEST-WORK C-3"
- "Show me the details of case C-3"
- "What's the status of my case?"
- "Get case information for OZNR3E-MYTEST-WORK C-3"

**V1 vs V2 Differences**:
- V1: Flat response, no eTag support, embedded UI elements
- V2: Nested data structure, eTag for optimistic locking, separated UI resources
- Both return equivalent business data

---

## update_case (V1 EXCLUSIVE) ✅
- "Update case C-3 with empty content"
- "Update the case with eTag validation"
- "Perform pyUpdateCaseDetails action on case C-3"

**V1 Note**: Requires eTag (if-match header) for all updates - get case first to obtain eTag

**Important**: Update case is V1-only. V2 uses case actions (PATCH /cases/{caseID}/actions/{actionID})

**Example Usage**:
```javascript
// Get case first to obtain eTag
const caseResult = await client.getCase('OZNR3E-MYTEST-WORK C-3');
// Update with eTag
await client.updateCase('OZNR3E-MYTEST-WORK C-3', {
  content: {},
  eTag: caseResult.eTag
});
```

---

## 🚧 Not Yet Implemented
- get_case_page (V1 EXCLUSIVE)
- get_case_view
- get_case_action
- refresh_case_action
- get_assignments (V1 EXCLUSIVE)
- get_assignment
- get_next_assignment
- perform_assignment_action
- get_assignment_action
- Attachments (6 endpoints)
- More...

**Check PROGRESS-PHASE2.md for latest status**

---

## Testing Notes

**Valid Case Type**: `OZNR3E-MyTest-Work-ChangeRequest`

**Find More Case Types**: `node tests/v1/casetypes/simple-test.js`
