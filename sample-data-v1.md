# Sample Data for Pega DX MCP Testing (V1 API)

This file contains sample data discovered during testing that can be reused for other tool tests.

**API Version**: Traditional DX API (V1)
**Test Instance**: https://pega.44a208b29c95.pegaenablement.com

---

## Valid Case Types

**Case Type**: `OZNR3E-MyTest-Work-ChangeRequest`
- **Name**: Change Request
- **Can Create**: true
- **Requires Fields**: false
- **Application**: MyTest (OZNR3E)

**Test Cases**:
- `OZNR3E-MYTEST-WORK C-2` (created 2025-10-13)
- `OZNR3E-MYTEST-WORK C-3` (created 2025-10-13) ⭐ Primary test case

---

## Case Type Schema: OZNR3E-MyTest-Work-ChangeRequest

### Valid Fields for Update
```json
{
  "ChangeRequestID": "string",
  "ChangeRequestTitle": "string",
  "ChangeRequestDescription": "string (textarea)",
  "ChangeRequestType": "string (dropdown - deferred)",
  "ChangeRequestStatus": "string (dropdown - deferred)",
  "ChangeRequestPriority": "string (dropdown - deferred)",
  "RequestedBy": "string",
  "RequestedDate": "date",
  "AssignedTo": "string",
  "AssignedDate": "date",
  "ActualEndDate": "date"
}
```

**Note**: Fields marked as "deferred" use `pyPreviewDeferredField` and may require additional configuration.

---

## GET /cases/{ID} - Sample Response

**Case ID**: `OZNR3E-MYTEST-WORK C-3`
**Retrieved**: 2025-10-16T09:15:05Z

```json
{
  "success": true,
  "data": {
    "caseInfo": {
      "ID": "OZNR3E-MYTEST-WORK C-3",
      "caseTypeID": "OZNR3E-MyTest-Work-ChangeRequest",
      "name": "Change Request",
      "status": "New",
      "stage": "PRIM0",
      "urgency": 10,
      "createTime": "2025-10-13T14:13:09.047Z",
      "createdBy": "AU66301760364789028",
      "lastUpdateTime": "2025-10-16T09:14:56.476Z",
      "lastUpdatedBy": "AU36361760606096447",
      "content": {
        "ChangeRequestTitle": "Updated via MCP - Testing Auto-Fetch",
        "ChangeRequestDescription": "This demonstrates real content update with automatic eTag fetching",
        "RequestedBy": "Claude Code Testing",
        "pxUpdateCounter": "12"
      }
    }
  },
  "eTag": "\"20251016T091456.476 GMT\"",
  "uiResources": null
}
```

**Key Properties**:
- `eTag`: Returned in response header (V1 supports this!)
- `pxUpdateCounter`: Increments with each update
- `pxSaveDateTime`: Used for eTag generation

---

## PUT /cases/{ID} - Update Case

### Request Example
**Endpoint**: `PUT /api/v1/cases/OZNR3E-MYTEST-WORK%20C-3`

**Headers**:
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json",
  "if-match": "\"20251016T091456.476 GMT\"",
  "x-origin-channel": "Web"
}
```

**Body**:
```json
{
  "content": {
    "ChangeRequestTitle": "Updated via MCP - Testing Auto-Fetch",
    "ChangeRequestDescription": "This demonstrates real content update with automatic eTag fetching",
    "RequestedBy": "Claude Code Testing"
  },
  "pageInstructions": [],
  "attachments": []
}
```

### Response Example
**Status**: 204 No Content

**Headers**:
```
etag: "20251016T091456.476 GMT"
```

**Body**: (empty - 204 No Content)

### Transformed Response (Client)
```json
{
  "success": true,
  "data": {
    "message": "Case updated successfully",
    "caseID": "OZNR3E-MYTEST-WORK C-3"
  },
  "eTag": "\"20251016T091456.476 GMT\"",
  "metadata": {
    "statusCode": 204,
    "apiVersion": "v1",
    "autoFetchedETag": true
  }
}
```

---

## Common Error Responses

### 403 Forbidden - Missing eTag
```json
{
  "pxObjClass": "Pega-API-CaseManagement-Case",
  "errors": [
    {
      "ID": "Pega_API_020",
      "message": "Missing If-Match request header",
      "pxObjClass": "Pega-API-Error"
    }
  ]
}
```

### 404 Not Found - Invalid Case ID
```json
{
  "pxObjClass": "Pega-API-CaseManagement-Case",
  "errors": [
    {
      "ID": "Pega_API_011",
      "message": "Case not found for the given parameter ID",
      "pxObjClass": "Pega-API-Error"
    }
  ]
}
```

### 412 Precondition Failed - Stale eTag
```json
{
  "pxObjClass": "Pega-API-CaseManagement-Case",
  "errors": [
    {
      "ID": "Pega_API_021",
      "message": "Unauthorized access: If-Match does not match ETag",
      "pxObjClass": "Pega-API-Error"
    }
  ]
}
```

### 400 Bad Request - Invalid Properties
```json
{
  "pxObjClass": "Pega-API-CaseManagement-Case",
  "errors": [
    {
      "ID": "Pega_API_001",
      "message": "Invalid request data",
      "pxObjClass": "Pega-API-Error"
    }
  ]
}
```

---

## Available Actions

**Case Actions for C-3**:
```json
[
  {
    "ID": "pyUpdateCaseDetails",
    "name": "Edit details",
    "pxObjClass": "Pega-API-CaseManagement-Action"
  },
  {
    "ID": "pyChangeStage",
    "name": "Change stage",
    "pxObjClass": "Pega-API-CaseManagement-Action"
  }
]
```

---

## Current Assignments

**Assignment for C-3**:
```json
{
  "ID": "ASSIGN-WORKLIST OZNR3E-MYTEST-WORK C-3!INITIATECHANGE_FLOW",
  "name": "Collect Change Details",
  "pxObjClass": "Pega-API-CaseManagement-Assignment",
  "routedTo": "AU66301760364789028",
  "type": "Assignment",
  "urgency": "10"
}
```

---

## Stages

**Available Stages for ChangeRequest**:
```json
[
  {
    "ID": "PRIM0",
    "name": "Initiate Change",
    "pxObjClass": "Pega-API-CaseManagement-Stage"
  },
  {
    "ID": "PRIM1",
    "name": "Evaluate Impact",
    "pxObjClass": "Pega-API-CaseManagement-Stage"
  },
  {
    "ID": "PRIM2",
    "name": "Implement Change",
    "pxObjClass": "Pega-API-CaseManagement-Stage"
  },
  {
    "ID": "PRIM3",
    "name": "Validate Change",
    "pxObjClass": "Pega-API-CaseManagement-Stage"
  }
]
```

---

**Last Updated**: 2025-10-16
**Test Status**: All data validated with real Pega instance