#!/usr/bin/env node
/*
 * merge-wave3-nyc-boston.js — append wave-3-only venues to main's editorial
 * NYC/Boston config. Editorial VENUES text is kept verbatim (its strings use
 * conventions that don't survive JSON.parse); wave-3 additions append as JSON.
 */
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..');
const CITY = process.argv[2];
if (!CITY || !['nyc', 'boston'].includes(CITY)) { console.error('usage: merge-wave3-nyc-boston.js nyc|boston'); process.exit(1); }

const mainPath = path.join(REPO, 'configs', CITY + '_config.js');
const mainText = fs.readFileSync(mainPath, 'utf8');
const econMatch = mainText.match(/const VENUES = \[([\s\S]*)\];/);
if (!econMatch) { console.error('no VENUES block found'); process.exit(1); }
const econText = econMatch[1];
const mainNames = new Set([...econText.matchAll(/"name":\s*"([^"]+)"/g)].map(m => m[1]));

const waveResearch = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/pilots', CITY, 'research.json'), 'utf8'));
const slug = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/).slice(0, 3).join('_');
const additions = [];
for (const v of (waveResearch.venues || [])) {
  if (mainNames.has(v.name)) continue;
  const area = v.area || (v._cell ? v._cell.split(' · ')[0] : 'Downtown');
  const type = v.type || (v._cell && v._cell.includes('coffee') ? 'coffee' : 'cowork');
  const cap = String(v.cap || '').replace(/(^|[^\w])((?:up to |~)?\d[\d,+–—* ]*\d?)/, (m, p, n) => p + '<b>' + n.trim() + '</b>');
  let email = v.email || null;
  if (email && /\s/.test(String(email))) email = String(email).split(/\s/)[0];
  additions.push({
    k: slug(v.name || 'venue'),
    name: v.name, area, type, addr: v.addr, cap,
    flag: v.flag, link: v.link, linkText: v.linkText, email,
    note: v.note, img: v.img || null, alt: v.alt, top: !!v.top,
  });
}

// editorial text verbatim + JSONified additions, comma-separated
const appJson = additions.length ? ', ' + JSON.stringify(additions, null, 2) : '';
const newText = mainText.replace(/const VENUES = \[([\s\S]*)\];/, 'const VENUES = [' + econText + appJson + '];');
fs.writeFileSync(mainPath, newText);
console.log(`${CITY}: ${mainNames.size} editorial + ${additions.length} wave-3-only appended`);
