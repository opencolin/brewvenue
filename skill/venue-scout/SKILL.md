---
name: venue-scout
description: Research and vet event venues in target neighborhoods, then ship a shareable, filterable venue-explorer web page with photos, capacities, and verified booking links. Use this skill whenever the user wants to find venues or spaces for hosting an event — a meetup, happy hour, all-day coworking event, launch party, offsite, dinner, conference satellite event — or asks "where can I host X in Y", wants a list of coffee shops / coworking spaces / bars / restaurants / rooftops suitable for events, asks about private-events pages or venue buyouts, or wants a venue guide, venue comparison, or venue shortlist for something like Tech Week, a hackathon, or a conference. Trigger even if they only ask for "a list" — the research-and-verify workflow is the core value; the explorer page is the default deliverable.
---

# Venue Scout

Turn "where should we host this?" into a vetted, shareable venue explorer. The
pipeline: clarify → research with verification → gather photos → build the
explorer page → deliver (artifact and, on request, a public URL).

The two failure modes this skill exists to prevent:

1. **Stale venues.** Event-space scenes churn fast — in one LA run, five famous
   venues (including NeueHouse Venice and the 45-year-old Rose Café) had closed
   within the previous year. A list with dead venues destroys user trust.
2. **Hallucinated links.** A "private events page" URL that 404s is worse than
   no link. Every URL in the deliverable must have been fetched successfully
   during the session.

## Step 1 — Frame the search

Extract or ask for (AskUserQuestion if the user is present; otherwise state
assumptions and proceed):

- **Where**: city + specific neighborhoods (default to the 2-3 neighborhoods
  most associated with the user's scene if unstated)
- **What kind of venues**: coffee shops, coworking, bars, restaurants,
  rooftops, galleries… (the explorer supports any 2-3 venue types)
- **Event shape**: headcount range, all-day vs evening, vibe (this drives the
  "why it works" note on every card)

Defaults that served well: ~50-200 attendees, 5-8 venues per neighborhood/type
combination, ranked best-first.

## Step 1.5 — Seed from tour traces (before cold discovery)

Global tech-event tours and chapter networks have already solved "find a
hackable café in this city" — and their past event pages *name the venues*. A
venue that hosted a 50-300 person builder event is a pre-vetted seed: proven
capacity, proven willingness to host, proven tech-crowd fit. The event page
itself is stronger capacity evidence than the venue's own marketing copy, and
it also feeds Step 1's framing (where events actually clustered beats where a
blog says they should).

Work `references/venue-sources.md` top-down before any cold search:

1. **Tier 0 — our own history** (Dabl Club past events on Luma): venues
   already used, hosts already known. Harvest first, always.
2. **Tier 1 — AI-builder tours** (Cafe Cursor, ElevenLabs Worldwide
   Hackathon, AI Tinkerers chapters, ClawCon, Lovable, Supabase meetups):
   same event shape as ours — check each series' calendar for the target city.
3. **Tier 2/3 — venue-native series and meta-directories** (CreativeMornings,
   Luma Discover): right venue shape, broader crowd.

Rules: a tour trace is a **seed, never a verification bypass**. A trace
proves hosting *history*, not current existence — every seed still gets a
fresh fetch of the venue's own site/events page in Step 2 before it may ship
(venues close between tours). Log the event-page fetch like any other
evidence (`used_for: "tour-trace seed via <series>"`). Every seed carries a
one-line **room-shape fit note** — why it suits the ~50-200 coffee/hack
format, not just who hosted there (a web3 gala hall proved a crowd, not our
room). For non-EN cities, sweep the sources in the **local language** before
concluding no trace exists — the source list is English-first and
undercounts local scenes. Luma pages may hide the street address until
registration, but the venue *name* is public — enough to seed. A tour stop
at a sponsor's private office is a partner lead, not a venue, unless it's
publicly bookable.

## Step 2 — Research with verification (subagents)

