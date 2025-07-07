# MCP Tool Test Coverage Matrix

*Last Updated: 2025-07-07T15:10:44Z*

## Overview

This matrix tracks the testing status of all 63 MCP tools in the Pega DX MCP Server. Each tool is tested systematically with real API calls against our Pega Platform environment.

## Legend

- ✅ **Completed**: Full testing and documentation complete
- 🟡 **In Progress**: Testing started but incomplete
- ❌ **Not Started**: No testing performed yet
- 🔄 **Under Review**: Testing complete, awaiting validation
- ⏭️ **Skipped**: Temporarily skipped due to dependencies

## Testing Status Summary

- **Total Tools**: 63
- **Completed**: 2 (3.2%)
- **In Progress**: 0 (0.0%)
- **Not Started**: 61 (96.8%)
- **Under Review**: 0 (0.0%)
- **Skipped**: 0 (0.0%)

---

## 1. Assignments (9 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| get-assignment | ❌ | - | - | Core assignment retrieval |
| get-assignment-action | ❌ | - | - | Assignment action details |
| get-next-assignment | ❌ | - | - | Get next work functionality |
| jump-to-step | ❌ | - | - | Navigation within assignments |
| navigate-assignment-previous | ❌ | - | - | Navigate to previous step |
| perform-assignment-action | ❌ | - | - | Execute assignment actions |
| recalculate-assignment-fields | ❌ | - | - | Field recalculation |
| refresh-assignment-action | ❌ | - | - | Refresh assignment form |
| save-assignment-action | ❌ | - | - | Save for later functionality |

### Assignment Category Status: 0/9 (0.0%) Complete

---

## 2. Attachments (7 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| add-case-attachments | ❌ | - | - | Attach files to cases |
| delete-attachment | ❌ | - | - | Remove attachments |
| get-attachment | ❌ | - | - | Download attachment content |
| get-attachment-categories | ❌ | - | - | Available attachment types |
| get-case-attachments | ❌ | - | - | List case attachments |
| update-attachment | ❌ | - | - | Update attachment metadata |
| upload-attachment | ❌ | - | - | Upload files to temporary storage |

### Attachment Category Status: 0/7 (0.0%) Complete

---

## 3. Cases (18 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| add-optional-process | ❌ | - | - | Add stage/case-wide processes |
| bulk-cases-patch | ❌ | - | - | Bulk case operations |
| change-to-next-stage | ❌ | - | - | Navigate to next stage |
| change-to-stage | ❌ | - | - | Navigate to specific stage |
| create-case | ❌ | - | - | Create new cases |
| delete-case | ❌ | - | - | Delete cases in create stage |
| get-case | ❌ | - | - | Retrieve case details |
| get-case-action | ❌ | - | - | Get case action details |
| get-case-ancestors | ❌ | - | - | Get parent case hierarchy |
| get-case-descendants | ❌ | - | - | Get child case hierarchy |
| get-case-stages | ❌ | - | - | Get case stage information |
| get-case-view | ❌ | - | - | Get specific case view |
| get-case-view-calculated-fields | ❌ | - | - | Get calculated field values |
| perform-bulk-action | ❌ | - | - | Execute bulk operations |
| perform-case-action | ❌ | - | - | Execute case actions |
| recalculate-case-action-fields | ❌ | - | - | Recalculate case action fields |
| refresh-case-action | ❌ | - | - | Refresh case action form |
| release-case-lock | ❌ | - | - | Release pessimistic locks |

### Case Category Status: 0/18 (0.0%) Complete

---

## 4. Case Types (3 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| get-case-type-action | ❌ | - | - | Get case type action metadata |
| get-case-type-bulk-action | ❌ | - | - | Get bulk action metadata |
| get-case-types | ✅ | 2025-07-07 | [results/2025-07-07-get-case-types-results.md] | **Completed** - 5 case types found |

### Case Type Category Status: 1/3 (33.3%) Complete

---

## 5. Data Views (7 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| delete-data-record | ❌ | - | - | Delete data records |
| get-data-objects | ❌ | - | - | List available data objects |
| get-data-view-count | ❌ | - | - | Get data view record count |
| get-data-view-metadata | ❌ | - | - | Get data view schema |
| get-list-data-view | ❌ | - | - | Query data views |
| update-data-record-full | ❌ | - | - | Full data record update |
| update-data-record-partial | ❌ | - | - | Partial data record update |

### Data View Category Status: 0/7 (0.0%) Complete

---

## 6. Documents (2 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| get-document | ❌ | - | - | Download document content |
| remove-case-document | ❌ | - | - | Remove document from case |

### Document Category Status: 0/2 (0.0%) Complete

---

## 7. Followers (3 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| add-case-followers | ❌ | - | - | Add users as case followers |
| delete-case-follower | ❌ | - | - | Remove case followers |
| get-case-followers | ❌ | - | - | List case followers |

### Follower Category Status: 0/3 (0.0%) Complete

---

## 8. Participants (7 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| create-case-participant | ❌ | - | - | Add participants to cases |
| delete-participant | ❌ | - | - | Remove case participants |
| get-case-participants | ❌ | - | - | List case participants |
| get-participant | ❌ | - | - | Get participant details |
| get-participant-role-details | ❌ | - | - | Get participant role info |
| get-participant-roles | ❌ | - | - | List available participant roles |
| update-participant | ❌ | - | - | Update participant information |

