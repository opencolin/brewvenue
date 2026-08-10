# PRD — Venue Detail Pages

**Status:** Draft for review · 2026-08-10
**Owner:** Colin
**Scope:** ComputeCafe static site (opencolin/brewvenue, Vercel, `main`)

---

## 1. Problem & opportunity

Today every venue lives only as a **card** on one of 17 city index pages (e.g. `/new-york/`). A card shows: photo, name, type chip, address, one capacity line, a flag chip, a 1–2 line `note`, one outbound booking link, and an email button.

That's enough to *shortlist* but not to *decide*. The config already carries richer data that never renders — full address strings, flag semantics, alt-text — and our research pipeline (`docs/pilots/<city>/`, `evidence.jsonl`) holds even more (research notes, food/transport/pairing context) that currently never leaves the repo. Meanwhile each card is one among 19–35 on a long page: no deep-link, no per-venue SEO surface, no per-venue analytics.

**Opportunity:** give each of the 473 venues its own page — a shareable, indexable, linkable destination — while keeping the build 100% static and zero-runtime-backend.

## 2. Goals & success metrics

| # | Goal | Metric (post-launch, 30d) |
|---|------|---------------------------|
| G1 | Every venue is deep-linkable | 100% of 473 venues resolve at a stable URL; 0 404s from in-site links |
| G2 | Better decision support | Click-through rate from a detail page → outbound venue booking link ≥ card-level CTR baseline; ≥15% of city-page sessions reach ≥1 detail page |
| G3 | SEO surface | Detail pages indexed; impressions for "{venue} private events" queries appear in Search Console within 45 days |
| G4 | Zero regressions | City pages still build; filter→map sync, star voting, dark mode all unaffected; Lighthouse on a detail page ≥ 90 |

**Non-goals (explicit):** no booking engine, no user accounts, no reviews/comments, no real-time availability, no backend writes, no CMS. Stays a curated static directory. No per-venue photo galleries in v1 (single hero image only). No map-with-routing — static mini-map only.

## 3. Users

- **Event organizer** (primary): needs capacity, vibe, and a clear next step (booking link / events email) without wading through 30 other cards. Shares a link with a cofounder ("what about this one?").
- **Cofounder / approver** (secondary, often on mobile): opens a shared link cold; must get the picture + the ask in ≤ 5 seconds, above the fold.

## 4. Current state (measured)

- 17 city configs → 473 venues; 459 with `img`, 14 documented dead-ends (placeholder).
- Venue fields (union): `k, name, area, type, addr, cap, flag, link, linkText, email, note, img, alt, top, lat, lng`. `TYPE_META` has ≤3 types/city (coffee / cowork / event).
- Build: `scripts/build.py` splices a config into `skill/venue-scout/assets/explorer-template.html` between EDIT markers → `<slug>/index.html`. No sitemap, no canonical, no OG/Twitter meta today. Stars are fetched on the **city** page from `/api/stars?city=…` and rendered into `[data-k]` slots.
- Design tokens: full light/dark palette in `explorer-template.html` (`--page … --shadow`), reused verbatim.

## 5. Proposal

Generate one static page per venue at **`/<city>/<venue-k>/`** using a single new template + a new builder, driven 100% by existing config data (v1). Richer per-venue prose is an optional v1.1 data-enrichment, not required to ship.

### 5.1 Information architecture

```
/new-york/                       city explorer (unchanged)
/new-york/firstroundsonme/       venue detail (NEW)  ← stable, kebab from v.k
/new-york/brooklynroasting…/
```
- URL = `/{city-slug}/{venue-slug}/index.html`, where `venue-slug = v.k.toLowerCase().replace(/_/g,"-")` (and any residual non-alphanumerics stripped). Verified against all 473 configs: every `k` is ≤48 chars and `[a-z0-9_-]` only, so an underscore→hyphen pass yields a clean, URL-safe, unique slug for 472/473 venues.
- **Phase-0 prerequisite (data fix, blocks Phase A):** Amsterdam has **two venues sharing `k = "the_coffee_virus"`** (`@ A Lab` and `A Lab & Startup Village`). They must get distinct `k` values (e.g. `the_coffee_virus_a_lab`, `the_coffee_virus_startup_village`) before any Amsterdam detail page builds. Understandably the only in-city collision in the dataset.
- City slug mapping stays as today (`nyc → /new-york`, `sf → /san-francisco`, `la → /los-angeles`); venue slug nests under the built directory. `k` is currently not URL-exposed anywhere, so the Amsterdam rename + the slug-mapping rule are config-internal and change nothing on the live city pages.

### 5.2 Page anatomy (one template, `skill/venue-scout/assets/venue-template.html`)

