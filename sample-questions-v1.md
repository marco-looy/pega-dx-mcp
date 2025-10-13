# Sample Questions for Pega Traditional DX API (V1) Tools

**Important**: Set `PEGA_API_VERSION=v1` in your `.env` file to use V1 endpoints.

**Implementation Status**: 2 of 22 endpoints complete

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

---

## 🚧 Not Yet Implemented

- get_case
- update_case (V1 EXCLUSIVE)
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
