/*
 * city-scout.js — parameterized venue-scout pipeline (the pattern Tokyo and Toronto proved).
 * Frame → Discover (per neighborhood×type) → Verify → dedup
 * Neighborhood list is provided by the Frame step.
 */
export const meta = {
  name: 'city-scout',
  description: 'Parameterised venue-scout pipeline for one BrewVenue city',
  phases: [
    { title: 'Frame',    detail: 'grounded neighborhood analysis (bilingual where needed)' },
    { title: 'Discover', detail: 'one agent per neighborhood×type with bilingual queries' },
    { title: 'PostProcess', detail: 'dedup + evidence assembly' },
  ],
};

const CITY = args.city;          // e.g. "Seoul"
const EVENT_DATE = args.eventDate; // "Sep 11, 2026"
const CITY_SLUG = args.slug;     // "seoul"
const LANGUAGE_HINT = args.lang || '';  // bilingual hints: "Korean + English: UI calls, solo/saju/anniversarires…"
const NEIGHBORHOOD_CAP = args.neighborhoodCap || 3;
const TYPE_CELLS = args.types || ['coffee', 'cowork/event'];
const FOOD_FILTER = args.foodFilter || '';

const FRAME_SCHEMA = {
  type: 'object',
  properties: {
    event_date: { type: 'string' },
    neighborhoods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          rationale: { type: 'string' },
          avoid_too: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'rationale', 'avoid_too'],
      },
    },
    sources: { type: 'array', items: { type: 'string' } },
  },
  required: ['event_date', 'neighborhoods', 'sources'],
};
const frame = await agent(
  `You are establishing the event geography for a ${EVENT_DATE} ${CITY} tech-week coffee/hack venue scout. Identify ${NEIGHBORHOOD_CAP} neighborhoods where the *actual* developer / AI / hackathon / startup events cluster in ${CITY} 2025-2026 — not where blogs say, but where equivalents of AI Tinkerers, Cursor Café, CreativeMornings, PyCon JP, local accelerators, and bilingual dev meetups actually ran.
${LANGUAGE_HINT ? 'Search in both languages. ' : ''}Prioritize venues that support a bilingual 50–200 person coffee/hack day. ${FOOD_FILTER}
For each neighborhood: 1-line grounded rationale (what events happened there), plus "avoid_too" (too corporate, hard to book, tiny, no event-capable cafes). List the URLs you relied on.`,
  { label: `frame:${CITY}`, phase: 'Frame', schema: FRAME_SCHEMA }
);
log(`Framed ${CITY}: ${frame.neighborhoods.map(n => n.name).join(' · ')}`);

const CELLS = [];
for (const n of frame.neighborhoods.slice(0, NEIGHBORHOOD_CAP)) {
  for (const t of TYPE_CELLS) CELLS.push({ neighborhood: n.name, type: t });
}

const VENUE_SCHEMA = {
  type: 'object',
  properties: {
    neighborhood: { type: 'string' }, type: { type: 'string' },
    venues: {
      type: 'array', items: { type: 'object',
        properties: {
          name: { type: 'string' }, addr: { type: 'string' }, cap: { type: 'string' },
          flag: { type: 'string', enum: ['dedicated', 'contact'] }, link: { type: 'string' },
          linkText: { type: 'string' }, email: { type: ['string', 'null'], pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' }, note: { type: 'string' },
          img: { type: ['string', 'null'] }, alt: { type: 'string' }, top: { type: 'boolean' },
        },
        required: ['name', 'addr', 'cap', 'flag', 'link', 'linkText', 'note', 'alt', 'top'],
      },
    },
    fetches: {
      type: 'array', items: { type: 'object',
        properties: { url: { type: 'string' }, outcome: { type: 'string', enum: ['success', 'fail'] }, used_for: { type: 'string' } },
        required: ['url', 'outcome', 'used_for'],
      },
    },
    closures: { type: 'array', items: { type: 'string' } },
  },
  required: ['neighborhood', 'type', 'venues', 'fetches', 'closures'],
};

const RULES = `NON-NEGOTIABLE RULES:
1. ONLY output a venue "link" URL if you successfully fetched that exact URL this session via search/extract. 404s worse than none.
2. If an obvious events URL fails, search the venue's own site for the live one; else use a fetched main site with flag="contact".
3. Log closures to "closures" — never silently drop. A genuine closure must state the closure evidence ("closed <date> per <source>"); scope/fit rejections must start with "dropped:" instead.
4. Capacities: published first; estimates get "~" + "(est)". Bold the headline numbers with <b>…</b> (template convention), e.g. "~<b>80</b> seated / <b>120</b> standing (est)".
5. Record every fetch/search URL in "fetches" — success AND fail.
6. ${LANGUAGE_HINT ? 'Bilingual: ' + LANGUAGE_HINT : 'Bilingual queries if the city runs in two scripts (e.g., Korean + English).'}
7. "alt" = a short photo caption (noun phrase describing the image), never advice or prose. "email" = the bare address only, or null.
8. Budget: at most ~25 search/extract calls for this cell — prioritize verifying fewer venues over discovering more.`;

phase('Discover');
const results = await pipeline(
  CELLS,
  (cell) =>
    agent(
      `You are a venue scout for BrewVenue. In "${cell.neighborhood}", ${CITY}, find 4-6 REAL venues of type "${cell.type}" for a ${EVENT_DATE} bilingual tech-week coffee/hack day (50-200 people).
SEED FIRST from tour traces (skill/venue-scout/references/venue-sources.md): check Cafe Cursor, the ${CITY} AI Tinkerers chapter, ClawCon, ElevenLabs hackathon hosts, and the CreativeMornings chapter for venues in this neighborhood — a venue that hosted a builder event is a pre-vetted seed. Tag those fetches used_for "tour-trace seed via <series>" and give each seed a one-line room-shape fit note (a trace proves history, not fit or current existence — still verify its own site fresh).
Then search cold in both relevant languages, and extract/verify each candidate. For each: name (EN + local script if shown), exact address, capacity, dedicated events page ("dedicated") or published events contact ("contact"), exact URL you fetched, published events email, 1-2 line "why it works" note, a wide interior/patio photo URL (venue CDN if possible), top=true on at most ONE.
${RULES}`,
      { label: `discover:${cell.neighborhood}·${cell.type}`, phase: 'Discover', schema: VENUE_SCHEMA }
    ),
  (r, cell) => (r ? { ...r, cell: `${cell.neighborhood} · ${cell.type}` } : null)
);

const good = results.filter(Boolean);
phase('PostProcess');
log(`${CITY} discover: ${good.length}/${CELLS.length} cells returned`);

const RUN_TS = args.ts || '2026-08-06'; // pass per-run: Date.now() is unavailable in workflow scripts
const seen = new Set(); const venues = [];
for (const r of good) for (const v of r.venues || []) {
  const k = (v.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  if (k && !seen.has(k)) {
    seen.add(k);
    const [area, type] = [r.cell.split(' · ')[0], r.cell.split(' · ')[1]];
    // k stored (template/validator require it); no _cell leak — area+type carry the cell
    venues.push({ ...v, k, area, type: type === 'coffee' ? 'coffee' : 'cowork' });
  }
}
const evidence = [];
for (const r of good) for (const f of r.fetches || []) evidence.push({ stage: 'discover', cell: r.cell, url: f.url, outcome: f.outcome, used_for: f.used_for, ts: RUN_TS });
log(`${CITY}: ${venues.length} venues, ${evidence.length} evidence rows`);
return { framing: frame, venues, evidence, closures: good.flatMap(r => r.closures || []) };
