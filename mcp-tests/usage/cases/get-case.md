# get-case End User Usage

## Overview
This document shows how end users can invoke the get-case tool to retrieve case information from Pega Platform.

## Use Case 1: Basic Case Information Lookup

### Context
When you need to check the current status, details, or stage of a specific case.

### How to Invoke
```
Please get me the details for case ON6E5R-DIYRECIPE-WORK R-1016
```

### Expected Response
The tool will return:
- Case ID and basic information
- Current status and stage
- Case type and creation details
- Key case properties and values
- Available actions

## Use Case 2: Case Information with UI Details

### Context
When you need comprehensive case information including UI structure for display or analysis purposes.

### How to Invoke
```
Can you get the full case details with UI metadata for case ON6E5R-DIYRECIPE-WORK R-1016?
```

### Expected Response
Same as basic case information plus:
- UI structure and form metadata
- Field definitions and layouts
- View configuration details
- Display properties

## Use Case 3: Specific Page View Details

### Context
When you need case information for a specific view or page within the case.

### How to Invoke
```
Please get the case details for ON6E5R-DIYRECIPE-WORK R-1016 using the Review page view
```

### Expected Response
Case information optimized for the specific page view:
- Page-specific field layout
- Relevant case data for that view
- View-specific UI metadata

## Troubleshooting

### If Case Not Found
- Verify the case ID format is correct (e.g., ON6E5R-DIYRECIPE-WORK R-1016)
- Check that the case exists in the system
- Ensure you have permission to view the case

### If Access Denied
- Confirm your user permissions
- Check case access rules
- Verify case type permissions

## Integration Examples

### Before Taking Action
```
Before I update this case, can you show me the current case details for ON6E5R-DIYRECIPE-WORK R-1016?
```

### Status Check
```
What's the current status of case ON6E5R-DIYRECIPE-WORK R-1016?
```

### Case Analysis
```
I need to analyze case ON6E5R-DIYRECIPE-WORK R-1016 - can you get me all the details including UI structure?
