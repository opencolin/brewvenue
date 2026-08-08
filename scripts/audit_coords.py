#!/usr/bin/env python3
"""Flag venue coordinates that sit far from their own city's cluster.

Auto-geocoding (Photon) occasionally resolves an address into the wrong city
or wrong hemisphere (e.g. "520 Broadway" -> Santa Ana, a boundary-street match
in Bolivia for Corgi Cafe). A coordinate more than `THRESH` degrees from the
median of the city's geocoded venues is almost certainly wrong.

Usage: python3 scripts/audit_coords.py   (exit 1 if any outlier)
"""
import json, os, re, subprocess, sys, statistics

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
THRESH_DEG = 0.5          # ~55 km at the equator
DUMP = ("const fs=require('fs');const src=fs.readFileSync(process.env.CFG,'utf8');"
        "const VENUES=eval('(()=>{'+src+';return VENUES;})()');"
        "console.log(JSON.stringify(VENUES.map(v=>({k:v.k,name:v.name,lat:v.lat||null,lng:v.lng||null}))));")

def load(path):
    env = dict(os.environ, CFG=path)
    r = subprocess.run(["node", "-e", DUMP], capture_output=True, text=True, env=env)
    return json.loads(r.stdout)

def med(a):
    return statistics.median(a)

bad = []
for fn in sorted(os.listdir(os.path.join(ROOT, "configs"))):
    if not fn.endswith("_config.js"):
        continue
    p = os.path.join(ROOT, "configs", fn)
    try:
        vs = load(p)
    except Exception as e:
        print("EVALFAIL", fn, e, file=sys.stderr)
        continue
    c = [v for v in vs if v.get("lat") is not None and v.get("lng") is not None]
    if len(c) < 5:
        continue  # too sparse for a meaningful median
    mlat, mlng = med([v["lat"] for v in c]), med([v["lng"] for v in c])
    for v in c:
        d = ((v["lat"] - mlat) ** 2 + (v["lng"] - mlng) ** 2) ** 0.5
        if d > THRESH_DEG:
            bad.append((fn, v["k"], v["name"], round(v["lat"], 4), round(v["lng"], 4), round(d, 2)))

for fn, k, name, lat, lng, d in bad:
    print(f"{fn:28} {k:24} {name[:40]:42} {lat},{lng}  dist={d}deg")
print(f"{len(bad)} outlier(s)")
sys.exit(1 if bad else 0)
