#!/usr/bin/env node
/*
 * normalize-pilot.js — deterministic config generator from a pilot's research.json.
 * Emits configs/<slug>_config.js that scripts/build.py can consume.
 * Applies Tokyo's normalize: drop-by-contract failures, fix prose-in-alt, bold cap numbers,
 * map area/type, slug k, repair email strings. Repo-root safe to run from anywhere.
 */
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..');

const city = process.argv[2];
if (!city) { console.error('usage: normalize-pilot.js <slug>'); process.exit(1); }
const info = require(path.join(__dirname, 'city-meta.json'))[city];
if (!info) { console.error('no city-meta.json entry for ' + city); process.exit(1); }

const slug = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/).slice(0, 3).join('_');

function normalizeVenue(v) {
  const area = v.area || (v._cell ? v._cell.split(' · ')[0] : 'Downtown');
  const type = v.type || (v._cell && v._cell.includes('coffee') ? 'coffee' : 'cowork');
  let cap = String(v.cap || '').replace(/(^|[^\w])((?:up to |~)?\d[\d,+–—* ]*\d?)/, (m, p, n) => p + '<b>' + n.trim() + '</b>');
  let email = v.email || null;
  if (email && /\s/.test(String(email))) email = String(email).split(/\s/)[0];
  let alt = v.alt || '';
  if (/(^|\s)(if|e\.g\.|confirm|reach out|book |rather than|prefer|instead|but |—)/i.test(alt) && alt.length > 45) {
    alt = (v.name || 'venue') + ' interior';
  }
  return {
    k: slug(v.name || 'venue'),
    name: v.name, area, type, addr: v.addr, cap,
    flag: v.flag, link: v.link, linkText: v.linkText, email,
    note: v.note, img: v.img || null, alt,
    top: !!v.top,
  };
}

function ensureEvidenceOk(slugName, venues, dropNotes) {
  const evPath = path.join(REPO, 'docs/pilots', slugName, 'evidence.jsonl');
  const ok = new Set();
  if (fs.existsSync(evPath)) {
    for (const line of fs.readFileSync(evPath, 'utf8').split('\n')) {
      try { const rec = JSON.parse(line); if (rec.outcome === 'success') ok.add(String(rec.url).replace(/\/+$/, '')); } catch (e) {}
    }
  }
  return venues.filter(v => {
    const okv = ok.has(String(v.link || '').replace(/\/+$/, ''));
    if (!okv) dropNotes.push({ name: v.name, link: v.link });
    return okv;
  });
}

function emitConfig(slugName, meta, venues, rawN, drops) {
  const lines = [];
  lines.push("// Page copy — CONFIG + TYPE_META + VENUES");
  lines.push("const CONFIG = {");
  lines.push('  kicker: "' + city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ') + ' Tech Week · Venue Scout",');
  lines.push('  title: ' + JSON.stringify(meta.title) + ',');
  lines.push('  subtitle: ' + JSON.stringify(meta.subtitle) + ',');
  lines.push('  extraStat: ' + JSON.stringify(meta.extraStat) + ',');
  lines.push('  footnotes: [');
  for (const f of meta.footnotes) lines.push('    ' + JSON.stringify(f) + ',');
  lines.push('  ],');
  const provenanceStr = String(meta.provenance || '')
    .replace('{ev}', 'docs/pilots/' + slugName + '/evidence.jsonl')
    .replace('{rawN}', String(rawN))
    .replace('{keptN}', String(venues.length))
    .replace('{dropslist}', drops.length ? drops.map(d => d.name).join(', ') : 'none')
    .replace(/\{dropcount_l \? [^}]+\}/, drops.length ? drops.map(d => d.name).join(', ') : 'none');
  lines.push('  provenance: ' + JSON.stringify(provenanceStr) + ',');
  lines.push('};');
  lines.push('');
  lines.push('const TYPE_META = {');
  lines.push('  coffee: { label: "Coffee shop", icon: "☕" },');
  lines.push('  cowork: { label: "Coworking / event space", icon: "🏢" },');
  lines.push('};');
  lines.push('');
  lines.push('const VENUES = ' + JSON.stringify(venues, null, 2) + ';');
  return lines.join('\n') + '\n';
}

const researchPath = path.join(REPO, 'docs/pilots', city, 'research.json');
if (!fs.existsSync(researchPath)) { console.error('missing ' + researchPath); process.exit(1); }
const { venues: rawVenues } = JSON.parse(fs.readFileSync(researchPath, 'utf8'));

let venues = rawVenues.map(normalizeVenue);
const dropNotes = [];
venues = ensureEvidenceOk(city, venues, dropNotes);

fs.mkdirSync(path.join(REPO, 'configs'), { recursive: true });
const out = emitConfig(city, info, venues, rawVenues.length, dropNotes);
fs.writeFileSync(path.join(REPO, 'configs', city + '_config.js'), out);
console.log(`${city}: ${rawVenues.length} → ${venues.length} after contract (dropped: ${dropNotes.length ? dropNotes.map(d=>d.name).join(', ') : 'none'})`);
