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

### Sample Questions
- "Update the change request title for case C-3"
- "Update case C-3 with a new description and requested by field"
- "Set the RequestedBy field to 'John Doe' for case C-3"
- "Update the ChangeRequestTitle to 'Emergency Change' in case C-3"
- "Update case C-3 change request description"

### Real Example (Tested via MCP)
```javascript
update_case({
  caseID: "OZNR3E-MYTEST-WORK C-3",
  content: {
    "ChangeRequestTitle": "Updated via MCP - Testing Auto-Fetch",
    "ChangeRequestDescription": "This demonstrates real content update with automatic eTag fetching",
    "RequestedBy": "Claude Code Testing"
  }
})
```
**Result**: ✅ All 3 fields updated successfully!

### Valid Fields for Updates
For case type `OZNR3E-MyTest-Work-ChangeRequest`:
- `ChangeRequestID`, `ChangeRequestTitle`, `ChangeRequestDescription`
- `RequestedBy`, `RequestedDate`, `AssignedTo`, `AssignedDate`
- `ActualEndDate`

See `sample-data-v1.md` for complete schema.

### Important Notes
- ✅ **eTag auto-fetched** if not provided (V2-style behavior)
- ✅ **No manual GET required** - just call update_case directly
- ⚠️ **V1 EXCLUSIVE** - V2 uses `perform_case_action` instead
- ⚠️ Use valid property names (invalid names return 400 error)

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
