# Related Cases API - Todo List

**Priority:** MEDIUM (Case relationship management)  
**Complexity:** SIMPLE  
**Current Status:** 3/3 endpoints completed - ✅ **COMPLETE**

## ✅ **IMPLEMENTED** (Case Relationship Operations)
- [x] `get_related_cases` - Get related cases for a case (GET /cases/{caseID}/related_cases) ✅ **IMPLEMENTED**
- [x] `relate_cases` - Create relationship between cases (POST /cases/{caseID}/related_cases) ✅ **IMPLEMENTED**
- [x] `delete_related_case` - Delete a related case relationship (DELETE /cases/{caseID}/related_cases/{related_caseID}) ✅ **IMPLEMENTED**

## 🔄 Medium Priority (Case Relationship Operations)
- ✅ **ALL RELATED CASES OPERATIONS COMPLETED**

## Implementation Notes
- **Dependencies:** PegaAPIClient, OAuth2Client
- **Common Parameters:** caseID, related_caseID, relationship data
- **Error Handling:** 404 (case not found), 401 (unauthorized), 409 (relationship already exists)
- **Testing:** Case relationship scenarios, bidirectional relationships
- **Pattern:** Standard CRUD operations for case relationships
- **Integration:** Case hierarchy and relationship management

## Key Use Cases
- **Case Hierarchy:** Link parent and child cases
- **Case Dependencies:** Track dependencies between cases
- **Related Work:** Group related cases for better organization
- **Cross-Reference:** Link cases that reference each other

## MCP Tool Names Convention
- Prefix: No prefix needed
- Format: snake_case
- Clear relationship intent (e.g., `get_related_cases`, `relate_cases`)

## Integration Points
- **Cases:** Relationships exist between specific cases
- **Hierarchy:** Support for case hierarchies and dependencies
- **Navigation:** Enable navigation between related cases
- **Reporting:** Support for relationship-based reporting

## Priority Rationale
- **MEDIUM Priority:** Case relationships are valuable for organization
- **Simple Implementation:** Basic CRUD operations
- **Organizational Tool:** Helps structure complex case scenarios
