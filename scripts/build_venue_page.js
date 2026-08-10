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
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZzrRCfZznMq3QhTRM=" crossorigin="">
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
body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--page);color:var(--ink-1);line-height:1.45;padding-bottom:40px}
.wrap{max-width:900px;margin:0 auto;padding:24px 20px}
header{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.crumbs a{color:var(--ink-3);text-decoration:none;font-size:12.5px;font-weight:600}
.crumbs a:hover{color:var(--ink-1)}
.crumbs span{color:var(--ink-3);font-size:12.5px}
.thbtn{font-size:12.5px;font-weight:600;color:var(--ink-3);background:var(--surface);border:1px solid var(--hairline);border-radius:8px;padding:6px 10px;cursor:pointer;margin-left:auto}
.thbtn:hover{color:var(--ink-1);border-color:var(--ink-3)}
.hero{position:relative;border-radius:16px;overflow:hidden;background:var(--surface);border:1px solid var(--hairline);box-shadow:var(--shadow);margin-bottom:22px}
.hero-imgbox{position:relative;aspect-ratio:16/9;overflow:hidden}
.hero-imgbox img{width:100%;height:100%;object-fit:cover;display:block;position:relative;z-index:1}
.ph{position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px}
.ph.t0{background:linear-gradient(135deg,var(--ph-a),var(--ph-b))}
.ph.t1{background:linear-gradient(135deg,var(--ph-c),var(--ph-d))}
.ph.t2{background:linear-gradient(135deg,var(--ph-e),var(--ph-f))}
.ph .mono{font-size:3.2rem;font-weight:700;letter-spacing:.04em;color:var(--ink-2);opacity:.85}
.ph .icn{font-size:2rem}
.toppick{position:absolute;top:10px;left:10px;z-index:3;font-size:11px;font-weight:700;background:rgba(11,11,11,.78);color:#fff;padding:4px 9px;border-radius:999px;backdrop-filter:blur(4px)}
.areatag{position:absolute;bottom:10px;left:10px;z-index:3;font-size:11px;font-weight:600;background:rgba(11,11,11,.62);color:#fff;padding:3px 9px;border-radius:999px;backdrop-filter:blur(4px)}
.title-block{padding:18px 20px 14px}
.vrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.vname{font-size:1.65rem;font-weight:700;letter-spacing:-.02em}
.typechip{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;flex:none}
.typechip.t0{color:var(--accent-a);background:var(--accent-a-soft)}
.typechip.t1{color:var(--accent-b);background:var(--accent-b-soft)}
.typechip.t2{color:var(--accent-c);background:var(--accent-c-soft)}
.flag{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:4px 10px;border-radius:7px;align-self:flex-start}
.flag.dedicated{color:var(--good);background:var(--good-soft)}
.flag.contact{color:var(--ink-2);background:var(--page);border:1px solid var(--hairline)}
.facts{padding:0 20px 18px;display:flex;flex-direction:column;gap:8px}
.facts .addr{font-size:13px}
.facts .addr a{color:var(--ink-3);text-decoration:none}
.facts .addr a:hover{color:var(--ink-1);text-decoration:underline}
.facts .cap{font-size:13px;color:var(--ink-2)}
.facts .cap b{color:var(--ink-1);font-weight:600}
.about{padding:14px 20px 16px;border-top:1px solid var(--grid)}
.about .note{font-size:14px;color:var(--ink-2);max-width:80ch}
.about .note b{color:var(--ink-1)}
.bar{position:sticky;bottom:0;background:rgba(var(--page),.95);backdrop-filter:blur(8px);border-top:1px solid var(--grid);padding:12px 20px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;z-index:10}
.bar .btn{font-size:12.5px;font-weight:600;text-decoration:none;padding:8px 14px;border-radius:8px;display:inline-flex;align-items:center;gap:4px}
.bar .btn.pri{background:var(--ink-1);color:var(--page)}
.bar .btn.pri:hover{opacity:.85}
.bar .btn.sec{color:var(--ink-2);border:1px solid var(--hairline)}
.bar .btn.sec:hover{color:var(--ink-1);border-color:var(--ink-3)}
.bar .starh{display:inline-flex;align-items:center;gap:4px;font-size:13px;border:none;background:transparent;cursor:pointer;color:var(--ink-3)}
.bar .starh .star{font-size:16px}
.bar .starh.on{color:var(--good)}
.bar .starh .cnt{font-size:12.5px;font-weight:600}
.mini-map{margin-top:16px;padding:0 20px 20px}
.map-label{font-size:12.5px;font-weight:600;color:var(--ink-2);margin-bottom:6px}
.map-frame{border-radius:12px;overflow:hidden;border:1px solid var(--hairline);background:var(--surface)}
.map-frame img{width:100%;display:block}
.map-caption{font-size:12px;color:var(--ink-3);padding:8px 10px;text-align:center}
.sibs{margin-top:16px;padding:0 20px 20px}
.sibs h3{font-size:14px;font-weight:700;margin-bottom:10px;color:var(--ink-2)}
.sibling{display:flex;gap:12px;align-items:center;padding:10px;border-radius:10px;border:1px solid var(--hairline);text-decoration:none;color:var(--ink-1);background:var(--surface);margin-bottom:8px}
.sibling:hover{border-color:var(--ink-3)}
.sibling .thumb{width:56px;height:40px;border-radius:8px;overflow:hidden;flex:none;background:var(--grid)}
.sibling .thumb img{width:100%;height:100%;object-fit:cover}
.sibling .mono{font-size:20px;font-weight:700;letter-spacing:.04em;color:var(--ink-2);opacity:.85;display:flex;align-items:center;justify-content:center;height:100%}
.sibling .stxt{flex:1}
.sibling .sname{font-size:14px;font-weight:700}
.sibling .sarea{font-size:12px;color:var(--ink-3)}
footer{margin-top:34px;border-top:1px solid var(--grid);padding:18px 0 0;display:flex;flex-direction:column;gap:12px}
.fnote{font-size:13px;color:var(--ink-2);max-width:90ch}
.prov{font-size:11.5px;color:var(--ink-3)}
@media (max-width:680px){
  .wrap{padding:14px 12px}
  .vname{font-size:1.35rem}
  .bar{padding:10px 12px}
  .ph .mono{font-size:2rem}
}
</style>
</head>
<body>
<div class="wrap">
  <header class="crumbs">
    <a href="/">Home</a> <span>/</span>
    <a href="{{CITY_HREF}}">{{CITY_NAME}}</a> <span>/</span>
    <span style="color:var(--ink-2)">{{VNAME}}</span>
    <button class="thbtn" id="themebtn" onclick="cycleTheme()">◐ Theme</button>
  </header>

  <div class="hero">
    {{HERO_IMG}}
    {{TOP_PICK}}
    <div class="areatag">{{AREA}}</div>
  </div>

  <div class="title-block">
    <div class="vrow">
      <h1 class="vname">{{VNAME}}</h1>
      <span class="typechip {{TCLS}}">{{TYPE_ICON}} {{TYPE_LABEL}}</span>
      {{FLAG_HTML}}
    </div>
  </div>

  <div class="facts">
    <div class="addr">📍 <a href="{{GMAPS_URL}}" target="_blank" rel="noopener">{{ADDR}}</a></div>
    <div class="cap">{{CAP}}</div>
  </div>

  <div class="about"><div class="note">{{NOTE}}</div></div>

  <div class="bar" id="actionbar">
    <a class="btn pri" href="{{LINK}}" target="_blank" rel="noopener">{{LINK_TEXT}} ↗</a>
    {{EMAIL_BTN}}
    <button class="starh" data-k="{{VK}}" data-city="{{CITY_SLUG}}" id="starbtn"><span class="star">☆</span><span class="cnt"></span></button>
  </div>

  <div class="mini-map">
    <div class="map-label">📍 Location</div>
    <div class="map-frame">
      <div id="minimap" style="height:220px;pointer-events:none"></div>
      <div class="map-caption"><a href="{{GMAPS_URL}}" target="_blank" rel="noopener" style="color:var(--accent-b)">Open in Google Maps ↗</a></div>
    </div>
  </div>

  {{SIBLINGS}}

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
  const topPick = v.top ? '<div class="toppick">★ Top pick</div>' : "";
  const flagHtml = v.flag === "dedicated"
    ? '<span class="flag dedicated">✓ Dedicated events page</span>'
    : '<span class="flag contact">✉ Events contact only</span>';
  const emailBtn = v.email
    ? `<a class="btn sec" href="mailto:${v.email}">${v.email}</a>` : "";

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
    siblingHtml = '<div class="sibs"><h3>More in ' + v.area + '</h3>' +
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
          <div class="stxt"><div class="sname">${s.name}</div><div class="sarea">${stmeta.icon} ${stmeta.label}</div></div>
        </a>`;
      }).join("") + '</div>';
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
  html = html.replace(/{{FLAG_HTML}}/g, flagHtml);
  html = html.replace(/{{ADDR}}/g, v.addr);
  html = html.replace(/{{GMAPS_URL}}/g, mapsUrl(v));
  html = html.replace(/{{CAP}}/g, v.cap || "");
  html = html.replace(/{{NOTE}}/g, v.note || "");
  html = html.replace(/{{LINK}}/g, v.link);
  html = html.replace(/{{LINK_TEXT}}/g, v.linkText);
  html = html.replace(/{{EMAIL_BTN}}/g, emailBtn);
  html = html.replace(/{{SIBLINGS}}/g, siblingHtml);
  html = html.replace(/{{FOOTNOTES}}/g, (CONFIG.footnotes || []).map(f=>`<div class="fnote">${f}</div>`).join(""));
  html = html.replace(/{{PROVENANCE}}/g, CONFIG.provenance || "");

  html = html.replace("</head>", `<script type="application/ld+json">${jsonLd}</script>\n</head>`);

  /* interactive Leaflet mini-map */
  const minimapScript = `
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9OBZuCHqkPKPSkYyP0nwU=" crossorigin=""></script>
<script>
const mmap = L.map('minimap', { zoomControl:false, attributionControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false, boxZoom:false, keyboard:false, tap:false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}).addTo(mmap);
mmap.setView([${v.lat}, ${v.lng}], 15);
L.marker([${v.lat}, ${v.lng}]).addTo(mmap);
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
