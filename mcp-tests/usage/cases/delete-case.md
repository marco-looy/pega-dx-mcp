# delete-case End User Usage

## Use Case 1: Delete a Case in CREATE Stage
### Context
When you need to permanently remove a case that is still in the CREATE stage. This is typically used for:
- Cleaning up test cases
- Removing accidentally created cases
- Deleting cases that are no longer needed before they progress

### How to Invoke
```
Delete case ON6E5R-DIYRecipe-Work-RecipeCollection R-1009
```
or
```
Remove the case with ID ON6E5R-DIYRecipe-Work-RecipeCollection R-1009
```
or
```
I need to delete case OSIEO3-DOCSAPP-WORK T-561003
```

### Expected Response
```
## Case Deletion: ON6E5R-DIYRecipe-Work-RecipeCollection R-1009

*Operation completed at: 2025-01-08T08:15:00.000Z*

✅ **Case ID**: ON6E5R-DIYRecipe-Work-RecipeCollection R-1009

### Operation Details
- The case has been permanently removed from the system
- This action cannot be undone
- Only cases in the create stage can be deleted
```

## Use Case 2: Handle Non-Existent Case
### Context
When attempting to delete a case that doesn't exist or you don't have access to.

### How to Invoke
```
Delete case ON6E5R-DIYRecipe-Work-RecipeCollection R-9999
```

### Expected Response
```
## Error deleting case: ON6E5R-DIYRecipe-Work-RecipeCollection R-9999

**Error Type**: NOT_FOUND
**Status Code**: 404

The case could not be found or deleted. This may occur if:
- The case ID doesn't exist
- You don't have permission to access this case
- The case is not in the CREATE stage
- The case has already been deleted

Please verify the case ID and ensure you have the necessary permissions.
```

## Use Case 3: Case Not in CREATE Stage
### Context
When trying to delete a case that has progressed beyond the CREATE stage.

### How to Invoke
```
Delete case MYORG-SERVICES-WORK S-293001
```

### Expected Response
```
## Error deleting case: MYORG-SERVICES-WORK S-293001

**Error Type**: BAD_REQUEST
**Status Code**: 400

Only cases in the CREATE stage can be deleted. This case appears to have progressed beyond the initial create stage.

To resolve this issue:
- Check the case status and current stage
- Use case management tools to handle non-CREATE stage cases
- Contact your system administrator if you need to remove progressed cases
