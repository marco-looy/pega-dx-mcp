# Pega DX MCP Server - Release Plan

This document tracks the development and release history of the Pega DX MCP Server, documenting new tools, changes, and improvements with each version.

---

## Version 0.1.0-alpha.8 (Upcoming)
**Target Date:** TBD  
**Status:** In Development  
**Package Version:** TBD

### New Tools Added
**Cases API:**
- `bulk_cases_patch` - Alternative bulk cases implementation using PATCH /api/application/v2/cases endpoint with platform-specific response handling for Infinity vs Launchpad
- `perform_case_action` - Perform case action with data updates and workflow progression (PATCH /cases/{caseID}/actions/{actionID})

**Case Types API:**
- `get_case_type_action` - Get detailed case type action metadata with rich UI resources (GET /casetypes/{caseTypeID}/actions/{actionID})

**Data Views API (3/3 tools complete):**
- `get_data_view_metadata` - Retrieve data view metadata including parameters and queryable fields (GET /data_views/{data_view_ID}/metadata)
- `get_data_objects` - Retrieve list of available data objects with metadata and HATEOAS links (GET /data_objects)
- `update_data_record_full` - Fully update existing data records based on conditional save plan (PUT /data/{data_view_ID})

**Assignments API (1/9 tools complete):**
- `get_next_assignment` - Get next assignment details using Get Next Work functionality (GET /assignments/next)

### Changes
- **Implemented `perform_case_action` tool** - Critical high-priority case action execution with comprehensive workflow progression
- Added complex parameter validation including eTag optimistic locking, content updates, page instructions, and attachments
- Implemented specialized error handling for 9 different error response types (400, 401, 403, 404, 409, 412, 422, 423, 424)
- Enhanced response formatting with detailed case state, assignment information, and workflow confirmation
- Added comprehensive troubleshooting guidance for eTag conflicts, validation failures, and lock conflicts
- Implemented `get_case_type_action` tool for rich case type action metadata retrieval
- Added comprehensive UI resources handling for form rendering and dynamic interfaces  
- Enhanced case type action metadata with detailed view, field, and component information
- **Implemented `get_data_view_metadata` tool** - Complete data view metadata retrieval functionality
- Added new dataviews category with comprehensive metadata access for both queryable and non-queryable data views
- Implemented rich response structure handling including parameters, fields, and HATEOAS links
- Added proper URL encoding for data view IDs with special characters
- Created comprehensive test suite for data view metadata functionality
- **Implemented `get_data_objects` tool** - Complete data objects discovery functionality
- Added comprehensive data object metadata retrieval with optional type filtering ("data" or "case")
- Implemented HATEOAS links handling for related data operations and navigation
- Enhanced data views category with discovery capabilities for data exploration
- Added comprehensive parameter validation with enum support for type filtering
- **Implemented `update_data_record_full` tool** - Complete data record full update functionality
- Added comprehensive data record replacement with conditional save plan execution
- Implemented PUT endpoint with proper URL encoding for data view IDs with special characters
- Enhanced data views category with full CRUD capabilities for data manipulation
- Added comprehensive parameter validation for dataViewID and data object requirements
- Implemented structured error handling for all documented scenarios (400, 403, 404, 422, 500)
- Implemented alternative bulk cases tool with enhanced platform detection (Infinity vs Launchpad)
- Added comprehensive error handling for bulk operations (400, 401, 500, 501 status codes)
- Enhanced API client with specialized bulk cases error handling and response formatting
- Added platform-specific response handling for synchronous (207 Multistatus) vs asynchronous (202 Accepted) operations
- Implemented first Assignments API tool to begin high-priority workflow functionality
- Added comprehensive parameter validation for viewType and pageName parameters
- Created new assignments tool directory structure following established patterns
- Enhanced PegaAPIClient with performCaseAction method (already existed - leveraged existing implementation)
- Added comprehensive test coverage for perform case action functionality
- Updated documentation to reflect API progress

### Breaking Changes
- None

### Implementation Notes
- Total tools implemented: 28/56 (50.0% complete) - **Major milestone: 50% complete**
- Cases API progress: 9/18 tools (50.0% complete) - **Major milestone: 50% complete**
- Assignments API progress: 5/9 tools (55.6% complete)
- Attachments API: Complete (7/7 tools, 100%)
- Case Types API: Complete (3/3 tools, 100%)
- Data Views API: Complete (3/3 tools, 100%)
- Auto-discovered via modular registry (no manual registration required)
- **High Priority Core Operations completed**: Case action execution now available for workflow progression
- **New category completed**: Data views functionality now complete with discovery and metadata capabilities
- Next priority: Continue with remaining case operations and assignment tools

