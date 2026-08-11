#!/usr/bin/env node
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_SITE = "https://brewvenue.vercel.app";

/* Inline the skeleton template. Build-time replacements are bracketed {{KEY}}. */
const SKELETON = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESC}}">
<link rel="canonical" href="{{CANONICAL}}">
<!-- Open Graph / Twitter -->
<meta property="og:title" content="{{TITLE}}">
<meta property="og:description" content="{{DESC}}">
<meta property="og:url" content="{{CANONICAL}}">
<meta property="og:type" content="place">
<meta property="og:image" content="{{OG_IMG}}">
<meta property="og:image:alt" content="{{ALT}}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{TITLE}}">
<meta name="twitter:description" content="{{DESC}}">
<meta name="twitter:image" content="{{OG_IMG}}">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root { color-scheme: light;
 --page: #f9f9f7; --surface: #fcfcfb; --ink-1: #0b0b0b; --ink-2: #52514e; --ink-3: #898781;
 --hairline: rgba(11,11,11,0.10); --grid: #e1e0d9;
 --accent-a: #eb6834; --accent-a-soft: rgba(235,104,52,0.12);
 --accent-b: #2a78d6; --accent-b-soft: rgba(42,120,214,0.12);
 --accent-c: #6f4fce; --accent-c-soft: rgba(111,79,206,0.12);
 --good: #0ca30c; --good-soft: rgba(12,163,12,0.10);
 --chip-on: #0b0b0b; --chip-on-ink: #fcfcfb;
 --ph-a: #f3e7dc; --ph-b: #e8d5c2; --ph-c: #dde8f3; --ph-d: #c9d9ec; --ph-e: #e7ddf3; --ph-f: #d6c8ec;
 --shadow: 0 1px 2px rgba(11,11,11,0.05), 0 4px 14px rgba(11,11,11,0.06);
}
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) {
    color-scheme: dark;
    --page: #0d0d0d; --surface: #1a1a19; --ink-1: #ffffff; --ink-2: #c3c2b7; --ink-3: #898781;
    --hairline: rgba(255,255,255,0.10); --grid: #2c2c2a;
    --accent-a: #d95926; --accent-a-soft: rgba(217,89,38,0.18);
    --accent-b: #3987e5; --accent-b-soft: rgba(57,135,229,0.18);
    --accent-c: #8f6ee8; --accent-c-soft: rgba(143,110,232,0.18);
    --good: #0ca30c; --good-soft: rgba(12,163,12,0.16);
    --chip-on: #ffffff; --chip-on-ink: #0d0d0d;
    --ph-a: #33281f; --ph-b: #453425; --ph-c: #1f2a38; --ph-d: #2a3a4e; --ph-e: #291f38; --ph-f: #382a4e;
    --shadow: 0 1px 2px rgba(0,0,0,0.4), 0 4px 14px rgba(0,0,0,0.35);
  }
}
:root[data-theme="dark"] {
 color-scheme: dark;
 --page: #0d0d0d; --surface: #1a1a19; --ink-1: #ffffff; --ink-2: #c3c2b7; --ink-3: #898781;
 --hairline: rgba(255,255,255,0.10); --grid: #2c2c2a;
 --accent-a: #d95926; --accent-a-soft: rgba(217,89,38,0.18);
 --accent-b: #3987e5; --accent-b-soft: rgba(57,135,229,0.18);
 --accent-c: #8f6ee8; --accent-c-soft: rgba(143,110,232,0.18);
 --good: #0ca30c; --good-soft: rgba(12,163,12,0.16);
 --chip-on: #ffffff; --chip-on-ink: #0d0d0d;
 --ph-a: #33281f; --ph-b: #453425; --ph-c: #1f2a38; --ph-d: #2a3a4e; --ph-e: #291f38; --ph-f: #382a4e;
 --shadow: 0 1px 2px rgba(0,0,0,0.4), 0 4px 14px rgba(0,0,0,0.35);
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--page);color:var(--ink-1);line-height:1.5;padding-bottom:48px}
.wrap{max-width:1020px;margin:0 auto;padding:28px 24px 0}
.kicker{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.crumbs{font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-3);display:flex;gap:8px;align-items:center}
.crumbs a{color:var(--ink-3);text-decoration:none}
.crumbs a:hover{color:var(--ink-1)}
.crumbs .sep{opacity:.5;font-weight:400}
.thbtn{margin-left:auto;font-size:11.5px;font-weight:600;color:var(--ink-2);background:none;border:1px solid transparent;border-radius:999px;padding:6px 14px;cursor:pointer;transition:border-color .15s,color .15s}
.thbtn:hover{color:var(--ink-1);border-color:var(--hairline)}
.hero{display:grid;grid-template-columns:5fr 6fr;border-radius:14px;overflow:hidden;background:var(--surface);box-shadow:var(--shadow)}
.hero-media{position:relative}
.hero-imgbox{position:relative;aspect-ratio:4/3;height:100%;overflow:hidden}
.hero-imgbox img{width:100%;height:100%;object-fit:cover;display:block;position:relative;z-index:1}
.ph{position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px}
.ph.t0{background:linear-gradient(135deg,var(--ph-a),var(--ph-b))}
.ph.t1{background:linear-gradient(135deg,var(--ph-c),var(--ph-d))}
.ph.t2{background:linear-gradient(135deg,var(--ph-e),var(--ph-f))}
.ph .mono{font-family:"Playfair Display",Georgia,serif;font-size:3.6rem;font-weight:600;letter-spacing:.06em;color:var(--ink-2);opacity:.9}
.ph .icn{font-size:1.9rem}
.toppick{position:absolute;top:14px;left:14px;z-index:4;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;background:rgba(9,8,7,.72);color:#fff;padding:6px 12px;border-radius:999px;backdrop-filter:blur(6px)}
.hero-meta{display:flex;flex-direction:column;gap:14px;padding:28px 30px;background:var(--surface)}
.arealine{font-size:10.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-3)}
.arealine .sep{opacity:.55;margin:0 .45em;font-weight:400}
.title-block{display:flex;flex-direction:column;gap:16px}
.lede{display:flex;flex-direction:column;gap:12px}
.vname{font-family:"Playfair Display",Georgia,"Times New Roman",serif;font-size:clamp(1.95rem,3.6vw,2.6rem);font-weight:600;letter-spacing:-.015em;line-height:1.08;color:var(--ink-1);overflow-wrap:break-word;hyphens:none}
.vname.long{font-size:clamp(1.5rem,2.9vw,2.05rem)}
.typechip{font-size:11px;font-weight:600;padding:4px 11px;border-radius:999px;flex:none;letter-spacing:.02em}
.typechip.t0{color:var(--accent-a);background:var(--accent-a-soft)}
.typechip.t1{color:var(--accent-b);background:var(--accent-b-soft)}
.typechip.t2{color:var(--accent-c);background:var(--accent-c-soft)}
/* on hero photos the tX accent tints are unreadable — override with a solid dark-glass pill */
.typechip.onhero,.typechip.onhero.t0,.typechip.onhero.t1,.typechip.onhero.t2{
  color:#fff;background:rgba(9,8,7,.62);border:1px solid rgba(255,255,255,.34);backdrop-filter:blur(6px)}
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px 20px;width:100%}
.facts .fact{min-width:0}
.flabel{display:block;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);margin-bottom:5px}
.facts .fact p{font-size:13.5px;line-height:1.5;margin:0}
.facts .fact p b{font-weight:600}
.facts .addr a{color:inherit;text-decoration:none;border-bottom:1px solid var(--hairline)}
.facts .addr a:hover{border-bottom-color:var(--ink-1)}
.pulse{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--good);margin-right:6px}
.act{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:18px 0 6px;border-top:1px solid var(--grid);width:100%;margin-top:auto}
.btn{display:inline-flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;padding:11px 18px;border-radius:999px;text-decoration:none;transition:background .15s,color .15s,border-color .15s,transform .15s;white-space:nowrap}
.btn .arr{transition:transform .15s;font-weight:400}
.btn:hover .arr{transform:translate(2px,-2px)}
.btn.pri{background:var(--ink-1);color:var(--page)}
.btn.pri:hover{opacity:.88}
.btn.sec{color:var(--ink-1);border:1px solid var(--hairline);background:var(--surface)}
.btn.sec:hover{border-color:var(--ink-3)}
.btn .ic{font-size:14px;line-height:1}
.starh{margin-left:auto;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--hairline);border-radius:999px;background:none;cursor:pointer;color:var(--ink-2);padding:8px 16px;font-size:13px;transition:border-color .15s,color .15s}
.starh:hover{border-color:var(--ink-3);color:var(--ink-1)}
.starh .star{font-size:15px;line-height:1}
.starh.on{color:var(--good);border-color:var(--good)}
.starh .cnt{font-size:12.5px;font-weight:600}
main section{padding:30px 0;border-top:1px solid var(--grid)}
.slabel{font-size:10.5px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--ink-3);margin-bottom:14px;display:flex;align-items:center;gap:10px}
.slabel::after{content:"";flex:1;height:1px;background:var(--grid)}
.about .note{font-size:15.5px;line-height:1.8;color:var(--ink-2);max-width:70ch}
.about .note>b:first-child,.about .note>b:first-of-type{color:var(--ink-1);font-family:"Playfair Display",Georgia,serif;font-weight:600;font-size:1.06em}
.about .note b{color:var(--ink-1)}
.map-track{max-width:340px}
.map-frame{border-radius:10px;overflow:hidden;border:1px solid var(--hairline);background:var(--surface)}
@media (prefers-color-scheme: dark){ :root:where(:not([data-theme="light"])) .map-frame .leaflet-tile{filter:brightness(.62) contrast(.92) saturate(.8)} }
:root[data-theme="dark"] .map-frame .leaflet-tile{filter:brightness(.62) contrast(.92) saturate(.8)}
.map-caption{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--ink-3);padding:9px 12px}
.map-caption a{color:inherit;text-decoration:none;border-bottom:1px solid var(--hairline)}
.map-caption a:hover{color:var(--ink-1);border-bottom-color:var(--ink-1)}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.gallery .gimg{position:relative;aspect-ratio:16/10;border-radius:8px;overflow:hidden;border:1px solid var(--hairline);background:var(--grid)}
.gallery .gimg img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}
.gallery .gimg:hover img{transform:scale(1.03)}
.sibs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.sibling{display:block;text-decoration:none;color:var(--ink-1);padding:0 0 14px;border-bottom:1px solid var(--hairline);transition:opacity .15s}
.sibling:hover{opacity:.75}
.sibling .thumb{position:relative;aspect-ratio:16/10;border-radius:8px;overflow:hidden;margin-bottom:10px;background:var(--grid)}
.sibling .thumb .ph{position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center}
.sibling .thumb .ph .mono{font-size:1.7rem}
.sibling .thumb img{position:absolute;inset:0;z-index:1;width:100%;height:100%;object-fit:cover;display:block}
.sibling .sname{font-family:"Playfair Display",Georgia,serif;font-size:1.02rem;font-weight:600}
.sibling .sarea{font-size:12px;color:var(--ink-3);margin-top:3px}
footer{margin-top:8px;padding:26px 0 6px}
.fnote{font-size:13px;line-height:1.75;color:var(--ink-2);max-width:72ch;margin-bottom:12px}
.fnote b{color:var(--ink-1);font-weight:600}
.prov{font-size:11px;letter-spacing:.08em;color:var(--ink-3);margin-top:6px}
@media (max-width:680px){
  .wrap{padding:18px 14px 0}
  .kicker{margin-bottom:14px}
  .hero{grid-template-columns:1fr;border-radius:12px}
  .hero-imgbox{aspect-ratio:16/9;height:auto}
  .hero-meta{padding:18px 18px 20px}
  .vname{font-size:1.75rem}
  .facts{grid-template-columns:1fr 1fr;gap:16px 14px}
  .act{gap:8px}
  .btn{width:100%;justify-content:center}
  .starh{margin-left:0;margin-top:8px}
  .ph .mono{font-size:2.2rem}
  .map-track{max-width:none}
}
</style>
</head>
<body>
<div class="wrap">
  <div class="kicker">
    <nav class="crumbs">
      <a href="/">ComputeCafe</a><span class="sep">/</span><a href="{{CITY_HREF}}">{{CITY_NAME}}</a>
    </nav>
    <button class="thbtn" id="themebtn" onclick="cycleTheme()">◐ Theme</button>
  </div>

  <div class="hero">
    <div class="hero-media">
      {{HERO_IMG}}
      {{TOP_PICK}}
    </div>
    <div class="hero-meta">
      <div class="lede">
        <div class="arealine">{{AREA}}<span class="sep">·</span>{{TYPE_LABEL}}</div>
        <h1 class="vname{{VNAME_LONG}}">{{VNAME}}</h1>
        <div><span class="typechip {{TCLS}}">{{TYPE_ICON}} {{TYPE_LABEL}}</span></div>
      </div>
      <div class="title-block">
        <div class="facts">
          <div class="fact"><span class="flabel">Address</span><p class="addr"><a href="{{GMAPS_URL}}" target="_blank" rel="noopener">{{ADDR}}</a></p></div>
          <div class="fact"><span class="flabel">Capacity</span><p>{{CAP}}</p></div>
          <div class="fact"><span class="flabel">Access</span><p>{{FLAG_ACCESS}}</p></div>
          <div class="fact"><span class="flabel">Status</span><p class="status">{{FLAG_STATUS}}</p></div>
        </div>
        <div class="act">
          <a class="btn pri" href="{{LINK}}" target="_blank" rel="noopener"><span class="ic">↗</span>{{LINK_TEXT}}</a>
          {{EMAIL_BTN}}
          <button class="starh" data-k="{{VK}}" data-city="{{CITY_SLUG}}" id="starbtn"><span class="star">☆</span><span class="cnt"></span></button>
        </div>
      </div>
    </div>
  </div>

  <main>
    <section class="about">
      <div class="slabel">Why it works</div>
      <div class="note">{{NOTE}}</div>
    </section>

    {{GALLERY}}

    <section>
      <div class="slabel">Location</div>
      <div class="map-track">
        <div class="map-frame">
          <div id="minimap" style="height:190px;pointer-events:none"></div>
          <div class="map-caption"><span>{{ADDR}}</span><a href="{{GMAPS_URL}}" target="_blank" rel="noopener">Directions ↗</a></div>
        </div>
      </div>
    </section>

    {{SIBLINGS}}
  </main>

  <footer>
    {{FOOTNOTES}}
    <div class="prov">{{PROVENANCE}}</div>
  </footer>
