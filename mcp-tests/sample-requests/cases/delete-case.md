# delete-case Sample Requests

## Use Case 1: Delete Valid Case in CREATE Stage
```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "delete_case",
  "arguments": {
    "caseID": "ON6E5R-DIYRecipe-Work-RecipeCollection R-1009"
  }
}
```

## Use Case 2: Delete Non-Existent Case (Error Handling)
```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "delete_case",
  "arguments": {
    "caseID": "ON6E5R-DIYRecipe-Work-RecipeCollection R-9999"
  }
}
```

## Use Case 3: Missing Required Parameter (Validation Test)
```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "delete_case",
  "arguments": {}
}
```

## Use Case 4: Empty Case ID (Validation Test)
```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "delete_case",
  "arguments": {
    "caseID": ""
  }
}
```

## Use Case 5: Case ID with Special Characters (URL Encoding Test)
```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "delete_case",
  "arguments": {
    "caseID": "ON6E5R-DIYRecipe-Work-RecipeCollection R-1010 (SPECIAL-TEST)"
  }
}
```

## Use Case 6: Case ID with Spaces (Common Format)
```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "delete_case",
  "arguments": {
    "caseID": "OSIEO3-DOCSAPP-WORK T-561003"
  }
}
