(function(){
  'use strict';

  var I18N = {
    en: {
      language: 'Language',
      heroEyebrow: 'supercgm-ns v2.0',
      heroTitle: 'Pick your watch and configure in one go',
      heroLede: 'Choose your Pebble model to get the right row count (4 for legacy Round, 5 for rectangular and Round 2) and a contrast-safe palette. All colors are quantized so parameters transfer reliably to every Pebble generation.',
      heroTag1: 'Works with new Pebble app',
      heroTag2: 'Contrast-first presets',
      heroTag3: 'Color-safe transfers',
      presetTitle: 'Watch presets',
      presetIntro: 'Select your model. Switching presets updates row count, palette (B/W for Classic and Pebble 2), and default colors.',
      rowsTitle: 'Rows',
      rowsIntro: 'Pick a type and color per row. Round watches hide the edge slots but we still send all five slots to keep transfers stable on every Pebble.',
      formatTitle: 'Formatting',
      formatIntro: 'Everything is quantized to Pebble-safe colors. Adjust date, weekday language, and refresh intervals.',
      leadingZeroLabel: 'Leading zero for time',
      dateFormatLabel: 'Date format:',
      weekdayLangLabel: 'Weekday language:',
      weekdayDeLabel: 'German',
      weekdayEnLabel: 'English',
      tempUnitLabel: 'Temperature unit:',
      weatherRefreshLabel: 'Weather refresh (min):',
      bgTitle: 'Nightscout',
      bgIntro: 'Only shown when at least one row is set to Nightscout BG. Set URL, timeout, refresh, thresholds, and colors. Sync mode uses status.now as server time and bgs.datetime as reading time.',
      bgUrlLabel: 'Nightscout URL',
      bgTimeoutLabel: 'Timeout (min)',
      bgRefreshLabel: 'BG interval (min)',
      syncBgWithIntervalLabel: 'Sync with BG interval (timestamp + 30s)',
      bgManualLabel: 'Manual fetch interval (min)',
      cgmUnitLabel: 'CGM Unit:',
      lowLabel: 'Low',
      highLabel: 'High',
      colorLowLabel: 'Color Low',
      colorInLabel: 'Color In-range',
      colorHighLabel: 'Color High',
      ghostColorLabel: 'Ghost Color',
      showGhostGridLabel: 'Show ghost background grid',
      shakeTitle: 'Shake to Reveal',
      shakeIntro: 'Shake or tap the watch to temporarily replace selected rows for 5 seconds using the same 5-digit look.',
      alertsTitle: 'Alerts and Behaviour',
      alertsIntro: 'Vibration alerts fire at most once per 10 minutes. Disconnect from phone triggers one short buzz automatically.',
      vibeLowLabel: 'Vibrate when BG is low (3 short pulses)',
      vibeHighLabel: 'Vibrate when BG is high (2 short pulses)',
      backlightLabel: 'Turn on backlight when shaking the watch',
      tipText: '<strong>Tip:</strong> Round watches hide the outer slots on the first/last row; data is still sent so every Pebble app stays stable.',
      paletteTitle: 'Compatible palette',
      paletteIntro: 'Only Pebble-safe colors are sent. B/W watches get grayscale steps; Pebble 2 forces white text with mid-gray ghost.',
      reload: 'Reload',
      save: 'Save',
      cancel: 'Cancel',
      row: 'Row',
      color: 'Color',
      secondValue: '2nd value',
      rowsMeta: 'Rows',
      bwMeta: 'B/W',
      colorMeta: 'Color',
      rowTypes: {
        0: 'Weather', 1: 'Time', 2: 'Date', 3: 'Weekday', 4: 'Battery',
        5: 'Nightscout BG', 6: 'Steps', 7: 'Heart Rate', 8: 'BG Time (last)',
        9: 'BG Delta', 10: 'Rain next 3h'
      },
      shakeTypes: {
        '-1': 'Off', '0': 'Weather', '1': 'Time', '2': 'Date', '3': 'Weekday', '4': 'Battery',
        '5': 'Nightscout BG', '6': 'Steps', '7': 'Heart Rate', '8': 'BG Time (last)',
        '9': 'BG Delta', '10': 'Rain next 3h'
      },
      presets: {
        chalk: { label: 'Pebble Time Round', description: '4 rows, strong contrast for the round display.' },
        basalt: { label: 'Pebble Time / Steel', description: 'Full color with high-contrast accents on 5 rows.' },
        diorite: { label: 'Pebble 2 (B/W)', description: 'Black/white only; colors forced to white text with mid-gray ghost.' },
        aplite: { label: 'Pebble Classic (B/W)', description: 'Grayscale palette for strong readability.' },
        time2: { label: 'Pebble Time 2', description: 'Large rectangular display tuned for bigger digits and spacing.' },
        round2: { label: 'Pebble Round 2', description: 'Large round display with 5-row tuned layout.' },
        contrast: { label: 'Color High Contrast', description: 'Maximum contrast for bright environments.' }
      }
    },
    de: {
      language: 'Sprache',
      heroEyebrow: 'supercgm-ns v2.0',
      heroTitle: 'Waehle deine Uhr und konfiguriere alles in einem Schritt',
      heroLede: 'Waehle dein Pebble-Modell fuer die richtige Zeilenzahl (4 bei alter Round, 5 bei rechteckigen Modellen und Round 2) und eine kontrastsichere Palette. Alle Farben werden Pebble-kompatibel quantisiert.',
      heroTag1: 'Funktioniert mit neuer Pebble-App',
      heroTag2: 'Kontraststarke Presets',
      heroTag3: 'Sichere Farbuebertragung',
      presetTitle: 'Uhren-Presets',
      presetIntro: 'Waehle dein Modell. Preset-Wechsel passt Zeilenzahl, Palette (S/W fuer Classic und Pebble 2) und Standardfarben an.',
      rowsTitle: 'Zeilen',
      rowsIntro: 'Waehle pro Zeile Typ und Farbe. Bei Round sind die Aussen-Slots oben/unten ausgeblendet, werden aber fuer stabile Uebertragung weiter gesendet.',
      formatTitle: 'Formatierung',
      formatIntro: 'Alle Farben werden Pebble-sicher quantisiert. Datum, Wochentag-Sprache und Intervalle koennen angepasst werden.',
      leadingZeroLabel: 'Fuehrende Null bei der Uhrzeit',
      dateFormatLabel: 'Datumsformat:',
      weekdayLangLabel: 'Wochentag-Sprache:',
      weekdayDeLabel: 'Deutsch',
      weekdayEnLabel: 'Englisch',
      tempUnitLabel: 'Temperatureinheit:',
      weatherRefreshLabel: 'Wetter-Intervall (Min):',
      bgTitle: 'Nightscout',
      bgIntro: 'Wird nur angezeigt, wenn mindestens eine Zeile Nightscout BG nutzt. URL, Timeout, Intervall, Grenzwerte und Farben setzen. Sync nutzt status.now als Serverzeit und bgs.datetime als Messzeit.',
      bgUrlLabel: 'Nightscout-URL',
      bgTimeoutLabel: 'Timeout (Min)',
      bgRefreshLabel: 'BG-Intervall (Min)',
      syncBgWithIntervalLabel: 'Mit BG-Intervall synchronisieren (Timestamp + 30s)',
      bgManualLabel: 'Manuelles Fetch-Intervall (Min)',
      cgmUnitLabel: 'CGM-Einheit:',
      lowLabel: 'Niedrig',
      highLabel: 'Hoch',
      colorLowLabel: 'Farbe Niedrig',
      colorInLabel: 'Farbe im Bereich',
      colorHighLabel: 'Farbe Hoch',
      ghostColorLabel: 'Ghost-Farbe',
      showGhostGridLabel: 'Ghost-Hintergrundraster anzeigen',
      shakeTitle: 'Shake zum Anzeigen',
      shakeIntro: 'Schuetteln oder Tippen ersetzt ausgewaehlte Zeilen fuer 5 Sekunden im gleichen 5-Digit-Look.',
      alertsTitle: 'Alarme und Verhalten',
      alertsIntro: 'Vibrationen werden hoechstens alle 10 Minuten ausgeloest. Bei Verbindungsabbruch gibt es einen kurzen Vibrationshinweis.',
      vibeLowLabel: 'Vibrieren bei niedrigem BG (3 kurze Pulse)',
      vibeHighLabel: 'Vibrieren bei hohem BG (2 kurze Pulse)',
      backlightLabel: 'Hintergrundlicht beim Schuetteln aktivieren',
      tipText: '<strong>Tipp:</strong> Bei Round sind die Aussen-Slots in der ersten/letzten Zeile versteckt; die Daten werden fuer stabile Pebble-App-Kompatibilitaet trotzdem gesendet.',
      paletteTitle: 'Kompatible Palette',
      paletteIntro: 'Es werden nur Pebble-sichere Farben gesendet. S/W-Modelle nutzen Graustufen; Pebble 2 nutzt weisse Schrift mit mittlerem Ghost-Grau.',
      reload: 'Neu laden',
      save: 'Speichern',
      cancel: 'Abbrechen',
      row: 'Zeile',
      color: 'Farbe',
      secondValue: '2. Wert',
      rowsMeta: 'Zeilen',
      bwMeta: 'S/W',
      colorMeta: 'Farbe',
      rowTypes: {
        0: 'Wetter', 1: 'Uhrzeit', 2: 'Datum', 3: 'Wochentag', 4: 'Batterie',
        5: 'Nightscout BG', 6: 'Schritte', 7: 'Puls', 8: 'BG-Zeit (letzter)',
        9: 'BG-Delta', 10: 'Regen naechste 3h'
      },
      shakeTypes: {
        '-1': 'Aus', '0': 'Wetter', '1': 'Uhrzeit', '2': 'Datum', '3': 'Wochentag', '4': 'Batterie',
        '5': 'Nightscout BG', '6': 'Schritte', '7': 'Puls', '8': 'BG-Zeit (letzter)',
        '9': 'BG-Delta', '10': 'Regen naechste 3h'
      },
      presets: {
        chalk: { label: 'Pebble Time Round', description: '4 Zeilen, starker Kontrast fuer das runde Display.' },
        basalt: { label: 'Pebble Time / Steel', description: 'Volle Farbe mit hohem Kontrast auf 5 Zeilen.' },
        diorite: { label: 'Pebble 2 (S/W)', description: 'Nur Schwarz/Weiss; Farben werden auf weisse Schrift mit Ghost-Grau abgebildet.' },
        aplite: { label: 'Pebble Classic (S/W)', description: 'Graustufenpalette fuer gute Lesbarkeit.' },
        time2: { label: 'Pebble Time 2', description: 'Grosses rechteckiges Display mit groesseren Ziffern und Abstaenden.' },
        round2: { label: 'Pebble Round 2', description: 'Grosses rundes Display mit abgestimmtem 5-Zeilen-Layout.' },
        contrast: { label: 'Farb-High-Contrast', description: 'Maximaler Kontrast fuer helle Umgebungen.' }
      }
    }
  };

  var RowTypes = [
    { id: 0, name: 'Weather' },
    { id: 1, name: 'Time' },
    { id: 2, name: 'Date' },
    { id: 3, name: 'Weekday' },
    { id: 4, name: 'Battery' },
    { id: 5, name: 'Nightscout BG' },
    { id: 6, name: 'Steps' },
    { id: 7, name: 'Heart Rate' },
    { id: 8, name: 'BG Time (last)' },
    { id: 9, name: 'BG Delta' },
    { id: 10, name: 'Rain next 3h' }
  ];

  var ShakeRowTypes = [
    { id: -1, name: 'Off' },
    { id: 0, name: 'Weather' },
    { id: 1, name: 'Time' },
    { id: 2, name: 'Date' },
    { id: 3, name: 'Weekday' },
    { id: 4, name: 'Battery' },
    { id: 5, name: 'Nightscout BG' },
    { id: 6, name: 'Steps' },
    { id: 7, name: 'Heart Rate' },
    { id: 8, name: 'BG Time (last)' },
    { id: 9, name: 'BG Delta' },
    { id: 10, name: 'Rain next 3h' }
  ];

  var Presets = [
    {
      id: 'chalk',
      label: 'Pebble Time Round',
      rows: 4,
      bw: false,
      pebble2: false,
      description: '4 rows, strong contrast for the round display.',
      defaults: {
        rows: [
          { type: 1, color: '#FFFFFF' },
          { type: 5, color: '#00FF00' },
          { type: 0, color: '#00FFFF' },
          { type: 2, color: '#FFFF00' },
          { type: 3, color: '#FFFFFF' }
        ],
        colors: { low: '#FF0000', in: '#00FF00', high: '#FFFF00', ghost: '#555555' }
      }
    },
    {
      id: 'basalt',
      label: 'Pebble Time / Steel',
      rows: 5,
      bw: false,
      pebble2: false,
      description: 'Full color with high-contrast accents on 5 rows.',
      defaults: {
        rows: [
          { type: 1, color: '#FFFFFF' },
          { type: 0, color: '#FF9900' },
          { type: 5, color: '#00FF00' },
          { type: 2, color: '#FFFF00' },
          { type: 3, color: '#FFFFFF' }
        ],
        colors: { low: '#FF0000', in: '#00FF00', high: '#FFFF00', ghost: '#555555' }
      }
    },
    {
      id: 'diorite',
      label: 'Pebble 2 (B/W)',
      rows: 5,
      bw: true,
      pebble2: true,
      description: 'Black/white only; colors forced to white text with mid-gray ghost.',
      defaults: {
        rows: [
          { type: 1, color: '#FFFFFF' },
          { type: 0, color: '#FFFFFF' },
          { type: 2, color: '#FFFFFF' },
          { type: 3, color: '#FFFFFF' },
          { type: 5, color: '#FFFFFF' }
        ],
        colors: { low: '#FFFFFF', in: '#FFFFFF', high: '#FFFFFF', ghost: '#777777' }
      }
    },
    {
      id: 'aplite',
      label: 'Pebble Classic (B/W)',
      rows: 5,
      bw: true,
      pebble2: false,
      description: 'Grayscale palette for strong readability.',
      defaults: {
        rows: [
          { type: 0, color: '#FFFFFF' },
          { type: 1, color: '#FFFFFF' },
          { type: 2, color: '#AAAAAA' },
          { type: 3, color: '#AAAAAA' },
          { type: 5, color: '#FFFFFF' }
        ],
        colors: { low: '#FFFFFF', in: '#AAAAAA', high: '#555555', ghost: '#AAAAAA' }
      }
    },
    {
      id: 'time2',
      label: 'Pebble Time 2',
      rows: 5,
      bw: false,
      pebble2: false,
      description: 'Large rectangular display tuned for bigger digits and spacing.',
      defaults: {
        rows: [
          { type: 1, color: '#FFFFFF' },
          { type: 5, color: '#00FF00' },
          { type: 9, color: '#00FF00' },
          { type: 0, color: '#00FFFF' },
          { type: 3, color: '#FFFFFF' }
        ],
        colors: { low: '#FF0000', in: '#00FF00', high: '#FFFF00', ghost: '#555555' }
      }
    },
    {
      id: 'round2',
      label: 'Pebble Round 2',
      rows: 5,
      bw: false,
      pebble2: false,
      description: 'Large round display with 5-row tuned layout.',
      defaults: {
        rows: [
          { type: 1, color: '#FFFFFF' },
          { type: 5, color: '#00FF00' },
          { type: 9, color: '#00FF00' },
          { type: 0, color: '#00FFFF' },
          { type: 3, color: '#FFFFFF' }
        ],
        colors: { low: '#FF0000', in: '#00FF00', high: '#FFFF00', ghost: '#555555' }
      }
    },
    {
      id: 'contrast',
      label: 'Farb-High-Contrast',
      rows: 5,
      bw: false,
      pebble2: false,
      description: 'Maximaler Kontrast für helle Umgebungen.',
      defaults: {
        rows: [
          { type: 1, color: '#FFFFFF' },
          { type: 0, color: '#FF9900' },
          { type: 5, color: '#00FF00' },
          { type: 2, color: '#FFFF00' },
          { type: 3, color: '#FFFFFF' }
        ],
        colors: { low: '#FF0000', in: '#00FF00', high: '#FFFF00', ghost: '#AAAAAA' }
      }
    }
  ];

  function getParams(){
    try {
      var p = new URLSearchParams(location.search);
      return {
        rows: Math.max(1, Math.min(5, parseInt(p.get('rows')||'5',10))),
        bw: (p.get('bw') === '1'),
        pebble2: (p.get('pebble2') === '1'),
        platform: p.get('platform') || '',
        lang: p.get('lang') || '',
        profile: (p.get('profile') || '').toLowerCase(),
        sw: parseInt(p.get('sw') || '0', 10) || 0,
        sh: parseInt(p.get('sh') || '0', 10) || 0
      };
    } catch(e) { return { rows:5, bw:false, pebble2:false, platform:'', lang:'', profile:'', sw:0, sh:0 }; }
  }
  var params = getParams();
  if (params.pebble2) params.bw = true;

  var state = {
    presetId: null,
    defaultRows: [],
    defaultBgColors: {},
    lang: 'en'
  };

  function getLang() {
    var q = (params.lang || '').toLowerCase();
    if (q === 'de' || q === 'en') return q;
    try {
      var saved = (localStorage.getItem('supercgm_lang') || '').toLowerCase();
      if (saved === 'de' || saved === 'en') return saved;
    } catch (_e) {}
    return 'en';
  }

  function txt(key) {
    return (I18N[state.lang] && I18N[state.lang][key]) || (I18N.en[key] || key);
  }

  function setText(id, value) {
    var el = byId(id);
    if (el) el.textContent = value;
  }

  function setHTML(id, value) {
    var el = byId(id);
    if (el) el.innerHTML = value;
  }

  function setLabelPrefix(label, prefix) {
    if (!label) return;
    if (label.firstChild && label.firstChild.nodeType === Node.TEXT_NODE) {
      label.firstChild.nodeValue = prefix + ' ';
    } else {
      label.insertBefore(document.createTextNode(prefix + ' '), label.firstChild || null);
    }
  }

  function localizeDataModels() {
    RowTypes.forEach(function(rt){ rt.name = txt('rowTypes')[rt.id]; });
    ShakeRowTypes.forEach(function(rt){ rt.name = txt('shakeTypes')[String(rt.id)]; });
    Presets.forEach(function(p){
      if (txt('presets')[p.id]) {
        p.label = txt('presets')[p.id].label;
        p.description = txt('presets')[p.id].description;
      }
    });
  }

  function applyI18nStatic() {
    document.documentElement.lang = state.lang;
    setText('langLabel', txt('language'));
    setText('heroEyebrow', txt('heroEyebrow'));
    setText('heroTitle', txt('heroTitle'));
    setText('heroLede', txt('heroLede'));
    setText('heroTag1', txt('heroTag1'));
    setText('heroTag2', txt('heroTag2'));
    setText('heroTag3', txt('heroTag3'));
    setText('presetTitle', txt('presetTitle'));
    setText('presetIntro', txt('presetIntro'));
    setText('rowsTitle', txt('rowsTitle'));
    setText('rowsIntro', txt('rowsIntro'));
    setText('formatTitle', txt('formatTitle'));
    setText('formatIntro', txt('formatIntro'));
    setText('leadingZeroLabel', txt('leadingZeroLabel'));
    setText('dateFormatLabel', txt('dateFormatLabel'));
    setText('weekdayLangLabel', txt('weekdayLangLabel'));
    setText('weekdayDeLabel', txt('weekdayDeLabel'));
    setText('weekdayEnLabel', txt('weekdayEnLabel'));
    setText('tempUnitLabel', txt('tempUnitLabel'));
    setText('weatherRefreshLabel', txt('weatherRefreshLabel'));
    setText('bgTitle', txt('bgTitle'));
    setText('bgIntro', txt('bgIntro'));
    setText('bgUrlLabel', txt('bgUrlLabel'));
    setText('bgTimeoutLabel', txt('bgTimeoutLabel'));
    setText('bgRefreshLabel', txt('bgRefreshLabel'));
    setText('syncBgWithIntervalLabel', txt('syncBgWithIntervalLabel'));
    setText('bgManualLabel', txt('bgManualLabel'));
    setText('cgmUnitLabel', txt('cgmUnitLabel'));
    setText('lowLabel', txt('lowLabel'));
    setText('highLabel', txt('highLabel'));
    setText('colorLowLabel', txt('colorLowLabel'));
    setText('colorInLabel', txt('colorInLabel'));
    setText('colorHighLabel', txt('colorHighLabel'));
    setText('ghostColorLabel', txt('ghostColorLabel'));
    setText('showGhostGridLabel', txt('showGhostGridLabel'));
    setText('shakeTitle', txt('shakeTitle'));
    setText('shakeIntro', txt('shakeIntro'));
    setText('alertsTitle', txt('alertsTitle'));
    setText('alertsIntro', txt('alertsIntro'));
    setText('vibeLowLabel', txt('vibeLowLabel'));
    setText('vibeHighLabel', txt('vibeHighLabel'));
    setText('backlightLabel', txt('backlightLabel'));
    setHTML('tipText', txt('tipText'));
    setText('paletteTitle', txt('paletteTitle'));
    setText('paletteIntro', txt('paletteIntro'));
    setText('reload', txt('reload'));
    setText('save', txt('save'));
    setText('cancel', txt('cancel'));
  }

  function colorHex(v) {
    var s = v.toString(16).toUpperCase();
    return s.length === 1 ? '0' + s : s;
  }

  function nearestPebbleChannel(v) {
    var levels = [0, 85, 170, 255];
    var best = levels[0];
    var bestDist = Math.abs(v - best);
    for (var i = 1; i < levels.length; i++) {
      var d = Math.abs(v - levels[i]);
      if (d < bestDist) {
        best = levels[i];
        bestDist = d;
      }
    }
    return best;
  }

  function getBWLevels() {
    if (params.platform === 'aplite') {
      return [0, 255];
    }
    return [0, 85, 170, 255];
  }

  function getColorOptions() {
    if (params.bw) {
      return getBWLevels().map(function(level){
        var h = '#' + colorHex(level) + colorHex(level) + colorHex(level);
        return { hex: h, name: h };
      });
    }
    var levels = [0, 85, 170, 255];
    var out = [];
    for (var r = 0; r < levels.length; r++) {
      for (var g = 0; g < levels.length; g++) {
        for (var b = 0; b < levels.length; b++) {
          var hex = '#' + colorHex(levels[r]) + colorHex(levels[g]) + colorHex(levels[b]);
          out.push({ hex: hex, name: hex });
        }
      }
    }
    return out;
  }

  function quantizeToPebble(hex) {
    hex = (hex || '').toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex)) {
      return params.bw ? '#FFFFFF' : '#FFFFFF';
    }
    var r, g, b;
    try {
      r = parseInt(hex.substr(1, 2), 16);
      g = parseInt(hex.substr(3, 2), 16);
      b = parseInt(hex.substr(5, 2), 16);
    } catch (e) {
      return params.bw ? '#FFFFFF' : '#FFFFFF';
    }
    if (params.bw) {
      var bw = getBWLevels();
      var lum = (r * 3 + g * 6 + b) / 10; // perceptual weight similar to watch code
      var idx = Math.round((lum / 255) * (bw.length - 1));
      if (idx < 0) idx = 0;
      if (idx >= bw.length) idx = bw.length - 1;
      var grey = bw[idx];
      return '#' + colorHex(grey) + colorHex(grey) + colorHex(grey);
    }
    r = nearestPebbleChannel(r);
    g = nearestPebbleChannel(g);
    b = nearestPebbleChannel(b);
    return '#' + colorHex(r) + colorHex(g) + colorHex(b);
  }

  function colorFriendlyName(hex) {
    var h = (hex || '').toUpperCase();
    var names = {
      '#FFFFFF': 'White', '#000000': 'Black', '#FF0000': 'Red', '#00FF00': 'Green',
      '#0000FF': 'Blue', '#FFFF00': 'Yellow', '#00FFFF': 'Cyan', '#FF00FF': 'Magenta',
      '#FF9900': 'Orange', '#AAAAAA': 'Light Gray', '#555555': 'Dark Gray', '#777777': 'Gray'
    };
    return names[h] || h;
  }

  function updateColorMetaForInput(inp) {
    if (!inp) return;
    var hostLabel = inp.closest('label');
    if (!hostLabel) return;
    var meta = hostLabel.querySelector('.color-meta');
    if (!meta) return;
    var sw = meta.querySelector('.swatch-preview');
    var name = meta.querySelector('.color-name');
    var q = quantizeToPebble(inp.value || '#FFFFFF');
    if (sw) sw.style.background = q;
    if (name) name.textContent = colorFriendlyName(q) + ' (' + q + ')';
  }

  function applyPebble2Colors(payload) {
    if (!params.pebble2 || !payload) return payload;
    if (!payload.colors) payload.colors = {};
    payload.colors.low = '#FFFFFF';
    payload.colors.in = '#FFFFFF';
    payload.colors.high = '#FFFFFF';
    payload.colors.ghost = quantizeToPebble(payload.colors.ghost || '#555555');
    if (Array.isArray(payload.rows)) {
      payload.rows = payload.rows.map(function(row){
        if (!row || typeof row !== 'object') return { type: 0, color: '#FFFFFF' };
        row.color = '#FFFFFF';
        return row;
      });
    }
    return payload;
  }

  function buildDefaults(preset) {
    var defaults = preset && preset.defaults ? preset.defaults : null;
    var baseRows = defaults ? defaults.rows : [
      { type: 0, color: '#00FFFF' },
      { type: 1, color: '#FFFFFF' },
      { type: 2, color: '#AAAAAA' },
      { type: 3, color: '#AAAAAA' },
      { type: 5, color: '#00FF00' }
    ];
    var rows = [];
    for (var i = 0; i < 5; i++) {
      rows.push(baseRows[i] || { type: 0, color: '#FFFFFF' });
    }
    var colors = defaults && defaults.colors ? defaults.colors : (params.bw ? (params.pebble2 ? {
      low: '#FFFFFF',
      in: '#FFFFFF',
      high: '#FFFFFF',
      ghost: '#777777'
    } : {
      low: '#FFFFFF',
      in: '#AAAAAA',
      high: '#555555',
      ghost: '#AAAAAA'
    }) : {
      low: '#FF0000',
      in: '#00FF00',
      high: '#FFFF00',
      ghost: '#555555'
    });
    state.defaultRows = rows;
    state.defaultBgColors = colors;
  }

  function selectPreset(initial) {
    var preset = null;
    var profile = (params.profile || '').toLowerCase();

    if (profile === 'round2') {
      preset = Presets.find(function(p){ return p.id === 'round2'; }) || null;
    } else if (profile === 'time2') {
      preset = Presets.find(function(p){ return p.id === 'time2'; }) || null;
    }

    if (initial) {
      for (var i = 0; i < Presets.length; i++) {
        if (Presets[i].id === initial) { preset = Presets[i]; break; }
      }
    }
    if (!preset && params.platform) {
      for (var j = 0; j < Presets.length; j++) {
        if (Presets[j].id === params.platform) { preset = Presets[j]; break; }
      }
    }
    if (!preset) {
      var platform = params.platform || '';
      if (platform === 'chalk') preset = Presets[0];
      else if (platform === 'aplite') preset = Presets[3];
      else if (platform === 'diorite') preset = Presets[2];
      else if (platform === 'emery') preset = Presets.find(function(p){ return p.id === 'time2'; }) || Presets[1];
      else if (platform === 'gabbro') preset = Presets.find(function(p){ return p.id === 'round2'; }) || Presets[0];
      else preset = Presets[1];
    }
    state.presetId = preset.id;
    if (profile === 'round2') params.rows = 5; // one more row than legacy round
    else if (profile === 'time2') params.rows = 5;
    else params.rows = preset.rows;
    params.bw = preset.bw;
    params.pebble2 = preset.pebble2;
    buildDefaults(preset);
  }

  function applyDeviceProfile() {
    var b = document.body;
    if (!b) return;
    b.classList.remove('profile-time2');
    b.classList.remove('profile-round2');
    if (params.profile === 'time2') b.classList.add('profile-time2');
    if (params.profile === 'round2') b.classList.add('profile-round2');
  }

  function updateBGFetchModeUI() {
    var sync = byId('syncBgWithInterval');
    var wrap = byId('bgManualWrap');
    if (!sync || !wrap) return;
    wrap.style.display = sync.checked ? 'none' : '';
  }

  function renderPresetGrid() {
    var grid = document.getElementById('preset-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Presets.forEach(function(p){
      var btn = document.createElement('button');
      btn.className = 'preset-card' + (p.id === state.presetId ? ' active' : '');
      btn.setAttribute('type','button');
      btn.setAttribute('data-preset', p.id);
        btn.innerHTML = '<div class="preset-label">'+p.label+'</div><div class="preset-desc">'+p.description+'</div><div class="preset-meta">'+(p.rows)+' '+txt('rowsMeta')+' · '+(p.bw?txt('bwMeta'):txt('colorMeta'))+'</div>';
      btn.onclick = function(){
        selectPreset(p.id);
        buildRowsForm(true);
        buildShakeRowsForm(true);
        renderPresetGrid();
        rebuildColorPickers();
        updateBGSectionVisibility();
      };
      grid.appendChild(btn);
    });
  }

  function byId(id){return document.getElementById(id);}  

  function supportsColorInput() {
    var input = document.createElement('input');
    input.setAttribute('type', 'color');
    return input.type === 'color';
  }

  function forEachNode(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  function buildRowsForm(resetValues) {
    var form = byId('rows-form');
    var typeSelects = form.querySelectorAll('select.row-type');
    var rowlines = form.querySelectorAll('.rowline');
    forEachNode(rowlines, function(div, idx){ div.style.display = (idx < params.rows) ? '' : 'none'; });
    forEachNode(rowlines, function(div, idx){
      var labels = div.querySelectorAll('label');
      setLabelPrefix(labels[0], txt('row') + ' ' + (idx + 1));
      setLabelPrefix(labels[1], txt('color'));
    });
    forEachNode(typeSelects, function(sel, idx){
      sel.innerHTML = '';
      RowTypes.forEach(function(rt){
        var o = document.createElement('option');
        o.value = rt.id; o.textContent = rt.name; sel.appendChild(o);
      });
      if (resetValues && idx < params.rows) sel.value = String(state.defaultRows[idx].type);
    });
    var colorInputs = form.querySelectorAll('input.row-color');
    var colorFallbacks = form.querySelectorAll('select.row-color-fallback');
    var useFallback = !supportsColorInput();
    forEachNode(colorFallbacks, function(sel, idx){
      sel.innerHTML = '';
      getColorOptions().forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex;
        o.textContent = opt.name + ' (' + opt.hex + ')';
        sel.appendChild(o);
      });
      if (resetValues && idx < params.rows) sel.value = state.defaultRows[idx].color;
    });
    forEachNode(colorInputs, function(inp, idx){
      if (resetValues && idx < params.rows) inp.value = state.defaultRows[idx].color;
      inp.setAttribute('list','palette-list');
      inp.addEventListener('change', function(){ inp.value = quantizeToPebble(inp.value); updateColorMetaForInput(inp); });
      inp.addEventListener('input', function(){ updateColorMetaForInput(inp); });
      if (useFallback) {
        inp.hidden = true;
        colorFallbacks[idx].hidden = false;
        if (resetValues && idx < params.rows) colorFallbacks[idx].value = state.defaultRows[idx].color;
      } else {
        inp.hidden = false;
        if (colorFallbacks[idx]) colorFallbacks[idx].hidden = true;
      }
      updateColorMetaForInput(inp);
    });
  }

  function buildShakeRowsForm(resetValues) {
    var form = byId('shake-rows-form');
    if (!form) return;
    var rowlines = form.querySelectorAll('.shake-rowline');
    forEachNode(rowlines, function(div, idx){ div.style.display = (idx < params.rows) ? '' : 'none'; });
    forEachNode(rowlines, function(div, idx){
      var labels = div.querySelectorAll('label');
      setLabelPrefix(labels[0], txt('row') + ' ' + (idx + 1) + ' ' + txt('secondValue'));
    });
    var selects = form.querySelectorAll('select.shake-row-type');
    forEachNode(selects, function(sel){
      sel.innerHTML = '';
      ShakeRowTypes.forEach(function(rt){
        var o = document.createElement('option');
        o.value = rt.id;
        o.textContent = rt.name;
        sel.appendChild(o);
      });
      if (resetValues) sel.value = '-1';
    });
  }

  function collectRows() {
    var form = byId('rows-form');
    var typeSelects = form.querySelectorAll('select.row-type');
    var colorInputs = form.querySelectorAll('input.row-color');
    var colorFallbacks = form.querySelectorAll('select.row-color-fallback');
    var useFallback = !supportsColorInput();
    var rows = [];
    for (var i=0;i<params.rows;i++) {
      var type = parseInt(typeSelects[i].value,10);
      var color = useFallback ? colorFallbacks[i].value : colorInputs[i].value;
      if (params.pebble2) {
        color = '#FFFFFF';
      }
      rows.push({ type:type, color:quantizeToPebble(color) });
    }
    return rows;
  }

  function normalizedRows(rows) {
    var result = [];
    var base = state.defaultRows;
    for (var i=0;i<5;i++) {
      var src = rows[i] || base[i] || { type: 0, color: '#FFFFFF' };
      var color = params.pebble2 ? '#FFFFFF' : quantizeToPebble(src.color);
      result.push({ type: src.type, color: color });
    }
    return result;
  }

  function normalizedShakeRows(shakeRows) {
    var out = [];
    for (var i = 0; i < 5; i++) {
      var v = (shakeRows && shakeRows[i] !== undefined) ? parseInt(shakeRows[i], 10) : -1;
      if (!isFinite(v)) v = -1;
      if (v < -1) v = -1;
      if (v > 10) v = 10;
      out.push(v);
    }
    return out;
  }

  function collectShakeRows() {
    var form = byId('shake-rows-form');
    if (!form) return normalizedShakeRows(null);
    var selects = form.querySelectorAll('select.shake-row-type');
    var rows = [];
    for (var i = 0; i < 5; i++) {
      var v = -1;
      if (selects[i]) v = parseInt(selects[i].value, 10);
      rows.push(isFinite(v) ? v : -1);
    }
    return normalizedShakeRows(rows);
  }

  function updateBGSectionVisibility() {
    var rows = collectRows();
    var anyBG = rows.some(function(r){ return r.type === 5; });
    var nsSection = byId('bg-section');
    if (nsSection) nsSection.style.display = anyBG ? '' : 'none';
  }

  function rebuildColorPickers() {
    var useFallback = !supportsColorInput();
    ['colLowFallback','colInFallback','colHighFallback','ghostFallback'].forEach(function(id){
      var sel = byId(id);
      if (!sel) return;
      sel.innerHTML = '';
      var opts = getColorOptions();
      opts.forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex; o.textContent = opt.name + ' (' + opt.hex + ')'; sel.appendChild(o);
      });
      sel.hidden = !useFallback;
    });
    var bgKeyById = { colLow: 'low', colIn: 'in', colHigh: 'high', ghost: 'ghost' };
    ['colLow','colIn','colHigh','ghost'].forEach(function(id){
      var input = byId(id);
      var sel = byId(id+'Fallback');
      var key = bgKeyById[id];
      var defaultValue = quantizeToPebble(state.defaultBgColors[key]);
      if (input) {
        input.value = defaultValue;
        input.setAttribute('list','palette-list');
        input.addEventListener('change', function(){ input.value = quantizeToPebble(input.value); updateColorMetaForInput(input); });
        input.addEventListener('input', function(){ updateColorMetaForInput(input); });
        input.hidden = useFallback && !!sel;
        if (!useFallback) input.hidden = false;
        updateColorMetaForInput(input);
      }
      if (sel) {
        sel.value = defaultValue;
        sel.hidden = !useFallback;
      }
    });
    try {
      var legend = byId('color-legend-list');
      legend.innerHTML = '';
      getColorOptions().forEach(function(opt){
        var li = document.createElement('li');
        li.innerHTML = '<span class="swatch" style="background:'+opt.hex+';'+(opt.hex==='#FFFFFF'||opt.hex==='#000000'?'border:1px solid #ccc;':'')+'"></span>'+opt.name+' ('+opt.hex+')';
        legend.appendChild(li);
      });
    } catch(e) {}
    try {
      var dl = byId('palette-list');
      dl.innerHTML = '';
      getColorOptions().forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex; o.label = opt.name; dl.appendChild(o);
      });
    } catch(e) {}
  }

  function save() {
    var rows = normalizedRows(collectRows());
    var useFallback = !supportsColorInput();
    var colLow = quantizeToPebble(useFallback ? byId('colLowFallback').value : byId('colLow').value);
    var colIn  = quantizeToPebble(useFallback ? byId('colInFallback').value  : byId('colIn').value);
    var colHigh= quantizeToPebble(useFallback ? byId('colHighFallback').value: byId('colHigh').value);
    var ghost  = quantizeToPebble(useFallback ? byId('ghostFallback').value  : byId('ghost').value);
    if (params.pebble2) {
      colLow = '#FFFFFF';
      colIn = '#FFFFFF';
      colHigh = '#FFFFFF';
    }
    var payload = {
      showLeadingZero: byId('leadingZero').checked,
      dateFormat: parseInt(document.querySelector('input[name="datefmt"]:checked').value,10),
      weekdayLang: parseInt(document.querySelector('input[name="wdlang"]:checked').value,10),
      tempUnit: document.querySelector('input[name="tempunit"]:checked').value,
      weatherIntervalMin: parseInt(byId('weatherInt').value,10),
      bgFetchIntervalMin: parseInt(byId('bgFetchInt').value,10),
      syncBgWithInterval: byId('syncBgWithInterval').checked,
      bgManualIntervalMin: parseInt(byId('bgManualInt').value,10),
      bgUrl: byId('bgUrl').value.trim(),
      bgTimeoutMin: parseInt(byId('bgTimeout').value,10),
      bgUnit: document.querySelector('input[name="bgunit"]:checked').value,
      low: parseInt(byId('low').value,10),
      high: parseInt(byId('high').value,10),
      colors: {
        low: colLow,
        in: colIn,
        high: colHigh,
        ghost: ghost
      },
      showGhostGrid: byId('showGhostGrid').checked,
      rows: rows,
      shakeRows: collectShakeRows(),
      preset: state.presetId,
      vibeOnLow:        byId('vibeOnLow').checked,
      vibeOnHigh:       byId('vibeOnHigh').checked,
      backlightOnShake: byId('backlightOnShake').checked
    };
    payload = applyPebble2Colors(payload);
    try { localStorage.setItem('supercgm_config', JSON.stringify(payload)); } catch(e) {}
    document.location = 'pebblejs://close#' + encodeURIComponent(JSON.stringify(payload));
  }

  function reloadLatest() {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('_ts', Date.now().toString());
      window.location.href = url.toString();
    } catch (e) {
      try {
        var base = window.location.href.split('#')[0];
        var sep = base.indexOf('?') === -1 ? '?' : '&';
        window.location.href = base + sep + '_ts=' + Date.now();
      } catch (_) {
        window.location.reload();
      }
    }
  }

  function cancel(){ document.location = 'pebblejs://close'; }

  function restoreSaved() {
    try {
      var saved = localStorage.getItem('supercgm_config');
      if (!saved) return;
      var cfg = JSON.parse(saved);
      if (cfg && cfg.preset) selectPreset(cfg.preset);
      cfg = applyPebble2Colors(cfg);
      byId('leadingZero').checked = !!cfg.showLeadingZero;
      document.querySelector('input[name="datefmt"][value="'+(cfg.dateFormat||0)+'"]').checked = true;
      document.querySelector('input[name="wdlang"][value="'+(cfg.weekdayLang||0)+'"]').checked = true;
      document.querySelector('input[name="tempunit"][value="'+(cfg.tempUnit||'C')+'"]').checked = true;
      byId('weatherInt').value = cfg.weatherIntervalMin || 30;
      byId('bgUrl').value = cfg.bgUrl || '';
      byId('bgTimeout').value = cfg.bgTimeoutMin || 20;
      byId('bgFetchInt').value = cfg.bgFetchIntervalMin || 5;
      byId('syncBgWithInterval').checked = cfg.syncBgWithInterval !== false;
      byId('bgManualInt').value = cfg.bgManualIntervalMin || 5;
      updateBGFetchModeUI();
      document.querySelector('input[name="bgunit"][value="'+(cfg.bgUnit||'mgdl')+'"]').checked = true;
      byId('low').value = cfg.low || 80;
      byId('high').value = cfg.high || 180;
      var applyColorValue = function(id, value) {
        var input = byId(id);
        var sel = byId(id + 'Fallback');
        var quant = quantizeToPebble(value);
        if (input) input.value = quant;
        if (sel) sel.value = quant;
        updateColorMetaForInput(input);
      };
      applyColorValue('colLow', (cfg.colors && cfg.colors.low) || state.defaultBgColors.low);
      applyColorValue('colIn', (cfg.colors && cfg.colors.in) || state.defaultBgColors.in);
      applyColorValue('colHigh', (cfg.colors && cfg.colors.high) || state.defaultBgColors.high);
      applyColorValue('ghost', (cfg.colors && cfg.colors.ghost) || state.defaultBgColors.ghost);
      if (byId('showGhostGrid')) byId('showGhostGrid').checked = cfg.showGhostGrid !== false;
      var shakeRows = normalizedShakeRows(cfg.shakeRows || []);
      var shakeForm = byId('shake-rows-form');
      if (shakeForm) {
        var shakeSelects = shakeForm.querySelectorAll('select.shake-row-type');
        for (var s = 0; s < 5; s++) {
          if (shakeSelects[s]) shakeSelects[s].value = String(shakeRows[s]);
        }
      }
      if (byId('vibeOnLow'))        byId('vibeOnLow').checked        = !!cfg.vibeOnLow;
      if (byId('vibeOnHigh'))       byId('vibeOnHigh').checked       = !!cfg.vibeOnHigh;
      if (byId('backlightOnShake')) byId('backlightOnShake').checked = cfg.backlightOnShake !== false;
      var form = byId('rows-form');
      var typeSelects = form.querySelectorAll('select.row-type');
      var colorInputs = form.querySelectorAll('input.row-color');
      var colorFallbacks = form.querySelectorAll('select.row-color-fallback');
      var rows = normalizedRows(cfg.rows || []);
      for (var i=0;i<5;i++) {
        if (typeSelects[i]) typeSelects[i].value = String(rows[i].type);
        if (colorInputs[i]) colorInputs[i].value = rows[i].color;
        if (colorFallbacks[i]) colorFallbacks[i].value = rows[i].color;
      }
      if (params.pebble2) {
        try { localStorage.setItem('supercgm_config', JSON.stringify(cfg)); } catch(e) {}
      }
    } catch(e) {}
  }

  function init() {
    state.lang = getLang();
    localizeDataModels();
    applyI18nStatic();
    applyDeviceProfile();
    selectPreset(params.platform || null);
    buildRowsForm(true);
    buildShakeRowsForm(true);
    renderPresetGrid();
    rebuildColorPickers();
    restoreSaved();
    byId('rows-form').addEventListener('change', function(e){
      if (e.target && (e.target.classList.contains('row-type'))) updateBGSectionVisibility();
    });
    updateBGSectionVisibility();
    updateBGFetchModeUI();
    byId('save').onclick=save;
    byId('cancel').onclick=cancel;
    if (byId('syncBgWithInterval')) {
      byId('syncBgWithInterval').addEventListener('change', updateBGFetchModeUI);
    }
    var reloadBtn = byId('reload');
    if (reloadBtn) reloadBtn.onclick = reloadLatest;
    var langChooser = byId('langChooser');
    if (langChooser) {
      langChooser.value = state.lang;
      langChooser.onchange = function() {
        var newLang = (langChooser.value === 'de') ? 'de' : 'en';
        state.lang = newLang;
        try { localStorage.setItem('supercgm_lang', newLang); } catch (_e) {}
        localizeDataModels();
        applyI18nStatic();
        buildRowsForm(false);
        buildShakeRowsForm(false);
        renderPresetGrid();
      };
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})(); 
