# Case Field Discovery - Sample Requests

## Overview
This document contains sample MCP tool requests for discovering case type fields before case creation, based on the comprehensive analysis performed on the DIY Recipe application.

## Discovery Workflow

### Step 1: Get Available Case Types
**MCP Tool:** `get_case_types`

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "get_case_types",
  "arguments": {}
}
```

**Result:** Discovered 5 case types:
- Recipe Collection: `ON6E5R-DIYRecipe-Work-RecipeCollection`
- Recipe Submission: `ON6E5R-DIYRecipe-Work-RecipeSubmission`
- Recipe Review: `ON6E5R-DIYRecipe-Work-RecipeReview`
- Recipe Sharing: `ON6E5R-DIYRecipe-Work-RecipeSharing`
- Recipe Planning: `ON6E5R-DIYRecipe-Work-RecipePlanning`

### Step 2: Analyze Case Type Fields
**MCP Tool:** `get_case_type_action`

#### Recipe Collection Analysis
```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "get_case_type_action",
  "arguments": {
    "caseTypeID": "ON6E5R-DIYRecipe-Work-RecipeCollection",
    "actionID": "Create"
  }
}
```

**Fields Discovered:**
- PreparationTime (TimeOfDay) - "Preparation Time"
- RecipeName (Text) - "Recipe Name"
- Category (Text) - "Category"
- CookingTime (TimeOfDay) - "Cooking Time"
- Cuisine (Text) - "Cuisine"
- DifficultyLevel (Text) - "Difficulty Level"
- Servings (Integer) - "Servings"
- CookingInstructions (Page List) - "Cooking Instructions"
- Description (Text) - "Description"
- IngredientList (Page List) - Complex ingredient data

#### Recipe Submission Analysis
```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "get_case_type_action",
  "arguments": {
    "caseTypeID": "ON6E5R-DIYRecipe-Work-RecipeSubmission",
    "actionID": "Create"
  }
}
```

**Fields Discovered:**
- IngredientsList (Text) - "Ingredients List"
- PreparationInstructions (Text) - "Preparation Instructions"
- RecipePhoto (Text) - "Recipe Photo"
- RecipeName (Text) - "Recipe Name"
- RecipeSource (Text) - "Recipe Source"
- DietaryRestrictions (Text) - "Dietary Restrictions"
- CookingTime (Integer) - "Cooking Time"
- ServingSize (Integer) - "Serving Size"
- RecipeCategory (Text) - "Recipe Category"
- Recipe (Page) - Complex recipe data structure

### Step 3: Get Data View Metadata (Optional)
**MCP Tool:** `get_data_view_metadata`

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "get_data_view_metadata",
  "arguments": {
    "dataViewID": "D_IngredientList"
  }
}
```

### Step 4: Get Data Objects Mapping (Optional)
**MCP Tool:** `get_data_objects`

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "get_data_objects",
  "arguments": {
    "type": "case"
  }
}
```

## Sample Case Creation Requests

### Recipe Collection Case
**MCP Tool:** `create_case`

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "create_case",
  "arguments": {
    "caseTypeID": "ON6E5R-DIYRecipe-Work-RecipeCollection",
    "content": {
      "RecipeName": "Chocolate Chip Cookies",
      "Category": "Dessert",
      "Cuisine": "American",
      "DifficultyLevel": "Easy",
      "PreparationTime": "00:15",
      "CookingTime": "00:12",
      "Servings": 24,
      "Description": "Classic homemade chocolate chip cookies with crispy edges and chewy centers"
    }
  }
}
```

