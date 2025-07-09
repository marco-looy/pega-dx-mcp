# Pega DX MCP Server - Release Notes

This document tracks all releases of the Pega DX MCP Server, providing detailed information about new features, capabilities, and configuration changes.

---

## 🚀 Current Release

### v0.1.1 - Foundation: Core Case Management
**Status:** ✅ Available  

#### Core Case Management

Introducing the essential tools for Pega case management through natural language interfaces.

#### What's New:

- ✅ **Service Connectivity** (1 tool) - Test OAuth2 connectivity and platform access
- ✅ **Case Type Discovery** (3 tools) - Explore available case types and their actions  
- ✅ **Complete Case Management** (16 tools) - Create, read, update, and manage case lifecycles

#### Key Capabilities:

- Create cases with natural language: "Create a new insurance claim"
- Discover case types: "What case types are available?"
- Manage case stages and processes
- Execute case actions and bulk operations
- Navigate case hierarchies (ancestors/descendants)

#### Configuration:

```bash
PEGA_SERVICE_TOOLS=true            # Service connectivity (1 tool)
PEGA_CASETYPE_TOOLS=true           # Case type information (3 tools)  
PEGA_CASE_TOOLS=true               # Case lifecycle management (16 tools)
```

#### Installation:

```bash
npm install -g @pega-enablement/pega-dx-mcp@0.1.1
```

---

## 🗺️ Release Roadmap

### v0.1.2 - Workflow: Assignment Management
**Status:** 📋 Planned  

#### ⚡ Workflow Execution - Assignment Management

Adding comprehensive assignment and workflow execution capabilities.

#### What's New:
- ✅ **Assignment Operations** (9 tools) - Complete workflow execution toolkit

#### Key Capabilities:
- Get next work assignments: "What's my next task?"
- Execute assignment actions with natural language
- Navigate through assignment flows and steps
- Save and refresh assignment form data
- Handle complex workflow progressions

#### Configuration:
```bash
# Enable Foundation tools from v0.1.1 plus:
PEGA_ASSIGNMENT_TOOLS=true         # Assignment operations (9 tools)
```

#### Tools Added:
- `get_assignment` - Get detailed assignment information
- `get_assignment_action` - Get assignment action details and UI metadata
- `get_next_assignment` - Get next work assignment for user
- `jump_to_step` - Navigate to specific step in assignment flow
- `navigate_assignment_previous` - Navigate to previous step in assignment
- `perform_assignment_action` - Execute assignment actions
- `recalculate_assignment_fields` - Recalculate assignment form fields
- `refresh_assignment_action` - Refresh assignment action form data
- `save_assignment_action` - Save assignment form data without executing

---

### v0.1.3 - Data & Documents: Information Management
**Status:** 📋 Planned  

#### 📊 Information Management - Data and File Operations

Comprehensive data operations and document management capabilities.

#### What's New:
- ✅ **Data View Operations** (7 tools) - Query, update, and manage data
- ✅ **Attachment Management** (7 tools) - Upload, organize, and retrieve files
- ✅ **Document Operations** (2 tools) - Handle documents and content

#### Key Capabilities:
- Query data views: "Show me customer data for region East"
- Upload attachments: "Attach the signed contract to this case"
- Manage document categories and metadata
- Perform CRUD operations on data records
- Handle complex data filtering and aggregation

#### Configuration:
```bash
# Enable previous tools plus:
PEGA_DATAVIEW_TOOLS=true           # Data view operations (7 tools)
PEGA_ATTACHMENT_TOOLS=true         # File and attachment management (7 tools)
PEGA_DOCUMENT_TOOLS=true           # Document operations (2 tools)
```

#### Tools Added:

**Data View Tools:**
- `delete_data_record` - Delete data records from savable data pages
- `get_data_objects` - List available data objects
- `get_data_view_count` - Get data view result counts
- `get_data_view_metadata` - Get data view metadata and parameters
- `get_list_data_view` - Query list data views with filtering
- `update_data_record_full` - Fully update data records
- `update_data_record_partial` - Partially update data records

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

### v0.1.4 - Collaboration: Team Management
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

#### Configuration:
```bash
# Enable previous tools plus:
PEGA_PARTICIPANT_TOOLS=true        # Case participant management (7 tools)
PEGA_FOLLOWER_TOOLS=true           # Case follower management (3 tools)
PEGA_TAG_TOOLS=true                # Case tagging operations (3 tools)
```

#### Tools Added:

**Participant Tools:**
- `create_case_participant` - Add participants to cases
- `delete_participant` - Remove case participants
- `get_case_participants` - List all case participants
- `get_participant` - Get specific participant details
- `get_participant_role_details` - Get participant role information
- `get_participant_roles` - List available participant roles
- `update_participant` - Update participant information

