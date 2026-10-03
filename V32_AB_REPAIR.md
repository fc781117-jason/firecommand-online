# V3.2 Phase A/B repair candidate

Base: `cfdfc26f480084728f426ce8efade054fdc117a8`, PR #7, branch `feature/v34-2-field-revision-v3-2`.

This is a local repair candidate for independent review. Production remains HOLD. The existing Preview uses prefilled, resettable synthetic local cases; trying the interface does not require a new Firebase project or account.

## Corrected behavior

1. Changing an active crew from attack to search in the personnel form closes the prior segment and starts the search segment. Editing only a count does not restart it.
2. Confirmed intake changes to rest/REHAB use the shared task status resolver, so rest is counted as REHAB. A retained interior hint from an earlier parsed sentence cannot override the reviewed task's non-working status. A later search starts a new work segment.
3. Rotation Undo records a new transition. Completed work and rest segments remain, and later unrelated count/note edits survive.
4. A replacement crew receives the target assignment's face and floor as well as its task and location.
5. The personnel sheet preserves empty, unspecified, and custom existing status values. A count-only edit cannot silently select “作業中”.
6. Resident transport/death outcomes remain visible as household records with person counts pending. They are not inferred from household population or added to patient totals.
7. Legacy male/female counts remain readable. Explicit modern unknown values remain unknown even when a stale legacy field exists.
8. Current patient facts come from the reconciled patient model. Superseded raw patient titles no longer appear as additional current situation facts; the underlying event history remains intact.
9. Floor state uses the newest timestamped floor record. Resident records continue to use their existing latest-record reconciliation.
10. Overview, report prose/table, radio speech, case list, and local advice share the trapped-person summary. Confirmed presence with an unknown count cannot become zero; confirmed absence and unconfirmed presence remain distinct.

Rotation and its Undo now use a single optimistic transaction for affected crews and hoses, applying partial updates through the shared assignment transition. Closed-case, observer, changed-case, and conflicting-assignment checks reject the operation. The local adapter persists before changing in-memory state. This is not a substitute for backend security enforcement.

## Verification

`node scripts/verify.cjs` checks every JS file in assets/api/server and runs the full test suite. Added regressions cover both live and practice flows, controlled ten-minute intervals, count-only edits, Undo history, conflicting records, local persistence failure, mocked Firebase transactions, and unknown trapped-person counts across summary consumers. Mocked tests do not establish real cloud synchronization or rule enforcement.

After publication, the exact deployed SHA still needs Preview browser confirmation. iPhone touch/pinch/pan, real camera/Storage persistence, multi-device synchronization, safe backend closure, and real background Push remain NOT TESTED for this candidate. Phase C/D are unfinished and are not prerequisites for trying the prefilled A/B demonstration.

## Data and security impact

No Rules, Storage policy, project configuration, environment variables, credentials, roles, or Preview isolation changes. No new collection or mandatory migration. Existing optional taskSegments/assignmentRevision fields are retained. The fix applies only on subsequent user actions; it does not rewrite historical records. No production or real incident data is used.

The remaining structured-summary consumers, including all report/AI/final/push paths, still require the broader V3.2 integration. Existing closure and notification gaps recorded in V32_TEST_RESULTS.md are not claimed complete by this repair.

If a later published repair must be rolled back, revert its commit on this feature branch and validate the resulting Preview. Do not delete task history or reset a remote branch.
