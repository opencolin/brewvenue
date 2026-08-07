# BrewVenue — Toronto dry-run REVIEW CARD

**Run:** `toronto-dryrun` · 2026-08-06 · scope **2 of 3** neighborhoods (King West/Liberty Village, Queen West; Downtown/MaRS core cut to cap tool calls) · 16 candidate venues · 4 discovery agents · 103 tool calls · ~328k tokens.
**Verdict up front:** the *harness* works — the evidence-log contract fired correctly and normalization is mechanical — but the *discovery schema has a real bug* and **two "top picks" are not trustworthy**. Do not ship any of this as a public page yet.

---

## 1) Contract status

| Check | Result |
|---|---|
| Every shipped `link` has a successful fetch in `evidence.jsonl` | ✅ 16/16 pass |
| Required schema fields present after normalize (`k,name,area,type,addr,cap,flag,link,linkText,email,note,img,alt,top`) | ✅ 0 problems |
| Internal `_cell` field leaked into venue objects | ⚠️ was present in raw output; stripped in normalize |
| `alt` = photo caption (not advice/prose) | ⚠️ 4 violations in raw output; fixed in normalize |
| `cap` numbers `<b>`-bolded | ⚠️ 0/16 raw; fixed in normalize |
| Closed venues surfaced, not dropped | ✅ 7 closures logged (see §4) |
| ≥60% of cards with photos | ❌ **7/16 = 44%** — under bar |
| `build.py` assembles a working `index.html` from this config | ⚠️ **not exercised** — see §5 bug |

**Net:** the anti-hallucination contract (the thing we actually built the harness for) **held**; the presentation-layer schema did **not** until a deterministic normalize pass. Add `k/area/type` to the agent's return schema and these warnings disappear upstream.

## 2) Top picks — as self-reported, with the honest caveats

1. **StartWell** (784 King St W) — dedicated, 150/suite → 300, espresso bar, real tech-event track record. ✅ most credible top pick; photo present.
2. **HotBlack Coffee** (245 Queen St W) — dedicated, 10–60, AV + licensed patio. ⚠️ cap tops out at **60**, below the 50–200 band's middle. Fine as a satellite, not a primary.
3. **Arvo Coffee — Liberty Village** — dedicated, cap "~50-300 (est; blog range)". ⚠️ that range comes from a *neighborhood blog*, not the venue — treat capacity as unverified. **Its `alt` field described Balzac's, a different café** — exactly the cross-contamination the verify stage exists to catch.
4. **The Great Hall** (1087 Queen St W) — dedicated, Main Hall 480. ⚠️ overshoots the brief and is a concert hall, not a coffee/hack room; likely mis-cast as a "top pick" for *this* event shape.

The skill's "top pick" contract ("use sparingly, ~5 max, should be the venue you'd actually book") is only solidly met by **StartWell**.

## 3) Items a human MUST re-check before this becomes a real page

- **Arvo capacity** — replace blog-sourced "30–300" with the venue's own number (fetch `arvocoffee.com/pages/events` again; the homepage 404'd mid-run but the events page fetched on retry).
- **"The Beaver (1192 Queen St W) — permanently closed"** — the closure claim rests on the agent's search, not a fetched source in `evidence.jsonl`. Confirm before publishing the footnote; it's the *kind* of closure fact the skill wants, but it needs an evidence line.
- **HotBlack "reopened May 2025 under new ownership"** — verify the operator identity is stable (events program depends on it).
- **Chloe Cafe** is **http-only** (both https variants failed). Keep with `flag:contact` + a "site is http-only" caveat, or drop. Lean: drop for link-hygiene consistency (repo rule is https).
- **iQ Offices capacities** (250/300) come from a **Cvent third-party listing**; the venue's own capacity PDFs 404'd twice. Mark `(3rd-party est)` or re-source.

## 4) Closures / "don't route inquiries here" (footer)

The Roastery (Liberty Village) · Coffee Oysters Champagne (214 King W, rebranding) · Dark Horse 64 Bathurst (COMING SOON, not open) · Project Spaces King West (consolidated to Camden) · The Beaver (Queen W) · The Welcome Studios (domain parked) · Workplace One Queen West (too small) · BarChef (fetch failed) · several out-of-neighborhood discards.

## 5) Bugs the dry-run caught in the harness itself (fix before next city)

1. **Discovery agent schema omits `k`, `area`, `type`** — the three fields the explorer template *requires* for chips/sections. Add them to `SCHEMA` (derive `area` from the cell prompt, `type` from the cell, `k` as a slug). **Highest-impact fix.**
2. **`assemble_city_config.py` emits raw JSON (`json.dumps`)** for VENUES, not the repo's hand-written JS shape — fine for data, but if the goal is "byte-similar to SF/LA configs," emit the same literal style with unquoted keys.
3. **Photo stage underrecruited** (44% < 60%) because `img` was folded into the same agent that was busy verifying links. Give photos their own stage (as the plan actually specifies — stage 4).
4. **No per-cell tool-call budgeting** observed — King West cowork/event burned 37 calls vs Queen West cowork/event's 14. The plan calls for per-stage caps; enforce them in the agent loop.

## 6) Recommended next moves

- **Fix the schema bug** (one-line-ish change to the workflow's `SCHEMA` + a `k` slug instruction), re-run the two King West cells photos-first to lift coverage past 60%, then *and only then* run the Downtown/MaRS cell to complete the third neighborhood.
- Keep `scripts/validate_config.py` as the standing quality gate between research and `build.py` — it earned its place today.
- Full Toronto for real is ~1 more hour of agent time away once the schema is fixed; the framing + closures work already done is reusable.

---

## 7) Post-run fixes (applied after this card was written)

- **Closures footnote contamination (missed above):** the generated config's "Gone" footnote had concatenated genuine closures with the cells' scope/fit drop notes — including StartWell, the #1 top pick. `assemble_city_config.py` now splits `dropped:`-marked entries into a JS comment block for this card; only real closures ship in the footnote.
- **StartWell address reconciled:** venue record (784 King St W) confirmed against startwell.co's own contact section (building spans 782–786, which explains the Queen West cell's 786); drop note corrected, fetch logged to `evidence.jsonl`.
- **Closure claims now require fetched sources:** the assembler annotates any closure lacking a successful URL fetch (search-snippet lines don't count) as `[UNVERIFIED]` in the footnote. Current state: 5 of 6 closures are fetch-backed; only **The Beaver** remains unverified (§3's item stands).
- **Artifacts relocated** from `tmp/toronto-dryrun/` (now gitignored) to `docs/pilots/toronto/`.

*Artifacts: `framing.md` · `evidence.jsonl` (99 lines) · `research.json` (raw) · `venues.normalized.json` (template-ready) · `toronto_config.js` (DRY RUN — not shippable) · this card.*
