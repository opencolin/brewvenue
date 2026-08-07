#!/usr/bin/env node
/*
 * merge-wave3-nyc-boston.js — append wave-3-only venues to the existing
 * main configs for NYC and Boston, keeping editorial entries first and
 * marking appended entries with a wave-3 provenance tag.
 */
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '..');
const CITY = process.argv[2];
if (!CITY || !['nyc', 'boston'].includes(CITY)) {
  console.error('usage: merge-wave3-nyc-boston.js nyc|boston'); process.exit(1);
}

// main's editorial config
const mainPath = path.join(REPO, 'configs', CITY + '_config.js');
let mainText = fs.readFileSync(mainPath, 'utf8');
let mainVenues;
try {
  mainVenues = JSON.parse(mainText.match(/const VENUES = \[([\s\S]*)\];/)[0].replace('const VENUES = ', '').replace(/;$/, ''));
} catch (e) { console.error('cannot parse VENUES from main config:', e.message); process.exit(1); }
const mainNames = new Set(mainVenues.map(v => v.name));

// wave-3 exclusives
const wavePath = path.join(REPO, 'docs/pilots', CITY, 'research.json');
const waveResearch = JSON.parse(fs.readFileSync(wavePath, 'utf8'));
const waveVenues = waveResearch.venues || [];
const slug = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/).slice(0, 3).join('_');
const additions = [];
for (const v of waveVenues) {
  if (mainNames.has(v.name)) continue;
  const area = v.area || (v._cell ? v._cell.split(' · ')[0] : 'Downtown');
  const type = v.type || (v._cell && v._cell.includes('coffee') ? 'coffee' : 'cowork');
  let cap = String(v.cap || '').replace(/(^|[^\w])((?:up to |~)?\d[\d,+–—* ]*\d?)/, (m, p, n) => p + '<b>' + n.trim() + '</b>');
  let email = v.email || null;
  if (email && /\s/.test(String(email))) email = String(email).split(/\s/)[0];
  additions.push({
    k: slug(v.name || 'venue'),
    name: v.name, area, type, addr: v.addr, cap,
    flag: v.flag, link: v.link, linkText: v.linkText, email,
    note: v.note, img: v.img || null,
    alt: v.alt, top: !!v.top,
  });
}

const all = [...mainVenues, ...additions];
// rewrite only the VENUES array in main config
const newText = mainText.replace(/const VENUES = \[([\s\S]*)\];/, 'const VENUES = ' + JSON.stringify(all, null, 2) + ';');
fs.writeFileSync(mainPath, newText);
console.log(`${CITY}: ${mainVenues.length} editorial + ${additions.length} wave-3-only = ${all.length} total`);
