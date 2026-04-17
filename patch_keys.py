import json, re, sys

BASE = 10000
ROOT = '/Users/simon/supercgmaktuell/Nightscout-supercgm'

src = json.load(open(f'{ROOT}/appinfo.json'))
new_keys = {k: BASE + v for k, v in src['appKeys'].items()}

# 1. build/appinfo.json
bd = json.load(open(f'{ROOT}/build/appinfo.json'))
bd['appKeys'] = new_keys
bd['messageKeys'] = new_keys
open(f'{ROOT}/build/appinfo.json', 'w').write(json.dumps(bd, indent=4))

# 2. build/js/message_keys.json
open(f'{ROOT}/build/js/message_keys.json', 'w').write(json.dumps(new_keys, indent=4))

# 3. build/include/message_keys.auto.h
h = open(f'{ROOT}/build/include/message_keys.auto.h').read()
for k in new_keys:
    decl = f'extern uint32_t MESSAGE_KEY_{k};\n'
    if decl not in h:
        h += decl
open(f'{ROOT}/build/include/message_keys.auto.h', 'w').write(h)

# 4. build/src/message_keys.auto.c
c = open(f'{ROOT}/build/src/message_keys.auto.c').read()
for k, v in new_keys.items():
    defn = f'uint32_t MESSAGE_KEY_{k} = {v};\n'
    if f'MESSAGE_KEY_{k} ' not in c:
        c += defn
open(f'{ROOT}/build/src/message_keys.auto.c', 'w').write(c)

# 5. c4che/_cache.py - inject into PROJECT_INFO messageKeys/appKeys dicts
cache = open(f'{ROOT}/build/c4che/_cache.py').read()
for dk in ['messageKeys', 'appKeys']:
    for k, v in new_keys.items():
        entry = f"'{k}': {v}"
        if entry not in cache:
            # append before closing brace of that dict
            pattern = rf"('{dk}': \{{[^}}]+)\}}"
            cache = re.sub(pattern, rf'\1, {entry}}}', cache, count=1)
open(f'{ROOT}/build/c4che/_cache.py', 'w').write(cache)

print('Done. Keys now present:')
check = json.load(open(f'{ROOT}/build/js/message_keys.json'))
for k in ('SHAKE_ROW_TYPE','SHAKE_ROW_COLOR','VIBE_ON_LOW','VIBE_ON_HIGH','BACKLIGHT_ON_SHAKE','BG_IOB'):
    print(f'  {k}: {check.get(k, "MISSING")}')
