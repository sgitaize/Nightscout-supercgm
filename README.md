# supercgm-ns

**Flexible Pebble watchface for CGM + weather with a fully customizable 5-slot grid per row.**  
Designed for both color and black-and-white Pebble devices, including Round models.  
About **90 % of the code was developed collaboratively with GitHub Copilot (Claude Sonnet)**, making it especially easy to extend and maintain.

---

## 📲 Quick Install

- **Rebble App Store**  
  Available directly in the Rebble store:  
  [https://apps.rebble.io/en_US/application/68c5e8d5474b97000932ae2c?query=Cgm&section=watchfaces](https://apps.rebble.io/en_US/application/68c5e8d5474b97000932ae2c?query=Cgm&section=watchfaces)

- **Direct Sideload (.pbw)**  
  Pre-built `.pbw` bundles are available under  
  [GitHub Releases](../../releases).  
  Download the latest release and sideload it using the Rebble phone app.

---

## ✨ Features

- **Customizable rows (per row choose one):**  
  Weather · Time · Date · Weekday · Battery · Nightscout BG · Steps · Heart Rate
- **Per-row color customization**, plus in-range / high / low BG colors and ghost grid color
- **Ghost grid contrast** — DarkGray on color displays; B/W platforms (Aplite, Diorite) use a 50 % checkerboard hatch overlay for a natural mid-gray look
- **Phone-side background fetch** for Nightscout BG (interval configurable)
- **Weather via Open-Meteo** (no API key needed, supports °C/°F)
- **Persistent storage** on watch and phone (survives restarts)
- **Platform-aware layout:**
  - Rectangular (Aplite/Diorite/Basalt/Time): 5 rows
  - Round (Chalk): 4 rows with tighter vertical spacing; top/bottom rows show 4 digits

### 🔔 Alerts & Behaviour
- **Vibration on low BG** — 3 short pulses (configurable, 10-minute cooldown)
- **Vibration on high BG** — 2 short pulses (configurable, 10-minute cooldown)
- **Backlight on shake** — lights up the display when the watch is shaken (Pebble Time+)
- **Bluetooth reconnect notification** — single buzz + NOCON display when Bluetooth drops

### 📳 Shake to Reveal
Shake or tap the watch to overlay extra info for 5 seconds.  
Configurable content:
- Steps · Battery · Heart Rate · BG / CGM
- **BG Time** — time of last Nightscout reading + age in minutes
- **IOB** — Insulin on Board (requires Nightscout `/pebble` endpoint with `iob` field)

---

## 🕹 Platforms

| Platform | Display | Rows |
|---|---|---|
| Basalt (Pebble Time) | Color | 5 |
| Chalk (Pebble Time Round) | Color, round | 4 |
| Aplite (Pebble / Pebble Steel) | B/W | 5 |
| Diorite (Pebble 2) | 4-level grayscale | 5 |

---

## ⚙️ Configuration

Open the watchface settings from the Pebble/Rebble phone app.  
The settings page (`/config20`) adapts to the platform (row count, B/W palette).  
All labels and options are in English.

---

## 🌙 Nightscout Integration

- Enter your base Nightscout URL; the app requests `<URL>/pebble`.
- If no BG is available → displays **NO-BG**; if connection lost → **NOCON**; if stale → **OLD-BG**.
- Trend arrows are drawn natively (↑, ↗, →, ↘, ↓ and double variants).
- IOB (Insulin on Board) is parsed from the `iob` field in the `/pebble` response.

---

## 🛠 Build & Development

Prerequisites: [Rebble SDK](https://developer.rebble.io/developer.pebble.com/sdk) (Pebble SDK 4.x) with `pebble` CLI.

**Quick start**
```bash
python3 patch_keys.py && pebble build       # Always use this; patches waf key cache
pebble install --phone <PHONE_IP>           # Install on phone
pebble install --emulator chalk             # Test on Round emulator
pebble install --emulator diorite           # Test on B/W emulator
```

> ⚠️ **Important:** Always run `python3 patch_keys.py` before `pebble build` when `appinfo.json` appKeys have changed. The pebble waf build system caches keys and does not auto-regenerate `MESSAGE_KEY_*` symbols.

**Deploy config website**
```bash
./deploy-config.sh    # Uploads web/config/ to FTP /config20
```
Requires `lftp` (`brew install lftp`). FTP credentials are stored in `.ftpconfig` (gitignored).

Development tips:
- Phone code: `src/js/pebble-js-app.js`
- Watch code: `src/main.c`
- Web config: `web/config/`
- AppMessage keys: `appinfo.json` → `appKeys`

---

## 💡 Contributing

This project is **open source (MIT License)** and welcomes:
- New feature ideas
- Bug reports
- Pull requests and forks
- Other Devs to help building this watchface

About **90 % of the implementation was "Vibe-coded" with GitHub Copilot (Claude Sonnet)**,  
which means the majority of the logic was pair-programmed and iteratively refined together with an AI assistant.  
If you have an idea for a new function, feel free to open an issue or PR.

---


## 📜 License

This project is released under the [MIT License](LICENSE).  
You are free to use, modify, and distribute it, provided that the license terms are respected.
