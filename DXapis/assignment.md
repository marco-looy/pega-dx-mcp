Assignment


GET
/assignments/next
Get next assignment details


GET
/assignments/{assignmentID}
Get assignment details


GET
/assignments/{assignmentID}/actions/{actionID}
Get action details of an assignment


PATCH
/assignments/{assignmentID}/actions/{actionID}
Perform assignment action


PATCH
/assignments/{assignmentID}/actions/{actionID}/recalculate
Recalculate calculated fields & whens for the current form


PATCH
/assignments/{assignmentID}/actions/{actionID}/refresh
Refresh assignment action


PATCH
/assignments/{assignmentID}/actions/{actionID}/save
Save assignment action


PATCH
/assignments/{assignmentID}/navigation_steps/previous
Go back to previous step


PATCH
/assignments/{assignmentID}/navigation_steps/{stepID}
Jump to the specified step