# supercgm-ns: Agent Knowledge Base

This file is the practical map for editing this watchface safely.
It explains where behavior lives, how values move through the stack, what is platform-specific, and what usually breaks.

## 1) Project architecture

- Watch app (C): src/main.c
- Phone JS bridge (PKJS): src/js/pebble-js-app.js
- Config website: web/config/index.html, web/config/script.js, web/config/styles.css
- Build metadata and app keys source of truth: package.json (pebble.appKeys)
- Auto-generated message key artifacts:
  - build/include/message_keys.auto.h
  - build/js/message_keys.json

Important rule:

- If you add a message key, add it to package.json -> pebble -> appKeys.
- Do not rely on appinfo.json alone for new keys in this project.

## 2) End-to-end data flow

1. Config website builds JSON payload and closes with pebblejs://close#<payload>.
2. PKJS receives payload in webviewclosed, stores it in localStorage, normalizes values, then sends AppMessages.
3. C watch app receives tuples in inbox_received_callback.
4. C updates runtime state and calls draw_all_rows() / layer_mark_dirty().
5. Layers render final output (ghost + foreground digits + overlays).

## 3) Core rendering model in C

Per row and per slot (5 columns):

- s_ghost_layers[row][col]: legacy ghost text layer (kept hidden now)
- s_ghost_hatch_layers[row][col]: custom layer for dotted 7-segment ghost skeleton
- s_digit_layers[row][col]: foreground character layer
- s_slot_text[row][col][2]: persistent char buffer for foreground digit text

Current rendering intent:

- Ghost is rendered by hatch layer only.
- Foreground digits render over ghost.
- On round displays, edge slots are hidden on top and bottom rows.

## 4) Ghost system (current behavior)

State in C (src/main.c):

- s_show_ghost_grid: on/off
- s_ghost_color: ghost dot color
- s_ghost_density: density level 1..5

Relevant keys:

- SHOW_GHOST_GRID
- GHOST_COLOR
- GHOST_DENSITY

Density mapping in hatch_update_proc:

- 1 -> step 8 (very sparse)
- 2 -> step 6
- 3 -> step 4
- 4 -> step 3
- 5 -> step 2 (dense)

Implementation note:

- hatch_update_proc draws a dotted 7-segment-like skeleton (top/middle/bottom horizontals + vertical sides).

## 5) Row type semantics

Row type enum (ROW_TYPE_*):

- 0 Weather
- 1 Time
- 2 Date
- 3 Weekday
- 4 Battery
- 5 Nightscout BG
- 6 Steps
- 7 Heart Rate
- 8 BG timestamp
- 9 BG delta
- 10 Rain next 3h

draw_all_rows() builds a 5-char slot string per row and stores each char in s_slot_text.

## 6) Shake second-level mode

Watch runtime:

- Config keys: SHAKE_ROW1_TYPE..SHAKE_ROW5_TYPE
- State: s_shake_row_types[], s_shake_active
- Trigger: tap_handler()
- Duration: 5 seconds via app_timer
- Effect: row type per row is replaced by configured shake type if >= 0

Config simulator:

- previewMode: main or shake
- Toggle button switches between main row mapping and shake row mapping

## 7) Config website simulator (web/config/script.js)

The simulator is intentionally approximate (fast feedback), not pixel-perfect.

drawGhostPreview() currently simulates:

- Round vs rectangular shape
- Device size from query params when available (sw/sh)
- Row/slot geometry
- Ghost color and density
- Foreground sample values by selected row type
- Foreground row colors from row color selectors
- Hidden edge slots on round top/bottom rows
- Shake preview mode toggle

Sample values in simulator are representative examples:

- Time: 14:37
- Date: 15/05 or 05/15 (based on date format)
- Weekday: WED / MIT
- Weather: 21 C
- BG: 118
- Delta: +12
- Steps/HR/etc: synthetic placeholders

## 8) Color and platform rules

General:

- Config colors are quantized to Pebble-safe levels.
- Color platforms use channel levels 0/85/170/255.
- B/W style platforms use grayscale logic.