---

## Version 0.1.0-alpha.7 (Current)
**Release Date:** January 2025  
**Status:** Released  
**Package Version:** 0.1.0-alpha.7

### New Tools Added
**Cases API (7/23 tools complete):**
- `get_case` - Retrieve detailed case information with optional UI metadata
- `create_case` - Create new cases with content, attachments, and parent case support
- `delete_case` - Delete cases in create stage
- `get_case_view` - Get view details and metadata for case UI rendering
- `get_case_stages` - Retrieve case stages, processes, and progress information
- `get_case_action` - Get case action details with form/page UI metadata
- `get_case_type_bulk_action` - Get bulk action metadata for case types

**Case Types API (2/2 tools complete):**
- `get_case_types` - List available case types for case creation
- `get_case_type_bulk_action` - Get bulk action metadata for specific case types

**System Tools:**
- `ping_pega_service` - Test OAuth2 connectivity and authentication

### Changes
- Implemented comprehensive MCP server architecture
- Added OAuth2 client credentials authentication with auto-refresh
- Built robust error handling with user-friendly guidance
- Created comprehensive testing framework
- Established modular tool architecture pattern
- Added complete documentation and development workflows

### Architecture Features
- **Security**: OAuth2 authentication with token caching and auto-refresh
- **Error Handling**: Multi-layer error handling with categorized error types
- **Testing**: Comprehensive test suite with real Pega instance validation
- **Documentation**: Complete API documentation and implementation guides
- **Modularity**: Clean separation of tools, API client, and authentication

### Breaking Changes
- None (initial alpha release)

### Implementation Statistics
- **Total APIs Available**: 54 endpoints across 9 categories
- **Currently Implemented**: 9 endpoints (16.7% complete)
- **Test Coverage**: 100% of implemented tools have comprehensive tests
- **Documentation Coverage**: Complete documentation for all features

---

## Development Roadmap

### Phase 1: Core Operations (Priority: HIGH)
1. **Assignments API** (9 tools) - Essential workflow functionality
   - Assignment retrieval, execution, and management
   - Critical for case processing workflows

2. **Remaining Cases API** (16 tools) - Complete case management
   - Advanced case operations, search, and management
   - Case updates, status changes, and bulk operations

3. **Attachments API** (7 tools) - File handling capabilities
   - File upload, download, and attachment management
   - Essential for document-heavy workflows

### Phase 2: User Management (Priority: MEDIUM-HIGH)
4. **Participants API** (7 tools) - User and access control
   - Case participant management and access control
   - User assignment and collaboration features

### Phase 3: Supporting Features (Priority: MEDIUM)
5. **Related Cases API** (3 tools) - Case relationships
   - Parent-child case relationships and dependencies
   - Case linking and hierarchy management

6. **Documents API** (2 tools) - Document operations
   - Document management and processing
   - Integration with Pega document features

### Phase 4: Collaboration Features (Priority: LOW-MEDIUM)
7. **Followers API** (3 tools) - Case following functionality
   - Case subscription and notification management
   - User engagement and tracking features

8. **Tags API** (3 tools) - Case categorization
   - Case tagging and categorization
   - Organization and filtering capabilities

---

## Release Notes Format

Each release entry includes:
- **Version**: Semantic versioning with alpha/beta/rc indicators
- **Target/Release Date**: Planned or actual release date
- **Status**: Development, Testing, Released
- **New Tools Added**: Detailed list of implemented MCP tools
- **Changes**: Feature additions, improvements, and fixes
- **Breaking Changes**: Any changes that affect existing functionality
- **Implementation Notes**: Progress statistics and development insights

---

## Version Increment Guidelines

- **Patch Increment** (e.g., 0.1.0-alpha.7 → 0.1.0-alpha.8):
  - New tool implementations
  - Bug fixes and minor improvements
  - Documentation updates
  - Test enhancements

- **Minor Increment** (e.g., 0.1.0 → 0.2.0):
  - Significant feature additions
  - API enhancements or extensions
  - Major functionality completions
  - Architecture improvements

- **Major Increment** (e.g., 0.x.y → 1.0.0):
  - Breaking changes
  - Major architecture updates
  - Production readiness milestone
  - API stability guarantees

---

## Git Release Integration

This release plan coordinates with git releases:

1. **Development**: Changes documented in upcoming version section
2. **Release Preparation**: Version finalized, all changes documented
3. **Git Commit**: Release committed with version tag
4. **Documentation**: Release plan updated with final details
5. **Next Version**: New upcoming version section created

Each git release will reference this release plan for comprehensive change documentation and version history.
