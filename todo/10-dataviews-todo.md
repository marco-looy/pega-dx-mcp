# Data Views & Data Objects TODO

**Category Status**: 🟡 **IN PROGRESS** (4/16 tools implemented)

## Overview

Comprehensive data view and data object operations for working with Pega data APIs, including CRUD operations, metadata retrieval, and action execution.

## Data Object Tools

### Get Data Objects
- **Status**: ✅ **IMPLEMENTED**
- **Tool Name**: `get_data_objects`
- **API Endpoint**: `GET /data_objects`
- **Description**: Retrieve list of available data objects with metadata and HATEOAS links. Can optionally filter by data object type (data or case).
- **Priority**: Medium
- **Features**:
  - Supports optional type parameter for filtering ("data" or "case")
  - Returns comprehensive data object metadata including classID, dataObjectID, defaultListDataView
  - Includes HATEOAS links for redalated operations
  - Provides isDefaultListDataViewQueryable flag for each data object
- **Implementation**: `src/tools/dataviews/get-data-objects.js`
- **Test File**: `tests/dataviews/get-data-objects-test.js`
- **Auto-registered**: ✅ Discovered by registry system

### Get Data Pages
- **Status**: ❌ **TODO**
- **Tool Name**: `get_data_pages`
- **API Endpoint**: `GET /data_pages`
- **Description**: Retrieve list of available data pages
- **Priority**: Medium

### Get Data Object Actions List
- **Status**: ❌ **TODO**
- **Tool Name**: `get_data_object_actions`
- **API Endpoint**: `POST /data/{data_view_ID}/actions`
- **Description**: Get list of actions available for a data object
- **Priority**: Medium

### Get Data Object Action Details
- **Status**: ❌ **TODO**
- **Tool Name**: `get_data_object_action_details`
- **API Endpoint**: `POST /data/{data_view_ID}/actions/{action_ID}`
- **Description**: Get detailed information about a specific data object action
- **Priority**: Medium

### Update Data Object Action Details
- **Status**: ❌ **TODO**
- **Tool Name**: `update_data_object_action_details`
- **API Endpoint**: `PATCH /data/{data_view_ID}/actions/{action_ID}`
- **Description**: Update details of a data object action
- **Priority**: Low

### Create Data Record
- **Status**: ❌ **TODO**
- **Tool Name**: `create_data_record`
- **API Endpoint**: `POST /data/{data_view_ID}`
- **Description**: Create a new data record
- **Priority**: High

### Fully Update Data Record
- **Status**: ✅ **IMPLEMENTED**
- **Tool Name**: `update_data_record_full`
- **API Endpoint**: `PUT /data/{data_view_ID}`
- **Description**: Fully update an existing data record based on conditional save plan configured for a savable Data Page
- **Priority**: High
- **Features**:
  - Complete data record replacement with provided data object
  - URL encoding for data view IDs with special characters
  - Comprehensive parameter validation (dataViewID and data object required)
  - Structured error handling for all documented error scenarios (400, 403, 404, 422, 500)
  - Follows BaseTool patterns for consistent response formatting
- **Implementation**: `src/tools/dataviews/update-data-record-full.js`
- **Test File**: `tests/dataviews/update-data-record-full-test.js`
- **Auto-registered**: ✅ Discovered by registry system

### Partially Update Data Record
- **Status**: ❌ **TODO**
- **Tool Name**: `update_data_record_partial`
- **API Endpoint**: `PATCH /data/{data_view_ID}`
- **Description**: Partially update an existing data record
- **Priority**: High

### Delete Data Record
- **Status**: ✅ **IMPLEMENTED**
- **Tool Name**: `delete_data_record`
- **API Endpoint**: `DELETE /data/{data_view_ID}`
- **Description**: Delete a data record based on conditional save plan configured for a savable Data Page. Only supported on data object classes.
- **Priority**: High
- **Features**:
  - Requires primary key(s) to uniquely identify the record to delete
  - Supports URL encoding for data view IDs with special characters
  - Comprehensive parameter validation (dataViewID and dataViewParameters required)
  - Structured error handling for all documented error scenarios (400, 403, 404, 422, 500)
  - Follows BaseTool patterns for consistent response formatting
- **Implementation**: `src/tools/dataviews/delete-data-record.js`
- **Test File**: `tests/dataviews/delete-data-record-test.js`
- **Auto-registered**: ✅ Discovered by registry system

## Data View Tools

### Get Single Page Data View
- **Status**: ❌ **TODO**
- **Tool Name**: `get_single_page_data_view`
- **API Endpoint**: `GET /data_views/{data_view_ID}`
- **Description**: Get a single page data view
- **Priority**: High

### Get List Data View
- **Status**: ❌ **TODO**
- **Tool Name**: `get_list_data_view`
- **API Endpoint**: `POST /data_views/{data_view_ID}`
- **Description**: Get list data view with filtering and pagination
- **Priority**: High

