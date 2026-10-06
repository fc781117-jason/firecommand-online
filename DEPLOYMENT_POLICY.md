# FireCommand Deployment Policy

Version: 1.0  
Governance scope: repository deployment, Preview, Production, rollback, and release verification.

## 1. Operating principle

Feature work and deployment governance are separate layers. Product features may evolve freely, but Production must pass this policy.

Primary deployment path:

```
GitHub branch / commit
→ Vercel Git Integration
→ Preview deployment
→ automated checks
→ Preview acceptance
→ one Production approval
→ Production branch
→ Vercel Production deployment
→ smoke / health verification
```

Vercel MCP is optional. A ChatGPT/Vercel connector result of `list_teams = []` is a **known non-blocking scope issue**. Do not stop work, do not repeatedly ask the user to reconnect Vercel, and do not treat that connector result as proof that Vercel deployment failed.

Use GitHub commit status/checks from Vercel as the primary machine-verifiable deployment signal when the connector cannot enumerate the Team.

## 2. Branches

- Preview/development branch: `test/vercel-preview-check`
- Production branch: `main`
- Production domain: https://firecommand-online.vercel.app

Do not push feature work directly to the Production branch.

## 3. Release gates

Risk class: **CRITICAL**

Before Production:

1. Working tree / source state is known and secrets are not committed.
2. Required test/check commands pass.
3. Required build command passes.
4. GitHub shows Vercel deployment status = success for the candidate commit.
5. Preview acceptance is performed when a Preview URL is accessible.
6. App-specific smoke checks pass.
7. Release summary lists changed files, test/build results, known limitations, and rollback target.
8. Obtain exactly one Production approval unless the user's current instruction already explicitly authorizes this exact release for Production.

If source changes after approval, approval expires and a new final approval is required.

A docs-only governance change may remain on a non-Production branch until a normal release; do not trigger Production solely to publish governance files.

## 4. Single-approval workflow

Default behavior:

```
implement
→ test
→ build
→ push Preview branch
→ verify Vercel success
→ Preview/smoke acceptance
→ ask once: "Production?"
→ if approved, promote/merge
→ verify Production
```

If the user explicitly says in the current task "正式上線", "直接上線", or equivalent and the exact candidate has already passed all gates, that instruction counts as the one Production approval for that candidate.

## 5. Failure and rollback

- Never promote a failed test/build/deployment candidate.
- If Production health/smoke verification fails, stop further changes and roll back or restore the last known-good Production commit/deployment when the available deployment path supports it.
- Record the failed candidate and rollback target.
- Never overwrite or rotate secrets merely to make a failing deployment pass.

## 6. Secrets and credentials

Never commit:
- `.env*`
- private keys / certificates
- API tokens
- service-account JSON
- passwords
- Vercel bypass secrets
- brokerage credentials

Secrets belong in the approved secret store / environment variables or local ignored files only.

## 7. App-specific safeguards

- Treat this as an operational command application. Production changes require strict Preview-first acceptance.
- Never mix practice/test records with live incident records.
- Do not alter Firebase/Firestore production data, auth configuration, security rules, or environment secrets unless the release task explicitly requires it and the change has its own verification step.
- Production smoke checks must include login entry, incident list/create entry, and at least one non-destructive navigation path.
- A deployment failure or auth regression requires immediate stop; do not "fix forward" in Production without a new gate.

## 8. Known Vercel connector issue

Current known behavior:
- OAuth/team authorization can be correct in Vercel UI.
- ChatGPT Vercel MCP may still return no Teams.

Required response:
- Mark as `VERCEL_MCP_KNOWN_SCOPE_ISSUE`.
- Continue via GitHub → Vercel Git Integration.
- Verify deployment from GitHub Vercel commit status/checks.
- Do not request repeated Vercel reauthorization solely because Teams is empty.

## 9. Handoff format

Every deployment/release handoff should report:

```
STATUS:
APP:
BRANCH:
CANDIDATE_SHA:
TESTS:
BUILD:
VERCEL_STATUS:
PREVIEW_ACCEPTANCE:
PRODUCTION_APPROVAL:
PRODUCTION_STATUS:
SMOKE_CHECK:
ROLLBACK_TARGET:
BLOCKERS:
NEXT_ACTION:
```
