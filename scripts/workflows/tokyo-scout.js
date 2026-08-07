export const meta = {
  name: 'tokyo-venue-scout',
  description: 'Tokyo venue-scout: frame → discover → verify with evidence log (bilingual JP/EN queries)',
  phases: [
    { title: 'Frame',   detail: 'neighborhood analysis (bilingual)' },
    { title: 'Discover', detail: 'one agent per neighborhood×type' },
    { title: 'PostProcess', detail: 'dedup + evidence assembly' },
  ],
};

/*
 * Stage 1: FRAME — establish Tokyo's real event geography before any venue search.
 * Result feeds the Discover fan-out.
 */
phase('Frame');
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
  `You are establishing the event geography for a September 9, 2026 Tokyo tech-week coffee/hack venue scout. Identify the 3-4 neighborhoods where the *actual* developer / AI / hackathon / startup events cluster in Tokyo 2025-2026 — not where blogs say, but where AI Tinkerers Tokyo, PyCon JP, Startup Lady Japan, Plug and Play, Antler, and bilingual dev meetups actually ran.
Use dual-language research (Japanese + English): 東京テク系イベント / 渋谷 AI ミートアップ / 六本木 スタートアップ / 恵比寿 coworking events / AI Tinkerers Tokyo / PyCon JP etc.
For each neighborhood: 1-line grounded rationale (what events happened there), plus "avoid_too" (too corporate, too hard to book, tiny venues, no event-capable cafes). List the URLs you relied on.`,
  { label: 'frame:tokyo', phase: 'Frame', schema: FRAME_SCHEMA }
);
log(`Framed Tokyo: ${frame.neighborhoods.map(n => n.name).join(' · ')}`);

/*
 * Stage 2: DISCOVER — fan out one agent per neighborhood × type. Use bilingual
 * queries; every URL must be fetched/extracted; evidence is emitted as the
 * "fetches" array.
 */
phase('Discover');
const TYPES = [
  { key: 'coffee',      label: 'Coffee shop' },
  { key: 'cowork/event', label: 'Coworking / event space' },
];
const CELLS = [];
for (const n of frame.neighborhoods) {
  for (const t of TYPES) CELLS.push({ neighborhood: n.name, type: t.key });
}

const VENUE_SCHEMA = {
  type: 'object',
  properties: {
    neighborhood: { type: 'string' },
    type: { type: 'string' },
    venues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          addr: { type: 'string' },
          cap: { type: 'string' },
          flag: { type: 'string', enum: ['dedicated', 'contact'] },
          link: { type: 'string' },
          linkText: { type: 'string' },
          email: { type: ['string', 'null'] },
          note: { type: 'string' },
          img: { type: ['string', 'null'] },
          alt: { type: 'string' },
          top: { type: 'boolean' },
        },
        required: ['name', 'addr', 'cap', 'flag', 'link', 'linkText', 'note', 'alt', 'top'],
      },
    },
    fetches: {
      type: 'array',
      items: {
        type: 'object',
        properties: { url: { type: 'string' }, outcome: { type: 'string', enum: ['success', 'fail'] }, used_for: { type: 'string' } },
        required: ['url', 'outcome', 'used_for'],
      },
    },
    closures: { type: 'array', items: { type: 'string' } },
  },
  required: ['neighborhood', 'type', 'venues', 'fetches', 'closures'],
};

const NONNEGOTIABLES = `
NON-NEGOTIABLE RULES (violate = rejected):
1. ONLY output a venue "link" URL if you successfully fetched that exact URL in THIS session via your search/extract tools. A 404'd URL is worse than none.
2. If the obvious events-page URL fails, search the venue's own site for the correct live one before giving up. If nothing fetches cleanly, use the main site you DID fetch and set flag="contact".
3. Flag closed venues to the "closures" array — never silently drop.
4. Capacities: published numbers first; estimates get a "~" prefix and "(est)" in the cap string.
5. Record every fetch/search target URL in "fetches" — both successes and failures. The harness needs this for the evidence log.
6. Tokyo venues are bilingual — search both Japanese and English (e.g., "Shibuya cafe private events" + "渋谷 カフェ 個室 イベント"), and confirm booking-language availability where visible.`;

const results = await pipeline(
  CELLS,
  (cell) =>
    agent(
      `You are a venue scout for the BrewVenue tour. Find 4-6 REAL venues in "${cell.neighborhood}", Tokyo, of type "${cell.type}" for a Sept 9, 2026 bilingual tech-week coffee/hack day (50-200 people, mixed JP/EN crowd).
Search in both languages (東京 + English), then extract/verify each candidate's own site. For each venue: name, exact address (with Japanese address if you can confirm), capacity, whether there's a DEDICATED private-events/buyout page (fetched and confirmed → "dedicated") or only a published events contact (→ "contact"), the exact URL you fetched, published events email, 1-2 line "why it works" note (bilingual where available), a wide interior/patio photo URL (venue CDN if possible), and top=true on at most ONE stand-out.
${NONNEGOTIABLES}`,
      { label: `discover:${cell.neighborhood}·${cell.type}`, phase: 'Discover', schema: VENUE_SCHEMA }
    ),
  (r, cell) => (r ? { ...r, cell: `${cell.neighborhood} · ${cell.type}` } : null)
);

const good = results.filter(Boolean);
phase('PostProcess');
log(`${good.length}/${CELLS.length} discovery cells returned`);

// dedup across cells by normalized name
const seen = new Set();
const venues = [];
for (const r of good) {
  for (const v of r.venues || []) {
    const k = (v.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (k && !seen.has(k)) { seen.add(k); venues.push({ ...v, _cell: r.cell }); }
  }
}
const evidence = [];
for (const r of good) for (const f of r.fetches || []) evidence.push({ stage: 'discover', cell: r.cell, url: f.url, outcome: f.outcome, used_for: f.used_for, ts: '2026-08-06' });
log(`${venues.length} unique venues, ${evidence.length} evidence rows`);

return {
  framing: frame,
  venues,
  evidence,
  closures: good.flatMap(r => r.closures || []),
};