### Participant Category Status: 0/7 (0.0%) Complete

---

## 9. Related Cases (3 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| delete-related-case | ❌ | - | - | Remove case relationships |
| get-related-cases | ❌ | - | - | List related cases |
| relate-cases | ❌ | - | - | Create case relationships |

### Related Case Category Status: 0/3 (0.0%) Complete

---

## 10. Services (1 tool)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| ping-pega-service | ✅ | 2025-07-07 | [results/2025-07-07-ping-service-results.md] | **Completed** - OAuth2 working |

### Service Category Status: 1/1 (100.0%) Complete

---

## 11. Tags (3 tools)

| Tool Name | Status | Test Date | Documentation | Notes |
|-----------|--------|-----------|---------------|-------|
| add-case-tags | ❌ | - | - | Add tags to cases |
| delete-case-tag | ❌ | - | - | Remove specific case tags |
| get-case-tags | ❌ | - | - | List case tags |

### Tag Category Status: 0/3 (0.0%) Complete

---

## Priority Testing Order

### Phase 1: Foundation Tools (Week 1) - 5 tools
1. ✅ `ping-pega-service` - **Completed**
2. ✅ `get-case-types` - **Completed**
3. ❌ `get-case` - Core functionality
4. ❌ `create-case` - Case creation
5. ❌ `get-data-objects` - Data access

### Phase 2: Core Case Operations (Week 2) - 12 tools
6. ❌ `get-case-action`
7. ❌ `perform-case-action`
8. ❌ `get-case-stages`
9. ❌ `change-to-stage`
10. ❌ `get-assignment`
11. ❌ `get-assignment-action`
12. ❌ `perform-assignment-action`
13. ❌ `get-list-data-view`
14. ❌ `get-data-view-metadata`
15. ❌ `delete-case`
16. ❌ `get-case-ancestors`
17. ❌ `get-case-descendants`

### Phase 3: Advanced Features (Week 3) - 20 tools
18. ❌ `upload-attachment`
19. ❌ `add-case-attachments`
20. ❌ `get-case-attachments`
21. ❌ `delete-attachment`
22. ❌ `get-attachment-categories`
23. ❌ `create-case-participant`
24. ❌ `get-case-participants`
25. ❌ `get-participant-roles`
26. ❌ `add-case-tags`
27. ❌ `get-case-tags`
28. ❌ `add-case-followers`
29. ❌ `get-case-followers`
30. ❌ `relate-cases`
31. ❌ `get-related-cases`
32. ❌ `get-case-view`
33. ❌ `refresh-case-action`
34. ❌ `recalculate-case-action-fields`
35. ❌ `save-assignment-action`
36. ❌ `refresh-assignment-action`
37. ❌ `recalculate-assignment-fields`

### Phase 4: Specialized Operations (Week 4) - 26 tools
38. ❌ `bulk-cases-patch`
39. ❌ `perform-bulk-action`
40. ❌ `get-case-type-action`
41. ❌ `get-case-type-bulk-action`
42. ❌ `update-data-record-full`
43. ❌ `update-data-record-partial`
44. ❌ `delete-data-record`
45. ❌ `get-data-view-count`
46. ❌ `get-next-assignment`
47. ❌ `jump-to-step`
48. ❌ `navigate-assignment-previous`
49. ❌ `add-optional-process`
50. ❌ `change-to-next-stage`
51. ❌ `release-case-lock`
52. ❌ `get-case-view-calculated-fields`
53. ❌ `get-attachment`
54. ❌ `update-attachment`
55. ❌ `get-participant`
56. ❌ `get-participant-role-details`
57. ❌ `update-participant`
58. ❌ `delete-participant`
59. ❌ `delete-case-follower`
60. ❌ `delete-case-tag`
61. ❌ `delete-related-case`
62. ❌ `get-document`
63. ❌ `remove-case-document`

## Recent Completions

### 2025-07-07
- ✅ **ping-pega-service**: OAuth2 authentication verified, environment connectivity confirmed
- ✅ **get-case-types**: 5 case types discovered (Recipe Collection, Submission, Review, Sharing, Planning)

## Known Issues & Dependencies

### Environment Dependencies
- **Case Data**: Need valid case IDs for testing (discovered during case creation attempt)
- **Field Mapping**: Case creation requires proper field configuration in Pega
- **Permissions**: All operations require appropriate user permissions

### Testing Blockers
- Case creation failed with BAD_REQUEST - need to identify required fields
- Assignment testing requires active assignments
- Attachment testing needs file upload capabilities
- Participant testing requires existing participants

## Next Steps

1. **Investigate Case Creation**: Determine required fields for each case type
2. **Create Test Cases**: Establish sample cases for testing other tools
3. **Assignment Discovery**: Find or create assignments for assignment tool testing
4. **Data View Exploration**: Identify available data views for querying

## Maintenance Schedule

- **Daily**: Update completion status
- **Weekly**: Review and prioritize remaining tools
- **Bi-weekly**: Validate completed tools still working
- **Monthly**: Full regression testing of completed tools

---

*This matrix is updated automatically as tools are tested and provides a comprehensive view of testing progress across all MCP tool categories.*
