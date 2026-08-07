# Publishing the venue explorer

Two delivery tiers. Do the first always; do the second when the user wants a
link anyone can open.

## Tier 1 — Cowork artifact (always)

1. `SendUserFile` the finished HTML with `display: "render"` — capture the
   `file_uuid` from the result.
2. `mcp__remote-devices__create_artifact` with that `file_uuid`, a kebab-case
   id (e.g. `austin-venue-scout`), and a description saying what it shows and
   the research date. This persists it in the user's desktop sidebar across
   sessions. If the tool is absent or errors (no desktop connected), the sent
   file is the fallback — say so and move on.

## Tier 2 — Public URL (on request: "shareable", "public", "send to my team")

The Vercel MCP connector is the proven path. Load tools via ToolSearch:
`mcp__Vercel__deploy_to_vercel, mcp__Vercel__list_teams, mcp__Vercel__get_deployment, mcp__Vercel__list_projects`.

Happy path:

1. `list_teams` → note the team id.
2. `deploy_to_vercel` with `target: "production"`, a fresh project `name`
   (e.g. `latw-venue-scout`), the team id, and
   `files: [{file: "index.html", data: <full HTML>}]`. Static HTML needs no
   build config — Vercel serves it directly.
3. Poll `get_deployment` until `state: "READY"`. The `alias` array usually
   contains a clean `<project>.vercel.app` — that's the URL to share, not the
   hash URL.
4. **Verify public access before announcing**: WebFetch the alias and confirm
   the actual page content comes back, not a login/authentication wall. Only
   then give the user the URL.

Known failure modes (all hit in practice):

- **403 "You don't have permission to create a project"** — the connector's
  token can often still deploy into *existing* projects; only creation is
  blocked. Diagnose cheaply: a tiny `target: "preview"` deploy into one of the
  user's least-important existing projects (tell them about the test — it
  never touches production). Then ask the user via AskUserQuestion:
  (a) reconnect the Vercel connector with full-team access / fix their team
  role, then retry the clean deploy (recommended); (b) designate an existing
  project to overwrite (warn: its live content is replaced); (c) skip Vercel
  and share the artifact/file instead.
- **Project settings break the deploy** (e.g. `NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST`)
  — the existing project expects a different root directory. Match the file
  path to the project's root-directory setting, or use a different project.
- **Preview URLs behind Vercel Authentication** — team preview deployments
  are often SSO-protected; a "shareable" preview link that 401s for the
  public is not a deliverable. Prefer production deploys for public pages.

Don't touch billing-adjacent Vercel tools (buy_domain, buy_pro, buy_credits)
unless the user explicitly asks to purchase something.

No Vercel connector? Offer: the artifact's share option in the desktop app,
the raw HTML file (opens in any browser), or ask which hosting the user has.

After deploying, offer to redeploy on future edits — same project name updates
the same URL — and mention custom domains are possible if they own one.