</div>

<script>
function cycleTheme(){
  const r=document.documentElement,
    c=r.getAttribute("data-theme"),
    n=c==="dark"?"light":c==="light"?"dark":(matchMedia("(prefers-color-scheme:dark)").matches?"light":"dark");
  r.setAttribute("data-theme",n);
}
/* star hydration */
const STAR_KEY=(c,k)=>'starred:'+c+':'+k;
(async()=>{
  const b=document.getElementById('starbtn'); if(!b)return;
  const k=b.dataset.k, city=b.dataset.city;
  try{localStorage.getItem(STAR_KEY(city,k))==='1' && b.classList.add('on');}catch(e){}
  try{
    const r=await fetch('/api/star-venue/'+encodeURIComponent(city)+'/'+encodeURIComponent(k));
    if(r.ok){
      const j=await r.json();
      b.querySelector('.cnt').textContent=j.newCount||j.count||0;
    }
  }catch(e){
    try{const c=(await(await fetch('/api/stars?city='+encodeURIComponent(city))).json()).find(x=>x.k===k)?.count||0;b.querySelector('.cnt').textContent=c;}catch(e2){}
  }
  b.addEventListener('click',async()=>{
    const key=STAR_KEY(city,k); let saved=false;
    try{saved=localStorage.getItem(key)==='1';}catch(e){}
    if(saved)return;
    try{localStorage.setItem(key,'1');saved=true;}catch(e){}
    b.classList.add('on');
    try{
      const r=await fetch('/api/star-venue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k,city})});
      const j=await r.json();
      if(j.ok&&j.newCount!=null)b.querySelector('.cnt').textContent=j.newCount;
    }catch(e){}
  });
})();
</script>
</body>
</html>`;

function initials(name){
  return name.replace(/[^a-zA-Z ]/g,"").split(" ").filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("");
}
function mapsUrl(v){
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(v.name + " " + v.addr);
}
function desc(v){
  const cap = (v.cap || "").replace(/<[^>]+>/g,"").replace(/"/g,"");
  const note = (v.note || "").replace(/<[^>]+>/g,"").replace(/"/g,"");
  const frag = (cap + ". " + note).slice(0,140);
  return frag + (frag.length >= 140 ? "…" : "");
}
/* Derive a short, area-scoped neighborhood note from the venues that share this
   venue's `area`. Uses only data on this venue's own cluster — never city-wide
   share stats — so a venue outside the core never inherits the core's analysis. */
function neighborhoodNote(v, VENUES, TYPE_META){
  const peers = VENUES.filter(x => x.area === v.area);
  if (!peers.length || !v.area) return "";
  const counts = {};
  peers.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
  const typeList = Object.entries(counts)
    .sort((a,b) => b[1]-a[1])
    .map(([t,n]) => {
      const lab = (TYPE_META[t]?.label || t).toLowerCase();
      return n > 1 ? `${lab}s` : lab;
    });
  const joinList = arr => arr.length <= 1 ? (arr[0]||"") : arr.length === 2 ? arr.join(" and ") : arr.slice(0,-1).join(", ") + ", and " + arr[arr.length-1];
  const n = peers.length;
  const scope = n === 1
    ? `${v.name} is the only listed venue we track in <b>${v.area}</b> right now.`
    : `<b>${v.area}</b> has <b>${n}</b> listed venue${n>1?"s":""} — ${joinList(typeList)}.`;
  // What the mix + bookability imply. `flag:dedicated` means the venue runs a
  // real rental program, so an all-dedicated cluster is a bookable-event area
  // even if several venues are typed as cafés.
  const dedicated = peers.filter(p => p.flag === "dedicated").length;
  const dom = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  let angle = "";
  if (n > 1) {
    const dlab = (TYPE_META[dom[0]]?.label || dom[0]).toLowerCase();
    if (dedicated === n) angle = `Every spot here runs a bookable events program — a cluster for hostable formats, not just drop-in tables.`;
    else if (dedicated / n >= 0.5) angle = `Most venues here are bookable, so this area suits hosting as much as casual working.`;
    else if (dom[0] === "coffee" || /coffee|café|cafe/.test(dlab)) angle = `The cluster leans toward drop-in, caffeinated work rather than bookable event floors.`;
    else if (/cowork/.test(dlab)) angle = `The cluster is coworking-weighted — reliable for structured work and small meetings.`;
    else if (/event/.test(dlab)) angle = `This cluster skews to bookable event formats — good if you need a program venue, less so for a quiet solo table.`;
  }
  const bits = [scope, angle].filter(Boolean).join(" ");
  return `<div class="fnote">${bits}</div>`;
}

function parseAddr(addr){
  const parts = addr.split(",").map(s=>s.trim()).filter(Boolean);
  const street = parts[0] || ""; const city = parts[parts.length-1] || "";
  const region = parts.length > 2 ? parts[parts.length-2] : "";
  const country = /\bJapan\b/i.test(addr) ? "JP" : /\bFranc\b/i.test(addr) ? "FR" : /\bGermany\b/i.test(addr) ? "DE" : /\bKorea\b/i.test(addr) ? "KR" : /\bIsrael\b/i.test(addr) ? "IL" : /\bSingapore\b/i.test(addr) ? "SG" : /\bMalaysia\b/i.test(addr) ? "MY" : /\bNetherlands\b/i.test(addr) ? "NL" : /\bSpain\b/i.test(addr) ? "ES" : /\bSweden\b/i.test(addr) ? "SE" : /\bSwitzerland\b/i.test(addr) ? "CH" : /\bUnited Kingdom\b/i.test(addr) ? "GB" : /\bCanada\b/i.test(addr) ? "CA" : /\bAustralia\b/i.test(addr) ? "AU" : /\bUSA\b/i.test(addr)||/\bUnited States\b/i.test(addr) ? "US" : "";
  return {street,city,region,country};
}

function build(cfgPath, citySlug, venueK, siteUrl){
  siteUrl = siteUrl || DEFAULT_SITE;
  const cfgFull = path.resolve(cfgPath);
  const src = fs.readFileSync(cfgFull, "utf8");
  const data = eval("(()=>{" + src + ";return {VENUES:typeof VENUES!=='undefined'?VENUES:null, CONFIG:typeof CONFIG!=='undefined'?CONFIG:null};})()");
  const VENUES = data.VENUES || data.CONFIG?.venues || [];
  const CONFIG = data.CONFIG || {};

  const v = VENUES.find(x => x.k === venueK);
  if (!v) throw new Error("Venue '" + venueK + "' not found in " + cfgPath);

  let TYPE_META = {};
  try{
    const tx = eval("(()=>{" + src + ";return typeof TYPE_META!=='undefined'?TYPE_META:null;})()");
    if (tx) TYPE_META = tx;
  } catch(e) {}
  if (!Object.keys(TYPE_META).length) {
    TYPE_META = { coffee: { label: "Coffee shop", icon: "☕" }, cowork: { label: "Coworking", icon: "🏢" }, event: { label: "Event space", icon: "✨" } };
  }

  const tmeta = TYPE_META[v.type] || { label: v.type, icon: "📍" };
  const typeKeys = Object.keys(TYPE_META);
  const tcls = "t" + (typeKeys.indexOf(v.type) % 3);

  const siblings = VENUES
    .filter(x => x.area === v.area && x.k !== v.k)
    .sort((a,b) => (b.top ? 1 : 0) - (a.top ? 1 : 0) || a.name.localeCompare(b.name))
    .slice(0,4);

  const cityName = (CONFIG.title || citySlug).replace(/\s*—.*/,"").replace(/\s*\|.*/,"").trim();
  const cityHref = "/" + citySlug + "/";

  const initialStr = initials(v.name);
  const heroImg = v.img
    ? `<div class="hero-imgbox"><img src="${v.img}" alt="${v.alt||''}" loading="eager" referrerpolicy="no-referrer"></div>`
    : `<div class="hero-imgbox"><div class="ph ${tcls}"><span class="icn">${tmeta.icon}</span><span class="mono">${initialStr}</span></div></div>`;
  const topPick = v.top ? '<div class="toppick">Top pick</div>' : "";
  const flagAccess = v.flag === "dedicated"
    ? 'Dedicated events page'
    : '! Events contact only';
  const flagStatus = v.flag === "dedicated"
    ? '<i class="pulse"></i>Open to bookings'
    : 'Contact before planning';
  const emailBtn = v.email
    ? `<a class="btn sec" href="mailto:${v.email}"><span class="ic">✉</span>Email</a>` : "";

  /* interactive Leaflet mini-map injected before </body> */

  const addrParsed = parseAddr(v.addr);
  const jsonLd = JSON.stringify({
    "@context":"https://schema.org","@type":"EventVenue",
    name:v.name, image: v.img || null,
    address:{"@type":"PostalAddress",streetAddress:addrParsed.street,addressLocality:addrParsed.city,addressRegion:addrParsed.region,addressCountry:addrParsed.country},
    geo:{"@type":"GeoCoordinates",latitude:v.lat,longitude:v.lng},
    url:v.link
  });

  let siblingHtml = "";
  if (siblings.length) {
    siblingHtml = '<section class="sibs"><div class="slabel">More in ' + v.area + '</div><div class="sibs-grid">' +
      siblings.map(s => {
        const stmeta = TYPE_META[s.type] || { label: s.type, icon: "📍" };
        const stcls = "t" + (typeKeys.indexOf(s.type) % 3);
        const smstrt = initials(s.name);
        const simg = s.img
          ? `<img src="${s.img}" alt="${s.alt||''}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : "";
        const sph = `<div class="ph ${stcls}"><span class="mono">${smstrt}</span></div>`;
        return `<a class="sibling" href="../${s.k}/">
          <div class="thumb">${simg}${sph}</div>
          <div class="sname">${s.name}</div>
          <div class="sarea">${stmeta.icon} ${stmeta.label} · ${s.area}</div>
        </a>`;
      }).join("") + '</div></section>';
  }

  /* optional photo gallery: every image beyond the primary `img` */
  let galleryHtml = "";
  const galleryImgs = Array.isArray(v.gallery) ? v.gallery.filter(Boolean) : [];
  if (galleryImgs.length) {
    galleryHtml = '<section><div class="slabel">Photos</div><div class="gallery">' +
      galleryImgs.map(g => {
        const gurl = typeof g === "string" ? g : g.src;
        const galt = (typeof g === "object" && g.alt) ? g.alt : (v.alt || v.name);
        return `<a class="gimg" href="${gurl}" target="_blank" rel="noopener"><img src="${gurl}" alt="${String(galt).replace(/"/g,'&quot;')}" loading="lazy" referrerpolicy="no-referrer"></a>`;
      }).join("") + '</div></section>';
  }

  const title = `${v.name} — ${cityName} · ComputeCafe`;
  const canon = `${siteUrl}/${citySlug}/${v.k}/`;
  const ogImg = v.img || `${siteUrl}/og-default.png`;

  let html = SKELETON;
  html = html.replace(/{{TITLE}}/g, title);
  html = html.replace(/{{DESC}}/g, desc(v));
  html = html.replace(/{{CANONICAL}}/g, canon);
  html = html.replace(/{{OG_IMG}}/g, ogImg);
  html = html.replace(/{{ALT}}/g, (v.alt || (v.name + " location")).replace(/"/g,"&quot;"));
  html = html.replace(/{{VNAME_LONG}}/g, v.name.length > 24 ? " long" : "");
  html = html.replace(/{{VNAME}}/g, v.name);
  html = html.replace(/{{VK}}/g, v.k);
  html = html.replace(/{{CITY_SLUG}}/g, citySlug);
  html = html.replace(/{{CITY_NAME}}/g, cityName);
  html = html.replace(/{{CITY_HREF}}/g, cityHref);
  html = html.replace(/{{HERO_IMG}}/g, heroImg);
  html = html.replace(/{{TOP_PICK}}/g, topPick);
  html = html.replace(/{{AREA}}/g, v.area);
  html = html.replace(/{{TYPE_ICON}}/g, tmeta.icon);
  html = html.replace(/{{TYPE_LABEL}}/g, tmeta.label);
  html = html.replace(/{{TCLS}}/g, tcls);
  html = html.replace(/{{FLAG_ACCESS}}/g, flagAccess);
  html = html.replace(/{{FLAG_STATUS}}/g, flagStatus);
  html = html.replace(/{{ADDR}}/g, v.addr);
  html = html.replace(/{{GMAPS_URL}}/g, mapsUrl(v));
  html = html.replace(/{{CAP}}/g, v.cap || "");
  html = html.replace(/{{NOTE}}/g, v.note || "");
  html = html.replace(/{{LINK}}/g, v.link);
  html = html.replace(/{{LINK_TEXT}}/g, v.linkText);
  html = html.replace(/{{EMAIL_BTN}}/g, emailBtn);
  html = html.replace(/{{SIBLINGS}}/g, siblingHtml);
  html = html.replace(/{{GALLERY}}/g, galleryHtml);
  /* A venue page shows only venue-scoped context. City-level footnotes
     (SoMa share stats, seed corrections, gone-bookable lists) stay on the
     city page. Instead we derive a fresh neighborhood note from this venue's
     own area + capacity mix so it never describes the wrong district. */
  html = html.replace(/{{FOOTNOTES}}/g, neighborhoodNote(v, VENUES, TYPE_META));
  html = html.replace(/{{PROVENANCE}}/g, CONFIG.provenance || "");

  html = html.replace("</head>", `<script type="application/ld+json">${jsonLd}</script>\n</head>`);

  /* interactive Leaflet mini-map */
  const minimapScript = `
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>
const mmap = L.map('minimap', { zoomControl:false, attributionControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false, boxZoom:false, keyboard:false, tap:false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}).addTo(mmap);
mmap.setView([${v.lat}, ${v.lng}], 15);
const dot = L.divIcon({ className:'', html:'<div style="width:10px;height:10px;border-radius:50%;background:var(--accent-a);box-shadow:0 0 0 2.5px var(--page),0 1px 4px rgba(0,0,0,.35)"></div>', iconSize:[10,10], iconAnchor:[5,5] });
L.marker([${v.lat}, ${v.lng}], {icon:dot}).addTo(mmap);
document.getElementById('minimap').addEventListener('click', () => window.open(${JSON.stringify(mapsUrl(v))}, '_blank'));
</script>`;
  html = html.replace("</body>", minimapScript + "\n</body>");

  const dest = path.join(ROOT, citySlug, v.k, "index.html");
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  fs.writeFileSync(dest, html, "utf8");
  console.log("wrote", dest);
}

const [_node,_script,cfgPath,citySlug,venueK,siteUrl] = process.argv;
if(!cfgPath || !citySlug || !venueK){
  console.error("Usage: node scripts/build_venue_page.js <config> <city-slug> <venue-k> [site-url]");
  process.exit(1);
}
build(cfgPath, citySlug, venueK, siteUrl);
