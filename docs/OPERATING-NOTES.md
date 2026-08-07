# BrewVenue operating notes

Quick-reference for anyone driving a city run. Assumes `scripts/city-meta.json` + `scripts/workflows/city-scout.js` + `scripts/normalize-pilot.js` exist.

## 1. Kick off a city

Two ways:

**A. Through Claude (most common):** say "run the venue scout for <city>" — the chat flies the scripted pipeline: `Frame → Discover → Verify → dedup → package docs/pilots/<slug>/`.

**B. Direct Workflow API:**
```
curl -X POST /agent/workflows --data '{"workflow":"city-scout","args":{"city":"Amsterdam","slug":"amsterdam","eventDate":"Sep 25, 2026","lang":"Dutch + English"}}'
```

Both produce `docs/pilots/<slug>/{framing.md,evidence.jsonl,research.json}`.

## 2. Verify quality (automatic)

After the run completes:
```
node scripts/normalize-pilot.js <slug>           # drops venues without successful evidence fetch
python3 scripts/validate_config.py --venues-json docs/pilots/<slug>/research.json
```
`normalize-pilot.js` writes `configs/<slug>_config.js` only if contract passes; warnings (not errors) go to stdout.

## 3. Build the page

```
python3 scripts/build.py configs/<slug>_config.js "<City> — Venue Options · ComputeCafe" <slug>
```
Then flip the card:
```
{ city: "Amsterdam", ..., status: "soon", href: null, img: "…" }
→ status: "live", href: "/amsterdam/"
```

## 4. Package + PR

```
git checkout -b <wave-slug>-<city>
git add configs/<slug>_config.js <slug>/ docs/pilots/<slug>/
git commit -m "<City>: venue scout"
gh pr create --title "<City> venue scout" --body "see docs/pilots/<slug>/review-card.md"
```

## Rules of engagement

| Rule | Why |
|---|---|
| 5 concurrent sandboxes, never more | the Tenki cap that keeps costs predictable |
| Order by event date, biggest market tiebreak | hardest cities get the correction buffer |
| Always run a *dry-run pilot* before a wave | catches the schema bugs before they burn 5 cities |
| Never hand-edit `configs/<city>_config.js` | all data flows through `normalize-pilot.js` — hand edits collide with the evidence contract |
| Never trust another run's "already verified" claim | re-run `validate_config.py` before merging |
| Ship English-native markets first | bilingual lift risk goes to the head of the queue |

## Canned city invocation (copy-paste template)

```
curl -X POST /agent/workflows --data '{"workflow":"city-scout","args":{
  "city":"<name>","slug":"<slug>","eventDate":"<date>","lang":"<bilingual hints>"}}'
```

That's the whole game.
