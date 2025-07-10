# Pega DX MCP Server - Release Notes

This document tracks all releases of the Pega DX MCP Server, providing detailed information about new features, capabilities, and configuration changes.

---

## 🚀 Current Releases

### v0.1.4 - Data View Operations

**Status:** ✅ Available

**Data View Operations**

Introducing comprehensive data view operations for querying, updating, and managing data through natural language interfaces.

**What's New:**

- ✅ **Data View Operations** (7 tools) - Query, update, and manage data records

**Key Capabilities:**

- Query data views: "Show me customer data for region East"
- Perform CRUD operations on data records
- Handle complex data filtering and aggregation
- Manage data view metadata and parameters
- Execute advanced data operations with conditional logic

---

### v0.1.3 - Assignment and Workflow Execution

**Status:** ✅ Available

**Assignment and Workflow Execution**

Introducing comprehensive assignment and workflow execution capabilities through natural language interfaces.

**What's New:**

- ✅ **Assignment Operations** (9 tools) - Complete workflow execution toolkit

**Key Capabilities:**

- Get next work assignments: "What's my next task?"
- Execute assignment actions with natural language
- Navigate through assignment flows and steps
- Save and refresh assignment form data
- Handle complex workflow progressions

---

### v0.1.2 - Complete Case Management

**Status:** ✅ Available

**Complete Case Management**

Introducing the complete set of tools for Pega case management through natural language interfaces.

**What's New:**

- ✅ **Complete Case Management** (16 tools) - Create, read, update, and manage case lifecycles

**Key Capabilities:**

- Create cases with natural language: "Create a new insurance claim"
- Manage case stages and processes
- Execute case actions and bulk operations
- Navigate case hierarchies (ancestors/descendants)

---

### v0.1.1 - Foundation: Core Case Management

**Status:** ✅ Available

**Core Case Management**

Introducing the essential tools for Pega case management through natural language interfaces.

**What's New:**

- ✅ **Service Connectivity** (1 tool) - Test OAuth2 connectivity and platform access
- ✅ **Case Type Discovery** (3 tools) - Explore available case types and their actions

**Key Capabilities:**

- Test Pega Infinity&trade; connectivity
- Discover case types: "What case types are available?"

---

## 🗺️ Release Roadmap

### v0.1.x - Attachments & Documents: File Management

**Status:** 📋 Planned

#### 📎 File Management - Attachment and Document Operations

Comprehensive file handling and document management capabilities.

#### What's New:

- ✅ **Attachment Management** (7 tools) - Upload, organize, and retrieve files
- ✅ **Document Operations** (2 tools) - Handle documents and content

#### Key Capabilities:

- Upload attachments: "Attach the signed contract to this case"
- Manage document categories and metadata
- Handle file uploads and downloads
- Organize attachments with categories
- Process document content and metadata

#### Configuration:

```bash
# Enable previous tools plus:
PEGA_ATTACHMENT_TOOLS=true         # File and attachment management (7 tools)
PEGA_DOCUMENT_TOOLS=true           # Document operations (2 tools)
```

#### Tools Added:

**Attachment Tools:**

- `add_case_attachments` - Attach files/URLs to cases
- `delete_attachment` - Remove attachments from cases
- `get_attachment` - Retrieve attachment content
- `get_attachment_categories` - List available attachment categories
- `get_case_attachments` - List all case attachments
- `update_attachment` - Update attachment metadata
- `upload_attachment` - Upload files as temporary attachments

**Document Tools:**

- `get_document` - Retrieve document content as base64
- `remove_case_document` - Remove documents linked to cases

---

### v0.1.x - Collaboration: Team Management

**Status:** 📋 Planned

#### 👥 Team Collaboration - User Management and Social Features

Enable team collaboration and case organization features.

#### What's New:

- ✅ **Participant Management** (7 tools) - Manage case participants and roles
- ✅ **Follower Management** (3 tools) - Subscribe to case updates and notifications
- ✅ **Tagging System** (3 tools) - Organize and categorize cases

#### Key Capabilities:

- Manage case participants: "Add Sarah as a reviewer for this claim"
- Follow case updates: "Subscribe me to updates on this case"
- Organize with tags: "Tag this case as high-priority"
- Handle participant roles and permissions
- Enable case subscription and notification workflows

---

### v0.1.x - Advanced: Case Relationships

**Status:** 📋 Planned

#### 🔗 Advanced Features - Case Relationships

Complete the toolkit with advanced case relationship management.

#### What's New:

- ✅ **Related Case Operations** (3 tools) - Manage complex case relationships

#### Key Capabilities:

- Link related cases: "Link this claim to the original policy case"
- Navigate case relationships and dependencies
- Manage parent-child case hierarchies
- Handle complex case interaction patterns

---
