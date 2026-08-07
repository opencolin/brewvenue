# BrewVenue — Multi-City Venue Research Plan

**Goal:** run the venue-scout pipeline across the remaining Builders & Brews: Hack Edition tour cities, producing a vetted, photo-rich venue explorer page per city on brewvenue.vercel.app — before each city's event window.

**Stack (per Colin):** Tavily for web search/extraction · Kimi K3 on Nebius Token Factory for inference · Tenki sandboxes to run the agents. All three are already tour partners, which makes this a nice dogfooding story: *the tour's venue pages were researched by agents running on the tour's own stack.*

---

## 1. Scope

| Wave | Cities | Event dates | Pages live by |
|---|---|---|---|
| 0 — Pilot | Toronto, London | Sep 29 / Sep 15 | Aug 12 (quality gate) |
| 1 — APJ | Tokyo, Seoul, Kuala Lumpur, Singapore | Sep 9–14 | Sep 1 |
| 2 — EMEA | Stockholm, Berlin, Tel Aviv, Zurich, Paris, Barcelona, Amsterdam | Sep 9–25 | Sep 5 |
| 3 — NA remainder | NYC, Boston (RSVP already live; venue pages still useful) | Sep 25 / Oct 2 | Sep 15 |
| 4 — Stretch (optional) | DC, Vilnius, Warsaw, Rome/Milan, Lisbon | TBD | if confirmed |

SF and LA are done (manual runs, live today). The pilot exists to tune prompts against the SF/LA quality bar before spending on 13 more cities.

## 2. What each city run must produce (the contract)

1. `venues.json` — 15–22 venues in the explorer schema (`k, name, area, type, addr, cap, flag, link, linkText, email, note, img, alt, top`), plus a `CONFIG` block (title, dates stat, neighborhood-analysis footnote, closed-venues footnote, provenance).
2. `evidence.jsonl` — one line per URL the agent fetched: URL, HTTP outcome, timestamp, what it was used for. **Any link that appears in venues.json must have a successful fetch in the evidence log.** This is the anti-hallucination contract, enforced by the harness, not by prompting alone.
3. `city/index.html` — assembled **deterministically by a build script** from venues.json + the venue-scout explorer template (no LLM in the build step; nothing to hallucinate).
4. A review card for a human: top picks, closures found, low-confidence items flagged.

Quality bar per city (from the venue-scout skill): every link verified · closed venues surfaced, not dropped · capacities marked published vs. estimate · ≥60% of cards with photos (fallback art covers the rest) · honest "too small" flags on seed venues.

## 3. Stack mapping

| Role | Tool | Notes |
|---|---|---|
| Agent runtime | **Tenki Sandbox** (disposable Linux VMs) | one sandbox per city run; clean env, killable, parallelizable |
| Inference | **Kimi K3** via Token Factory (OpenAI-compatible API) | open-weight frontier model built for long-horizon agentic work; up to 1M-token context means a whole city's research fits in one session without aggressive summarization |
| Search | **Tavily** `search` | neighborhood discovery, venue discovery, open/closed checks — supports country/language targeting for APJ + EMEA |
| Extraction | **Tavily** `extract` | verification fetches of events pages + photo-URL harvesting from page content (handles JS-rendered sites) |
| Spec | **venue-scout skill** (SKILL.md) | becomes the system prompt: research rules, verification gates, photo rules, schema |
| Build + deploy | template build script → **Vercel** (`brewvenue` project) | new `/city-slug/` route + front-page card flips from "Coming soon" to "Venue scout live" |
| Tracking | simple status dashboard (tenki-devrel-dashboard pattern) | per-city stage: framing → discovery → verify → photos → build → review → live |

## 4. Pipeline stages (per city)

