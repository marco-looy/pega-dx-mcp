# Attachments API - Todo List

**Priority:** HIGH (File handling is common requirement)  
**Complexity:** MODERATE-HIGH (File operations)  
**Current Status:** 0/7 endpoints completed

## 🔄 High Priority (Core File Operations)
- [ ] `upload_attachment` - Upload a file to be used as an attachment (POST /attachments/upload)
- [ ] `get_attachment` - Get attachment content (GET /attachments/{attachmentID})
- [ ] `get_case_attachments` - Get attachments for a case (GET /cases/{caseID}/attachments)
- [ ] `add_case_attachments` - Add attachments to case (POST /cases/{caseID}/attachments)

## 🔄 Medium Priority (Attachment Management)
- [ ] `delete_attachment` - Delete attachment (DELETE /attachments/{attachmentID})
- [ ] `edit_attachment` - Edit the attachment name and category (PATCH /attachments/{attachmentID})
- [ ] `get_attachment_categories` - Get attachment categories (GET /cases/{caseID}/attachment_categories)

## Implementation Notes
- **Dependencies:** PegaAPIClient, OAuth2Client, file handling utilities
- **Common Parameters:** attachmentID, caseID, file data, category, name
- **Error Handling:** 404 (attachment not found), 413 (file too large), 415 (unsupported media type)
- **Testing:** Requires test files and file upload scenarios
- **Pattern:** File-based operations with multipart/form-data handling
- **Security:** File type validation, size limits, virus scanning considerations

## Key Implementation Challenges
- **File Upload:** Multipart form data handling
- **Binary Data:** Proper handling of file streams
- **File Types:** Support for various attachment types
- **Size Limits:** Handle large file uploads appropriately
- **Categories:** Dynamic category management per case

## MCP Tool Names Convention
- Prefix: No prefix needed
- Format: snake_case
- Clear file operation intent (e.g., `upload_attachment`, `get_case_attachments`)

## Integration Points
- **Cases:** Attachments are linked to specific cases
- **Security:** File type and size validation
- **Storage:** Temporary vs permanent attachment storage
- **Metadata:** File name, category, upload date tracking

## Priority Rationale
- **HIGH Priority:** File upload and retrieval are essential
- **MEDIUM Priority:** Management operations for existing attachments
- Critical for document-heavy workflows and evidence management
