# supercgm-ns

**Flexible Pebble watchface for CGM + weather with a fully customizable 5-slot grid per row.**  
Designed for both color and black-and-white Pebble devices, including Round models.  
About **90 % of the code was developed collaboratively with GPT-5 (“Vibe-coded”)**, making it especially easy to extend and maintain.

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
  Weather · Time · Date · Weekday · Battery · Nightscout BG · Steps
- **Per-row color customization**, plus in-range / high / low BG colors and ghost grid color
- **Phone-side background fetch** for Nightscout BG (interval configurable)
- **Weather via Open-Meteo** (no API key needed, supports °C/°F)
- **Persistent storage** on watch and phone (survives restarts)
- **Platform-aware layout:**
  - Rectangular (Aplite/Diorite/Basalt/Time): 5 rows
  - Round (Chalk): 4 rows with tighter vertical spacing; top/bottom rows show 4 digits

---

## 🕹 Platforms

- **Color**: Basalt (Pebble Time), Chalk (Round)
- **Black & White**: Aplite (Pebble / Pebble Steel), Diorite (Pebble 2)

---

## ⚙️ Configuration

Open the watchface settings from the Pebble/Rebble phone app.  
The settings page adapts to the platform (row count, B/W palette).  
All labels and options are in English.

---

## 🌙 Nightscout Integration

- Enter your base Nightscout URL; the app requests `<URL>` without `/pebble`.
- If no BG is available → displays **NO-BG**; if stale → **NOCON**.
- Trend arrows are drawn natively (↑, ↗, →, ↘, ↓ and double variants).

---

## 🛠 Build & Development

Prerequisites: [Rebble SDK](https://developer.rebble.io/developer.pebble.com/sdk) (Pebble SDK 4.x) with `pebble` CLI.

**Quick start**
```bash
pebble build
pebble install --phone <PHONE_IP>      # Install on phone
pebble install --emulator chalk        # Test on Round emulator
pebble install --emulator diorite      # Test on B/W emulator
```

Troubleshooting:
- If logs fail to connect, ensure the emulator is running or the phone is reachable.
- If fonts clip, rebuild and restart the watchface.

Development tips:
- App keys are generated from `package.json` (`pebble.messageKeys`).
- Phone code: `src/js/pebble-js-app.js`
- Watch code: `src/main.c`
- Web config: `web/config/`
- After changing config fields or resources, always rebuild (`pebble build`).

---

## 💡 Contributing

This project is **open source (MIT License)** and welcomes:
- New feature ideas
- Bug reports
- Pull requests and forks
- Other Devs to help building this watchface

About **90 % of the implementation was “Vibe-coded” with GPT-5**,  
which means the majority of the logic was pair-programmed and iteratively refined together with an AI assistant.  
If you have an idea for a new function, feel free to open an issue or PR.

---


## 📜 License

This project is released under the [MIT License](LICENSE).  
You are free to use, modify, and distribute it, provided that the license terms are respected.
