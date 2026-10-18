/* global Pebble */
var keys = require('message_keys');
(function() {
  'use strict';

  var config = {
    weatherApi: 'https://api.open-meteo.com/v1/forecast',
    bgUrl: null,
    authToken: null,
    bgSource: 'nightscout',          // 'nightscout' | 'ipumpmini' (local iPhone app)
    ompUrl: 'http://127.0.0.1:17580',
    ompFallback: false,              // iPump-mini: Nightscout (bgUrl/authToken) as fallback
    bgTimeoutMin: 20,
    low: 80,
    high: 180,
  tempUnit: 'C',
  weatherIntervalMin: 30,
  bgUnit: 'mgdl',
  bgFetchIntervalMin: 5,
    syncBgWithInterval: true,
    bgManualIntervalMin: 5,
    colors: {
      low: '#FF0000',
      high: '#FFFF00',
      in: '#00FF00',
      ghost: '#555555' // Pebble Time: darkest non-black gray that's reliably visible
    },
    rows: [
      { type: 0, color: '#00FFFF' }, // Weather
      { type: 1, color: '#FFFFFF' }, // Time
      { type: 2, color: '#AAAAAA' }, // Date
      { type: 3, color: '#AAAAAA' }, // Weekday
      { type: 5, color: '#00FF00' }  // CGM
    ],
    showLeadingZero: true,
    dateFormat: 0,
    weekdayLang: 1,  // 0=German, 1=English (matches C init_defaults)
    showGhostGrid: true,
    ghostDensity: 3,
    shakeRows: [-1, -1, -1, -1, -1],
    vibeOnLow: false,
    vibeOnHigh: false,
    backlightOnShake: true,
    bgColor: '#000000'
  };

  function hexToInt(hex) {
    return parseInt(hex.replace('#',''), 16);
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

  function getBWPalette() {
    return ['#000000', '#FFFFFF'];
  }

  var isBWPlatform = false;
  var isPebble2 = false;
  var BG_STATUS = { OK: 0, NO_DATA: 1, NO_CONN: 2, OLD: 3, NO_APP: 4 };

  function quantize(hex) {
    hex = (hex||'').toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex)) return '#FFFFFF';
    try {
      var r = parseInt(hex.substr(1,2),16), g = parseInt(hex.substr(3,2),16), b = parseInt(hex.substr(5,2),16);
      if (isBWPlatform) {
        var bwPalette = getBWPalette();
        var lum = (r * 3 + g * 6 + b) / 10;
        var idx = Math.round((lum / 255) * (bwPalette.length - 1));
        if (idx < 0) idx = 0;
        if (idx >= bwPalette.length) idx = bwPalette.length - 1;
        return bwPalette[idx];
      }
      r = nearestPebbleChannel(r);
      g = nearestPebbleChannel(g);
      b = nearestPebbleChannel(b);
      return '#' + colorHex(r) + colorHex(g) + colorHex(b);
    } catch(e) {}
    return '#FFFFFF';
  }

  function normalizeRows(rows) {
    var template = [
      { type: 0, color: '#00FFFF' },
      { type: 1, color: '#FFFFFF' },
      { type: 2, color: '#AAAAAA' },
      { type: 3, color: '#AAAAAA' },
      { type: 5, color: '#00FF00' }
    ];
    var out = [];
    for (var i = 0; i < 5; i++) {
      var src = (rows && rows[i]) || template[i];
      out.push({ type: src.type, color: src.color || '#FFFFFF' });
    }
    return out;
  }

  function normalizeShakeRows(shakeRows) {
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

  function toKeyed(dict) {
    var out = {};
    Object.keys(dict).forEach(function(k){ out[keys[k]] = dict[k]; });
    return out;
  }

  function enforceBWPalette() {
    if (!config.rows || !Array.isArray(config.rows)) config.rows = normalizeRows(config.rows);
    if (!isBWPlatform) return;
    config.rows = normalizeRows(config.rows).map(function(row){
      return { type: row.type, color: quantize(row.color) };
    });
    if (!config.colors) config.colors = {};
    config.colors.low   = quantize(config.colors.low   || '#FFFFFF');
    config.colors.in    = quantize(config.colors.in    || '#FFFFFF');
    config.colors.high  = quantize(config.colors.high  || '#FFFFFF');
    config.colors.ghost = quantize(config.colors.ghost || '#555555');
  }

  function sendConfig() {
    // Break into smaller messages for reliability on some phones
    function send(dict, cb) {
      Pebble.sendAppMessage(toKeyed(dict), function(){ if (cb) cb(); }, function(){
        // one retry
        Pebble.sendAppMessage(toKeyed(dict), function(){ if (cb) cb(); }, function(){ if (cb) cb(); });
      });
    }
    // 1) Rows types/colors
    config.rows = normalizeRows(config.rows);
    config.shakeRows = normalizeShakeRows(config.shakeRows);
    var rowsDict = {};
    for (var i=0; i<5; i++) {
      rowsDict['ROW' + (i+1) + '_TYPE'] = config.rows[i].type;
  rowsDict['ROW' + (i+1) + '_COLOR'] = hexToInt(quantize(config.rows[i].color));
    }
    // 2) Colors and thresholds
    var bgColorHex = config.bgColor || '#000000';
    if (isBWPlatform && !isPebble2) {
      // Aplite: only black or white allowed as background
      bgColorHex = (bgColorHex.toUpperCase() === '#FFFFFF') ? '#FFFFFF' : '#000000';
    }
    var colorsDict = {
  'COLOR_LOW': hexToInt(quantize(config.colors.low)),
  'COLOR_HIGH': hexToInt(quantize(config.colors.high)),
  'COLOR_IN_RANGE': hexToInt(quantize(config.colors.in)),
  'GHOST_COLOR': hexToInt(quantize(config.colors.ghost)),
      // Thresholds are stored in the configured unit; send ×10 for mmol so C compares in same unit as sgv
      'BG_THRESH_LOW':  config.bgUnit === 'mmol' ? Math.round((parseFloat(config.low)  || 0) * 10) : Math.round(parseFloat(config.low)  || 80),
      'BG_THRESH_HIGH': config.bgUnit === 'mmol' ? Math.round((parseFloat(config.high) || 0) * 10) : Math.round(parseFloat(config.high) || 180),
      'DISPLAY_BG_COLOR': hexToInt(quantize(bgColorHex))
    };
    // 3) Basics
    var basicDict = {
      'SHOW_LEADING_ZERO': config.showLeadingZero ? 1 : 0,
      'DATE_FORMAT': config.dateFormat,
      'WEEKDAY_LANG': config.weekdayLang,
      'SHOW_GHOST_GRID': config.showGhostGrid === false ? 0 : 1,
      'GHOST_DENSITY': Math.max(1, Math.min(5, parseInt(config.ghostDensity || 3, 10))),
      'TEMP_UNIT': config.tempUnit === 'F' ? 1 : 0,
      'WEATHER_INTERVAL_MIN': config.weatherIntervalMin,
      'BG_TIMEOUT_MIN': config.bgTimeoutMin,
      'BG_FETCH_INTERVAL_MIN': Math.max(1, parseInt(config.bgFetchIntervalMin || 5, 10)),
      'BG_UNIT': config.bgUnit === 'mmol' ? 1 : 0
    };
    send(rowsDict, function(){ send(colorsDict, function(){ send(basicDict, function(){
      // Per-row shake replacement config
      var shakeDict = {
        'SHAKE_ROW1_TYPE': config.shakeRows[0],
        'SHAKE_ROW2_TYPE': config.shakeRows[1],
        'SHAKE_ROW3_TYPE': config.shakeRows[2],
        'SHAKE_ROW4_TYPE': config.shakeRows[3],
        'SHAKE_ROW5_TYPE': config.shakeRows[4]
      };
      send(shakeDict);
    }); }); });
  }

  // Weather fetch with caching and throttling
  var _lastWeather = { ts: 0, temp: null, rain3h: -1 };
  function sendWeather(temp, unit, rain3h) {
    try {
      Pebble.sendAppMessage(toKeyed({
        'WEATHER_TEMP': temp,
        'WEATHER_RAIN3H': (isFinite(rain3h) ? rain3h : -1),
        'TEMP_UNIT': unit === 'F' ? 1 : 0
      }));
    } catch(e) {}
  }
  function fetchWeather() {
    var now = Date.now();
    var unit = config.tempUnit === 'F' ? 'F' : 'C';
    // If we have a recent value (<10 min), send it immediately to avoid '--'
    if (_lastWeather.temp !== null && (now - _lastWeather.ts) < 10*60*1000) {
      sendWeather(_lastWeather.temp, unit, _lastWeather.rain3h);
    }
    function parseRainNext3h(json) {
      try {
        if (!json || !json.hourly || !Array.isArray(json.hourly.time) || !Array.isArray(json.hourly.precipitation_probability)) return -1;
        var times = json.hourly.time;
        var probs = json.hourly.precipitation_probability;
        if (!times.length || !probs.length) return -1;
        var currentTime = (json.current_weather && json.current_weather.time) ? json.current_weather.time : null;
        var idx = 0;
        if (currentTime) {
          idx = times.indexOf(currentTime);
        }
        if (idx < 0) {
          var nowIsoHour = new Date();
          nowIsoHour.setMinutes(0, 0, 0);
          var nowIso = nowIsoHour.toISOString().slice(0, 13) + ':00';
          for (var i = 0; i < times.length; i++) {
            if (times[i] >= nowIso) { idx = i; break; }
          }
        }
        var maxProb = -1;
        for (var j = idx; j < idx + 3 && j < probs.length; j++) {
          var p = parseInt(probs[j], 10);
          if (isFinite(p) && p > maxProb) maxProb = p;
        }
        if (maxProb < 0) return -1;
        if (maxProb > 100) maxProb = 100;
        return maxProb;
      } catch (_e) {
        return -1;
      }
    }
    function tryOpenMeteo(lat, lon, onOk, onErr) {
      var url = (config.weatherApi || 'https://api.open-meteo.com/v1/forecast') +
        '?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&hourly=precipitation_probability&forecast_days=2';
      var req = new XMLHttpRequest();
      req.onload = function() {
        try {
          var json = JSON.parse(this.responseText || '{}');
          var cw = json.current_weather || {};
          var t = Math.round(parseFloat(cw.temperature));
          if (!isFinite(t)) throw new Error('no temp');
          if (unit === 'F') t = Math.round((t * 9/5) + 32);
          onOk({ temp: t, rain3h: parseRainNext3h(json) });
        } catch(e) { onErr('parse'); }
      };
      req.onerror = function(){ onErr('network'); };
      req.ontimeout = function(){ onErr('timeout'); };
      req.open('GET', url);
      req.timeout = 10000;
      req.send();
    }
    function tryWttr(lat, lon, onOk, onErr) {
      var url = 'https://wttr.in/' + lat + ',' + lon + '?format=j1';
      var req = new XMLHttpRequest();
      req.onload = function() {
        try {
          var json = JSON.parse(this.responseText || '{}');
          var cc = (json.current_condition && json.current_condition[0]) || {};
          var key = (unit === 'F') ? 'temp_F' : 'temp_C';
          var t = Math.round(parseFloat(cc[key]));
          if (!isFinite(t)) throw new Error('no temp');
          onOk({ temp: t, rain3h: -1 });
        } catch(e) { onErr('parse'); }
      };
      req.onerror = function(){ onErr('network'); };
      req.ontimeout = function(){ onErr('timeout'); };
      req.open('GET', url);
      req.timeout = 10000;
      req.send();
    }
    function doFetch(lat, lon) {
      tryOpenMeteo(lat, lon, function(w){
        _lastWeather = { ts: Date.now(), temp: w.temp, rain3h: w.rain3h };
        sendWeather(w.temp, unit, w.rain3h);
      }, function(){
        // fallback
        tryWttr(lat, lon, function(w){
          _lastWeather = { ts: Date.now(), temp: w.temp, rain3h: w.rain3h };
          sendWeather(w.temp, unit, w.rain3h);
        }, function(){
          if (_lastWeather.temp !== null) sendWeather(_lastWeather.temp, unit, _lastWeather.rain3h);
        });
      });
    }
    // Try geolocation; fallback to last known or a default (Berlin) if it fails
    navigator.geolocation.getCurrentPosition(function(pos){
      doFetch(pos.coords.latitude, pos.coords.longitude);
    }, function(){
      try {
        var saved = JSON.parse(localStorage.getItem('supercgm_last_loc')||'null');
        if (saved && saved.lat && saved.lon) {
          doFetch(saved.lat, saved.lon);
          return;
        }
      } catch(_) {}
      // default coords (Berlin)
      doFetch(52.5200, 13.4050);
    }, { timeout: 8000, maximumAge: 900000 });
  }
  // persist last location when available
  try {
    navigator.geolocation.getCurrentPosition(function(pos){
      localStorage.setItem('supercgm_last_loc', JSON.stringify({lat: pos.coords.latitude, lon: pos.coords.longitude}));
    });
  } catch(e){}

  var weatherTimer = null;
  function scheduleWeather() {
    if (weatherTimer) {
      clearInterval(weatherTimer);
      weatherTimer = null;
    }
    var ms = Math.max(5, parseInt(config.weatherIntervalMin||30,10)) * 60 * 1000;
    weatherTimer = setInterval(fetchWeather, ms);
  // trigger an immediate fetch as well (throttled by cache)
  setTimeout(fetchWeather, 1000);
  }

  // ── CGM data source: shared library pebble-cgm (src/js/cgm.js) ─────────────
  // Nightscout (default) or iPump-mini (local iPhone app, wake schedule, optional
  // Nightscout fallback). Same logic as CasioCGM and 91 Dub CGM.
  function isIpumpMini() { return config.bgSource === 'ipumpmini'; }
  function hasCgmRow() { return config.rows && config.rows.some(function(r){ return r.type === 5; }); }

  // AppMessage queue (pebble-cgm): reading, status and wake schedule used to be sent back
  // to back with plain sendAppMessage, so the second one often failed with APP_MSG_BUSY
  // and the watch kept an old wake schedule. Same key = newest message wins.
  var cgmOutbox = require('./cgm').outbox('supercgm');

  var cgm = require('./cgm')({
    name: 'supercgm',
    settings: function() {
      return {
        source: isIpumpMini() ? 'ipumpmini' : 'nightscout',
        nsUrl: config.bgUrl, nsToken: config.authToken,
        ompUrl: config.ompUrl || 'http://127.0.0.1:17580', ompFallback: !!config.ompFallback,
        sensorMin: Math.max(1, parseInt(config.bgFetchIntervalMin || 5, 10)),
        sync: config.syncBgWithInterval !== false,
        manualMin: Math.max(1, parseInt(config.bgManualIntervalMin || config.bgFetchIntervalMin || 5, 10))
      };
    },
    onReading: function(r) {
      var mmol = config.bgUnit === 'mmol';
      var dir = r.direction.toLowerCase(), arrow = '';
      if (dir.indexOf('doubleup') >= 0) arrow = '^^';
      else if (dir.indexOf('singleup') >= 0 || dir === 'up') arrow = '^';
      else if (dir.indexOf('fortyfiveup') >= 0) arrow = '^>';
      else if (dir.indexOf('flat') >= 0) arrow = '-';
      else if (dir.indexOf('fortyfivedown') >= 0) arrow = '>v';
      else if (dir.indexOf('singledown') >= 0 || dir === 'down') arrow = 'v';
      else if (dir.indexOf('doubledown') >= 0) arrow = 'vv';
      // mmol: send mmol x10 so C can display "X.Y" without conversion
      var payload = {
        BG_STATUS: r.stale ? BG_STATUS.OLD : BG_STATUS.OK,
        BG_SGV: mmol ? Math.round(r.sgvMgdl * 10 / 18) : r.sgvMgdl,
        BG_TIMESTAMP: r.tsSec,
        BG_TREND: arrow,
        BG_UNIT: mmol ? 1 : 0,
        BG_DELTA: isFinite(r.deltaMgdl) ? (mmol ? Math.round(r.deltaMgdl * 10 / 18) : Math.round(r.deltaMgdl)) : -9999,
        CGM_SOURCE: r.fallback ? 1 : 0
      };
      cgmOutbox.send(toKeyed(payload), 'BG', { key: 'bg' });
    },
    onStatus: function(code) {
      var st = code === 'NO_APP' ? BG_STATUS.NO_APP : code === 'NO_CONN' ? BG_STATUS.NO_CONN : BG_STATUS.NO_DATA;
      cgmOutbox.send(toKeyed({ BG_STATUS: st }), 'BG status', { key: 'bg' });
    },
    onWakeSchedule: function(next, interval) {
      // The watch wakes this JS with REQUEST_BG at the app's next wake (reliable clock).
      cgmOutbox.send(toKeyed({ CGM_WAKE_NEXT: next, CGM_WAKE_INTERVAL: interval }), 'wake schedule', { key: 'wake' });
    }
  });

  function scheduleBG() {
    if (!hasCgmRow() || (!config.bgUrl && !isIpumpMini())) { cgm.stop(); return; }
    cgm.start();
  }

  function loadSavedConfig() {
    try {
      var saved = localStorage.getItem('supercgm_config');
      if (saved) {
        var cfg = JSON.parse(saved);
        if (cfg && cfg.rows) {
          cfg.rows = normalizeRows(cfg.rows);
        }
        if (cfg) {
          cfg.shakeRows = normalizeShakeRows(cfg.shakeRows);
          if (cfg.showGhostGrid === undefined) cfg.showGhostGrid = true;
          if (!cfg.ghostDensity) cfg.ghostDensity = 3;
          if (cfg.syncBgWithInterval === undefined) cfg.syncBgWithInterval = true;
          if (!cfg.bgManualIntervalMin) cfg.bgManualIntervalMin = 5;
          if (!cfg.bgColor) cfg.bgColor = '#000000';
          if (cfg.authToken === undefined) cfg.authToken = null;
          if (!cfg.bgSource) cfg.bgSource = 'nightscout';
          if (!cfg.ompUrl) cfg.ompUrl = 'http://127.0.0.1:17580';
          cfg.ompFallback = cfg.ompFallback === true || cfg.ompFallback === 1 || cfg.ompFallback === '1';
          // Migrate old configs: if unit is mmol but thresholds look like mg/dL (>30), convert
          if (cfg.bgUnit === 'mmol' && cfg.low > 30) {
            cfg.low  = Math.round(cfg.low  * 10 / 18) / 10;
            cfg.high = Math.round(cfg.high * 10 / 18) / 10;
          }
        }
        // Basic sanity: ensure rows exist
        if (cfg && Array.isArray(cfg.rows)) {
          if (!cfg.colors) cfg.colors = {};
          var g = (cfg.colors.ghost || '').toLowerCase();
          if (!g || /^#0{0,6}$/.test(g) || g === '#2a2a2a' || g === '#1e1e1e') {
            cfg.colors.ghost = '#555555';
          }
          config = cfg;
        }
      }
    } catch(e) {}
  }

  Pebble.addEventListener('ready', function() {
    try {
      var info = (Pebble.getActiveWatchInfo && Pebble.getActiveWatchInfo()) || {};
      var platform = info.platform || '';
      isBWPlatform = (platform === 'aplite' || platform === 'diorite');
      isPebble2 = (platform === 'diorite');
    } catch(e) { isBWPlatform = false; isPebble2 = false; }
    // Load saved config if available so we don't overwrite watch with defaults
    loadSavedConfig();
    enforceBWPalette();
    sendConfig();
    scheduleWeather();
    scheduleBG();
  });

  Pebble.addEventListener('appmessage', function(e) {
    if (e.payload && e.payload.REQUEST_WEATHER) {
  console.log('REQUEST_WEATHER received');
  fetchWeather();
    }
    if (e.payload && e.payload.REQUEST_BG) {
      console.log('REQUEST_BG received');
      if (hasCgmRow()) cgm.fetchNow();
    }
  });

  Pebble.addEventListener('showConfiguration', function() {
    var info = (Pebble.getActiveWatchInfo && Pebble.getActiveWatchInfo()) || {};
    var platform = (info.platform || '').toLowerCase();
    if (!platform) platform = isBWPlatform ? 'diorite' : 'basalt';

    var modelHint = ((info.model || info.hardware || info.name || '') + '').toLowerCase();
    var isTime2 = (platform === 'emery') || (modelHint.indexOf('time 2') >= 0);
    var isRound2 = (platform === 'gabbro') || (modelHint.indexOf('round 2') >= 0);
    var profile = isTime2 ? 'time2' : (isRound2 ? 'round2' : 'default');
    var isRound = (platform === 'chalk') || (modelHint.indexOf('round') >= 0) || isRound2;
    var isBW = isBWPlatform || (platform === 'aplite' || platform === 'diorite') || (info.color === false);
    var isPebble2Like = (platform === 'diorite') || (modelHint.indexOf('pebble 2') >= 0);
    var rows = isRound ? 4 : 5;
    if (profile === 'round2') rows = 5;

    var screenW = 0;
    var screenH = 0;
    if (info.resolution && typeof info.resolution.x === 'number' && typeof info.resolution.y === 'number') {
      screenW = info.resolution.x;
      screenH = info.resolution.y;
    } else if (profile === 'time2') {
      screenW = 200;
      screenH = 228;
    } else if (profile === 'round2') {
      screenW = 260;
      screenH = 260;
    }

    var lang = 'en';

    var url = 'https://sgitaize.github.io/Nightscout-supercgm/config/index.html' +
      '?platform=' + encodeURIComponent(platform) +
      '&bw=' + (isBW ? '1' : '0') +
      '&rows=' + rows +
      '&pebble2=' + (isPebble2Like ? '1' : '0') +
      '&profile=' + encodeURIComponent(profile) +
      '&sw=' + screenW +
      '&sh=' + screenH +
      '&lang=' + lang;
    // current config in the fragment: shown on the (GitHub Pages) config page
    // regardless of its origin; fragments are not sent to the web server
    try {
      var stored = localStorage.getItem('supercgm_config');
      if (stored) url += '#config=' + encodeURIComponent(stored);
    } catch (e) {}
    Pebble.openURL(url);
  });

  Pebble.addEventListener('webviewclosed', function(e) {
    if (!e || !e.response || e.response === 'CANCELLED') { return; }
    try {
      config = JSON.parse(decodeURIComponent(e.response));
      config.rows = normalizeRows(config.rows);
      config.shakeRows = normalizeShakeRows(config.shakeRows);
      if (config.showGhostGrid === undefined) config.showGhostGrid = true;
      if (!config.ghostDensity) config.ghostDensity = 3;
      if (config.syncBgWithInterval === undefined) config.syncBgWithInterval = true;
      if (!config.bgManualIntervalMin) config.bgManualIntervalMin = 5;
      if (config.authToken === undefined) config.authToken = null;
      if (!config.bgSource) config.bgSource = 'nightscout';
      if (!config.ompUrl) config.ompUrl = 'http://127.0.0.1:17580';
      config.ompFallback = config.ompFallback === true || config.ompFallback === 1 || config.ompFallback === '1';
      // Persist to pkjs storage so it survives app restarts
      try { localStorage.setItem('supercgm_config', JSON.stringify(config)); } catch(_e) {}
      sendConfig();
      scheduleWeather();
      scheduleBG();
    } catch(err) {
      console.log('config parse error', err);
    }
  });
})();
