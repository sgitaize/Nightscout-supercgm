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
      ghostDensityLabel: 'Ghost dot density',
      ghostDensityPreviewLabel: 'Preview',
      ghostDensityNames: ['very light', 'light', 'medium', 'dense', 'very dense'],
      previewMainLabel: 'Main rows',
      previewShakeLabel: 'Shake rows',
      previewToggleToShake: 'Show shake preview',
      previewToggleToMain: 'Show main preview',
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
      ghostDensityLabel: 'Ghost-Punktdichte',
      ghostDensityPreviewLabel: 'Vorschau',
      ghostDensityNames: ['sehr duenn', 'duenn', 'mittel', 'dicht', 'sehr dicht'],
      previewMainLabel: 'Hauptzeilen',
      previewShakeLabel: 'Shake-Zeilen',
      previewToggleToShake: 'Shake-Vorschau zeigen',
      previewToggleToMain: 'Hauptvorschau zeigen',
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
        colors: { low: '#FFFFFF', in: '#FFFFFF', high: '#FFFFFF', ghost: '#AAAAAA' }
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
        colors: { low: '#FFFFFF', in: '#AAAAAA', high: '#555555', ghost: '#555555' }
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
    activePlatform: '',
    defaultRows: [],
    defaultBgColors: {},
    lang: 'en',
    previewMode: 'main'
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
    setText('ghostDensityLabel', txt('ghostDensityLabel'));
    setText('ghostPreviewTitle', txt('ghostDensityPreviewLabel'));
    updatePreviewModeUI();
    updateGhostDensityLabel();
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
    var platform = state.activePlatform || params.platform || '';
    if (platform === 'aplite') {
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

  function getGhostColorOptions() {
    if (params.bw && (state.activePlatform || params.platform) === 'aplite') {
      return [
        { hex: '#555555', name: '#555555' },
        { hex: '#FFFFFF', name: '#FFFFFF' }
      ];
    }
    return getColorOptions();
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

  function quantizeGhostToPebble(hex) {
    var q = quantizeToPebble(hex);
    if (params.bw && (state.activePlatform || params.platform) === 'aplite' && q === '#000000') {
      // Aplite ghost should stay at darkest non-black shade.
      return '#555555';
    }
    return q;
  }

  function updateGhostDensityLabel() {
    var el = byId('ghostDensity');
    var lbl = byId('ghostDensityValue');
    if (!el || !lbl) return;
    var d = parseInt(el.value, 10) || 3;
    var names = (I18N[state.lang] && I18N[state.lang].ghostDensityNames) || I18N.en.ghostDensityNames;
    lbl.textContent = names[(d - 1)] || d;
  }

  function updatePreviewModeUI() {
    var stateEl = byId('previewModeState');
    var btn = byId('previewModeToggle');
    var isShake = state.previewMode === 'shake';
    if (stateEl) stateEl.textContent = isShake ? txt('previewShakeLabel') : txt('previewMainLabel');
    if (btn) btn.textContent = isShake ? txt('previewToggleToMain') : txt('previewToggleToShake');
  }

  function slotHiddenOnRound(row, col, rowsCount, isRound) {
    return !!(isRound && (row === 0 || row === (rowsCount - 1)) && (col === 0 || col === 4));
  }

  function toSlots5(text) {
    var out = [' ', ' ', ' ', ' ', ' '];
    var s = String(text || '');
    for (var i = 0; i < 5 && i < s.length; i++) out[i] = s.charAt(i);
    return out;
  }

  function sampleSlotsForType(type) {
    var isDe = state.lang === 'de';
    switch (type) {
      case 0: return toSlots5(' 21 C');
      case 1: return toSlots5('14:37');
      case 2: {
        var fmt = parseInt((document.querySelector('input[name="datefmt"]:checked') || { value: '0' }).value, 10) || 0;
        return toSlots5(fmt === 0 ? '15/05' : '05/15');
      }
      case 3: return toSlots5(isDe ? '  MIT' : '  WED');
      case 4: return toSlots5(' 84% ');
      case 5: return toSlots5(' 118 ');
      case 6: return toSlots5(' 7420');
      case 7: return toSlots5('HR072');
      case 8: return toSlots5(' 1328');
      case 9: return toSlots5(' +12 ');
      case 10: return toSlots5('R 40 ');
      default: return toSlots5('     ');
    }
  }

  function getPreviewRowsData(rowsCount) {
    var rows = normalizedRows(collectRows());
    var shakeRows = collectShakeRows();
    var active = [];
    for (var i = 0; i < rowsCount; i++) {
      var base = rows[i] || { type: 0, color: '#FFFFFF' };
      var t = base.type;
      if (state.previewMode === 'shake' && shakeRows[i] !== undefined && shakeRows[i] >= 0) t = shakeRows[i];
      active.push({ type: t, color: quantizeToPebble(base.color), slots: sampleSlotsForType(t) });
    }
    return active;
  }

  function drawSegment(ctx, x, y, w, h, seg, color) {
    var t = Math.max(1, Math.floor(Math.min(w, h) / 8));
    var inset = Math.max(1, Math.floor(t / 2));
    var x0 = x + inset;
    var x1 = x + w - inset;
    var y0 = y + inset;
    var y1 = y + h - inset;
    var xm = Math.floor((x0 + x1) / 2);
    var ym = Math.floor((y0 + y1) / 2);
    ctx.fillStyle = color;
    switch (seg) {
      case 'A': ctx.fillRect(x0 + t, y0, Math.max(1, x1 - x0 - 2 * t), t); break;
      case 'B': ctx.fillRect(x1 - t, y0 + t, t, Math.max(1, ym - y0 - t)); break;
      case 'C': ctx.fillRect(x1 - t, ym + t, t, Math.max(1, y1 - ym - 2 * t)); break;
      case 'D': ctx.fillRect(x0 + t, y1 - t, Math.max(1, x1 - x0 - 2 * t), t); break;
      case 'E': ctx.fillRect(x0, ym + t, t, Math.max(1, y1 - ym - 2 * t)); break;
      case 'F': ctx.fillRect(x0, y0 + t, t, Math.max(1, ym - y0 - t)); break;
      case 'G': ctx.fillRect(x0 + t, ym - Math.floor(t / 2), Math.max(1, x1 - x0 - 2 * t), t); break;
      case 'DP': ctx.fillRect(x1 - t, y1 - t, t, t); break;
    }
  }

  function drawSegmentGlyph(ctx, ch, x, y, w, h, color) {
    var c = String(ch || ' ').toUpperCase();
    if (c === '+') {
      ctx.fillStyle = color;
      var barH = Math.max(1, Math.floor(h * 0.12));
      var barW = Math.max(1, Math.floor(w * 0.56));
      var barX = x + Math.floor((w - barW) / 2);
      var barY = y + Math.floor((h - barH) / 2);
      ctx.fillRect(barX, barY, barW, barH);
      var vW = Math.max(1, Math.floor(w * 0.12));
      var vH = Math.max(1, Math.floor(h * 0.56));
      var vX = x + Math.floor((w - vW) / 2);
      var vY = y + Math.floor((h - vH) / 2);
      ctx.fillRect(vX, vY, vW, vH);
      return;
    }
    if (c === '-') {
      ctx.fillStyle = color;
      var dashH = Math.max(1, Math.floor(h * 0.12));
      var dashW = Math.max(1, Math.floor(w * 0.56));
      var dashX = x + Math.floor((w - dashW) / 2);
      var dashY = y + Math.floor((h - dashH) / 2);
      ctx.fillRect(dashX, dashY, dashW, dashH);
      return;
    }
    var map = {
      '0': ['A','B','C','D','E','F'],
      '1': ['B','C'],
      '2': ['A','B','G','E','D'],
      '3': ['A','B','G','C','D'],
      '4': ['F','G','B','C'],
      '5': ['A','F','G','C','D'],
      '6': ['A','F','E','D','C','G'],
      '7': ['A','B','C'],
      '8': ['A','B','C','D','E','F','G'],
      '9': ['A','B','C','D','F','G'],
      '0': ['A','B','C','D','E','F'],
      '=': ['G','D'],
      '_': ['D'],
      'C': ['A','F','E','D'],
      'F': ['A','F','E','G'],
      'H': ['F','E','G','B','C'],
      'R': ['A','F','E','G','B','C'],
      'P': ['A','B','F','E','G'],
      'M': ['F','B','E','C'],
      'U': ['F','E','D','B','C'],
      'N': ['F','E','B','C'],
      'O': ['A','B','C','D','E','F'],
      'D': ['B','C','D','E','G'],
      'E': ['A','F','E','D','G'],
      'W': null,
      'T': ['A','G'],
      'S': ['A','F','G','C','D'],
      'G': ['A','F','E','D','C'],
      '/': ['B','E'],
      '%': null,
      ':': null,
      ' ': []
    };
    if (c === ':') {
      var dot = Math.max(1, Math.floor(Math.min(w, h) / 8));
      ctx.fillStyle = color;
      ctx.fillRect(x + Math.floor(w / 2) - Math.floor(dot / 2), y + Math.floor(h / 3), dot, dot);
      ctx.fillRect(x + Math.floor(w / 2) - Math.floor(dot / 2), y + Math.floor(h * 2 / 3), dot, dot);
      return;
    }
    if (c === '%') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + Math.floor(w * 0.28), y + Math.floor(h * 0.32), Math.max(1, Math.floor(Math.min(w, h) * 0.08)), 0, Math.PI * 2);
      ctx.arc(x + Math.floor(w * 0.72), y + Math.floor(h * 0.68), Math.max(1, Math.floor(Math.min(w, h) * 0.08)), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + Math.floor(w * 0.25), y + Math.floor(h * 0.18), Math.max(1, Math.floor(w * 0.06)), Math.floor(h * 0.70));
      return;
    }
    var segs = map[c];
    if (segs) {
      segs.forEach(function(seg) { drawSegment(ctx, x, y, w, h, seg, color); });
      return;
    }
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = 'bold ' + Math.max(8, Math.floor(h * 0.42)) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c, x + Math.floor(w / 2), y + Math.floor(h / 2) + 1);
    ctx.restore();
  }

  function drawFontGlyph(ctx, ch, x, y, w, h, color, weight) {
    var c = String(ch || ' ');
    if (c === ' ') return;
    if (c === '+') {
      ctx.save();
      ctx.fillStyle = color;
      var plusH = Math.max(1, Math.floor(h * 0.08));
      var plusW = Math.max(1, Math.floor(w * 0.42));
      var plusX = x + Math.floor((w - plusW) / 2);
      var plusY = y + Math.floor((h - plusH) / 2);
      ctx.fillRect(plusX, plusY, plusW, plusH);

      var stemW = Math.max(1, Math.floor(w * 0.08));
      var stemH = Math.max(1, Math.floor(h * 0.48));
      var stemX = x + Math.floor((w - stemW) / 2);
      var stemY = y + Math.floor((h - stemH) / 2);
      ctx.fillRect(stemX, stemY, stemW, stemH);
      ctx.restore();
      return;
    }
    if (c === 'W') {
      ctx.save();
      ctx.fillStyle = color;
      var wSize = Math.max(8, Math.floor(h * 0.74));
      ctx.translate(x + Math.floor(w / 2), y + Math.floor(h / 2) + 1);
      ctx.scale(1.22, 1);
      ctx.font = (weight || 700) + ' ' + wSize + 'px DSEG14Web, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('W', 0, 0);
      ctx.restore();
      return;
    }
    var size = Math.max(8, Math.floor(h * 0.74));
    var family = 'DSEG14Web, sans-serif';
    var canUseDseg = true;
    try {
      if (document.fonts && document.fonts.check) {
        canUseDseg = document.fonts.check((weight || 700) + ' ' + size + 'px DSEG14Web');
      }
    } catch (_e) {}
    if (!canUseDseg) {
      drawSegmentGlyph(ctx, c, x, y, w, h, color);
      return;
    }
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = (weight || 700) + ' ' + size + 'px ' + family;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c, x + Math.floor(w / 2), y + Math.floor(h / 2) + 1);
    ctx.restore();
  }

  function drawGhostPreview() {
    var canvas = byId('ghostPreviewCanvas');
    if (!canvas || !canvas.getContext) return;
    var platform = (state.activePlatform || params.platform || '').toLowerCase();
    var isRound = (platform === 'chalk' || platform === 'gabbro' || platform === 'round2');
    var simW = params.sw || (isRound ? 180 : 144);
    var simH = params.sh || (isRound ? 180 : 168);
    if (canvas.width !== simW) canvas.width = simW;
    if (canvas.height !== simH) canvas.height = simH;
    canvas.style.width = Math.round(simW * 1.1) + 'px';
    canvas.style.height = Math.round(simH * 1.1) + 'px';
    var ctx = canvas.getContext('2d');
    var ROWS_COUNT = params.rows || 5;
    var COLS = 5;
    var W = canvas.width;
    var H = canvas.height;
    var density = parseInt((byId('ghostDensity') || {}).value || '3', 10);
    if (density < 1) density = 1;
    if (density > 5) density = 5;
    var steps = [8, 6, 4, 3, 2];
    var step = steps[density - 1];
    var useFallback = params.bw || !supportsColorInput();
    var ghostEl = byId('ghost');
    var ghostFallEl = byId('ghostFallback');
    var ghostHex = useFallback
      ? ((ghostFallEl && ghostFallEl.value) || '#555555')
      : ((ghostEl && ghostEl.value) || '#555555');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    if (isRound) {
      ctx.save();
      ctx.beginPath();
      var r = Math.min(W, H) / 2 - 2;
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      var r2 = Math.min(W, H) / 2 - 2;
      ctx.arc(W / 2, H / 2, r2, 0, Math.PI * 2);
      ctx.clip();
    }
    var slotW = Math.floor(W / COLS);
    var rowH = Math.floor(H / ROWS_COUNT);
    var leftPad = Math.floor((W - slotW * COLS) / 2);
    var rowsData = getPreviewRowsData(ROWS_COUNT);
    ctx.fillStyle = ghostHex;
    for (var row = 0; row < ROWS_COUNT; row++) {
      for (var col = 0; col < COLS; col++) {
        if (slotHiddenOnRound(row, col, ROWS_COUNT, isRound)) continue;
        var sx = leftPad + col * slotW;
        var sy = row * rowH;
        var mx = Math.max(1, Math.floor(slotW / 5));
        var my = Math.max(1, Math.floor(rowH / 7));
        var x0 = sx + mx;
        var x1 = sx + slotW - mx - 1;
        var y0 = sy + my;
        var y1 = sy + rowH - my - 1;
        var ym = Math.floor((y0 + y1) / 2);
        for (var x = x0; x <= x1; x += step) {
          ctx.fillRect(x, y0, 1, 1);
          ctx.fillRect(x, ym, 1, 1);
          ctx.fillRect(x, y1, 1, 1);
        }
        for (var y = y0 + step; y <= ym - step; y += step) {
          ctx.fillRect(x0, y, 1, 1);
          ctx.fillRect(x1, y, 1, 1);
        }
        for (var y2 = ym + step; y2 <= y1 - step; y2 += step) {
          ctx.fillRect(x0, y2, 1, 1);
          ctx.fillRect(x1, y2, 1, 1);
        }
      }
    }

    // Foreground sample digits in configured row color.
    for (var r3 = 0; r3 < ROWS_COUNT; r3++) {
      var rd = rowsData[r3] || { color: '#FFFFFF', slots: [' ',' ',' ',' ',' '] };
      for (var c3 = 0; c3 < COLS; c3++) {
        if (slotHiddenOnRound(r3, c3, ROWS_COUNT, isRound)) continue;
        var ch = rd.slots[c3] || ' ';
        if (ch === ' ') continue;
        var sx2 = leftPad + c3 * slotW;
        var sy2 = r3 * rowH;
        drawFontGlyph(ctx, ch, sx2 + 1, sy2 + 1, slotW - 2, rowH - 2, rd.color || '#FFFFFF', 700);
      }
    }

    if (isRound) {
      ctx.restore();
      ctx.strokeStyle = '#2a3240';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, Math.min(W, H) / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();
    }
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
    var q = (inp.id === 'ghost') ? quantizeGhostToPebble(inp.value || '#FFFFFF') : quantizeToPebble(inp.value || '#FFFFFF');
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
    if (payload.colors.ghost === '#000000' || payload.colors.ghost === '#555555') {
      payload.colors.ghost = '#AAAAAA';
    }
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
      ghost: '#AAAAAA'
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
    state.activePlatform = preset.id;
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
        updateGhostDensityLabel();
        updatePreviewModeUI();
        drawGhostPreview();
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
    var useFallback = params.bw || !supportsColorInput();
    forEachNode(colorFallbacks, function(sel, idx){
      sel.innerHTML = '';
      getColorOptions().forEach(function(opt){
        var o = document.createElement('option');
        o.value = opt.hex;
        o.textContent = opt.name + ' (' + opt.hex + ')';
        sel.appendChild(o);
      });
      if (resetValues && idx < params.rows) sel.value = quantizeToPebble(state.defaultRows[idx].color);
    });
    forEachNode(colorInputs, function(inp, idx){
      if (resetValues && idx < params.rows) inp.value = quantizeToPebble(state.defaultRows[idx].color);
      inp.setAttribute('list','palette-list');
      inp.addEventListener('change', function(){ inp.value = quantizeToPebble(inp.value); updateColorMetaForInput(inp); });
      inp.addEventListener('input', function(){ updateColorMetaForInput(inp); });
      if (useFallback) {
        inp.hidden = true;
        colorFallbacks[idx].hidden = false;
        colorFallbacks[idx].onchange = function() {
          inp.value = quantizeToPebble(colorFallbacks[idx].value || '#FFFFFF');
          updateColorMetaForInput(inp);
        };
        if (resetValues && idx < params.rows) colorFallbacks[idx].value = quantizeToPebble(state.defaultRows[idx].color);
        inp.value = quantizeToPebble(colorFallbacks[idx].value || inp.value);
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
    var useFallback = params.bw || !supportsColorInput();
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
    var useFallback = params.bw || !supportsColorInput();
    ['colLowFallback','colInFallback','colHighFallback','ghostFallback'].forEach(function(id){
      var sel = byId(id);
      if (!sel) return;
      sel.innerHTML = '';
      var opts = (id === 'ghostFallback') ? getGhostColorOptions() : getColorOptions();
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
      var defaultValue = (id === 'ghost') ? quantizeGhostToPebble(state.defaultBgColors[key]) : quantizeToPebble(state.defaultBgColors[key]);
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
        sel.onchange = function() {
          if (input) {
            input.value = (id === 'ghost') ? quantizeGhostToPebble(sel.value || '#FFFFFF') : quantizeToPebble(sel.value || '#FFFFFF');
          }
          updateColorMetaForInput(input);
          if (id === 'ghost') drawGhostPreview();
        };
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
    drawGhostPreview();
  }

  function save() {
    var rows = normalizedRows(collectRows());
    var useFallback = params.bw || !supportsColorInput();
    var colLow = quantizeToPebble(useFallback ? byId('colLowFallback').value : byId('colLow').value);
    var colIn  = quantizeToPebble(useFallback ? byId('colInFallback').value  : byId('colIn').value);
    var colHigh= quantizeToPebble(useFallback ? byId('colHighFallback').value: byId('colHigh').value);
    var ghost  = quantizeGhostToPebble(useFallback ? byId('ghostFallback').value  : byId('ghost').value);
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
      ghostDensity: parseInt((byId('ghostDensity') || {value: '3'}).value || '3', 10),
      previewMode: state.previewMode,
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
        var quant = (id === 'ghost') ? quantizeGhostToPebble(value) : quantizeToPebble(value);
        if (input) input.value = quant;
        if (sel) sel.value = quant;
        updateColorMetaForInput(input);
      };
      applyColorValue('colLow', (cfg.colors && cfg.colors.low) || state.defaultBgColors.low);
      applyColorValue('colIn', (cfg.colors && cfg.colors.in) || state.defaultBgColors.in);
      applyColorValue('colHigh', (cfg.colors && cfg.colors.high) || state.defaultBgColors.high);
      applyColorValue('ghost', (cfg.colors && cfg.colors.ghost) || state.defaultBgColors.ghost);
      if (byId('showGhostGrid')) byId('showGhostGrid').checked = cfg.showGhostGrid !== false;
      var densityEl = byId('ghostDensity');
      if (densityEl && cfg.ghostDensity) { densityEl.value = cfg.ghostDensity; updateGhostDensityLabel(); }
      if (cfg.previewMode === 'shake') state.previewMode = 'shake'; else state.previewMode = 'main';
      updatePreviewModeUI();
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
      drawGhostPreview();
    });
    byId('rows-form').addEventListener('input', function(e){
      if (e.target && e.target.classList.contains('row-color')) drawGhostPreview();
    });
    var shakeForm = byId('shake-rows-form');
    if (shakeForm) shakeForm.addEventListener('change', drawGhostPreview);
    updateBGSectionVisibility();
    updateBGFetchModeUI();
    // Ghost density slider + live preview
    var ghostDensityEl = byId('ghostDensity');
    if (ghostDensityEl) {
      ghostDensityEl.addEventListener('input', function() {
        updateGhostDensityLabel();
        drawGhostPreview();
      });
    }
    // Ghost color changes → update preview (works for both color input and fallback select)
    var bgSection = byId('bg-section');
    if (bgSection) {
      bgSection.addEventListener('change', function(e) {
        if (e.target && (e.target.id === 'ghost' || e.target.id === 'ghostFallback')) drawGhostPreview();
      });
      bgSection.addEventListener('input', function(e) {
        if (e.target && e.target.id === 'ghost') drawGhostPreview();
      });
    }
    var previewModeToggle = byId('previewModeToggle');
    if (previewModeToggle) {
      previewModeToggle.onclick = function() {
        state.previewMode = (state.previewMode === 'shake') ? 'main' : 'shake';
        updatePreviewModeUI();
        drawGhostPreview();
      };
    }
    drawGhostPreview();
    try {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() {
          drawGhostPreview();
        });
      }
    } catch (_e) {}
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
        updatePreviewModeUI();
        drawGhostPreview();
      };
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})(); 
