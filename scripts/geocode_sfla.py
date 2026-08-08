#!/usr/bin/env python3
"""Geocode the two JS-literal configs (sf, la) by round-tripping VENUES through Node.

sf/la configs use unquoted keys (`k:"..."`), so the JSON geocoder skips them.
This asks Node to dump each config's VENUES to JSON, geocodes venues missing
coords via Photon (shares geocode-cache.json), then hands k->[lat,lng] back to
Node which stamps `, lat: N, lng: N` right after that venue's `addr:"..."` value.
Idempotent (venues whose block already contains `lat:` are skipped).
"""
import json, os, subprocess, time, urllib.parse, urllib.request

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
CACHE = os.path.join(os.path.dirname(__file__), "geocode-cache.json")
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

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

def geocode(q):
    if q in cache:
        return cache[q]
    url = "https://photon.komoot.io/api/?limit=1&q=" + urllib.parse.quote(q)
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            j = json.load(r)
        feats = j.get("features") or []
        res = [feats[0]["geometry"]["coordinates"][1], feats[0]["geometry"]["coordinates"][0]] if feats else None
    except Exception:
        return None  # transient; do not cache
    cache[q] = res
    return res

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
        res = geocode(f"{v['name']}, {v['addr']}")
        time.sleep(0.7)
        if res:
            stamped[k] = res
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
