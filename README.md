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

## Adding a city

1. **Research** — run the `venue-scout` skill (see `skill/venue-scout/SKILL.md`) for the city:
   neighborhood analysis → venue discovery → **link verification** (every URL fetched before
   it ships) → photo URLs. Output the findings as a `configs/<city>_config.js` following the
   schema documented in the template comments.
2. **Build** — `python3 scripts/build.py configs/<city>_config.js "<City> Tech Week — Venue Options · ComputeCafe" <city-slug>`
   writes `<city-slug>/index.html` (repo-root-relative, safe to run from anywhere) with the
   ComputeCafe home link injected. Titles follow the `… · ComputeCafe` suffix convention. The
   shipped pages were built with exactly:
   ```
   python3 scripts/build.py configs/sf_config.js "SF Tech Week — Venue Options · ComputeCafe" san-francisco
   python3 scripts/build.py configs/la_config.js "LA Tech Week — Venue Options · ComputeCafe" los-angeles
   ```
3. **Flip the card** — in `index.html`, set the city's entry to `status: "live", href: "/<city-slug>/"`.
   The `href` must match the `<city-slug>` passed to the build script.
4. **Deploy** — push to the connected Vercel project (`brewvenue`), or deploy the file tree
   with the Vercel API. The site is plain static HTML; no build step on Vercel's side.

The plan to run steps 1–4 as autonomous agents (Tavily search/extract + Kimi K3 on Nebius
Token Factory + Tenki sandboxes) for the remaining 13 cities is in
[`docs/multicity-research-plan.md`](docs/multicity-research-plan.md).

## Data honesty rules

Carried from the skill, enforced in every city page: no unverified URLs · closed venues
surfaced in the footer, never silently dropped · capacities marked published vs. estimated ·
photos hotlink from each venue's own site with automatic fallback art · research date in
the provenance line.

---
Built with Claude (Cowork) · venue research verified Aug 2026
