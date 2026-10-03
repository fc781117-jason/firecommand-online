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