1. **Frame** — establish the city's event geography first: where did recent tech/AI meetups, hackathons, and conference satellites actually cluster? (Luma city pages, recent event recaps, local tech-press.) Output: 3–4 target neighborhoods with a one-line rationale each — the city's equivalent of "SoMa near 2nd St."
2. **Discover** — per neighborhood × type (cafes / coworking / event spaces), Tavily-search for large, event-capable candidates. Dual-language queries where relevant (JP, KR, MS, SV, DE, HE, FR, ES, NL).
3. **Verify** — the core stage. For every candidate: Tavily-extract the events/booking page (must load and actually cover events), classify `dedicated` vs `contact` vs drop, check open status ("[venue] closed 2025/2026"), harvest capacity + published email. Closures go to a closed-list, never silently dropped. The harness rejects any venue whose link lacks an evidence-log entry.
4. **Photos** — from pages already extracted, pick one wide interior/patio shot per venue (venue's own CDN; skip logos/headshots); hotlink with the template's built-in fallback art. Skip robots-blocked sites.
5. **Build** — script assembles `index.html` from the template + venues.json. Deterministic; runs in the sandbox.
6. **QA** — a *fresh* K3 instance (no research context) adversarially re-checks a sample: does each flagged "dedicated" page really cover private events? Then a human skim — ideally the local Fellow/partner for that city, who can catch "that place closed last month" in 5 minutes.
7. **Ship** — merge to the brewvenue repo/deploy, flip the front-page card.

## 5. Why verification gets its own stage

The two manual runs are the argument. LA: five famous venues (NeueHouse Venice, Rose Café, Cross Campus, Philz SM, Interstellar) turned out closed. SF: three of eight seed venues had wrong locations in living memory (Motoring ≠ Russian Hill, TIAT ≠ SoMa, Bluestone's remembered locations don't exist), Vega Coffee was dead, and Blue Bottle Mint Plaza had closed. Every city will have its own versions of these. An agent that merely *searches well* will still ship dead links and closed venues; the evidence-log contract plus the adversarial QA pass is what makes the output trustworthy enough to put on a public page with the tour's name on it.

## 6. Harness sketch

- One repo: agent loop (OpenAI-compatible tool-calling against Token Factory) + tools `tavily_search`, `tavily_extract`, `save_finding`, `log_evidence` + the build script + the explorer template.
- Stage-scoped prompts (framing prompt, discovery prompt, verify prompt…) rather than one mega-prompt — keeps K3 on-task over a long run; budget ~250 tool calls per city with per-stage caps.
- Orchestrator (can literally be a cron/CI job) launches 3–5 Tenki sandboxes in parallel per wave, collects artifacts, posts review cards.
- Everything idempotent per city: re-running a city overwrites its JSON + page only after QA passes.

## 7. Rough cost per city (estimates — validate in the pilot)

- **Tavily:** ~200–300 calls (search + extract) per city, based on the SF run (~80 tool calls per research agent × 3 agents + verification batch).
- **Kimi K3:** ~3–8M tokens per city across stages + QA. At Token Factory's published K3 rates this is small money; both Tavily and Token Factory credits are already part of the tour program, so the marginal cost is likely ~zero.
- **Tenki:** one disposable VM per city for a few hours; negligible.
- **Wall-clock:** a city should complete in 1–3 hours; a full wave in an afternoon with parallel sandboxes.

## 8. Risks & mitigations

- **Hallucinated or dead links** → evidence-log contract + adversarial QA + human skim. Non-negotiable.
- **Non-English sources (APJ, parts of EMEA)** → dual-language Tavily queries; K3 is natively multilingual; local Fellow does the final skim.
- **Photo hotlink rot / blocking** → template's fallback art is automatic; prefer venue-CDN URLs; never block a ship on photos.
- **Agent drift over long runs** → stage-scoped prompts, tool-call budgets, deterministic build step outside the LLM.
- **Rate limits / API hiccups** → stagger waves, retry with backoff, sandboxes make partial re-runs cheap.
- **Venue data goes stale between research and event** → re-run the verify stage only (cheap) the week before each city's event; provenance line on every page shows the research date.

## 9. Definition of done (per city)

15–22 venues across 3 types in the city's real event neighborhoods · every link fetch-verified · closures listed · neighborhood analysis footnote answering "where should we host?" · photos or intentional fallbacks · local review sign-off · deployed at `/city-slug/` · front-page card flipped to "Venue scout live."

## 10. Immediate next steps

1. Stand up the repo + harness skeleton (agent loop, Tavily tools, evidence log, build script) — 1–2 days.
2. Port the venue-scout SKILL.md into stage prompts; wire the explorer template in as the build asset.
3. Pilot **Toronto** end-to-end in a Tenki sandbox; diff its output against the SF/LA pages; tune.
4. Pilot **London** (bigger, messier market) to stress discovery + verification.
5. Green-light Wave 1 (APJ) — the Sep 1 deadline is the binding constraint; work backward from it.

---
*Prepared Aug 7, 2026 · Companion assets: venue-scout skill (SKILL.md + explorer template), brewvenue.vercel.app repo/deploys, SF & LA venues.json extractable from the live pages.*
