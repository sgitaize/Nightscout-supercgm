# supercgm-ns

Flexible Pebble watchface for CGM + weather with a 5-slot grid per row. Highly configurable colors and rows. Works on color and black-and-white devices, including Round.

## Features
- Rows (per row choose one): Weather, Time, Date, Weekday, Battery, Nightscout BG, Steps
- Color customization per row, plus in-range/high/low BG colors and ghost grid color
- Phone-side background fetch for BG (interval configurable)
- Weather via Open-Meteo (no API key) with unit selection (°C/°F)
- Persistence on watch and phone (survives restarts)
- Platform-aware layout:
  - Rectangular (Aplite/Diorite/Basalt/Time): 5 rows
  - Round (Chalk): 4 rows with tighter vertical spacing; top/bottom show 4 digits

## Platforms
- Color: Basalt (Pebble Time), Chalk (Round)
- B/W: Aplite (Pebble/Pebble Steel), Diorite (Pebble 2)

## Configuration
- Open the watchface settings from the Pebble/Rebble phone app.
- The page adapts to platform (rows count, BW palette). All labels are English.

### Nightscout
- Enter your base Nightscout URL; the app requests `<URL>` without /pebble.
- No BG -> shows `NO-BG`; stale -> `NOCON`.
- Trend arrows are drawn natively (↑, ↗, →, ↘, ↓ and double variants).

## Build and Install
Prereqs: Rebble SDK (Pebble SDK 4.x) installed and `pebble` CLI available.

Quick start:

1) Build the app bundle
	- Run in project root:
	  - `pebble build`

2) Install to phone (replace IP with your phone IP from the Pebble app)
	- `pebble install --phone <PHONE_IP>`

3) Install to emulator
	- Round: `pebble install --emulator chalk`
	- BW: `pebble install --emulator diorite`

Troubleshooting:
- If logs fail to connect, ensure the emulator is running or phone is reachable.
- If fonts clip, rebuild and restart the watchface.

## Development tips
- App keys are generated from `package.json` (see `pebble.messageKeys`).
- Phone code lives in `src/js/pebble-js-app.js`.
- Watch C code lives in `src/main.c`.
- Web config is under `web/config/`.
- After changing config fields or resources, rebuild (`pebble build`).