Case


POST
/cases/bulk-actions
Get bulk actions


POST
/cases
Creates new case


PATCH
/cases
Perform bulk action


GET
/cases/{caseID}
Get case details


DELETE
/cases/{caseID}
Delete case in create stage


GET
/cases/{caseID}/actions/{actionID}
Get case actions details


PATCH
/cases/{caseID}/actions/{actionID}
Perform case action


PATCH
/cases/{caseID}/actions/{actionID}/recalculate
Recalculate calculated fields & whens for the current form


PATCH
/cases/{caseID}/actions/{actionID}/refresh
Refresh case action


GET
/cases/{caseID}/ancestors
Get ancestor case hierarchy


GET
/cases/{caseID}/descendants
Get descendant case hierarchy


POST
/cases/{caseID}/processes/{processID}
Add optional process


GET
/cases/{caseID}/stages
Get case stages list


POST
/cases/{caseID}/stages/next
Change to next stage


PUT
/cases/{caseID}/stages/{stageID}
Change to specified stage


DELETE
/cases/{caseID}/updates
Release lock


GET
/cases/{caseID}/views/{viewID}
Get view details for a case


POST
/cases/{caseID}/views/{viewID}/calculated_fields
Get calculated fields for a given case view


PATCH
/cases/{caseID}/views/{viewID}/refresh
Refresh view details for a case