Reusing the existing token palette. Sections top→bottom:

1. **Nav strip** — `← {City}` back link (to `/{city}/`), city kicker, dark-mode toggle.
2. **Hero** — full-width image (the venue's `img`; placeholder monogram when null) with `★ Top pick` + area tag overlays, exactly as the card.
3. **Title block** — `name`, type chip, `flag` chip ("✓ Dedicated events page" / "✉ Events contact only").
4. **Fact strip** (the decision row) — address (auto-linked to Google Maps), capacity line (with existing `<b>` markup), area, type.
5. **About / note** — the `note` prose, plus (v1.1) an optional longer `description`.
6. **Action bar (sticky on mobile)** — primary CTA = `link`/`linkText` ↗; secondary = `mailto:` when `email` present; star button (same `data-k`/`data-city` contract, counts fetched per-page).
7. **Mini map** — a **static OSM tile image** (single marker at `lat,lng`) wrapped in an "Open in Google Maps ↗" link. Zero-JS, no CDN, works with JavaScript disabled, fast first paint — the self-contained-page goal. No inline Leaflet.
8. **More in {area}** — up to 4 sibling venue cards (same city, same area, excluding self) → keeps users in the funnel and creates internal links.
9. **Footer** — same provenance/confirm-capacity copy as the city page.

### 5.3 SEO / sharing (this is the biggest delta from today)

Per page, generated at build time from config fields:
- `<title>{name} — {City} · ComputeCafe</title>`
- `<meta name="description">` = `cap` (stripped of tags) + first ~120 chars of `note`.
- OpenGraph + Twitter card: `og:title`, `og:description`, `og:image` = `img` (or an on-site placeholder when null), `og:url` = canonical.
- `<link rel="canonical">` to the absolute detail URL.
- **JSON-LD** schema.org `LocalBusiness`/`EventVenue`: name, address (parsed from `addr`), geo (`lat/lng`), image, url. *Address parsing is best-effort; omit subfields we can't derive reliably rather than emit wrong structured data.*

### 5.4 City-page integration

- Each card's title becomes a link: `<a class="vname" href="/{city}/{k}/">`. The whole `.imgbox` also links (large click target). Card stays otherwise identical.
- v1 keeps outbound behavior for the buttons (primary still goes to the venue's own site). Detail pages are an *addition*, not a funnel detour — cards remain scannable.
- **Slugbase + sitemap**: a new `scripts/build_all_venues.py` also writes `sitemap.xml` (all 473 detail URLs + 17 city pages + home) and each detail page holds the canonical — today there is no sitemap at all.

### 5.5 Build pipeline

- **New:** `skill/venue-scout/assets/venue-template.html` — a *partial* (head + body skeleton) with one `{{VENUE_JSON}}` + `{{CITY}}` injection point and EDIT markers, styling cloned from explorer tokens. No Leaflet CDN if we can inline the single-marker map (decision: inline a minimal Leaflet via the existing unpkg pattern used by the explorer, since pins already work there — consistent).
- **New:** `scripts/build_venues.py <config> <city-slug> <site-origin>` → loops `VENUES`, renders one page each into `<city-slug>/<v.k>/index.html`. Idempotent; safe to re-run.
- **Modify:** `scripts/build.py` (or a thin `build_all.py`) → after writing the city page, invoke the venue builder for that city so a single command rebuilds a city end-to-end.
- **Modify:** explorer template `card()` (done at template level so all 17 cities pick it up on next rebuild) to wrap title/image in the detail link.
- Existing gates unchanged: `validate_config.py`, `audit_coords.py` still run; add a venue-build smoke check (every built page contains its `og:url` and the venue name).

## 6. Data flow

```
configs/<city>_config.js ─┐
                          ├─► scripts/build.py ──► <city>/index.html  (cards now link out)
                          └─► scripts/build_venues.py ──► <city>/<k>/index.html ×n
                                                          (+ sitemap.xml, shared JSON-LD)
```
Stars: detail page calls `GET /api/stars?city=<slug>` once and fills its own `[data-k]` slot — same contract, no new endpoint. (Alternative: `POST /api/star` from the detail page with the same body — same handler, no API change.)

## 7. Detailed functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Every venue in every config builds a page at `/{city}/{v.k}/` returning 200 | P0 |
| FR2 | Page renders all 11 populated fields; missing `img`/`email` degrade gracefully (placeholder / no mailto) | P0 |
| FR3 | OG/Twitter/canonical/JSON-LD emitted per page from config | P0 |
| FR4 | City cards link title + image to the detail page; no other card change | P0 |
| FR5 | Sticky action bar on ≤760px width; CTA + mailto + star reachable without scrolling | P1 |
| FR6 | "More in {area}" shows up to 4 same-area siblings, stable order (top picks first) | P1 |
| FR7 | `sitemap.xml` regenerated listing all detail + city URLs | P1 |
| FR8 | `python3 scripts/build_all.py` rebuilds all 17 cities + 473 detail pages + sitemap in one command | P1 |
| FR9 | Dark mode fully supported (reuse explorer tokens + toggle) | P0 |
| FR10| Star voting works on detail page (same `data-k` contract) | P2 |
| FR11| Optional `description` field (longer prose) renders when present, falls back to `note` | P2 (v1.1) |
| FR12| BreadcrumbList JSON-LD (home › city › venue) | P2 |
| FR13| Static OSM tile for the mini-map, wrapped in "Open in Google Maps ↗"; no Leaflet on detail pages | P1 |
| FR14| Builder auto-prunes orphan `<city>/<k>/` dirs and logs each delete | P1 |
| FR15| `booking_click {city,k}` event fires on primary CTA + mailto (Vercel WA custom event or a tiny inline beacon) | P2 |

## 8. Edge cases

- **`img: null` (14 venues)** → placeholder monogram hero (existing pattern), *omit* `og:image` or point to a generic on-site placeholder asset rather than hotlinking nothing.
- **`email: null`** → no mailto button (First Round's on Me today).
- **Duplicate `k` across cities** → fine (slug nests under city). Enforce uniqueness *within* a city at build time — currently violated once (Amsterdam `the_coffee_virus`, see 5.1); after the Phase-0 fix the builder hard-fails on any collision so regressions can't ship.
- **JS-disabled** → page must be fully readable server-rendered; map degrades to an address + "Open in Maps" link (Leaflet enhancement only).
- **Stale detail page after a venue is removed from a config** → builder **auto-prunes**: any `<city>/<k>/` dir whose `k` is no longer in the config is deleted during build, one log line per removal. Removals become clean 404s rather than lingering zombies.
- **`addr` already contains parenthetical qualifiers** ("(Chelsea)", "(Navy Yard edge)") → address shown verbatim; JSON-LD address field strips parentheticals.

## 9. Analytics

Today the site runs **only Vercel Web Analytics** — automatic pageviews, no custom events. To make G2 measurable, the detail template emits two lightweight events:
- `detail_view { city, k }` — fires once on load (or is inferred from pageview, since the URL already encodes `/{city}/{k}`).
- `booking_click { city, k }` — fires on the primary CTA (outbound venue `link`) and on mailto.
`detail_view` can be derived from URL alone; `booking_click` genuinely needs a click event — one tiny inline script, no new vendor, keeps console clean. If we defer instrumentation we ship detail pages with pageviews only and mark G2 "unmeasured."

## 10. Rollout

0. **Phase 0 (data, blocks everything):** disambiguate Amsterdam's duplicate `the_coffee_virus` keys; add a build-time per-city slug-uniqueness assertion. Tiny config-only change, no live-page impact.
1. **Phase A (one city, NYP):** hand-build `venue-template.html`, wire `build_venues.py`, generate `/new-york/*` (35 venues), verify Lighthouse + OG previews + one real share, star-vote round-trip.
2. **Phase B (all cities):** generalize via `build_all.py`, template change to `card()`, rebuild 17 cities + 473 pages, regenerate sitemap, submit to Search Console.
3. **Phase C (v1.1, optional):** enrich top ~50 venues with `description`; consider multi-photo galleries only if Phase A/B show detail pages earning traffic.

**Risks:** 473-page build time (trivial — string templating, no network); template drift between explorer & venue pages (mitigate: single shared CSS/JS partial or a build-time include); SEO thin-content flag if pages are near-identical (mitigate: FR11 prose + unique JSON-LD).

## 11. Decisions (locked 2026-08-10)

1. **URL shape** → **nested `/{city}/{venue}/`** (not `/venue/{city}--{venue}`). Reads naturally, sitemap stays per-city.
2. **Detail mini-map** → **static OSM tile image + external "Open in Maps" link.** Zero-JS, no CDN, JS-disabled safe.
3. **Orphan dirs** → **builder auto-prunes + logs each delete** (stale venues become clean 404s, no zombies).
4. **Analytics** → **Vercel Web Analytics only today; add a minimal `booking_click` click event** so G2 is measurable. `detail_view` comes for free from the URL-encoded path.

*Resolved during research (were open questions in the draft):*
- ~~`k` slug safety~~ → all 473 `k` values are `[a-z0-9_-]` and ≤48 chars; an `underscore→hyphen` slug pass is sufficient. The one in-city dupe (Amsterdam `the_coffee_virus`) became the Phase-0 data fix.
