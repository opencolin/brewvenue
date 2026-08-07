# BrewVenue — New York REVIEW CARD

**Run:** `new-york` · 2026-08-07 · 2 neighborhoods × 2 types · 4 subagent cells (shared with Boston run) · 12 venues shipped · in-session Claude Code subagents with tour-trace seeding (skill Step 1.5).
**Verdict up front:** contract held (12/12 links fetch-verified, validator 0 problems / 0 warnings). Weaker `dedicated` ratio than other cities (2/12) — NYC cafés/coworks mostly run events by inquiry, not published pages. Ship with the §2 hand-checks.

## 1) Contract status

| Check | Result |
|---|---|
| Every shipped `link` has a successful fetch in `evidence.jsonl` | ✅ 12/12 |
| Schema (incl. `k`, `area`, `type`, `<b>` caps, caption alts, bare emails) | ✅ 0 problems — no normalize pass needed |
| Closures footnote | ✅ 1 genuine closure (Brooklyn Roasting DUMBO flagship — absent from the brand's current store list), fetch-backed; 11 discards as comments |
| Photos | 5/12 (42%) — below the 60% bar; placeholder art covers the rest |

## 2) Items a human should check before/while booking

- **Cafe Cursor's Brooklyn host café is still unnamed publicly** (Luma-gated; GarysGuide says "Venue To Be Announced"). Whoever attends Aug 12 should capture the venue — it's a pre-vetted seed for this exact page.
- **Zero Irving** — the event/conference center isn't linked from the homepage; the `/event-space/` guess 404'd. Inquire via contact form; capacity is an estimate from CityRealty/6sqft coverage (14,000 sq ft).
- **Dumbo Loft capacity (140/200)** comes from venue listings, not the venue's own page — confirm on inquiry.
- **Newlab** is Brooklyn Navy Yard — between the two target neighborhoods, not inside either; disclosed in the address. Paid rentals only.
- **The Yard buyout capacities** unpublished — both entries are estimate-marked; confirm 50+ headcounts.
- **Devoción Flatiron's link** is the brand's cafés directory (no per-café page exists); one brand relationship covers Williamsburg + Flatiron.

## 3) Top picks

1. **Devoción Williamsburg** — greenhouse flagship, training-lab event history, the strongest coffee/hack room in Brooklyn.
2. **Zero Irving** — purpose-built Union Square tech hub with a dedicated event floor; strongest Manhattan shape.
3. **Newlab** — hackathon/demo-day history at scale, dedicated rental intake.

## 4) Tour-trace outcomes (honest accounting)

All four NYC traces dead-ended for *venues* (Cafe Cursor gated; ClawCon → Ideal Glass, West Village, out of cell; AI Tinkerers → sponsor offices; Dabl/Pilot → undisclosed 28-person social) — but produced three partner leads (Betaworks, ElevenLabs office, Pilot) and confirmed the neighborhoods. NYC is the counterexample to Boston: tour traces here inform framing more than they seed venues.

*Artifacts: `research.json` · `evidence.jsonl` (51 lines) · `nyc_config_draft.js` (generated) · final config at `configs/nyc_config.js` · page at `/new-york/`.*
