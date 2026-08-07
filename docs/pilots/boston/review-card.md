# BrewVenue — Boston REVIEW CARD

**Run:** `boston` · 2026-08-07 · 2 neighborhoods × 2 types · 4 subagent cells (shared with New York run) · 10 venues shipped · in-session Claude Code subagents with tour-trace seeding (skill Step 1.5).
**Verdict up front:** contract held (10/10 links fetch-verified, validator 0 problems / 0 warnings), and the verify stage caught a live landmine — see §2. Ship with the §3 hand-checks.

## 1) Contract status

| Check | Result |
|---|---|
| Every shipped `link` has a successful fetch in `evidence.jsonl` | ✅ 10/10 |
| Schema (incl. `k`, `area`, `type`, `<b>` caps, caption alts, bare emails) | ✅ 0 problems — first run with the fixed pipeline; no normalize pass needed |
| Closures footnote | ✅ 1 genuine closure, fetch-backed; 9 discards kept as comments |
| Photos | 3/10 — below the 60% bar; venues here publish few hotlinkable interiors. Placeholder art covers the rest; a photo pass would help |

## 2) The District Hall adjudication (why verification gets its own stage)

The cowork cell shipped **District Hall (Seaport) as a top pick — "verified operating with 2026 bookings open."** The coffee cell independently found it **closed since winter 2023** (Boston Business Journal; Gather/Brew tenants closed Jan 2024 per Hoodline; still closed Sept 2025 per The Boston Guardian) and that **districthallboston.org is a compromised domain**. Post-run reconciliation fetch confirmed: the booking page still serves complete pre-closure content — capacities, hourly rates, request form — **plus injected Estonian casino spam** in the nav. A zombie site passed one agent's fetch-verification with years-stale data. Removed from venues, kept in closures with the news evidence; its image URL (on the compromised domain) was NOT hotlinked. **Pipeline lesson: a successful fetch of the venue's own site is necessary but not sufficient — closure sweeps must also run per venue, and cross-cell disagreement is a signal, not noise.**

## 3) Items a human should check before/while booking

- **Venture Café Cambridge vs CIC Cambridge** — same building/org (One Broadway). Kept as separate entries (weekly program + café floor vs rentable rooms) — one relationship covers both; don't double-book.
- **Microsoft NERD** — free hosting requires the event to be *free and open to public registration*; Mon–Sat only. Confirm the tour's format qualifies.
- **Caffè Nero Fort Point** — corporate store page is JS-rendered; details are directory-corroborated (Tripadvisor/Yelp to Oct 2025). Call the store for buyout terms.
- **Newlab** (NYC run has the same class of note) — paid rentals only.
- **Zero capacity published** for CIC Boston and Venture Lane — estimates marked; confirm headcount by inquiry.

## 4) Top picks

1. **The Engine (750 Main)** — the only Kendall room seating the full 200, purpose-built event theater, published capacities, non-resident bookable.
2. **Venture Café Cambridge** — the standing Thursday-Gathering crowd *is* the audience; 56 events / 11.5k attendees in 2025.
3. **George Howell (Godfrey Hotel)** — coffee-programming anchor downtown; dedicated location email.

## 5) Tour-trace outcomes (honest accounting)

ClawCon Boston + ElevenLabs hackathon venues are registration-gated (partner leads, not venues); AI Tinkerers' Microsoft NERD trace **landed a shipped venue**; CreativeMornings' trace surfaced the District Hall closure; Venture Café/CIC institutional traces produced the two Kendall anchors. Seeding worked — 4 of 10 shipped venues came from traces.

*Artifacts: `research.json` · `evidence.jsonl` (51 lines) · `boston_config_draft.js` (generated) · final config at `configs/boston_config.js` · page at `/boston/`.*


## Union pass (PR #9 resolution)

The wave-3 NYC/Boston regen proposed replacing these configs; review found it re-added District Hall (closed since winter 2023, adjudicated in this card) and dropped the confirmed host + curated entries. Resolution: **union** — the 10 curated entries stay as shipped, 19 net-new contract-passing venues from the wave research were appended (total 29), District Hall stayed excluded, and every addition required a successful fetch in the evidence log.
