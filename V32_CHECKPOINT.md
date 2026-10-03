# FireCommand V3.2 checkpoint

Production HOLD. Scope: FireCommand only.

## Audited baseline — 2026-10-03

- Remote V3.1 HEAD re-read: `ea525ed510fb6ad60d2e2550c483cb94e1960263`; PR #6 draft.
- Production branch `main`: `4ecae9ca76fed7f38779d0b19ea16520ac345b01`.
- Working directory initially clean. Original local commits and V3.1 branch retained.
- New branch: `feature/v34-2-field-revision-v3-2` from latest remote V3.1, not historical local copy.
- Vanilla JS/static HTML; Firebase compat Firestore/Auth/Storage; Vercel static + API functions.
- Existing patient identity reconciliation, private resident photo path repair, preview isolation retained.
- Vercel connector returns 403 for project team scope. No credentials/settings changed. GitHub reports prior Preview success; direct deployment settings cannot be audited with current connector access.

## Phase A implemented

- Real SOP/deployment/overview entries retained. New `operational-v32.js` composes existing patient/resident source contracts.
- Tactical SVG viewBox zoom/pan, +/-/Fit, transform-aware object positioning. Minimum transparent tap targets; overview remains read-only.
- Resident carousel per floor, compact short labels, click/key detail sheet using existing private photo component.
- Structured overview: incident/life safety/situation/deployment/floors/hazards/support/time. Registered households != verified building total. Patient totals not added to residents.
- Preview demo allowlist adds only exact new feature branch; production remains denied.

## Compatibility

No schema migration, Rules, Storage configuration, or environment variable changes in Phase A.
Optional verified total-household metadata is read-only; existing records are not rewritten.
Rollback: revert Phase A commit on feature branch. Production unchanged.

## Gates / pending

- Automated tests recorded separately; real iPhone camera/pinch/PWA and Firebase Storage persistence NOT TESTED.
- Task segments, closure backend guards/snapshot, PWA push not delivered by Phase A.
- Vercel scope reauthorization required for direct project/deployment inspection; never promote Preview without user approval.

## Phase B — implemented, Preview regression pending

- Compatible `crews.taskSegments[]` + `assignmentRevision`; no second crew collection.
- Shared transition used by addItem/updateItem, field personnel form, and confirmed intake transaction (including undo).
- Count-only changes keep status/timer; task/status/face/floor changes close prior segment and record new one. Legacy startAt is explicitly partial; absent times are not invented.
- Manual crew updates use transaction + changed-field freshness check. Other clients cannot silently replace task data through this path.
- Crew cards provide history. Operational report data includes per-segment work/REHAB totals and dispatch count. Timers are derived, no per-second writes.
- Closure helper is unit-tested but NOT wired to formal closure yet. Phase C final snapshot/admin reopen/backend readonly remains unfinished; existing Rules are unchanged.
- Phase D PWA/Push remains unfinished, not claimed enabled. There is no scoped server service credential/configuration verified in this session; scheduled background sender, recipient isolation and lock-screen receive must be implemented/validated before release.

## Test checkpoint

- `node scripts/verify.cjs`: 264/264 PASS (syntax + automated regression).
- Phase A real Preview: structured overview, +/-/Fit SVG viewBox, resident compact/detail UI inspected.
- Real iPhone, multi-touch, Storage upload persistence, authenticated multi-device conflict, push: NOT TESTED.
- Do not upload this branch to Production as a complete V3.2 update. Continue C/D after obtaining authorized isolated backend and Vercel team access.
