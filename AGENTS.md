# Deployment governance

Before any release, deployment, Production, Vercel, or rollback work:

1. Read `DEPLOYMENT_POLICY.md`.
2. Read `.github/deployment-profile.json`.
3. Treat Vercel MCP `list_teams = []` as a known non-blocking connector issue.
4. Use GitHub → Vercel Git Integration as the primary deployment path.
5. Do not push feature work directly to the Production branch.
6. Complete the defined gates before Production.
7. Ask for at most one final Production approval unless the current user instruction already explicitly authorizes that exact release.
8. Never expose or commit secrets.