**Follower Tools:**
- `add_case_followers` - Add users as case followers
- `delete_case_follower` - Remove case followers
- `get_case_followers` - List case followers

**Tag Tools:**
- `add_case_tags` - Add tags to cases
- `delete_case_tag` - Remove specific case tags
- `get_case_tags` - List case tags

---

### v0.1.5 - Advanced: Case Relationships
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

#### Configuration:
```bash
# Enable all previous tools plus:
PEGA_RELATED_CASE_TOOLS=true       # Related case operations (3 tools)
```

#### Tools Added:
- `delete_related_case` - Remove case relationships
- `get_related_cases` - List related cases
- `relate_cases` - Create case relationships

#### 🎉 Complete Toolkit
All 61 tools now available for comprehensive Pega Infinity interaction through natural language interfaces.

---

## 📈 Release Statistics

| Release | Tools Added | Total Tools | Categories | Status |
|---------|-------------|-------------|------------|---------|
| v0.1.1  | 20          | 20          | 3          | ✅ Released |
| v0.1.2  | 9           | 29          | 4          | 📋 Planned |
| v0.1.3  | 16          | 45          | 7          | 📋 Planned |
| v0.1.4  | 13          | 58          | 10         | 📋 Planned |
| v0.1.5  | 3           | 61          | 11         | 📋 Planned |

## 📦 Installation & Upgrade

### Fresh Installation
```bash
# Install latest release
npm install -g @pega-enablement/pega-dx-mcp

# Install specific version
npm install -g @pega-enablement/pega-dx-mcp@0.1.1
```

### Upgrading Between Releases
```bash
# Upgrade to latest
npm update -g @pega-enablement/pega-dx-mcp

# Upgrade to specific version
npm install -g @pega-enablement/pega-dx-mcp@0.1.2
```

### Configuration Migration
Each release is backward compatible. Simply add new environment variables to enable additional tool categories:

```bash
# v0.1.1 Configuration
PEGA_SERVICE_TOOLS=true
PEGA_CASETYPE_TOOLS=true  
PEGA_CASE_TOOLS=true

# v0.1.2 Addition
PEGA_ASSIGNMENT_TOOLS=true

# v0.1.3 Additions
PEGA_DATAVIEW_TOOLS=true
PEGA_ATTACHMENT_TOOLS=true
PEGA_DOCUMENT_TOOLS=true

# v0.1.4 Additions
PEGA_PARTICIPANT_TOOLS=true
PEGA_FOLLOWER_TOOLS=true
PEGA_TAG_TOOLS=true

# v0.1.5 Addition
PEGA_RELATED_CASE_TOOLS=true
```

## 🔄 Update Notifications

### MCP Client Configuration
To receive the latest features, update your MCP client configuration:

```json
{
  "mcpServers": {
    "pega-dx-mcp": {
      "command": "npx",
      "args": ["-y", "@pega-enablement/pega-dx-mcp"],
      "env": {
        "PEGA_BASE_URL": "https://your-pega-instance.com",
        "PEGA_CLIENT_ID": "your-client-id",
        "PEGA_CLIENT_SECRET": "your-client-secret",
        
        // Enable tool categories as they become available
        "PEGA_SERVICE_TOOLS": "true",
        "PEGA_CASETYPE_TOOLS": "true",
        "PEGA_CASE_TOOLS": "true"
      }
    }
  }
}
```

### Release Channels

- **Stable**: Latest released version (recommended for production use)
- **Beta**: Pre-release versions with new features (for testing)
- **Alpha**: Development versions (for contributors and early adopters)

## 🐛 Known Issues & Limitations

### v0.1.1
- OAuth token refresh may require MCP client restart in some configurations
- Large case hierarchies may timeout on complex ancestor/descendant queries
- Bulk operations limited to 100 cases per request

### Reporting Issues
Report bugs and feature requests via [GitHub Issues](https://github.com/MarcoLooy/pega-dx-mcp/issues).

## 📝 Release Notes Format

Each release includes:
- **Feature Overview**: Summary of new capabilities
- **Tool Inventory**: Complete list of added tools
- **Configuration Changes**: Required environment variable updates
- **Usage Examples**: Sample commands and interactions
- **Breaking Changes**: Any compatibility impacts
- **Known Issues**: Current limitations and workarounds

---

## 🏷️ Version Tags

All releases are tagged in the repository:
- `v0.1.1` - Foundation: Core Case Management
- `v0.1.2` - Workflow: Assignment Management (Planned)
- `v0.1.3` - Data & Documents: Information Management (Planned)
- `v0.1.4` - Collaboration: Team Management (Planned)
- `v0.1.5` - Advanced: Case Relationships (Planned)

Use tags to install specific versions or track release history.

---

*For the latest updates and announcements, follow the [GitHub repository](https://github.com/MarcoLooy/pega-dx-mcp).*
