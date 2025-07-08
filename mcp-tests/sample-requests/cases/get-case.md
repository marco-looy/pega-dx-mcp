# get-case Sample Requests

## Use Case 1: Basic Case Retrieval
Get basic case information without UI metadata.

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "get_case",
  "arguments": {
    "caseID": "ON6E5R-DIYRECIPE-WORK R-1016"
  }
}
```

## Use Case 2: Case with Page UI Metadata
Get case information with full page UI metadata .for display purposes.

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "get_case",
  "arguments": {
    "caseID": "ON6E5R-DIYRECIPE-WORK R-1016",
    "viewType": "page"
  }
}
```

## Use Case 3: Case with Specific Page View
Get case information with specific page view metadata.

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "get_case",
  "arguments": {
    "caseID": "ON6E5R-DIYRECIPE-WORK R-1016",
    "viewType": "page",
    "pageName": "Review"
  }
}
```

## Use Case 4: Error Handling - Invalid Case ID
Test error handling with invalid case ID format.

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "get_case",
  "arguments": {
    "caseID": "INVALID-CASE-ID"
  }
}
