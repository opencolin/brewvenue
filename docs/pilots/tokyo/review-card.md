# BrewVenue — Tokyo venue-scout REVIEW CARD

**Run:** `tokyo-scout` · 2026-08-06 · 3 neighborhoods × 2 types = 6 cells · 32 unique venues → 31 kept after contract · 178 evidence lines · 19 closures · 6 agents · 668,854 tokens · 150 tool calls · ~5.3 min wall-clock.

**Front-page readiness:** Shibuya, Nihonbashi/Kayabacho, Roppongi. Akihabara/Odaiba dropped from this run (second-tier bilingual attendance evidence); add in a follow-up if the top 3 pages do well.

## Contract status
| Check | Result |
|---|---|
| Links with successful fetch in evidence.jsonl | ✅ 31/31 |
| Required fields present (after normalize) | ✅ 0 problems |
| `k` / `area` / `type` present | ✅ (post-normalize) |
| Photo coverage | ✅ 26/31 = 84% (way over 60% bar) |
| Flag ratio | ✅ 30 dedicated / 1 contact |
| Closures surfaced, not dropped | ✅ 19 logged |

## Top picks (self-reported)
1. **OR | Miyashita Park (Shibuya coffee)** — `top:true`. Bilingual rental page, 3 floors (100/100/300), espresso bar at street level, escalator into Miyashita Park for overflow. ⚠️ Site flags ongoing renovation (2026.07.21 notice); confirm floor access before booking.
2. **SHIBUYA QWS Scramble Hall (Shibuya cowork)** — `top:true`. In Tokyo's startup hub; full AV + bilingual staff via Theatre Workshop. Capacity 200. Reliable infrastructure pick.

## What the run flagged (data honesty)
- **`FINOLAB` dropped automatically by the evidence contract** — its `link` had no logged successful fetch. This is the system working: a venue failed verification, got rejected, with an audit trail.
- **Hills Café/Space email was malformed by the agent** (prose like "(fallback mailbox published…)" inside the email string). Normalized to the bare address during cleanup; the contact path for that venue needs a hand-check.
- **`PARK6 powered by bondolfi boncaffè` is http-only** (park6.jp). The one remaining warning, same pattern as Chloe Cafe on Toronto — acceptable per repo precedent, but the front page's "all links verified https" claim only holds for the other 30 venues.
- **19 closures** ranging from known Tokyo venue churn (e.g., Roppongi's TCDC Cafe now permanently closed, some corporate cafe closures) to neighborhood-discards (Tsutaya BOOK APARTMENT Shinjuku out of scope). All in `docs/pilots/tokyo/research.json` under `closures`.

## Learnings vs Toronto (the previous dry-run)

**Tokyo produced structurally better data.**
- Dedicated-flag ratio 30/31 vs Toronto's 10/16 — Tokyo's venue culture natively runs `space.kane`/`rental` pages with capacities and equipment lists; the agents had more to verify against.
- Photo coverage 84% vs Toronto's 44% — Tokyo venues' own sites hot-link freely (SAKURA DEEPTECH, GOBLIN`s cdn, QWS hubfs), so no robots-blocked juggling needed.
- `cap` markup quality is still the weakest dimension. 0/32 agents naturally bold-capacity in their raw output; normalize fixes it but this is ripe material for the schema.

**What broke (and needs fixing in the pipeline):**
1. **`cap`/`alt` schema still leaks.** Same bug class as Toronto: raw venue objects miss `k` and carry a `_cell` leak + prose-style `alt` ("Confirm availability for 2026-09-09 early: …"). Fix: add `area`, `type`, `k` to the agent return schema; tell the agent alt must be a noun phrase.
2. **No per-cell tool budgeting.** The Roppongi cowork/event cell burned 43 tool calls on drop-downs while a Nihonbashi cell finished in 21. The plan'd resource guard isn't enforced — add per-agent tool-call budgets.
3. **Email hygiene not in the schema.** Instead of regex-valid emails, we got English prose glued into `email`. Either validate at the JSON schema level or post-normalize.
4. **Bilingual query quality is strong but not measured.** Shibuya + Roppongi got clean bilingual venue pages; Nihonbashi zaferans nightspaces are Japanese-first only. That's a fair warning to ship on the city page, not a blocker.

## Next
1. Build `configs/tokyo_config.js` from `venues.normalized.json` → run `scripts/build.py` → flip the front-page card (`status: "live", href: "/tokyo/"`).
2. Write the human review (what you see now) → human sign-off.
3. Merge a PR (pattern from PR #2) or deploy straight to Vercel — same `brewvenue` project.
4. **Follow-up candidate:** Akihabara/Odaiba cell (cornland / docomo R&D OPEN LAB) to give the page a true large-format listing above 200.

## Artifacts
- `docs/pilots/tokyo/framing.md` — neighborhood analysis + "don't waste time" list
- `docs/pilots/tokyo/evidence.jsonl` — 180 lines (incl. framing + all fetches)
- `docs/pilots/tokyo/research.json` — raw extracted venues + closures
- `docs/pilots/tokyo/venues.normalized.json` — 31 template-ready venues
- `docs/pilots/tokyo/review-card.md` — this file
