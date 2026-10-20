![Nightscout SuperCGM Banner](assets/banner.png)

# Nightscout-supercgm

**English** · [Deutsch](README.de.md)

A flexible Pebble watchface for **CGM and weather** with a fully customisable 5-slot grid per row – for colour and black-and-white Pebbles, including the round models.

**Status:** in the Pebble Appstore · data from Nightscout or [iPump-mini](https://github.com/sgitaize/iPump-mini) · all Pebble models · actively maintained

## Get it

| | |
|---|---|
| **Pebble Appstore** | [supercgm-ns](https://apps.rePebble.com/68c5e8d5474b97000932ae2c) – install from the Pebble app on your phone |
| **Releases** | [`.pbw` on GitHub](https://github.com/sgitaize/Nightscout-supercgm/releases/latest) for side-loading |
| **Settings** | gear icon in the Pebble app → [settings page](https://sgitaize.github.io/Nightscout-supercgm/config/) (English / German) |

## Features

- **Customisable rows** – per row choose one: weather · time · date · weekday · battery · BG · steps · heart rate · BG time · BG delta · rain in the next 3 h
- **Two CGM sources:** Nightscout (`/pebble`, default) or [iPump-mini](https://github.com/sgitaize/iPump-mini), the iPhone app that reads a MiniMed 780G directly – no internet needed; Nightscout can act as a fallback (small cloud symbol)
- **Battery-friendly sync** right after each new reading; with iPump-mini it follows the app's wake schedule, and the watch nudges the phone if it stays quiet
- **Per-row colours**, plus in-range / high / low BG colours and a ghost grid colour
- **Ghost rendering tuned per platform** – visible ghost colour on colour Pebbles, a subtle dotted skeleton on Aplite, a grey ghost on Diorite; density configurable from 1 to 5
- **Weather via Open-Meteo** (no API key, °C/°F) with rain probability for the next 3 hours
- **Settings page with live simulator** – watch shape, row types and colours, sample values, ghost density and a main/shake toggle, rendered in a DSEG font close to the real watch
- **Persistent storage** on watch and phone; the last BG value survives a restart

### Alerts & behaviour
- **Vibration on low BG** – 3 short pulses, **on high BG** – 2 pulses (each configurable, 10-minute cooldown)
- **Backlight on shake** (Pebble Time and newer)
- **Bluetooth lost** – a single buzz and **NOCON** on the display

### Shake to reveal
Shake or tap the watch to overlay extra info for 5 seconds: steps · battery · heart rate · BG · **BG time** · **BG delta** · **rain next 3 h**. The settings page has a shake preview, so you can check the second level before saving.

## Platforms

| Platform | Display | Rows |
|---|---|---|
| Basalt (Pebble Time) | colour | 5 |
| Chalk (Pebble Time Round) | colour, round | 4 |
| Gabbro (Pebble Round 2) | colour, round | 5 |
| Emery (Pebble Time 2) | colour | 5 |
| Flint (Pebble 2 Duo) | B/W | 5 |
| Aplite (Pebble / Pebble Steel) | B/W | 5 |
| Diorite (Pebble 2) | B/W | 5 |

## Architecture

<p align="center"><img src="docs/architecture.png" alt="Architecture: the watchface and the C part of pebble-cgm on the watch talk via AppMessage to PebbleKit JS on the phone, which fetches from Nightscout or iPump-mini and weather services; settings come from a page on GitHub Pages" width="100%"></p>

<sub>Source: <a href="docs/architecture.mmd">docs/architecture.mmd</a> (Mermaid)</sub>

**How it works**
- **The watch draws, the phone fetches.** The C code renders the rows and keeps the last value; the JavaScript in the Pebble app (PebbleKit JS) talks to the internet and sends compact AppMessages.
- **pebble-cgm** handles everything CGM on both sides: choosing the source, timing fetches after each new reading, the iPump-mini wake schedule, fallback to Nightscout, a send queue with acknowledgements, and a watchdog on the watch. The same library runs in [CasioCGM](https://github.com/sgitaize/casiocgm) and [91 Dub CGM](https://github.com/sgitaize/dubv4cgm).
- **Settings** are a static page on GitHub Pages; the configuration travels in the URL fragment, so your Nightscout token never reaches a server.
- **Layout per platform:** rectangular models get 5 rows, the original round Pebble 4 with tighter spacing, Round 2 a tuned round layout.

| Part | Where | What it does |
|---|---|---|
| Watchface | `src/main.c` | rows, ghost grid, colours, shake, persistence |
| CGM (watch) | `src/cgm.c` | last value, status, watchdog, wake timer (from pebble-cgm) |
| Phone script | `src/js/pebble-js-app.js` | settings, weather, location, messages to the watch |
| CGM (phone) | `src/js/cgm.js` | Nightscout / iPump-mini, scheduling, fallback (from pebble-cgm) |
| Settings page | `web/config/` | simulator, English / German, published by `.github/workflows/pages.yml` |
| Message keys | `package.json` → `pebble.messageKeys` | single source of truth for watch ↔ phone keys |
| Store listing | `store/` | description, screenshots, `publish.sh` |

## Configuration

Open the watchface settings from the Pebble app. The [settings page](https://sgitaize.github.io/Nightscout-supercgm/config/) adapts to the platform (row count, B/W palette, ghost visibility, preview layout); presets include the older models plus Time 2 and Round 2. Default language is English, with a German switch on the page.

**CGM:** choose Nightscout or iPump-mini. For Nightscout enter your base URL (the app requests `<URL>/pebble`) and an optional token; for iPump-mini you can enable Nightscout as fallback.

- No BG available → **NO-BG**, connection lost → **NOCON**, stale → **OLD-BG**, iPump-mini not running → **NOAPP**
- Trend arrows are drawn natively (↑, ↗, →, ↘, ↓ and double variants); the delta comes from `bgs[0].bgdelta`
- Timed fetches use the server time `status[0].now` and the reading time `bgs[0].datetime` (`datetime + interval + 30 s`)

## Build & development

Prerequisite: Pebble SDK 4.33 (`pebble` CLI, pebble-tool 5).

```bash
pebble build                          # app + generated message keys
pebble install --phone <PHONE_IP>     # on your phone
pebble install --emulator emery       # Time 2 · also chalk, gabbro, diorite, aplite …
```

Changes under `web/` on `main` are published to GitHub Pages automatically. The watch passes its settings in the URL fragment (`#config=…`), so the page shows them on any host. Versions before 2.4 still open the old page at supercgm-config.aize-it.de/config20.

## Status & roadmap

- **Live:** 2.8 in the Pebble Appstore (Nightscout and iPump-mini, reliability fixes from pebble-cgm 1.1.0).
- Ideas, bug reports and pull requests are welcome – open an [issue](https://github.com/sgitaize/Nightscout-supercgm/issues).

## Support

If this watchface saves you from checking your phone 50 times a day – consider buying me a Paulaner Spezi!

<p align="center">
  <a href="https://www.paypal.com/donate/?hosted_button_id=LGAZB9PR4YV5L">
    <img src="https://img.shields.io/badge/%F0%9F%A5%A4%20Buy%20me%20a%20Paulaner%20Spezi-Donate%20via%20PayPal-009cde?style=for-the-badge&logo=paypal&logoColor=white" width="500" height="70" alt="Buy me a Paulaner Spezi">
  </a>
</p>

## Credits

About 90 % of the code was pair-programmed with AI assistants (GitHub Copilot with Claude, later [Claude Code](https://claude.com/claude-code)), which keeps it easy to extend.

## License

[MIT](LICENSE.txt) – you are free to use, modify and distribute it under the license terms.
