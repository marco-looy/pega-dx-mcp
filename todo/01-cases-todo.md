# Cases API - Todo List

**Priority:** HIGH (Core functionality)  
**Complexity:** MODERATE  
**Current Status:** 8/18 endpoints completed (44.4% complete)

## ✅ Completed Tools (8/18)
- [x] `get_case` - Get case details (GET /cases/{caseID}) - ✅ **IMPLEMENTED** in `src/tools/cases/get-case.js`
- [x] `create_case` - Creates new case (POST /cases) - ✅ **IMPLEMENTED** in `src/tools/cases/create-case.js`
- [x] `delete_case` - Delete case in create stage (DELETE /cases/{caseID}) - ✅ **IMPLEMENTED** in `src/tools/cases/delete-case.js`
- [x] `get_case_view` - Get view details for a case (GET /cases/{caseID}/views/{viewID}) - ✅ **IMPLEMENTED** in `src/tools/cases/get-case-view.js`
- [x] `get_case_stages` - Get case stages list (GET /cases/{caseID}/stages) - ✅ **IMPLEMENTED** in `src/tools/cases/get-case-stages.js`
- [x] `get_case_action` - Get case action details (GET /cases/{caseID}/actions/{actionID}) - ✅ **IMPLEMENTED** in `src/tools/cases/get-case-action.js`
- [x] `perform_bulk_action` - Perform bulk action (PATCH /cases) - ✅ **IMPLEMENTED** in `src/tools/cases/perform-bulk-action.js`
- [x] `bulk_cases_patch` - Alternative bulk cases implementation (PATCH /cases) - ✅ **IMPLEMENTED** in `src/tools/cases/bulk-cases-patch.js`

## ✅ Related Completed Tools (Case Types - 2/2) ✅ COMPLETE
- [x] `get_case_types` - List available case types (GET /casetypes) - ✅ **IMPLEMENTED** in `src/tools/casetypes/get-case-types.js`
- [x] `get_case_type_bulk_action` - Get bulk action metadata (GET /casetypes/{caseTypeID}/actions/{actionID}) - ✅ **IMPLEMENTED** in `src/tools/casetypes/get-case-type-bulk-action.js`

## ✅ Core Infrastructure
- [x] `ping_pega_service` - Test OAuth2 connectivity - ✅ **IMPLEMENTED** in `src/tools/ping-service.js`

## 🔄 High Priority (Core Operations)
- [ ] `perform_case_action` - Perform case action (PATCH /cases/{caseID}/actions/{actionID})

## 🔄 Medium Priority (Advanced Operations)
- [ ] `get_case_ancestors` - Get ancestor case hierarchy (GET /cases/{caseID}/ancestors)
- [ ] `get_case_descendants` - Get descendant case hierarchy (GET /cases/{caseID}/descendants)
- [ ] `change_to_next_stage` - Change to next stage (POST /cases/{caseID}/stages/next)
- [ ] `change_to_stage` - Change to specified stage (PUT /cases/{caseID}/stages/{stageID})
- [ ] `release_case_lock` - Release lock (DELETE /cases/{caseID}/updates)

## 🔄 Advanced Priority (Specialized Operations)
- [ ] `get_bulk_actions` - Get bulk actions (POST /cases/bulk-actions)
- [x] `perform_bulk_action` - Perform bulk action (PATCH /cases) - ✅ **IMPLEMENTED** in `src/tools/cases/perform-bulk-action.js`
- [ ] `add_optional_process` - Add optional process (POST /cases/{caseID}/processes/{processID})
- [ ] `recalculate_case_fields` - Recalculate calculated fields (PATCH /cases/{caseID}/actions/{actionID}/recalculate)
- [ ] `refresh_case_action` - Refresh case action (PATCH /cases/{caseID}/actions/{actionID}/refresh)
- [ ] `get_calculated_fields` - Get calculated fields for case view (POST /cases/{caseID}/views/{viewID}/calculated_fields)
- [ ] `refresh_case_view` - Refresh view details (PATCH /cases/{caseID}/views/{viewID}/refresh)

## Implementation Notes
- **Dependencies:** PegaAPIClient, OAuth2Client
- **Common Parameters:** caseID (URL encoded), actionID, viewID, stageID
- **Error Handling:** 404 (case not found), 401 (unauthorized), 400 (bad request)
- **Testing:** Each tool needs corresponding test file in /tests/
- **Pattern:** Follow GetCaseTool and CreateCaseTool implementation patterns

## MCP Tool Names Convention
- Prefix: No prefix needed (e.g., `get_case`, not `pega_get_case`)
- Format: snake_case
- Descriptive: Action + target (e.g., `perform_case_action`, `get_case_stages`)
