T Case Types API - Todo List

**Priority:** MEDIUM (Metadata functionality)  
**Complexity:** SIMPLE  
**Current Status:** 1/2 endpoints completed

## 🔄 Medium Priority (Metadata Operations)
- [ ] `get_case_types` - Get list of case types for your application (GET /casetypes)
- [x] `get_case_type_bulk_action` - Get bulk action details for this case type (GET /casetypes/{caseTypeID}/actions/{actionID}) ✅

## Implementation Notes
- **Dependencies:** PegaAPIClient, OAuth2Client
- **Common Parameters:** caseTypeID, actionID
- **Error Handling:** 404 (case type not found), 401 (unauthorized)
- **Testing:** Simple GET operations, minimal complexity
- **Pattern:** Read-only metadata operations
- **Integration:** Supports case creation and bulk operations

## Key Use Cases
- **Application Discovery:** List available case types for an application
- **Bulk Operations:** Understand available bulk actions per case type
- **UI Generation:** Dynamic form generation based on case type metadata
- **Validation:** Case type validation before case creation

## MCP Tool Names Convention
- Prefix: No prefix needed
- Format: snake_case
- Clear metadata intent (e.g., `get_case_types`, `get_case_type_bulk_action`)

## Integration Points
- **Case Creation:** Validate case types before creating cases
- **Bulk Operations:** Support for bulk case operations
- **Application Metadata:** Core application structure information

## Priority Rationale
- **MEDIUM Priority:** Essential for metadata operations but not core workflow
- **Simple Implementation:** Straightforward GET operations
- **Foundation:** Enables other tools to work more effectively