Platform-specific behaviors:

- aplite (classic): practical black/white rendering; ghost must avoid black.
- diorite (Pebble 2 B/W): grayscale quantization used for ghost and foreground mapping.
- color platforms (basalt/chalk/emery/flint/gabbro): full Pebble color quantization.

Pebble 2 guardrails in PKJS/config:

- Foreground row colors are forced to white.
- Ghost default/migration uses brighter grayscale to remain visible in emulator.

## 9) Message keys and generation workflow

Source of key names:

- package.json -> pebble -> appKeys (ordered list)

Generated outputs:

- build/include/message_keys.auto.h
- build/js/message_keys.json

If key changes are not reflected:

1. Verify key is present in package.json appKeys.
2. Run pebble clean && pebble build.
3. Confirm generated files contain the new key.

## 10) PKJS responsibilities

src/js/pebble-js-app.js does all of the following:

- Loads and normalizes saved config from localStorage
- Enforces platform palette constraints
- Sends config in chunked AppMessages
- Opens config URL with platform/profile/resolution hints
- Schedules weather and BG fetch loops
- Applies Pebble 2 safety mappings

Any new config field should be updated in all these areas:

- default config object
- loadSavedConfig normalization
- sendConfig payload
- webviewclosed parsing

## 11) Weather/BG overlay notes

Weather:

- Uses Open-Meteo first, wttr fallback in PKJS
- C draws degree symbol via overlay layer on rectangular layouts

Nightscout BG:

- Supports sync scheduling from reading timestamp + 30s or manual interval mode
- Status states: OK, NO_DATA, NO_CONN, OLD
- Trend symbol drawn with dedicated overlay layer
- Threshold colors selected from config

## 12) Build, install, deploy commands

Build:

- pebble build

Clean rebuild (when app keys/resources changed):

- pebble clean && pebble build

Install one emulator:

- pebble install --emulator aplite
- pebble install --emulator diorite
- pebble install --emulator basalt
- pebble install --emulator chalk

Install all emulators in background sequence:

- (for e in aplite basalt chalk diorite emery flint gabbro; do pebble install --emulator "$e"; done) >/tmp/pebble-install-all.log 2>&1 &!

Deploy config site:

- ./deploy-config.sh

## 13) Common pitfalls and fast diagnosis

Problem: new key ignored at runtime

- Cause: key added in wrong place
- Fix: add to package.json appKeys, then clean rebuild

Problem: config site changes not visible

- Cause: old deployed files or cache
- Fix: run deploy-config.sh and reload with cache-busting

Problem: ghost not visible on emulator

- Check SHOW_GHOST_GRID
- Check ghost color is not black/dark remapped to invisible tone
- Check ghost density not set too sparse
- Confirm hatch layers are marked dirty after config updates

Problem: looks correct on one platform but wrong on another

- Re-check platform conditionals in src/main.c
- Re-check quantization in PKJS and config script

## 14) Safe edit checklist for coding assistants

Before editing rendering/config behavior:

1. Confirm target behavior in src/main.c first.
2. Confirm matching config controls in web/config/script.js and index.html.
3. Confirm PKJS send/restore paths in src/js/pebble-js-app.js.
4. Confirm required message keys exist in package.json appKeys.
5. Build and verify no new compile errors.
6. If config web changed, deploy via ./deploy-config.sh.

After editing:

1. Test at least one B/W emulator (aplite or diorite) and one color emulator (basalt/chalk).
2. Open config page and verify save/restore works for new fields.
3. Verify simulator and watch output are directionally consistent.

## 15) What to update when adding a new feature

If you add a new config-driven visual feature, update all of these:

1. package.json appKeys (if new key is needed)
2. src/js/pebble-js-app.js
   - defaults
   - loadSavedConfig
   - sendConfig
   - webviewclosed parse
3. src/main.c inbox_received_callback
4. src/main.c runtime defaults/init
5. web/config/index.html control(s)
6. web/config/script.js
   - i18n labels
   - save/restore
   - preview/simulator behavior
7. web/config/styles.css if UI layout changes
8. this agents.md file
