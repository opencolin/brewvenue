#!/usr/bin/env python3
"""Geocode the two JS-literal configs (sf, la) by round-tripping VENUES through Node.

sf/la configs use unquoted keys (`k:"..."`), so the JSON geocoder skips them.
This asks Node to dump each config's VENUES to JSON, geocodes venues missing
coords via Photon (shares geocode-cache.json), then hands k->[lat,lng] back to
Node which stamps `, lat: N, lng: N` right after that venue's `addr:"..."` value.
Idempotent (venues whose block already contains `lat:` are skipped).
"""
import json, os, re, subprocess, sys, time, urllib.parse, urllib.request

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
CACHE = os.path.join(os.path.dirname(__file__), "geocode-cache.json")
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
CITY_NAMES = {"sf": "San Francisco", "la": "Los Angeles"}
# Previously a definitive empty result was cached as None forever, which wedged
# 40+ venues that geocoded once against a bad query (usually the venue's display
# name prefixed to its address). Treat cached misses as retryable below.

DUMP_JS = """const fs=require('fs');
const src=fs.readFileSync(process.env.CFGPATH,'utf8');
const VENUES=eval('(()=>{'+src+';return VENUES;})()');
process.stdout.write(JSON.stringify(VENUES.map(v=>({k:v.k,name:v.name,addr:v.addr||'',hasCoord:!!(v.lat&&v.lng)}))));"""

# escape a literal for a JS regex, and apply per-key stamping
STAMP_JS = """const fs=require('fs');const cfgPath=process.env.CFGPATH,mapPath=process.env.MAPPATH;
const m=JSON.parse(fs.readFileSync(mapPath,'utf8'));
let s=fs.readFileSync(cfgPath,'utf8');let n=0;
const esc=x=>x.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&');
for(const [k,[lat,lng]] of Object.entries(m)){
 const re=new RegExp('(k:"'+esc(k)+'"[^]*?addr:"[^"]*")(?!\\\\s*,\\\\s*lat:)','');
 if(re.test(s)){s=s.replace(re,'$1, lat:'+lat+', lng:'+lng);n++;}
}
fs.writeFileSync(cfgPath,s);
console.log('stamped '+n+'/'+Object.keys(m).length);"""

_UA = {"User-Agent": "ComputeCafe venue-scout/1.0 (colin.lowenberg@nebius.com)"}

def geocode(q):
    """Query Photon once. Positive hits cache; misses/expired-null entries retry."""
    if cache.get(q):
        return cache[q]
    url = "https://photon.komoot.io/api/?limit=1&q=" + urllib.parse.quote(q)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=_UA), timeout=20) as r:
            j = json.load(r)
        feats = j.get("features") or []
        res = [feats[0]["geometry"]["coordinates"][1], feats[0]["geometry"]["coordinates"][0]] if feats else None
    except Exception:
        return None  # transient; do not cache
    if res:
        cache[q] = res
    return res

def _clean_addr(addr):
    a = re.sub(r"^〒[\d-]+\s*", "", addr)                    # strip JP postal prefix
    a = re.sub(r"\s*\([^)]*\)", "", a)                       # strip "(Cow Hollow)" notes
    a = re.sub(r"\s+[—–-]\s+.*$", "", a)                     # strip trailing " — adjacent to…"
    return a.strip(" ,·")

def _strip_floor(addr):
    # "130 Queens Quay E, East Tower, 4th Floor, Toronto" -> keep street + city
    return re.sub(r",[^,]*\b(?:floor|suite|ste|tower|level|unit|room|bldg|building|f)\b[^,]*",
                  "", addr, flags=re.I)

def _latin_half(addr):
    # KR/JP addresses often carry "한글주소 / romaji address" — lon latin half geocodes best.
    if "/" in addr:
        for part in addr.split("/"):
            if re.search(r"[A-Za-z]", part) and not re.search(r"[가-힯぀-ヿ一-鿿]", part):
                return part.strip()
    return None

def query_strategies(name, addr, city=""):
    """Ordered query forms, most→least precise. Address-only first: prefixing a
    display name ("Motoring Coffee / The Motoring Club, 1525 Union St…") routinely
    steers Photon to a same-name venue elsewhere in town. A trailing ", {City}"
    anchors multilingual / floor-and-tower addresses that fail unanchored."""
    a = _clean_addr(addr)
    clean = re.sub(r"\s*[/·×@]\s*", " ", name).strip()      # drop brand separators
    suf = f", {city}" if city and city.lower() not in a.lower() else ""
    qs = [a + suf, f"{clean}, {a}{suf}", f"{clean} {a}{suf}", f"{clean}{suf}"]
    lat = _latin_half(addr)
    if lat:
        qs.insert(0, lat + suf)
        qs.insert(1, _strip_floor(lat) + suf)
    qs.append(_strip_floor(a) + suf)                        # "+city, no floor clause"
    if lat:
        qs.append(_strip_floor(_clean_addr(lat)) + suf)
    out, seen = [], set()
    for q in qs:
        if q and q not in seen:
            seen.add(q); out.append(q)
    return out

def geocode_venue(name, addr, city=""):
    for q in query_strategies(name, addr, city):
        res = geocode(q)
        time.sleep(0.7)
        if res:
            return res
    return None

for slug in ("sf", "la"):
    cfg = os.path.join(ROOT, "configs", f"{slug}_config.js")
    env = dict(os.environ, CFGPATH=cfg)
    rv = subprocess.run(["node", "-e", DUMP_JS], capture_output=True, text=True, env=env)
    if rv.returncode != 0:
        print(f"{slug}: node dump failed: {rv.stderr.strip()}")
        continue
    vs = json.loads(rv.stdout)
    todo = {v["k"]: v for v in vs if v["addr"] and not v["hasCoord"]}
    stamped = {}
    for k, v in todo.items():
        res = geocode_venue(v["name"], v["addr"], CITY_NAMES.get(slug, ""))
        if res:
            stamped[k] = res
        else:
            print(f"  - no geocode: {slug}/{k}", file=sys.stderr)
    sys.stderr.flush()
    if stamped:
        mapfile = os.path.join(os.path.dirname(__file__), f".sfla-map-{slug}.json")
        json.dump(stamped, open(mapfile, "w"))
        out = subprocess.run(["node", "-e", STAMP_JS], capture_output=True, text=True,
                             env=dict(os.environ, CFGPATH=cfg, MAPPATH=mapfile))
        os.remove(mapfile)
        print(f"{slug}: {out.stdout.strip()} {out.stderr.strip()}")
    else:
        print(f"{slug}: nothing to stamp")
    json.dump(cache, open(CACHE, "w"))
print("done")
