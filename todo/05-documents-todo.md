# Documents API - Todo List

**Priority:** MEDIUM (Document management)  
**Complexity:** SIMPLE  
**Current Status:** 2/2 endpoints completed ✅ **COMPLETE**

## ✅ Completed (Document Operations)
- [x] ✅ **IMPLEMENTED** `get_document` - Get contents of a document (GET /documents/{documentID})
- [x] ✅ **IMPLEMENTED** `remove_case_document` - Removes document linked to case (DELETE /cases/{caseID}/documents/{documentID})

## Implementation Notes
- **Dependencies:** PegaAPIClient, OAuth2Client
- **Common Parameters:** documentID, caseID
- **Error Handling:** 404 (document not found), 401 (unauthorized), 403 (forbidden)
- **Testing:** Simple operations, document content retrieval
- **Pattern:** Basic document operations
- **Integration:** Links to case management

## Key Use Cases
- **Document Retrieval:** Get document content for viewing/processing
- **Case Cleanup:** Remove documents from cases when no longer needed
- **Content Access:** Direct document content access by ID
- **Document Management:** Basic document lifecycle operations

## MCP Tool Names Convention
- Prefix: No prefix needed
- Format: snake_case
- Clear document intent (e.g., `get_document`, `remove_case_document`)

## Integration Points
- **Cases:** Documents are linked to specific cases
- **Attachments:** Different from attachments - documents are content-based
- **Content Management:** Direct document content operations

## Priority Rationale
- **MEDIUM Priority:** Document operations are common but not always critical
- **Simple Implementation:** Straightforward GET and DELETE operations
- **Support Function:** Enables document-based workflows
