# Assignments API - Todo List

**Priority:** HIGH (Core workflow functionality)  
**Complexity:** MODERATE  
**Current Status:** 0/9 endpoints completed

## 🔄 High Priority (Core Operations)
- [ ] `get_next_assignment` - Get next assignment details (GET /assignments/next)
- [ ] `get_assignment` - Get assignment details (GET /assignments/{assignmentID})
- [ ] `get_assignment_action` - Get action details of an assignment (GET /assignments/{assignmentID}/actions/{actionID})
- [ ] `perform_assignment_action` - Perform assignment action (PATCH /assignments/{assignmentID}/actions/{actionID})

## 🔄 Medium Priority (Form Operations)
- [ ] `recalculate_assignment_fields` - Recalculate calculated fields & whens (PATCH /assignments/{assignmentID}/actions/{actionID}/recalculate)
- [ ] `refresh_assignment_action` - Refresh assignment action (PATCH /assignments/{assignmentID}/actions/{actionID}/refresh)
- [ ] `save_assignment_action` - Save assignment action (PATCH /assignments/{assignmentID}/actions/{actionID}/save)

## 🔄 Medium Priority (Navigation)
- [ ] `go_back_previous_step` - Go back to previous step (PATCH /assignments/{assignmentID}/navigation_steps/previous)
- [ ] `jump_to_step` - Jump to the specified step (PATCH /assignments/{assignmentID}/navigation_steps/{stepID})

## Implementation Notes
- **Dependencies:** PegaAPIClient, OAuth2Client
- **Common Parameters:** assignmentID, actionID, stepID
- **Error Handling:** 404 (assignment not found), 401 (unauthorized), 400 (bad request)
- **Testing:** Each tool needs corresponding test file in /tests/
- **Pattern:** Similar to case tools but assignment-focused
- **Integration:** Works closely with case operations

## Key Differences from Cases
- **Assignment Focus:** Individual work items vs entire cases
- **Navigation:** Step-based navigation within assignments
- **Form Operations:** Heavy emphasis on form field management
- **Workflow:** Linear progression through assignment steps

## MCP Tool Names Convention
- Prefix: No prefix needed
- Format: snake_case
- Clear action intent (e.g., `get_next_assignment`, `perform_assignment_action`)

## Priority Rationale
- **HIGH Priority:** Core assignment retrieval and execution
- **MEDIUM Priority:** Form state management and navigation
- Essential for complete Pega workflow automation
