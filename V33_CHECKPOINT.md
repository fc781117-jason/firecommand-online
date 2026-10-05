# FireCommand V3.3 checkpoint — 2026-10-04

## Scope and release guard

- Base: V3.2 `5bdbc52d622c644ca9acce9131ded2e2f6675800` (latest remote branch at start).
- Branch: `feature/v34-2-field-revision-v3-3`; draft PR #8 targets V3.2, not `main`.
- Remote HEAD: `83270ab516af20710fdf1680cf2d81c338e8350f` before this documentation commit.
- Preview: https://firecommand-online-git-feature-v-7e5695-fc781117-4321s-projects.vercel.app
- Vercel deployment: `DhRg3f5GzniGFCtQVWLSUnDRd4cj`; GitHub Vercel status **success**, PR bot **Ready**.
- Production: **HOLD**. No merge, production deploy, real case write, schema migration, Rules/Storage edit or environment-variable edit.

## Implemented

1. Human and vehicle headers use one native inline `<details>` design. Vehicle summary reports registered count and the count of actually unpositioned vehicles, omitting the second item at zero.
2. Removed the redundant outer drawing accordion. Tactical and building are adjacent top-level inline accordions after a divider; opening one closes the other. Human and vehicle expansion remains independent. Removed drawing jump/`scrollIntoView` handlers.
3. Floor details use an aggregate heading followed by distinct resident bullet records, with visual indentation and floor dividers. Incomplete demographic counts remain lower bounds, not totals. Empty resident floors are omitted only from detailed text, not the building section.
4. Isolated demo access is allowed for this exact V3.3 Preview branch; the API still rejects Production, development and other branch names. No real Firebase is used for the demo fixture.

Changed program files: `index.html`, `assets/app.js`, `assets/operational-v32.js`, new `assets/v34-v33.css`, `api/preview-mode.js`; changed tests: `tests/field-entry-vnext.test.cjs`, `tests/v34-ui-v2.test.cjs`, `tests/v34-v3.test.cjs`, new `tests/v34-v33.test.cjs`, `tests/preview-isolation-v31.test.cjs`.

## Verification

`node scripts/verify.cjs`: **286 PASS, 0 FAIL**. `git diff --check`: clean. Deployment build: **Ready** according to GitHub Vercel status and bot comment. This is not a substitute for UI/Safari acceptance.

| Requirement | Automated source/model | Browser/iPhone Preview |
|---|---|---|
| UI-01/02 human/vehicle header hierarchy | PASS | NOT TESTED |
| UI-03/04 vehicle inline open/close | PASS (native details markup) | NOT TESTED |
| UI-05 no Vercel Toolbar interception | No app handler/link to Toolbar | NOT TESTED |
| UI-06/07 outer frame removed, four peer entries | PASS | NOT TESTED |
| UI-08/10 tactical inline open/close | PASS (native details markup) | NOT TESTED |
| UI-09 no automatic scroll/jump handler | PASS (source check) | NOT TESTED |
| UI-11 building inline; diagrams exclusive | PASS | NOT TESTED |
| UI-12 chevron reflects `open` | PASS (CSS/native details) | NOT TESTED |
| FLOOR-01/02/03 aggregate then resident bullets | PASS | NOT TESTED |
| FLOOR-04 unknown not zero | PASS | NOT TESTED |
| FLOOR-05 dividers | PASS | NOT TESTED |
| FLOOR-06 omit empty detailed floors only | PASS | NOT TESTED |

The cloud browser was denied by automatic security review when opening the Preview URL, citing a restricted Vercel browser fallback. We did **not** bypass the denial or claim a screenshot, Safari/iPhone test, click success, Toolbar diagnosis or visual PASS. User acceptance must exercise the actual Preview on an iPhone. In particular, tap the vehicle entire header with the Preview Toolbar both closed/open, confirm its form appears immediately beneath it, then test tactical/building toggles and A/B residents.

## V3.2 carry-over ledger

| Track | Status | Evidence / remaining gate |
|---|---|---|
| PWA Push | NOT_STARTED | Full background sender, subscription, isolation, deep link and lock-screen verification not done. |
| Task Timeline | PARTIAL | Compatible segments and transition repair with unit tests; not all editing routes/real multi-device flow verified. |
| Case Closure | PARTIAL | Existing closed guard and timer closure tests; double confirmation, server-authorized admin reopen and final snapshot not complete. |
| Contact/hazard/resident photos | PARTIAL | Existing private Storage code path; real camera/upload/reopen persistence not verified. |
| iPhone Safari/PWA | BLOCKED | Requires physical iPhone and successful permitted Preview access. |

## Compatibility and rollback

This V3.3 patch needs no migration, Rules, Storage policy or new setup parameters. Existing optional V3.2 fields and historical data stay readable. Revert the V3.3 code commits on this feature branch, build a new Preview and verify there; do not erase case data or rewrite Production. Preserve the V3.2 parent and its checkpoint. Do not merge the draft PR until user acceptance and outstanding safety gates are separately resolved.
