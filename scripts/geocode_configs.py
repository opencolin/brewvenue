#!/usr/bin/env python3
"""Stamp lat/lng into every JSON-style city config by geocoding venue addresses
server-side via Nominatim (1 req/sec per usage policy, persistent cache in
scripts/geocode-cache.json). Venues that fail to geocode are left without
coords; the city map simply skips them. Idempotent: venues with coords or
cached addresses cost no requests."""
import json, re, glob, os, sys, time, urllib.parse, urllib.request

CACHE = os.path.join(os.path.dirname(__file__), 'geocode-cache.json')
UA = {'User-Agent': 'ComputeCafe venue-scout/1.0 (colin.lowenberg@nebius.com)'}
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
misses = hits = stamped = 0

def geocode(addr):
    """Photon (OSM) primary; errors are NOT cached so retries stay possible.
    Only a definitive empty result caches as None."""
    global misses
    if addr in cache:
        return cache[addr]
    url = 'https://photon.komoot.io/api/?limit=1&q=' + urllib.parse.quote(addr)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
            data = json.load(r)
        feats = data.get('features') or []
        if feats:
            lon, lat = feats[0]['geometry']['coordinates'][:2]
            res = [float(lat), float(lon)]
        else:
            res = None            # definitive miss - cacheable
        cache[addr] = res
    except Exception as e:
        print(f'  ! {addr[:50]}: {e}', file=sys.stderr)
        time.sleep(2)             # back off so failures do not flood the resolver
        return None               # transient - do NOT cache
    misses += 1
    time.sleep(0.7)
    return res

for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__), '..', 'configs', '*_config.js'))):
    slug = os.path.basename(f).replace('_config.js', '')
    if slug in ('sf', 'la'):
        continue  # JS-literal configs; geocode when they migrate to JSON style
    s = open(f, encoding='utf-8').read()
    m = re.search(r'const VENUES = (\[.*?\]);', s, re.S)
    vs = json.loads(m.group(1))
    changed = False
    for v in vs:
        if v.get('lat') and v.get('lng'):
            continue
        addr = v.get('addr')
        if not addr:
            continue
        # trim parentheticals that confuse the geocoder
        q = re.sub(r'\s*\([^)]*\)', '', addr).strip()
        res = geocode(q)
        if res:
            v['lat'], v['lng'] = res
            changed = True
            globals()['stamped'] = stamped + 1
    if changed:
        s = s[:m.start(1)] + json.dumps(vs, indent=2, ensure_ascii=False) + s[m.end(1):]
        open(f, 'w', encoding='utf-8').write(s)
    done = sum(1 for v in vs if v.get('lat'))
    print(f'{slug}: {done}/{len(vs)} venues have coords')
    json.dump(cache, open(CACHE, 'w'))
json.dump(cache, open(CACHE, 'w'))
print(f'network lookups this run: {misses}')