### Get Total Result Count
- **Status**: ❌ **TODO**
- **Tool Name**: `get_data_view_count`
- **API Endpoint**: `POST /data_views/{data_view_ID}/count`
- **Description**: Get total count of results for a data view query
- **Priority**: Medium

### Get Data View Metadata (GET)
- **Status**: ✅ **IMPLEMENTED**
- **Tool Name**: `get_data_view_metadata`
- **API Endpoint**: `GET /data_views/{data_view_ID}/metadata`
- **Description**: Retrieve data view metadata including parameters and queryable fields
- **Features**:
  - Supports both queryable and non-queryable data views
  - Returns comprehensive metadata structure
  - Includes data view parameters with types and constraints
  - Provides field definitions with source information
  - Handles HATEOAS links for related operations
- **Implementation**: `src/tools/dataviews/get-data-view-metadata.js`
- **Test File**: `tests/dataviews/get-data-view-metadata-test.js`
- **Auto-registered**: ✅ Discovered by registry system

### Get Data View Metadata (POST)
- **Status**: ❌ **TODO**
- **Tool Name**: `get_data_view_metadata_post`
- **API Endpoint**: `POST /data_views/{data_view_ID}/metadata`
- **Description**: Retrieve data view metadata using POST method (for complex parameters)
- **Priority**: Medium

### Get Data with View Metadata
- **Status**: ❌ **TODO**
- **Tool Name**: `get_data_with_view_metadata`
- **API Endpoint**: `POST /data_views/{data_view_ID}/views/{view_ID}`
- **Description**: Get data combined with view metadata
- **Priority**: Medium

## API Integration (Needed)

### PegaAPIClient Methods
- ✅ `getDataViewMetadata(dataViewID)` - Retrieve data view metadata
- ✅ `getDataObjects(options)` - Get available data objects with optional type filtering
- ✅ `updateDataRecordFull(dataViewID, data)` - Fully update data record
- ❌ `getDataPages()` - Get available data pages
- ❌ `getDataObjectActions(dataViewID)` - Get data object actions
- ❌ `getDataObjectActionDetails(dataViewID, actionID)` - Get action details
- ❌ `updateDataObjectActionDetails(dataViewID, actionID, data)` - Update action details
- ❌ `createDataRecord(dataViewID, data)` - Create data record
- ❌ `updateDataRecordPartial(dataViewID, data)` - Partially update data record
- ✅ `deleteDataRecord(dataViewID, dataViewParameters)` - Delete data record
- ❌ `getSinglePageDataView(dataViewID, params)` - Get single page data view
- ❌ `getListDataView(dataViewID, params)` - Get list data view
- ❌ `getDataViewCount(dataViewID, params)` - Get total result count
- ❌ `getDataViewMetadataPost(dataViewID, params)` - Get metadata via POST
- ❌ `getDataWithViewMetadata(dataViewID, viewID, params)` - Get data with view metadata

### Error Handling
- Standard Pega API error responses (404, 403, 401, etc.)
- URL encoding for data view IDs with special characters
- OAuth2 authentication integration
- Validation for required parameters

## Implementation Priority

### Phase 1 (High Priority - Core CRUD)
1. `create_data_record` - Essential for data creation
2. `update_data_record_full` - Essential for data updates
3. `update_data_record_partial` - Essential for partial updates
4. `delete_data_record` - Essential for data deletion
5. `get_single_page_data_view` - Essential for data retrieval
6. `get_list_data_view` - Essential for data listing

### Phase 2 (Medium Priority - Enhanced Features)
7. `get_data_view_count` - Useful for pagination
8. `get_data_objects` - Discovery functionality
9. `get_data_pages` - Discovery functionality
10. `get_data_object_actions` - Action discovery
11. `get_data_object_action_details` - Action details
12. `get_data_view_metadata_post` - Enhanced metadata retrieval
13. `get_data_with_view_metadata` - Combined data/metadata

### Phase 3 (Low Priority - Administrative)
14. `update_data_object_action_details` - Administrative function

## Implementation Notes

### Tool Architecture
- All tools should extend `BaseTool` with standardized patterns
- Use `executeWithErrorHandling` for consistent error management
- Implement proper parameter validation for all endpoints
- Follow project's response formatting standards

### Common Parameters
- `data_view_ID`: Data view identifier (requires URL encoding)
- `action_ID`: Action identifier for action-specific endpoints
- `view_ID`: View identifier for view-specific endpoints
- Request bodies for POST/PUT/PATCH operations
- Query parameters for filtering and pagination

### Testing Requirements
- Comprehensive unit tests for each tool
- Registry auto-discovery verification
- Parameter validation testing
- BaseTool inheritance verification
- End-to-end API integration tests

## Status Summary

**Category**: 🟡 IN PROGRESS  
**Tools Implemented**: 4/16  
**API Methods**: 4/16  
**High Priority Remaining**: 4 tools  
**Test Coverage**: 4/16 complete  
**Documentation**: Needs expansion

The data views category requires significant expansion to support comprehensive data operations in Pega DX API.
