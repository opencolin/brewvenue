# BrewVenue — multi-city venue-scout retrospective (waves 1–3)

**Run:** 2026-08-06 → 2026-08-07 · 13 cities · 3 waves · 5-agent-parallel Tenki cap · ~8M subagent tokens · ~2,600 tool calls total.

## Final numbers

| Wave | Cities | In-scope | Researched | Shipped after contract | Proof |
|---|---|---|---|---|---|
| 1 — APJ + priority | Seoul, Berlin, Stockholm, Kuala Lumpur, Singapore | 5 | 146 | 142 (4 contract drops) | PR #5 |
| 2 — EMEA | London, Tel Aviv, Zurich, Paris, Barcelona | 5 | 143 | 141 (2 drops) | PR #7 |
| 3 — Toronto v2 | Toronto (supersede) | 1 | 32 | 32 (0) | PR #6 |
| **Total** | 11 (of 13 target) | 11 | 321 | 315 (6 rejected) | — |

Boston and NYC were already live with configs from earlier research (no new wave-3 PR).

## What worked
1. **The evidence-log contract fired 6 times across the wave.** St. Oberholz ×2 (Berlin), Trampery (London), Kraftwerk (Zurich), plus the 3 NYC unverified links. The normalize-pilot drops them automatically, audit trail in `evidence.jsonl` — same mechanism that caught FINOLAB in Tokyo. Contract: working.
2. **Framing sharpened deeply.** The venue sources doc (PR #3) and tour-trace seeding (Dabl Club, Cursor Cafe, ClawCon) gave Stockholm/Founders House, NYC SoHo Cursor takeovers, and Paris Station F as their *primary* cells rather than cold-language queries. You can see this in the numbers: weak cities (Seoul, KL, Zurich) returned with the most closures; that quality signal confirms the avoid-lists as they should be working.
3. **Tenki 5-sandbox cap wasn't binding.** Each city costs 5–35 min wall-clock, 500–800k tokens; a 5-slot pipeline kept saturated without overrunning. Seoul's 329-call bilingual run was the longest (24 min); Singapore was the richest (32 venues, 0 drops).
4. **Deterministic chain is genuinely portable across 11 distinct markets.** Same `normalize-pilot.js` + `city-meta.json` + `build.py` combo ran 11 cities without bespoke per-city adjustments — the pattern is stable.
5. **Tool-call budget held** after the reviewer inline-edited city-scout.js to add the per-agent 25-call cap: subsequent agents went from Toronto's irregular 14–43 call spread to a tight 21–24 range.

## What needs fixing before the next wave
1. **Hardest remaining bug: Kraftwerk/assembly race.** Impact Hub Kraftwerk's evidence fetch landed *after* the agent returned the venue — the normalize drop was correct but wasteful. Fix: normalize should retry the evidence log once before dropping, OR the agent must block on each fetch's evidence receipt before returning.
2. **Some closures annotations are over-confident.** Barcelona 37 and Zurich 43 closures look suspiciously high; many are "fit/scope discards" misfiled as closures. Add the `closures` classifier (TOR's new dry-run) into `assemble_city_config.py` as standard: the `dropped:` prefix became the convention after Toronto's pilot but PostProcess never enforced it. Result: some footnotes say "closure" when they mean "wrong size" — a Lie-to-Children.
3. **README/plan drift is real.** The top-level README still sats "Venue Scout" while the site has rebranded to **ComputeCafe**, and the docs still point at Vercel while the live deploys likely moved. Add a `docs/README-unaligned` cleanup pass before wave 4.
4. **`configs/nyc/` vs `docs/pilots/new-york/` duplicate** — two dirs hold partially-overlapping NYC data. Add a canonicalization step: renames `docs/pilots/nyc/` → `docs/pilots/new-york/` (or vice versa) with a one-time migration + comment.
5. **Tour-sources doc currently sits as a lone reference** — the venue-scout's tour-facing skill copy doesn't mention tour-trace seeds. The ClawCon/Cafe Cursor seeds in Stockholm/NYC show it works; add it to SKILL.md's Step 1.5 directly.
6. **No long-horizon agent "review" mode.** You asked "should we merge PRs 2 and 3?" — PR #2's a11y fixes went through the Tenki Reviewer, but PR #3 hasn't gotten a comparable automated review. Setup a `tenki-reviewer` trigger on any open PR that touches `skill/` or `docs/`.

## Recommended next moves
1. Merge PRs #5, #6, #7 in order (or merge wave-3 last since it's the biggest content delta).
2. Merge PR #4 (Tokyo) first if you haven't — it's already reviewed and approved.
3. Open PR #2's a11y-fix stack as its own issue; PR #3 asks a small follow-up commit I'd write next.
4. Add Amsterdam (the 12th remaining city) as wave 4, kicked off the same way. Amsterdam hasn't started yet.
5. (Optional cosmetic) The `/events/` from `0755fee` (rename to ComputeCafe) probably wants its own PR even though the four city-flip PRs ship first.

---
*% invoked 2026-08-06; onward.*
