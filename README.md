# BrewVenue ☕

Venue scouting HQ for the **Builders & Brews: Hack Edition** global hackathon tour (H2 2026).

**Live:** https://brewvenue.vercel.app

The front page shows all 17 tour cities across three regions. Cities with a completed
venue scout link to a filterable explorer of vetted venues — cafes, coworking, and event
spaces with capacities, photos, and **verified** private-events/booking links.

| Route | Page |
|---|---|
| `/` | City grid (tour dates, statuses, RSVP links) |
| `/san-francisco/` | SF Tech Week venue scout — 20 venues, SoMa/2nd St analysis |
| `/los-angeles/` | LA Tech Week venue scout — 19 venues, Santa Monica + Venice |

## Repo layout

```
index.html                 ← front page (city grid; edit REGIONS array to add/flip cities)
los-angeles/index.html     ← generated city page
san-francisco/index.html   ← generated city page
configs/                   ← per-city venue data (CONFIG + TYPE_META + VENUES)
scripts/build.py           ← assembles a city page from a config + the template
skill/venue-scout/         ← the research skill: SKILL.md, explorer template, publishing notes
docs/                      ← multi-city research plan (Tavily + Kimi K3 + Tenki pipeline)
```

## Adding a city (the end-to-end recipe)

The canonical recipe: research → validate → build → flip → review → PR.

```bash
# 1. Kick off research — the workflow script drives frame → discover → verify per city
curl -X POST https://agent/workflows \
  -d '{"workflow":"city-scout","args":{"city":"Amsterdam","slug":"amsterdam","eventDate":"Sep 25, 2026","lang":"Dutch + English"}}'
# Or: open this chat and say "run the venue-scout for Amsterdam"

# 2. Shape the artifacts
# Each agent run produces:
#   docs/pilots/<city>/framing.md       — neighborhood analysis + don't-waste-time list
#   docs/pilots/<city>/evidence.jsonl   — every fetch/search the agent made (the anti-hallucination log)
#   docs/pilots/<city>/research.json    — raw venues + closures (the draft, not the config)
#
# Then:
node scripts/normalize-pilot.js $CITY       # → configs/$CITY_config.js (drops unverified via evidence contract)
python3 scripts/build.py configs/$CITY_config.js "$CITY — Venue Options · ComputeCafe" $CITY
python3 scripts/validate_config.py --venues-json docs/pilots/$CITY/research.json

# 3. Flip the card
# Edit index.html:  { city: "Amsterdam", status: "soon", href: null, ... }  →  status: "live", href: "/amsterdam/"

# 4. PR
git checkout -b add-$CITY
git add configs/$CITY_config.js $CITY/ docs/pilots/$CITY/
gh pr create --title "Amsterdam venue scout" --body "…"
```

### Waves, caps, and order
To run many cities in parallel: launch each city as its own top-level Workflow with `args = {city, slug, eventDate, lang}`. Three rules of engagement that proved sound:
- **5 concurrent sandboxes/cells, no more** (the Tenki cap)
- **Order by event date** with biggest-market tiebreak when dates overlap
- **Ship least-risky-first** — English-native markets go out before dual-script heavy cities

### Data honesty rules
Carried from the skill, *enforced in code*, in every city page:
- **No unverified URLs.** Any venue without a successful fetch in `evidence.jsonl` is auto-dropped.
- **Closures surface in the footer, never disappear.**
- **Capacities marked published vs estimated** with `~` + `(est)`.
- **`alt` = photo caption,** never advice — enforced by `validate_config.py`.
- **Research date in the provenance line.**

For the exhaustive multi-city retrospective: `docs/retrospective-wave-123.md`.

## Data honesty rules

Carried from the skill, enforced in every city page: no unverified URLs · closed venues
surfaced in the footer, never silently dropped · capacities marked published vs. estimated ·
photos hotlink from each venue's own site with automatic fallback art · research date in
the provenance line.

---
Built with Claude (Cowork) · venue research verified Aug 2026
