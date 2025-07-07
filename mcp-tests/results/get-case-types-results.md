# get_case_types - Test Results

## Test 1: Basic Case Type Discovery
*Date: 2025-07-07T15:03:46Z*

**MCP Call:**
```json
{
  "server": "pega-dx-mcp",
  "tool": "get_case_types",
  "arguments": {}
}
```

**Response:**
```markdown
## Available Case Types

*Operation completed at: 2025-07-07T15:03:46.366Z*

**Application Type**: Constellation Compatible

### Case Types Available for Creation (5)

#### 1. Recipe Collection
- **ID**: ON6E5R-DIYRecipe-Work-RecipeCollection
- **Display Name**: Recipe Collection
- **Creation Method**: POST /cases
- **Creation Title**: Create Case
- **Required Case Type ID**: ON6E5R-DIYRecipe-Work-RecipeCollection

#### 2. Recipe Submission
- **ID**: ON6E5R-DIYRecipe-Work-RecipeSubmission
- **Display Name**: Recipe Submission
- **Creation Method**: POST /cases
- **Creation Title**: Create Case
- **Required Case Type ID**: ON6E5R-DIYRecipe-Work-RecipeSubmission

#### 3. Recipe Review
- **ID**: ON6E5R-DIYRecipe-Work-RecipeReview
- **Display Name**: Recipe Review
- **Creation Method**: POST /cases
- **Creation Title**: Create Case
- **Required Case Type ID**: ON6E5R-DIYRecipe-Work-RecipeReview

#### 4. Recipe Sharing
- **ID**: ON6E5R-DIYRecipe-Work-RecipeSharing
- **Display Name**: Recipe Sharing
- **Creation Method**: POST /cases
- **Creation Title**: Create Case
- **Required Case Type ID**: ON6E5R-DIYRecipe-Work-RecipeSharing

#### 5. Recipe Planning
- **ID**: ON6E5R-DIYRecipe-Work-RecipePlanning
- **Display Name**: Recipe Planning
- **Creation Method**: POST /cases
- **Creation Title**: Create Case
- **Required Case Type ID**: ON6E5R-DIYRecipe-Work-RecipePlanning

### Summary
- **Total Case Types**: 5
- **Constellation Case Types**: 5

### Quick Reference for Case Creation
Use these case type IDs when creating new cases:
1. **Recipe Collection**: `ON6E5R-DIYRecipe-Work-RecipeCollection`
2. **Recipe Submission**: `ON6E5R-DIYRecipe-Work-RecipeSubmission`
3. **Recipe Review**: `ON6E5R-DIYRecipe-Work-RecipeReview`
4. **Recipe Sharing**: `ON6E5R-DIYRecipe-Work-RecipeSharing`
5. **Recipe Planning**: `ON6E5R-DIYRecipe-Work-RecipePlanning`
```

**Result**: ✅ SUCCESS - Found 5 case types, all Constellation compatible

---