Spawn one general-purpose subagent per neighborhood×type combination, in
parallel, so no single context drowns in fetched pages. Each agent uses
WebSearch/WebFetch (loaded via ToolSearch) and returns structured data, not
prose. Require from every agent, for every venue:

1. Name + street address
2. Suitability: capacity (published numbers when they exist, estimates clearly
   marked), layout (patio/rooftop/private room), why it works for this event
3. **Private-events flag**, one of:
   - `dedicated` — a real private-events/buyout/venue-hire page, **fetched and
     confirmed to load and to actually cover events**
   - `contact` — no dedicated page but a published events email/phone/form
   - plus the exact URL and any published email
4. Open-status check — search "[venue] closed [year]" when in doubt; collect
   closures separately (they become a "gone since last year" footnote that
   users love)
5. Any event-hosting history (shows the venue actually says yes — a tour
   trace from Step 1.5 satisfies this; cite the event page)

Non-negotiables to write into every agent prompt: *only output URLs you
fetched successfully; if a URL 404s, search the site for the right one; flag
closed venues rather than silently dropping them.* After agents return,
spot-check the headline URLs yourself with a parallel batch of WebFetch calls.

## Step 3 — Photos

Real photos make the explorer. In the cloud sandbox, direct image downloads
are usually blocked (egress proxy), so don't fight it:

- Get image URLs from page content: WebFetch's markdown conversion strips
  `og:image` meta tags but usually **preserves inline gallery/hero image
  URLs**. Have a subagent fetch each venue's page and pick the best wide
  interior/patio/storefront shot (skip logos, icons, headshots, menu
  closeups). Shopify/Squarespace/BentoBox CDN URLs are stable hotlink targets.
- **Hotlink** those URLs in the page and rely on the template's built-in
  placeholder fallback (`onerror` → styled monogram card) for anything that
  fails or was never found. Never let a broken-image icon appear.
- Respect robots-blocked sites — use a photo from a fetchable third-party
  article about the venue instead, or the placeholder.

## Step 4 — Build the explorer

Start from `assets/explorer-template.html` — a self-contained, validated
light/dark page with filter chips, card grid, placeholder art, and Google Maps
address links. Do not rebuild it from scratch; edit the two config blocks:

1. `CONFIG` — kicker, title, subtitle, footnotes (closed-venues warning,
   pairing tips), provenance line with today's date
2. `TYPE_META` + `VENUES` — venue objects as documented in the template
   comments. Area filter chips, type chips, and header stats all derive from
   the data automatically, so any city/venue mix works without touching markup.

Keep everything inline (no external CSS/JS/fonts, no localStorage) so the file
works as a Cowork artifact, an email attachment, and a static deploy alike.
Flag badges keep icon + text ("✓ Dedicated events page" / "✉ Events contact
only") — never color alone.

**Render-check before delivering**: screenshot with headless Chromium
(Playwright is preinstalled in Cowork sandboxes; `executablePath:
'/opt/pw-browsers/chromium'`) in light mode, dark mode, and with one filter
applied. Look for layout breaks and confirm placeholders show. Images won't
load in the sandbox — that's expected and actually verifies the fallback path.

## Step 5 — Deliver

1. `SendUserFile` the HTML (display: render).
2. Persist as a Cowork artifact via `mcp__remote-devices__create_artifact`
   with the returned file_uuid — a venue directory is revisit-by-nature.
3. In the final message: name the top picks and the one-line reason for each,
   note any famous venues that turned out closed, and mention capacities are
   confirm-when-booking.

**If the user wants it public/shareable** (or asks later): deploy to a public
URL and verify it. Read `references/publishing.md` for the Vercel flow and its
known failure modes (permission 403s, protected previews) before deploying.

## Quality bar

- Every venue: address, capacity (or marked estimate), flag with working link,
  1-2 line "why", photo or intentional placeholder
- Closed venues surfaced, not dropped
- Zero unverified URLs anywhere in the deliverable
- A "Sources" trail exists in conversation for the research claims
