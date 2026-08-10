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

def city_of(slug, src):
    m = re.search(r'kicker:\s*"([^"·]+)', src)        # e.g. "Kuala Lumpur · ComputeCafe"
    if m and m.group(1).strip():
        return re.sub(r'\s+tech\s+week\s*$', '', m.group(1).strip(), flags=re.I)
    return slug.replace('-', ' ').title()

def geocode(q):
    """Photon (OSM) primary. Positive hits cache; misses DON'T cache — a cached
    None used to permanently wedge any venue that failed once against a bad query."""
    global misses
    if cache.get(q):            # truthy only: cached positive; None/missing -> retry
        return cache[q]
    url = 'https://photon.komoot.io/api/?limit=1&q=' + urllib.parse.quote(q)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
            data = json.load(r)
        feats = data.get('features') or []
        if feats:
            lon, lat = feats[0]['geometry']['coordinates'][:2]
            res = [float(lat), float(lon)]
            cache[q] = res      # cache only successful geocodes
        else:
            res = None
    except Exception as e:
        print(f'  ! {q[:50]}: {e}', file=sys.stderr)
        time.sleep(2)             # back off so failures do not flood the resolver
        return None               # transient - do NOT cache
    misses += 1
    time.sleep(0.7)
    return res

def _clean_addr(addr):
    a = re.sub(r'^〒[\d-]+\s*', '', addr)                 # strip JP postal prefix
    a = re.sub(r'\s*\([^)]*\)', '', a)                    # strip "( Cow Hollow )" notes
    a = re.sub(r'\s+[—–-]\s+.*$', '', a)                  # strip trailing " — adjacent to…"
    return a.strip(' ,·')

def _strip_floor(addr):
    # "130 Queens Quay E, East Tower, 4th Floor, Toronto" -> keep street + city
    return re.sub(r',[^,]*\b(?:floor|suite|ste|tower|level|unit|room|bldg|building|f)\b[^,]*',
                  '', addr, flags=re.I)

_CJK = r'[가-힯぀-ヿ一-鿿]'

def _latin_half(addr):
    # KR/JP addresses often carry "한글주소 / romaji address" — the latin half geocodes best.
    if '/' in addr:
        for part in addr.split('/'):
            if re.search(r'[A-Za-z]', part) and not re.search(_CJK, part):
                return part.strip()
    return None

def _latin_name(name):
    # "Mindspace Rothschild / מיינדספייס" / "PARK6 powered by … (パークシックス)" -> latin text only
    seg = re.split(r'[/·×@|]', name)[0]
    seg = re.sub(r'\([^)]*' + _CJK + r'[^)]*\)', '', seg)   # drop CJK parentheticals
    seg = re.sub(_CJK + r'+', ' ', seg)                     # drop remaining CJK glyphs
    seg = re.sub(r'\s+', ' ', seg).strip(' ,—–-')
    return seg if re.search(r'[A-Za-z]', seg) else None

def _cjk_street(addr):
    # Pure-CJK JP/KR address: strip postal prefix + building/floor suffix ("…15階", "…6F", towers),
    # keep the ward/block so Photon matches the street/venue, not the skyscraper record.
    a = re.sub(r'^〒[\d-]+\s*', '', addr)
    a = re.sub(r'\s*\([^)]*\)', '', a)
    # drop floor/level markers common in CJK addresses
    a = re.sub(r'\d+\s*(?:階|F|f|층)\b.*$', '', a)
    a = re.sub(r'\s+(?:\S*タワー|\S*ビル|\S*スクエア|\S*センター)\S*\s*\d*.*$', '', a)
    return a.strip(' ,·')

def query_strategies(name, addr, city=''):
    """Ordered query forms, most→least precise. Try the address first; a venue
    display-name prefix is a later hint only. A trailing ", {City}" anchors the
    multilingual / floor-and-tower addresses that fail unanchored."""
    a = _clean_addr(addr)
    clean = re.sub(r'\s*[/·×@]\s*', ' ', name).strip()
    suf = f', {city}' if city and city.lower() not in a.lower() else ''
    qs = [addr.strip(), a + suf, f'{clean}, {a}{suf}', f'{clean}{suf}']
    lat = _latin_half(addr)
    if lat:
        qs.insert(0, lat + suf)
        qs.insert(1, _strip_floor(lat) + suf)
    qs.append(_strip_floor(a) + suf)
    if lat:
        qs.append(_strip_floor(_clean_addr(lat)) + suf)
    # CJK-only names/addresses: try the latin brand name, and the stripped CJK street
    lname = _latin_name(name)
    if lname:
        qs += [f'{lname}, {city}' if city else lname, lname]
    cjk = _cjk_street(addr)
    if cjk and re.search(_CJK, cjk):
        qs += [f'{cjk}, {city}' if city else cjk]
    out, seen = [], set()
    for q in qs:
        if q and q not in seen:
            seen.add(q); out.append(q)
    return out

for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__), '..', 'configs', '*_config.js'))):
    slug = os.path.basename(f).replace('_config.js', '')
    if slug in ('sf', 'la'):
        continue  # JS-literal configs; geocode when they migrate to JSON style
    s = open(f, encoding='utf-8').read()
    m = re.search(r'const VENUES = (\[.*?\]);', s, re.S)
    vs = json.loads(m.group(1))
    city = city_of(slug, s)
    changed = False
    for v in vs:
        if v.get('lat') and v.get('lng'):
            continue
        addr = v.get('addr')
        if not addr:
            continue
        for q in query_strategies(v.get('name', ''), addr, city):
            res = geocode(q)
            if res:
                v['lat'], v['lng'] = res
                changed = True
                globals()['stamped'] = stamped + 1
                break
    if changed:
        s = s[:m.start(1)] + json.dumps(vs, indent=2, ensure_ascii=False) + s[m.end(1):]
        open(f, 'w', encoding='utf-8').write(s)
    done = sum(1 for v in vs if v.get('lat'))
    print(f'{slug}: {done}/{len(vs)} venues have coords')
    json.dump(cache, open(CACHE, 'w'))
json.dump(cache, open(CACHE, 'w'))
print(f'network lookups this run: {misses}')
