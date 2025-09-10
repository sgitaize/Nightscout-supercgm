# supercgm-ns

A Pebble SDK 4.x watchface with five flexible rows using the DSEG14Classic font. Rows can be reordered and colored via a configuration webpage. Supports: Weather, Time, Date, Weekday, Battery, Nightscout BG, and Steps.

## Font placement
Place the font file at:
- `resources/fonts/DSEG14Classic-Regular.ttf` (already referenced)

The project expects size 42 to render cleanly; adjust if needed by changing the target font or row height.

## Build and install
- Requires Pebble SDK 4.5 (Rebble SDK). Use `pebble build` and `pebble install --phone <ip>`.

## Configuration
- Config page opens from the Pebble app. We set `"capabilities": ["configurable"]` in `package.json` so PebbleJS exposes the configuration events.
- Config-URL ist aktuell: `http://supercgm-config.aize-it.de/config/index.html`. Du kannst die Seite auch selbst hosten und die URL in `src/js/pebble-js-app.js` anpassen.

## Nightscout
- Enter your base Nightscout URL; the app will request `<URL>/pebble`.
- If no value is returned, the BG row shows `NO-BG`.
- If older than the configured timeout, shows `NoCon`.
- Colors: low (< low threshold) red, high (> high threshold) yellow, otherwise green. All configurable.

## Notes
- Weather uses Open-Meteo (no API key) and requires location permission.
- Weekday in German uses custom triplets: SON, MON, DIE, MIT, DON, FRE, SAM.