### Recipe Submission Case
**MCP Tool:** `create_case`

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "create_case",
  "arguments": {
    "caseTypeID": "ON6E5R-DIYRecipe-Work-RecipeSubmission",
    "content": {
      "RecipeName": "Italian Pasta Marinara",
      "RecipeCategory": "Main Course",
      "RecipeSource": "Family Recipe",
      "IngredientsList": "500g pasta, 400g canned tomatoes, 3 cloves garlic, fresh basil, olive oil, salt, pepper",
      "PreparationInstructions": "1. Boil pasta until al dente. 2. Sauté garlic in olive oil. 3. Add tomatoes and simmer. 4. Combine with pasta and garnish with basil.",
      "CookingTime": 30,
      "ServingSize": 4,
      "DietaryRestrictions": "Vegetarian",
      "RecipePhoto": "https://example.com/pasta-marinara.jpg"
    }
  }
}
```

### Recipe Review Case
**MCP Tool:** `create_case`

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "create_case",
  "arguments": {
    "caseTypeID": "ON6E5R-DIYRecipe-Work-RecipeReview",
    "content": {
      "RecipeName": "Banana Bread",
      "ReviewerName": "John Doe",
      "ReviewStatus": "Pending",
      "ReviewComments": "Needs review for ingredient proportions and baking time accuracy"
    }
  }
}
```

### Recipe Sharing Case
**MCP Tool:** `create_case`

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "create_case",
  "arguments": {
    "caseTypeID": "ON6E5R-DIYRecipe-Work-RecipeSharing",
    "content": {
      "RecipeName": "Thai Green Curry",
      "ShareMethod": "Social Media",
      "TargetAudience": "Spicy Food Lovers",
      "ShareDate": "2025-01-15"
    }
  }
}
```

### Recipe Planning Case
**MCP Tool:** `create_case`

```json
{
  "server_name": "pega-dx-mcp",
  "tool_name": "create_case",
  "arguments": {
    "caseTypeID": "ON6E5R-DIYRecipe-Work-RecipePlanning",
    "content": {
      "MealType": "Dinner",
      "PlanningDate": "2025-01-20",
      "NumberOfGuests": 6,
      "BudgetConstraint": "Medium",
      "DietaryRestrictions": "Gluten-free"
    }
  }
}
```

## Field Discovery Best Practices

### 1. Always Discover First
- Use `get_case_types` to see all available case types
- Use `get_case_type_action` to understand field requirements
- Avoid creating cases without understanding field constraints

### 2. Field Type Mapping
- **Text**: String values
- **Integer**: Numeric values (whole numbers)
- **TimeOfDay**: Format as "HH:MM" (e.g., "00:15")
- **Page List**: Complex nested data structures
- **Page**: Complex embedded data objects

### 3. Required vs Optional Fields
- The UI metadata shows which fields are present in the creation form
- Fields marked as "required" in the UI must be provided
- Some fields may have default values if not specified

### 4. Data Source Integration
- Editable data sources (e.g., "D_RecipeSavable") indicate fields that can be modified
- Readonly data sources provide lookup/reference data
- Use data view metadata to understand field constraints

## Advanced Scenarios

### Complex Field Structures
For fields with Page List or Page types, structure data hierarchically:

```json
{
  "CookingInstructions": [
    {
      "StepNumber": 1,
      "Instruction": "Preheat oven to 375°F",
      "Duration": "00:05"
    },
    {
      "StepNumber": 2,
      "Instruction": "Mix dry ingredients",
      "Duration": "00:02"
    }
  ]
}
```

### Parent Case Creation
```json
{
  "caseTypeID": "ON6E5R-DIYRecipe-Work-RecipeCollection",
  "parentCaseID": "ON6E5R-DIYRecipe-Work-RecipeCollection R-1001",
  "content": {
    "RecipeName": "Child Recipe",
    "Category": "Dessert"
  }
}
```

## Testing Workflow

1. **Discover** available case types with `get_case_types`
2. **Analyze** field requirements with `get_case_type_action`
3. **Validate** field constraints with `get_data_view_metadata` (if needed)
4. **Create** test cases with `create_case`
5. **Verify** successful creation with `get_case`

This workflow ensures successful case creation by understanding field requirements before attempting to create cases.
