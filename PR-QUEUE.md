# PR queue — merge when rate-limit resets

The GitHub GraphQL rate limiter hit (429s). These branches are pushed and ready:
- `image-healing` (PR #?) — the 12-image heal patch for NYC + Boston
- `add-city-map` (**PR #10**) — View Map toggle on every page + CITY_CENTERS + template wiring
- `integrate-vote-submit-v1` — Submit Venue + star voting APIs + UI wiring + Upstash KV integration (needs env vars)
- `ops-docs-wave-4` — README + SKILL.md + docs/OPERATING-NOTES.md + pilots for Amsterdam/SF/LA
- `retrospective-waves-123` (**PR #8**) — multi-city retrospective doc
- `merge-nyc-boston` (**PR #9**) — replace broken NYC/Boston configs with clean wave-3 regen
- `wave-1` (**PR #5**), `wave-2` (**PR #7**), `wave-3` (**PR #6**) — city venue scouts

## Fire one command when rate limit resets

```bash
cd /Users/luxor/Code/brewvenue
for pr in 5 6 7 8 9 10; do gh pr merge $pr --squash --auto; done
gh pr merge image-healing --squash --auto
gh pr merge integrate-vote-submit-v1 --squash --auto --delete-branch
gh api --method POST /repos/opencolin/brewvenue/merges -f base=main -f head=add-city-map
```

## After merging, audit before pushing to deploy
- Vercel: wire `GITHUB_TOKEN` + `KV_REST_API_URL`/`KV_REST_API_TOKEN` env vars (dashboard → brewvenue → Settings → Env Vars), redeploy.
- Re-run `scripts/normalize-pilot.js` per city to confirm each still validates.
- Spot-check a few city pages on the live site: map opens, Submit Venue modal opens, star button renders a ☆ + count.
